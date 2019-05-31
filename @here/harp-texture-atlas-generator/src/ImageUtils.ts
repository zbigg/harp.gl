/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlendOperation } from "./BlendOperations";
import { ColorOperation } from "./ColorOperations";
import { ColorUtils, RGBA } from "./ColorUtils";
import { ImageDecoder, ImageEncoder } from "./ImageFactory";

export enum ReferenceImg {
    Dst = "Dst",
    Src = "Src",
    Bigger = "Bigger",
    Smaller = "Smaller"
}
/**
 * Provides utility functions for images' blending and colors manipulation.
 */
export class ImageUtils {

    /**
     * Render the srcImage into the dstImage, applying predefinet blit operation.
     *
     * @param dstImage destination image for the blending operation.
     * @param srcImage source image in blend operator.
     * @param blitOp operation to be applied on the images during rendering.
     * @param sizeRef enumeration that decides which image is used as base for output.
     * @param offsetX offset that will be applied to the second image (not the base one).
     * @param offsetY offset in Y coordinates starting from base image left-top corner,
     * pointing downwards.
     * @returns resulting image as new [[ImageEncoder]] instance.
     */
    static combineImages(dstImage: ImageDecoder, srcImage: ImageDecoder, blitOp: BlendOperation,
        sizeRef: ReferenceImg = ReferenceImg.Dst,
        offsetX: number = 0, offsetY: number = 0): ImageEncoder {

        const dstBigger: boolean = (dstImage.width * dstImage.height) >
            (srcImage.width * srcImage.height);
        const dstSizeRef: boolean =
            (sizeRef === ReferenceImg.Dst ||
                ((sizeRef === ReferenceImg.Bigger) && dstBigger) ||
                ((sizeRef === ReferenceImg.Smaller) && !dstBigger));

        const outImage: ImageEncoder = dstSizeRef ? dstImage.copy() : srcImage.copy();
        const offsetImage: ImageDecoder = !dstSizeRef ? dstImage : srcImage;

        // Store convinient variables for src and dst image offsets,
        // one of thoose will always hold zeros.
        const srcOff = {
            x: offsetImage === srcImage ? offsetX : 0,
            y: offsetImage === srcImage ? offsetY : 0,
        };
        const dstOff = {
            x: offsetImage === dstImage ? offsetX : 0,
            y: offsetImage === dstImage ? offsetY : 0,
        };
        // Create rectangles in base (output) image coordinates system.
        const srcRect = {
            x0: srcOff.x,
            y0: srcOff.y,
            x1: srcImage.width + srcOff.x,
            y1: srcImage.height + srcOff.y
        };
        const dstRect = {
            x0: dstOff.x,
            y0: dstOff.y,
            x1: dstImage.width + dstOff.x,
            y1: dstImage.height + dstOff.y
        };
        // Calculate intersection.
        const intersectRect = {
            x0: Math.max(srcRect.x0, dstRect.x0),
            y0: Math.max(srcRect.y0, dstRect.y0),
            x1: Math.min(srcRect.x1, dstRect.x1),
            y1: Math.min(srcRect.y1, dstRect.y1),
        };

        // Intersection rectangle gives coordinates in the output image space, because output image
        // it the which gives the base coordinates for the offsets.
        for (let y = intersectRect.y0; y < intersectRect.y1; ++y) {
            for (let x = intersectRect.x0; x < intersectRect.x1; ++x) {
                const dstColor = dstImage.getPixelAt(x - dstOff.x, y - dstOff.y);
                const srcColor = srcImage.getPixelAt(x - srcOff.x, y - srcOff.y);
                outImage.setPixelAt(x, y, blitOp(dstColor, srcColor));
            }
        }

        return outImage;
    }

    /**
     * Render the srcImage into the dstImage, applying blend operation.
     *
     * @param {*} dstImage
     * @param {*} srcImage
     * @param {*} offsetX
     * @param {*} offsetY
     * @returns resulting image as new [[ImageEncoder]] instance.
     */
    static blendImages(dstImage: ImageDecoder, srcImage: ImageDecoder, blitOp: BlendOperation,
        offsetX: number = 0, offsetY: number = 0): ImageEncoder {

        const outImage: ImageEncoder = dstImage.copy();

        const w: number = Math.min(srcImage.width, dstImage.width - offsetX);
        const h: number = Math.min(srcImage.height, dstImage.height - offsetY);

        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const dstColor = dstImage.getPixelAt(offsetX + x, offsetY + y);
                const srcColor = srcImage.getPixelAt(x, y);
                outImage.setPixelAt(offsetX + x, offsetY + y,
                    blitOp(dstColor, srcColor));
            }
        }

        return outImage;
    }

    /**
     * Perform pixel by pixel color blending on image source data.
     *
     * @param srcImage
     * @param colorOp
     * @param blendColor
     * @returns resulting image as new [[ImageEncoder]] instance.
     */
    static blendImageColor(srcImage: ImageDecoder | ImageEncoder, blendOp: BlendOperation,
        blendColor: RGBA): ImageEncoder {
        const outImage: ImageEncoder = srcImage.copy();

        const w: number = srcImage.width;
        const h: number = srcImage.height;

        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const srcColor: RGBA = srcImage.getPixelAt(x, y);
                const resColor: RGBA = blendOp(srcColor, blendColor);
                outImage.setPixelAt(x, y, resColor);
            }
        }

        return outImage;
    }

    /**
     * Perform pixel by pixel color transformation on image source data.
     *
     * @param srcImage
     * @param colorOp
     * @returns resulting image as new [[ImageEncoder]] instance.
     */
    static processImageColor(srcImage: ImageDecoder | ImageEncoder,
        colorOp: ColorOperation): ImageEncoder {

        const outImage: ImageEncoder = srcImage.copy();

        const w: number = srcImage.width;
        const h: number = srcImage.height;

        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const srcColor: RGBA = srcImage.getPixelAt(x, y);
                const resColor: RGBA = colorOp(srcColor);
                outImage.setPixelAt(x, y, resColor);
            }
        }

        return outImage;
    }
}

