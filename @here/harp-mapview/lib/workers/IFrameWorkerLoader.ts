/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoggerManager } from "@here/harp-utils";

const logger = LoggerManager.instance.create("WorkerLoader");

abstract class BasicAbstractMessagePort implements MessagePort {
    private m_queuedEvents: Event[] = [];
    private m_listeners: { [type: string]: Array<(event: any) => void> };

    set onmessage(listener: (ev: MessageEvent) => any) {
        this.addEventListener("message", listener);
        this.dispatchQueuedMessagesIfNeeded();
    }
    set onerror(listener: (ev: ErrorEvent) => any) {
        this.addEventListener("error", listener);
        this.dispatchQueuedMessagesIfNeeded();
    }
    set onmessageerror(listener: (ev: MessageEvent) => any | null) {
        this.addEventListener("messageerror", listener);
        this.dispatchQueuedMessagesIfNeeded();
    }

    postMessage(_message: any, _transfer?: Transferable[] | undefined): void {
        throw new Error("Method not implemented.");
    }

    close(): void {
        /** no op by default */
    }
    start(): void {
        this.dispatchQueuedMessagesIfNeeded();
    }

    terminate(): void {
        /** no op by default */
    }
    addEventListener(type: any, listener: any) {
        let listeners = this.m_listeners[type];
        if (!listeners) {
            listeners = this.m_listeners[type] = [];
        }
        listeners.push(listener);
    }
    removeEventListener(type: any, listener: any) {
        const listeners = this.m_listeners[type];
        if (!listeners) {
            return;
        }
        this.m_listeners[type] = listeners.filter(
            existingListener => existingListener === listener
        );
    }

    dispatchEvent(event: Event): boolean {
        const listeners = this.m_listeners[event.type];
        if (!listeners) {
            this.m_queuedEvents.push(event);
        } else {
            for (const listener of listeners) {
                listener(event);
            }
        }
        return true;
    }

    private dispatchQueuedMessagesIfNeeded() {
        const queuedEvents = this.m_queuedEvents;
        this.m_queuedEvents = [];
        for (const event of queuedEvents) {
            this.dispatchEvent(event);
        }
    }
}

/**
 * Handles request-reponse messaging by assigning `requestId` to messages and tracking responses
 * by same field.
 */
class MessagePortCallAdapter {
    private m_nextRequestId: number = 1;
    private m_requests: Map<
        number,
        {
            resolve: (result: unknown) => void;
            reject: (error: Error) => void;
        }
    > = new Map();

    constructor(readonly target: MessagePort, readonly requestIdProperty: string = "requestId") {
        target.addEventListener("message", this.onMessageFromTarget);
    }

    onMessageFromTarget = (messageEvent: MessageEvent) => {
        const message = messageEvent.data;
        if (!message) {
            return;
        }
        const requestId = message[this.requestIdProperty];
        if (!requestId || typeof requestId !== "number") {
            return;
        }
        const requestEntry = this.m_requests.get(requestId);
        if (!requestEntry) {
            return;
        }

        requestEntry.resolve(message);
    };

    call(message: unknown, transferList?: Transferable[]): Promise<unknown> {
        const requestId = this.m_nextRequestId++;
        this.target.postMessage(
            {
                ...message,
                [this.requestIdProperty]: requestId
            },
            transferList
        );

        return new Promise((resolve, reject) => {
            this.m_requests.set(requestId, { resolve, reject });
        });
    }
}

class RemoteWorker extends BasicAbstractMessagePort implements Worker {
    constructor(readonly target: MessagePort, public workerId: number) {
        super();
    }

    postMessage(message: any, transferList?: Transferable[] | undefined): void {
        this.target.postMessage(
            {
                type: "post-worker-message",
                workerId: this.workerId,
                message,
                $transferList: transferList
            },
            transferList
        );
    }

    terminate(): void {
        this.target.postMessage({
            type: "terminate-worker",
            workerId: this.workerId
        });
    }
}

/**
 * Implements `MessagePort` interface over `Window` instances from `iframe`s - like
 * `iframe.contentWindow`.
 *
 * Needed, because all `iframe` based events are routed through global `window`'s `message` event
 * listener.
 */
class WindowMessagePort extends BasicAbstractMessagePort {
    static sourcesMap: Map<any, WindowMessagePort> = new Map();
    static globalListenerInstalled: boolean = false;

