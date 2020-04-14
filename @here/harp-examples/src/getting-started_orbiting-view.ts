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
        earth: createGeoBox([-180, 78], [180, -55]),
        anatarctic: [
            new GeoCoordinates(-65.29705, 51.32607),
            new GeoCoordinates(-67.30229, -5.99415),
            new GeoCoordinates(-60.20446, -57.72913),
            new GeoCoordinates(-69.89815, -123.99539),
            new GeoCoordinates(-64.45382, 157.49746),
            new GeoCoordinates(-58.62286, 98.65179)
        ],
        africa: [
            new GeoCoordinates(32.66827, 36.15456),
            new GeoCoordinates(9.87776, 55.79889),
            new GeoCoordinates(-21.14927, 55.41922),
            new GeoCoordinates(-37.23619, 10.88411),
            new GeoCoordinates(-34.66981, 39.03188),
            new GeoCoordinates(12.9366, -25.47008),
            new GeoCoordinates(37.64753, -10.81045)
        ],
        southAmerica: [
            new GeoCoordinates(-0.037727, -85.18558),
            new GeoCoordinates(12.08309, -79.51376),
            new GeoCoordinates(14.99663, -62.62817),
            new GeoCoordinates(-5.82442, -30.97989),
            new GeoCoordinates(-58.76469, -63.97934),
            new GeoCoordinates(-55.51751, -77.08135)
        ],
        australia: [
            new GeoCoordinates(0.319314, 130.85031),
            new GeoCoordinates(-4.03136, 153.57669),
            new GeoCoordinates(-28.94059, 156.3926),
            new GeoCoordinates(-45.25263, 147.50161),
            new GeoCoordinates(-36.99093, 113.46194),
            new GeoCoordinates(-21.93939, 112.09722)
        ],
        northAmerica: [
            new GeoCoordinates(51.95849, -169.69321),
            new GeoCoordinates(82.20267, -5.83541),
            new GeoCoordinates(68.46351, -20.30972),
            new GeoCoordinates(46.1365, -51.80882),
            new GeoCoordinates(17.92657, -65.01497),
            new GeoCoordinates(4.20772, -79.38697),
            new GeoCoordinates(20.15675, -112.33495)
        ],
        asia: [
            new GeoCoordinates(38.70557, 25.095676273814004),
            new GeoCoordinates(40.46185, 25.83294696123821),
            new GeoCoordinates(47.56539, 49.337120152451824),
            new GeoCoordinates(73.83876, 68.08862941747252),
            new GeoCoordinates(81.76084, 90.62772020101889),
            new GeoCoordinates(67.63809, -168.68095103187997),
            new GeoCoordinates(62.90522, -171.40633287870494),
            new GeoCoordinates(48.53365, 157.00900173445882),
            new GeoCoordinates(34.06298, 141.58701888473408),
            new GeoCoordinates(-4.09993, 131.63498333285776),
            new GeoCoordinates(-10.31057, 127.50500787226275),
            new GeoCoordinates(-12.24436, 115.18798058166826),
            new GeoCoordinates(12.1344, 43.53950783023524),
            new GeoCoordinates(28.33851, 32.586304605269305)
        ],
        pacificOcean: [
            new GeoCoordinates(27.0819, 116.99188331207404),
            new GeoCoordinates(64.74506, -175.21090904770676),
            new GeoCoordinates(7.32805, -78.13612731489623),
            new GeoCoordinates(-55.58942, -70.25827916326132),
            new GeoCoordinates(-75.2942, -123.99212082420046),
            new GeoCoordinates(-16.05847, 146.5315368832761)
        ],
        arcticOcean: [
            new GeoCoordinates(68.45423, -67.72241699176338),
            new GeoCoordinates(65.63336, -17.597189318841238),
            new GeoCoordinates(63.30735, 38.63837863819523),
            new GeoCoordinates(66.05542, 73.80738827811217),
            new GeoCoordinates(70.19595, 131.7552825070622),
            new GeoCoordinates(65.12073, -168.5813757864778),
            new GeoCoordinates(50.9709, -81.03147632358663)
        ],
        beringSea: [
            new GeoCoordinates(50.95019, -179.1428493376325),
            new GeoCoordinates(52.91106, 159.02544759162745),
            new GeoCoordinates(69.90354, 179.15147738391926),
            new GeoCoordinates(70.25714, -161.597647174786),
            new GeoCoordinates(55.76049, -157.31410465785078)
        ]
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
                    zoomLevel: 6.7,
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
