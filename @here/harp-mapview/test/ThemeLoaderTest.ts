/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:only-arrow-functions
//    Mocha discourages using arrow functions, see https://mochajs.org/#arrow-functions

import { assert } from "chai";

import { SolidLineStyle, StyleSet, Theme } from "@here/harp-datasource-protocol";
import { getTestResourceUrl } from "@here/harp-test-utils";
import { ThemeLoader } from "../lib/ThemeLoader";

describe.only("ThemeLoader", function() {
    describe("#expandReferences", function() {
        it("supports $ref in technique attr values", async function() {
            const theme: Theme = {
                definitions: {
                    roadColor: { type: "color", value: "#f00" }
                },
                styles: {
                    tilezen: [
                        {
                            description: "roads",
                            when: "kind == 'road",
                            technique: "solid-line",
                            attr: {
                                lineColor: { $ref: "roadColor" }
                            }
                        }
                    ]
                }
            };
            const r = await ThemeLoader.expandReferences(theme);

            const roadStyle = r.styles!.tilezen.find(s => s.description === "roads")!;
            assert.exists(roadStyle);
            assert.equal(roadStyle.technique, "solid-line");
            const roadStyleCasted = (roadStyle as any) as SolidLineStyle;
            assert.equal(roadStyleCasted.attr!.lineColor, "#f00");
        });

        it("supports $ref in Style", async function() {
            const theme: Theme = {
                definitions: {
                    roadColor: { type: "color", value: "#f00" },
                    roadTechnique: {
                        description: "roads",
                        when: "kind == 'road", // TODO: do we want `when` here ...
                        technique: "solid-line",
                        attr: {
                            lineColor: { $ref: "roadColor" }
                        }
                    }
                },
                styles: {
                    tilezen: [
                        {
                            when: "kind == 'road", // or here, or both with override ?
                            $ref: "roadTechnique"
                        }
                    ]
                }
            };
            const r = await ThemeLoader.expandReferences(theme);

            const roadStyle = r.styles!.tilezen.find(s => s.description === "roads")!;
            assert.exists(roadStyle);
            assert.equal(roadStyle.technique, "solid-line");
            const roadStyleCasted = (roadStyle as any) as SolidLineStyle;
            assert.equal(roadStyleCasted.description, "roads");
            assert.equal(roadStyleCasted.attr!.lineColor, "#f00");
        });
    });

    describe("#resolveBaseTheme", function() {
        it("propely loads inherited definitions", async function() {
            const baseTheme: Theme = {
                definitions: {
                    roadColor: { type: "color", value: "#f00" },
                    primaryRoadFillLineWidth: {
                        type: "number",
                        value: {
                            interpolation: "Linear",
                            zoomLevels: [8, 9, 10, 11, 12, 13, 14, 16, 18],
                            values: [650, 400, 220, 120, 65, 35, 27, 9, 7]
                        }
                    },
                    roadTechnique: {
                        description: "roads",
                        when: "kind == 'road",
                        technique: "solid-line",
                        attr: {
                            lineWidth: { $ref: "primaryRoadFillLineWidth" },
                            lineColor: { $ref: "roadColor" }
                        }
                    }
                }
            };
            const inheritedTheme: Theme = {
                extends: baseTheme,
                definitions: {
                    roadColor: { type: "color", value: "#fff" }
                }
            };

            const result = await ThemeLoader.resolveBaseTheme(inheritedTheme);

            assert.exists(result.definitions);
            assert.exists(result.definitions!.roadColor);
            assert.exists(result.definitions!.roadTechnique);
            assert.deepEqual(result.definitions!.roadColor, { type: "color", value: "#fff" });
            assert.deepEqual(
                result.definitions!.roadTechnique,
                baseTheme.definitions!.roadTechnique
            );
        });
    });

    describe("#load support for inheritance and definitions", function() {
        const baseThemeUrl = getTestResourceUrl(
            "@here/harp-mapview",
            "test/resources/baseTheme.json"
        );

        const expectedBaseStyleSet: StyleSet = [
            {
                description: "roads",
                when: "kind == 'road",
                technique: "solid-line",
                attr: {
                    lineWidth: {
                        interpolation: "Linear",
                        zoomLevels: [8, 9, 10, 11, 12, 13, 14, 16, 18],
                        values: [650, 400, 220, 120, 65, 35, 27, 9, 7]
                    },
                    lineColor: "#f00"
                }
            }
        ];

        const expectedOverridenStyleSet: StyleSet = [
            {
                description: "roads",
                when: "kind == 'road",
                technique: "solid-line",
                attr: {
                    lineWidth: {
                        interpolation: "Linear",
                        zoomLevels: [8, 9, 10, 11, 12, 13, 14, 16, 18],
                        values: [650, 400, 220, 120, 65, 35, 27, 9, 7]
                    },
                    lineColor: "#fff"
                }
            }
        ];
        it("loads theme from actual URL and resolves definitions", async function() {
            const result = await ThemeLoader.load(baseThemeUrl);
            assert.exists(result);
            assert.exists(result.styles!.tilezen);
            assert.deepEqual(result.styles!.tilezen, expectedBaseStyleSet);
        });

        it("supports definitions override with actual files", async function() {
            const inheritedThemeUrl = getTestResourceUrl(
                "@here/harp-mapview",
                "test/resources/inheritedStyleBasic.json"
            );
            const result = await ThemeLoader.load(inheritedThemeUrl);
            assert.exists(result);
            assert.exists(result.styles!.tilezen);
            assert.deepEqual(result.styles!.tilezen, expectedOverridenStyleSet);
        });

        it("empty inherited theme just loads base", async function() {
            const result = await ThemeLoader.load({ extends: baseThemeUrl });
            assert.exists(result);
            assert.exists(result.styles!.tilezen);
            assert.deepEqual(result.styles!.tilezen, expectedBaseStyleSet);
        });

        it("supports local definitions override", async function() {
            const result = await ThemeLoader.load({
                extends: baseThemeUrl,
                definitions: {
                    roadColor: { type: "color", value: "#fff" }
                }
            });
            assert.exists(result);
            assert.exists(result.styles!.tilezen);
            assert.deepEqual(result.styles!.tilezen, expectedOverridenStyleSet);
        });
    });
});
