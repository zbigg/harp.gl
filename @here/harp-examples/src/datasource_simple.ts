/*
 * Copyright (C) 2017-2018 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { DebugTileDataSource } from "@here/harp-debug-datasource";
import {
    GeoCoordinates,
    TileKey,
    TilingScheme,
    webMercatorTilingScheme
} from "@here/harp-geoutils";
import { MapControls } from "@here/harp-map-controls";
import { CopyrightElementHandler, DataSource, MapView, Tile } from "@here/harp-mapview";
import * as THREE from "three";

// creates a new MapView for the HTMLCanvasElement of the given id
function initializeMapView(id: string): MapView {
    const canvas = document.getElementById(id) as HTMLCanvasElement;

    const sampleMapView = new MapView({
        canvas,
        //theme: { styles: [] }, // dummy theme
        theme: "resources/theme.json"
    });

    CopyrightElementHandler.install("copyrightNotice")
        .attach(sampleMapView)
        .setDefaults([
            {
                id: "openstreetmap.org",
                label: "OpenStreetMap contributors",
                link: "https://www.openstreetmap.org/copyright"
            }
        ]);

    // let the camera float over the map, looking straight down
    sampleMapView.camera.position.set(0, 0, 20000000);
    // center the camera somewhere around Berlin geo locations
    sampleMapView.geoCenter = new GeoCoordinates(52.51622, 13.37036, 0);

    // instantiate the default map controls, allowing the user to pan around freely.
    const controls = new MapControls(sampleMapView);
    controls.tiltEnabled = true;

    // resize the mapView to maximum
    sampleMapView.resize(window.innerWidth, window.innerHeight);

    // react on resize events
    window.addEventListener("resize", () => {
        sampleMapView.resize(window.innerWidth, window.innerHeight);
    });

    return sampleMapView;
}

/**
 * A simple Getting Started Data Source. Creates flat colored geometry for each tile. All data
 * sources extend the [[DataSource]] class:
 *
 * ```typescript
 * class SimpleDataSource extends DataSource {
 * ```
 *
 * In the constructor, the constructor of the super class is called first, passing the name of the
 * data source. Then, the [[DataSource.cacheable]] property is set to true to inform that the tiles
 * generated by this data source can be cached and [[MapView]] should manage the lifetime of
 * [[Tile]] objects created by this data source:
 *
 * ```typescript
 * [[include:vislib_datasource_simple_1.ts]]
 * ```
 *
 * Next, [[DataSource.getTilingScheme]] method is being overriden to to tell which [[TilingScheme]]
 * the generated [[Tile]] objects adhere to. In this example, the [[webMercatorTilingScheme]] is
 * used:
 *
 * ```typescript
 * [[include:vislib_datasource_simple_2.ts]]
 * ```
 *
 * To render a flat geometry for each tile. A helper method to create a geometry for each tile, that
 * uses the [[Tile.boundingBox]] as extends of the geometry is used.
 *
 * ```typescript
 * [[include:vislib_datasource_simple_3.ts]]
 * ```
 *
 * To actually render the geometry it also needs a material. Another helper method is added to
 * create the materials for the tiles. Then a checkerboard pattern is created using the
 * [[TileKey.column]] and [[TileKey.row]] numbers of the [[Tile]].
 *
 *
 * ```typescript
 * [[include:vislib_datasource_simple_4.ts]]
 * ```
 *
 * Now it's time to prepare the tile generation using the [[createGeometry]] and [[createMaterial]]
 * methods by overriding the [[DataSource.getTile]] method. A [[Tile]] can have multiple
 * [[Tile.objects]] attached to it. As a starting point a single mesh is created and attached to it.
 *
 * ```typescript
 * [[include:vislib_datasource_simple_5.ts]]
 * ```
 *
 * First, a new [[Tile]] object is created. Every tile can have zero or more THREE objects, in this
 * case, a new Mesh is created using createGeometry and createMaterial methods. [[MapView]] handles
 * caching tiles. Finally an instance of the Datasource is created and added to the mapview.
 * ```typescript
 * [[include:vislib_datasource_simple_6.ts]]
 * ```
 *
 * Additionally a debug Datasource is added, too, to visualize tile bounds and tileKeys.
 * ```typescript
 * [[include:vislib_datasource_simple_7.ts]]
 * ```
 */
export namespace SimpleDataSourceExample {
    export class SimpleDataSource extends DataSource {
        // snippet:vislib_datasource_simple_1.ts
        constructor() {
            super("SimpleDataSource");
            this.cacheable = true;
        }
        // end:vislib_datasource_simple_1.ts

        // snippet:vislib_datasource_simple_2.ts
        getTilingScheme(): TilingScheme {
            return webMercatorTilingScheme;
        }
        // end:vislib_datasource_simple_2.ts

        // snippet:vislib_datasource_simple_3.ts
        createGeometry(boundingBox: THREE.Box3, center: THREE.Vector3): THREE.Geometry {
            const geometry = new THREE.Geometry();
            // move the bounding  center to (0, 0), as the created geometry will later be added
            // to tile.center
            boundingBox.min.sub(center);
            boundingBox.max.sub(center);
            // add vertices to the geometry
            geometry.vertices.push(
                new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, 0),
                new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, 0),
                new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, 0),
                new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, 0)
            );
            // add two triangle faces to the geometry, using the vertex indices
            geometry.faces.push(new THREE.Face4(0, 1, 2), new THREE.Face4(0, 2, 3));
            return geometry;
        }
        // end:vislib_datasource_simple_3.ts

        // snippet:vislib_datasource_simple_4.ts
        createMaterial(tileKey: TileKey): THREE.MeshMaterialType {
            const material = new THREE.MeshBasicMaterial();
            // tslint:disable-next-line:prefer-conditional-expression
            if ((tileKey.row + tileKey.column) % 2) {
                //create a black material for the even numbered tiles
                material.color = new THREE.Color(0, 0, 0);
            } else {
                //create a white material for the odd numbered tiles
                material.color = new THREE.Color(1, 1, 1);
            }
            return material;
        }
        // end:vislib_datasource_simple_4.ts

        // snippet:vislib_datasource_simple_5.ts
        getTile(tileKey: TileKey): Tile | undefined {
            // Create a new tile.
            const tile = new Tile(this, tileKey);

            // Add a THREE.Mesh created from the geometry and material factories
            tile.objects.push(
                new THREE.Mesh(
                    this.createGeometry(tile.boundingBox.clone(), tile.center),
                    this.createMaterial(tile.tileKey)
                )
            );

            return tile;
        }
        // end:vislib_datasource_simple_5.ts
    }

    const mapView = initializeMapView("mapCanvas");

    // snippet:vislib_datasource_simple_6.ts
    const simpleDataSource = new SimpleDataSource();
    mapView.addDataSource(simpleDataSource);
    // end:vislib_datasource_simple_6.ts

    // snippet:vislib_datasource_simple_7.ts
    const debugDataSource = new DebugTileDataSource(webMercatorTilingScheme);
    mapView.addDataSource(debugDataSource);
    // end:vislib_datasource_simple_7.ts
}
