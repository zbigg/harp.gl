/*
 * Copyright (C) 2017-2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    GeoBox,
    GeoCoordinates,
    GeoCoordLike,
    mercatorProjection,
    sphereProjection
} from "@here/harp-geoutils";
import { MapControls } from "@here/harp-map-controls";
import { CopyrightElementHandler, MapView, MapViewEventNames } from "@here/harp-mapview";
import { APIFormat, AuthenticationMethod, OmvDataSource } from "@here/harp-omv-datasource";
import { GUI } from "dat.gui";
import { apikey, copyrightInfo } from "../config";
import { MapViewSceneDebugger } from "../lib/MapViewSceneDebugger";

/**
 * In this example we simply use the `lookAt` method to make the camera orbit around a geolocation.
 *
 * First we create the map.
 * ```typescript
 * [[include:harp_gl_camera_orbit_example_0.ts]]
 * ```
 *
 * Then we listen to render events to trigger new `lookAt` calls with progressing yaw angle offsets:
 * ```typescript
 * [[include:harp_gl_camera_orbit_example_1.ts]]
 * ```
 *
 * Here a GUI is also set up so as to fiddle with the tilt and distance from the page.
 */

function createGeoBox(...points: GeoCoordLike[]) {
    if (points.length < 2) {
        throw new Error("createGeoBox require at least 2 points");
    }
    let result: GeoBox;
    const addPoint = (point: GeoCoordLike) => {
        // NOTE: GeoJson coordinates are in [longitute, latitute] order!
        const coords = GeoCoordinates.fromObject(point);
        if (result === undefined) {
            result = new GeoBox(coords, coords.clone());
        } else {
            result.growToContain(coords);
        }
    };
    points.forEach(addPoint);
    return result!;
}

export namespace CameraOrbitExample {
    // snippet:harp_gl_camera_orbit_example_0.ts
    const locations: { [name: string]: GeoBox | GeoCoordLike[] } = {
        washington: createGeoBox([-77.06377, 38.906263], [-76.96455, 38.858825]),
        dubai: createGeoBox([55.264556, 25.200165], [55.285199, 25.190379]),
        france: createGeoBox([-5.998535, 51.412912], [8.4375, 43.052834]),
        us: createGeoBox([-131.660156, 51.289406], [-71.367188, 24.527135]),
        europe: createGeoBox([-25.839844, 66.548263], [44.121094, 34.307144]),
        earth: createGeoBox([-180, 78], [180, -55])
    };
    let currentLocation = "dubai";

    const map = createBaseMap();
    // end:harp_gl_camera_orbit_example_0.ts

    // snippet:harp_gl_camera_orbit_example_1.ts
    // const dubai = new GeoCoordinates(25.19705, 55.27419);
    const options = { globe: true };
    map.addEventListener(MapViewEventNames.AfterRender, () => {
        console.log("AfterRender th", map.tilt, map.heading);
        gui.updateDisplay();
        updateHTML();
    });
    MapControls.create(map);

    function setLocation(name: string) {
        currentLocation = name;

        map.fitBounds(locations[name] as GeoBox);
        gui.updateDisplay();
        updateHTML();
    }

    // end:harp_gl_camera_orbit_example_1.ts

    const gui = new GUI({ width: 300 });
    gui.add(map, "tilt", 0, 80, 0.1);
    gui.add(map, "heading", -180, 180, 0.5);
    gui.add(map, "zoomLevel", 1, 20, 0.1);
    gui.add(options, "globe").onChange(() => {
        map.projection = options.globe ? sphereProjection : mercatorProjection;
    });

    gui.add(
        {
            staticFrance: () => {
                map.lookAt({
                    target: (locations.france as GeoBox).center,
                    tilt: 25,
                    zoomLevel: 5.1,
                    heading: 15
                });
            }
        },
        "staticFrance"
    );

    gui.add(
        {
            lookAt: () => {
                map.lookAt({});
            }
        },
        "lookAt"
    );

    const setLocations = Object.keys(locations).reduce((r, locationName) => {
        r[locationName] = setLocation.bind(undefined, locationName);
        return r;
    }, {} as any);

    Object.keys(setLocations).forEach(locationName => {
        gui.add(setLocations, locationName);
    });

    function createBaseMap(): MapView {
        document.body.innerHTML += getExampleHTML();

        const canvas = document.getElementById("mapCanvas") as HTMLCanvasElement;
        const mapView = new MapView({
            canvas,
            projection: sphereProjection,
            theme: "resources/berlin_tilezen_base_globe.json"
        });
        MapViewSceneDebugger.setDefault(mapView);
        canvas.addEventListener("contextmenu", e => e.preventDefault());

        CopyrightElementHandler.install("copyrightNotice", mapView);

        mapView.resize(window.innerWidth, window.innerHeight);

        window.addEventListener("resize", () => {
            mapView.resize(window.innerWidth, window.innerHeight);
        });

        const omvDataSource = new OmvDataSource({
            baseUrl: "https://vector.hereapi.com/v2/vectortiles/base/mc",
            apiFormat: APIFormat.XYZOMV,
            styleSetName: "tilezen",
            authenticationCode: apikey,
            authenticationMethod: {
                method: AuthenticationMethod.QueryString,
                name: "apikey"
            },
            copyrightInfo
        });
        mapView.addDataSource(omvDataSource);

        return mapView;
    }

    function updateHTML() {
        const infoElement = document.getElementById("info") as HTMLParagraphElement;
        infoElement.innerHTML =
            `This view is set through the lookAt method: map.lookAt({target: dubai, ` +
            `zoomLevel: ${map.zoomLevel.toFixed(1)}, ` +
            `tilt: ${map.tilt.toFixed(1)}, ` +
            `heading: ${map.heading.toFixed(1)}})`;
    }

    function getExampleHTML() {
        return `
            <style>
                #mapCanvas{
                    top:0
                }
                #info {
                    color: #fff;
                    width: 80%;
                    left: 15%;
                    position: relative;
                    margin: 10px 0 0 -40%;
                    font-size: 15px;
                }
                @media screen and (max-width: 700px) {
                    #info{
                        font-size:11px;
                    }
                }
                </style>
                <p id=info></p>
        `;
    }
}
