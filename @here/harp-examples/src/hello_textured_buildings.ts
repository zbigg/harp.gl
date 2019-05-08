/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoCoordinates } from "@here/harp-geoutils";
import { MapControls, MapControlsUI } from "@here/harp-map-controls";
import { CopyrightElementHandler, CopyrightInfo, MapView, ThemeLoader } from "@here/harp-mapview";
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import { accessToken } from "../config";

export namespace HelloWorldTexturedExample {
    function main() {
        addTextureCoypright();

        const mapView = initializeMapView("mapCanvas");

        const hereCopyrightInfo: CopyrightInfo = {
            id: "here.com",
            year: new Date().getFullYear(),
            label: "HERE",
            link: "https://legal.here.com/terms"
        };
        const copyrights: CopyrightInfo[] = [hereCopyrightInfo];

        const omvDataSource = new OmvDataSource({
            baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
            apiFormat: APIFormat.XYZOMV,
            styleSetName: "tilezen",
            maxZoomLevel: 17,
            authenticationCode: accessToken,
            copyrightInfo: copyrights
        });

        mapView.addDataSource(omvDataSource);
    }

    function addTextureCoypright() {
        document.body.innerHTML += `
<style>
    #mapCanvas {
        top: 0;
    }
    #texture-license{
        margin: 10px;
        padding: 10px;
        color: #cccccc;
    }
</style>
<p id="texture-license">Textures by
<a href="https://opengameart.org/content/wall-grass-rock-stone-wood-and-dirt-480">
West</a>.</p>`;
    }

    function initializeMapView(id: string): MapView {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        const map = new MapView({
            canvas,
            theme: "resources/example_textured_buildings.json"
        });

        CopyrightElementHandler.install("copyrightNotice", map);

        map.camera.position.set(0, 0, 1600);

        map.geoCenter = new GeoCoordinates(40.7, -74.010241978);
        const mapControls = new MapControls(map);
        mapControls.setRotation(0.9, 23.928);
        const ui = new MapControlsUI(mapControls);
        canvas.parentElement!.appendChild(ui.domElement);

        map.resize(window.innerWidth, window.innerHeight);

        window.addEventListener("resize", () => {
            map.resize(window.innerWidth, window.innerHeight);
        });

        return map;
    }

    main();
}
