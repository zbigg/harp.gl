/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { CubemapSkyParams } from "@here/harp-datasource-protocol";
import { LoggerManager } from "@here/harp-utils";
import { CubeTexture, CubeTextureLoader, Texture } from "three";

const logger = LoggerManager.instance.create("SkyCubemapTexture");

// Maps the faceId to the expected position in the threejs faces array.
enum FaceIdx {
    "px",
    "nx",
    "py",
    "ny",
    "pz",
    "nz"
}

/**
 * Class that handles loading all 6 faces of a [[CubeTexture]], to be used with [[SkyBackground]].
 */
export class SkyCubemapTexture {
    private m_skybox: CubeTexture;

    /**
     * Constructs a new `SkyCubemapTexture`.
     *
     * @param m_params Initial [[CubemapSkyParams]].
     */
    constructor(params: CubemapSkyParams) {
        const faces = this.createCubemapFaceArray(params);
        this.m_skybox =
            faces !== undefined ? new CubeTextureLoader().load(faces) : new CubeTexture();
    }

    /**
     * Disposes allocated resources.
     */
    dispose() {
        this.m_skybox.dispose();
    }

    /**
     * `SkyCubemapTexture`'s texture resource.
     */
    get texture(): Texture {
        return this.m_skybox;
    }

    /**
     * Updates the `SkyCubemapTexture` with new parameters.
     *
     * @param params New [[CubemapSkyParams]].
     */
    updateTexture(params: CubemapSkyParams) {
        const faces = this.createCubemapFaceArray(params);
        if (faces === undefined) {
            return;
        }
        this.m_skybox = new CubeTextureLoader().load(faces);
    }

    private createCubemapFaceArray(params: CubemapSkyParams): string[] | undefined {
        const faces: Array<string | undefined> = [
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        ];
        for (let i = 0; i < 6; ++i) {
            const faceIdx: number = (FaceIdx[params.faces[i].faceId] as any) as number;
            if (faceIdx === undefined) {
                logger.error(`Invalid FaceId "${params.faces[i].faceId}".`);
                return;
            }
            if (faces[faceIdx] !== undefined) {
                logger.error(`Face "${params.faces[i].faceId}" was defined more than once.`);
                return;
            }
            faces[faceIdx] = params.faces[i].url;
        }

        return faces as string[];
    }
}
