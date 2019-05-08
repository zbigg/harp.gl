/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoCoordinates } from "@here/harp-geoutils";
import { MapControls, MapControlsUI } from "@here/harp-map-controls";
import { CopyrightElementHandler, CopyrightInfo, MapView } from "@here/harp-mapview";
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import { GUI } from "dat.gui";
import { accessToken } from "../config";
import * as THREE from "three";

/**
 * Harp's effects playground example with GUI to tweak values in one's own map.
 *
 */
export namespace EffectsExample {
    // Create a new MapView for the HTMLCanvasElement of the given id.
    function initializeMapView(id: string): MapView {
        // snippet:harp_gl_hello_world_example_0.ts
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        // end:harp_gl_hello_world_example_0.ts

        // snippet:harp_gl_hello_world_example_1.ts
        const map = new MapView({
            canvas,
            theme: "resources/berlin_tilezen_base.json"
        });
        // end:harp_gl_hello_world_example_1.ts

        CopyrightElementHandler.install("copyrightNotice", map);

        // snippet:harp_gl_hello_world_example_2.ts
        // Center the camera on Manhattan, New York City.
        map.setCameraGeolocationAndZoom(new GeoCoordinates(40.6935, -74.009), 16.9);

        // Instantiate the default map controls, allowing the user to pan around freely.
        const mapControls = new MapControls(map);
        mapControls.maxPitchAngle = 50;
        mapControls.setRotation(6.3, 50);
        // end:harp_gl_hello_world_example_2.ts

        // Add an UI.
        const ui = new MapControlsUI(mapControls);
        canvas.parentElement!.appendChild(ui.domElement);

        // snippet:harp_gl_hello_world_example_3.ts
        // Resize the mapView to maximum.
        map.resize(window.innerWidth, window.innerHeight);

        const gui = new GUI({ width: 300 });
        const options = {
            toneMappingExposure: 1.0,
            outline: {
                enabled: false,
                ghostExtrudedPolygons: false,
                thickness: 0.02,
                color: "#004455"
            },
            bloom: {
                enabled: false,
                strength: 1.0,
                threshold: 0.85,
                radius: 0.4
            }
        };
        gui.add(options, "toneMappingExposure", 0.0, 3.0).onChange((value: number) => {
            map.renderer.toneMappingExposure = value;
            map.update();
        });
        const outlineFolder = gui.addFolder("Outlines");
        const outlineEnabled = outlineFolder.add(options.outline, "enabled");
        outlineEnabled.onChange((value: boolean) => {
            map.mapRenderingManager.outline.enabled = value;
            map.mapRenderingManager.updateOutline(options.outline);
            map.update();
        });
        const outlineThickness = outlineFolder.add(options.outline, "thickness", 0.001, 0.03);
        outlineThickness.onChange((value: number) => {
            map.mapRenderingManager.updateOutline(options.outline);
            map.update();
        });
        const outlineGhost = outlineFolder.add(options.outline, "ghostExtrudedPolygons");
        outlineGhost.onChange((value: boolean) => {
            map.mapRenderingManager.updateOutline(options.outline);
            map.update();
        });
        const outlineColor = outlineFolder.addColor(options.outline, "color");
        outlineColor.onChange((value: boolean) => {
            map.mapRenderingManager.updateOutline(options.outline);
            map.update();
        });

        const bloomFolder = gui.addFolder("Bloom");
        const bloomEnabled = bloomFolder.add(options.bloom, "enabled");
        bloomEnabled.onChange((value: boolean) => {
            map.mapRenderingManager.bloom.enabled = value;
            map.mapRenderingManager.bloom = options.bloom;
            map.update();
        });
        const bloomStrength = bloomFolder.add(options.bloom, "strength", 0, 2.0);
        bloomStrength.onChange((value: number) => {
            map.mapRenderingManager.bloom = options.bloom;
            map.update();
        });
        const bloomThreshold = bloomFolder.add(options.bloom, "threshold", 0.0, 1.0);
        bloomThreshold.onChange((value: boolean) => {
            map.mapRenderingManager.bloom = options.bloom;
            map.update();
        });
        const bloomRadius = bloomFolder.add(options.bloom, "radius", 0.0, 1.0);
        bloomRadius.onChange((value: boolean) => {
            map.mapRenderingManager.bloom = options.bloom;
            map.update();
        });

        // React on resize events.
        window.addEventListener("resize", () => {
            map.resize(window.innerWidth, window.innerHeight);
        });
        // end:harp_gl_hello_world_example_3.ts

        return map;
    }

    const mapView = initializeMapView("mapCanvas");

    const hereCopyrightInfo: CopyrightInfo = {
        id: "here.com",
        year: new Date().getFullYear(),
        label: "HERE",
        link: "https://legal.here.com/terms"
    };
    const copyrights: CopyrightInfo[] = [hereCopyrightInfo];

    // snippet:harp_gl_hello_world_example_4.ts
    const omvDataSource = new OmvDataSource({
        baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
        apiFormat: APIFormat.XYZOMV,
        styleSetName: "tilezen",
        maxZoomLevel: 17,
        authenticationCode: accessToken,
        copyrightInfo: copyrights
    });
    // end:harp_gl_hello_world_example_4.ts

    // snippet:harp_gl_hello_world_example_5.ts
    mapView.addDataSource(omvDataSource);
    // end:harp_gl_hello_world_example_5.ts
}