    static onGlobalMessage(messageEvent: MessageEvent) {
        const source = messageEvent.source;
        if (!source) {
            return;
        }
        const iFrameAdapter = WindowMessagePort.sourcesMap.get(source);
        if (!iFrameAdapter) {
            return;
        }

        if (iFrameAdapter.origin !== messageEvent.origin) {
            return;
        }

        iFrameAdapter.dispatchEvent(messageEvent);
    }

    constructor(readonly target: Window, readonly origin: string) {
        super();
        WindowMessagePort.sourcesMap.set(target, this);
        if (WindowMessagePort.globalListenerInstalled) {
            return;
        }
        window.addEventListener("message", WindowMessagePort.onGlobalMessage);
    }

    close() {
        WindowMessagePort.sourcesMap.delete(this.target);
        if (WindowMessagePort.sourcesMap.size === 0) {
            window.removeEventListener("message", WindowMessagePort.onGlobalMessage);
            WindowMessagePort.globalListenerInstalled = false;
        }
    }

    postMessage(message: any, transferList?: Transferable[] | undefined): void {
        this.target.postMessage(message, this.origin, transferList);
    }
}

/**
 *
 */
class RemoteWorkerManager {
    static createFromIframe(iframeUrl: string): Promise<RemoteWorkerManager> {
        const iframe = document.createElement("iframe") as HTMLIFrameElement;
        iframe.src = iframeUrl;
        iframe.style.visibility = "hidden";
        iframe.style.display = "none";

        return new Promise<RemoteWorkerManager>(async (resolve, reject) => {
            iframe.addEventListener("error", errorEvent => {
                logger.error("startWorkerIframe: error from iframe", errorEvent);
                reject(new Error(`unable to create trampoline iframe for '${iframeUrl}'`));
            });

            iframe.addEventListener("load", () => {
                const iframeOrigin = new URL(iframeUrl).origin;
                const messagePort = new WindowMessagePort(iframe.contentWindow!, iframeOrigin);

                resolve(new RemoteWorkerManager(messagePort));
            });
        });
    }

    private m_workers: Map<number, RemoteWorker> = new Map();

    private m_targetCallAdapter: MessagePortCallAdapter;

    constructor(readonly target: MessagePort) {
        this.m_targetCallAdapter = new MessagePortCallAdapter(target, "requestId");
        target.addEventListener("message", this.onMessage);
    }

    async startWorker(scriptUrl: string): Promise<Worker> {
        const response: any = await this.m_targetCallAdapter.call({
            type: "start-worker",
            scriptUrl
        });

        if (response.type === "worker-started") {
            const workerId = response.workerId as number;
            const worker = new RemoteWorker(this.target, workerId);
            this.m_workers.set(workerId, worker);
            return worker;
        } else {
            throw new Error("RemoteWorkerManager#startWorker: unknown response");
        }
    }

    private onMessage = (messageEvent: MessageEvent) => {
        const message = messageEvent.data;
        if (!message) {
            return;
        }
        if (message.type === "message-from-worker") {
            const workerId = message.workerId;
            if (!workerId) {
                return;
            }
            const worker = this.m_workers.get(workerId);
            if (!worker) {
                return;
            }
            worker.dispatchEvent(message.message);
        } else if (message.type === "terminate-worker") {
            const workerId = message.workerId;
            this.m_workers.delete(workerId);
        } else if (message.type === "error-from-worker") {
            logger.log("RemoteWorkerManager: error from worker", message);
        }
    };
}

const activeWorkerManagers: Map<string, Promise<RemoteWorkerManager>> = new Map();

/**
 * Create or reuse `WorkerManager` talking with `iframeWorkerStarter.html` pointed by
 * `iframeWorkerTrampolineUrl`.
 *
 * @param iframeWorkerTrampolineUrl URL of iframe
 */
function getIframedWorkerManager(iframeUrl: string): Promise<RemoteWorkerManager> {
    let iframePromise = activeWorkerManagers.get(iframeUrl);
    if (!iframePromise) {
        iframePromise = RemoteWorkerManager.createFromIframe(iframeUrl);
        activeWorkerManagers.set(iframeUrl, iframePromise);
    }
    return iframePromise;
}

// https://stackoverflow.com/questions/21913673/execute-web-worker-from-different-origin
// https://stackoverflow.com/questions/9153445/how-to-communicate-between-iframe-and-the-parent-site
export async function startWorkerIframe(
    scriptUrl: string,
    iframeWorkerTrampolineUrl: string
): Promise<Worker> {
    const workerManager = await getIframedWorkerManager(iframeWorkerTrampolineUrl);

    return workerManager.startWorker(scriptUrl);
}
