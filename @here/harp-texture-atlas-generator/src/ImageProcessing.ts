/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlendAlpha, BlendMultiplyRGB, BlendOperation, BlendOverlay } from "./BlendOperations";
import { ColorGrayscaleAverage, ColorGrayscaleLightness } from "./ColorOperations";
// tslint:disable-next-line: no-duplicate-imports
import { ColorGrayscaleLuminosity, ColorInvert } from "./ColorOperations";
import { Color, ImageDecoder, ImageEncoder } from "./ImageFactory";
import { ImageUtils, ReferenceImg } from "./ImageUtils";


export interface ImageProcess {
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder;
}

export class InvertColor implements ImageProcess {
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        return ImageUtils.processImageColor(srcImage, ColorInvert);
    }
}

export enum GrayscaleMethod {
    Lighness = "Lighness",
    Average = "Average",
    Luminosity = "Luminosity"
}

export class Grayscale implements ImageProcess {
    constructor(private readonly method: GrayscaleMethod = GrayscaleMethod.Luminosity) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        switch (this.method) {
            case GrayscaleMethod.Lighness:
                return ImageUtils.processImageColor(srcImage, ColorGrayscaleLightness);
            case GrayscaleMethod.Average:
                return ImageUtils.processImageColor(srcImage, ColorGrayscaleAverage);
            case GrayscaleMethod.Luminosity:
                return ImageUtils.processImageColor(srcImage, ColorGrayscaleLuminosity);
            default:
                throw new Error("Unrecognized grayscale method!");
        }
    }
}

export class Colorize implements ImageProcess {
    constructor(readonly color: Color) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        // Firstly convert image to grayscale using most common Luminosity method.
        let resultImage: ImageEncoder =
            ImageUtils.processImageColor(srcImage, ColorGrayscaleLuminosity);
        // Blend multiply luminosity values by desired color.
        resultImage = ImageUtils.blendImageColor(resultImage, BlendMultiplyRGB, this.color);
        return resultImage;
    }
}

export class BlendImages implements ImageProcess {
    constructor(readonly dstImage: ImageDecoder, readonly blendOperation: BlendOperation) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        // TODO: Not all blending modes has been yet tested
        return ImageUtils.blendImages(this.dstImage, srcImage, this.blendOperation);
    }
}

export interface Offset {
    readonly x: number;
    readonly y: number;
}

export class CombineImages implements ImageProcess {
    constructor(readonly dstImage: ImageDecoder, readonly blendOperation: BlendOperation,
        readonly sizeRef: ReferenceImg = ReferenceImg.Dst,
        readonly offset: Offset = { x: 0, y: 0 }) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        return ImageUtils.combineImages(this.dstImage, srcImage, this.blendOperation, this.sizeRef,
            this.offset.x, this.offset.y);
    }
}

export class AddBackground implements ImageProcess {
    constructor(readonly background: ImageDecoder, readonly offset: Offset = { x: 0, y: 0 }) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        return ImageUtils.combineImages(this.background, srcImage, BlendAlpha, ReferenceImg.Bigger,
            this.offset.x, this.offset.y);
    }
}

export class AddForeground implements ImageProcess {
    constructor(readonly foreground: ImageDecoder, readonly offset: Offset = { x: 0, y: 0 }) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        return ImageUtils.combineImages(srcImage, this.foreground, BlendAlpha, ReferenceImg.Bigger,
            this.offset.x, this.offset.y);
    }
}

export class Resize implements ImageProcess {
    constructor(readonly width: number, readonly height: number) {
    }
    run(srcImage: ImageDecoder | ImageEncoder): ImageEncoder {
        // If image dimensions are the same as desired or both target dimensions are set to
        // zero just return copy of the image.
        if ((this.width === 0 && this.height === 0) ||
            (this.width === srcImage.width && this.height === srcImage.height)) {
            return srcImage.copy();
        }
        // If one of the parameters is set to zero then calculate its value by
        // preserving original aspect ratio.
        const aspect: number = srcImage.width / srcImage.height;
        const w: number = this.width === 0 ? this.height * aspect : this.width;
        const h: number = this.height === 0 ? this.width / aspect : this.height;
        // If we deal with ImageEncoder directly simply resize
        if ("resize" in srcImage) {
            return srcImage.resize(w, h);
        }
        // Otherwise explicit copy is required
        else {
            return srcImage.copy().resize(w, h);
        }
    }
}

