/* Page Shadow
 *
 * Copyright (C) 2015-2024 Eliastik (eliastiksofts.com)
 *
 * This file is part of Page Shadow.
 *
 * Page Shadow is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Page Shadow is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Page Shadow.  If not, see <http://www.gnu.org/licenses/>. */
import { sha256 } from "../utils/commonUtils.js";
import { sendMessageWithPromise } from "../utils/browserUtils.js";
import { isValidURL, isCrossOrigin } from "../utils/urlUtils.js";
import { svgElementToImage, backgroundImageToImage, getImageUrlFromElement } from "../utils/imageUtils.js";
import { rgbTohsl } from "../utils/colorUtils.js";
import { maxImageSizeDarkImageDetection } from "../constants.js";

export default class ImageProcessor {

    debugLogger;
    websiteSpecialFiltersConfig;

    memoizedResults = new Map();

    constructor(debugLogger, websiteSpecialFiltersConfig) {
        this.debugLogger = debugLogger;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    async detectDarkImage(image, hasBackgroundImg, computedStyles, pseudoElt) {
        if(!image || !computedStyles) return false;

        const imageUrl = getImageUrlFromElement(image, hasBackgroundImg, computedStyles, pseudoElt);

        if(imageUrl == null || imageUrl.trim() === "") {
            return false;
        }

        if(!isValidURL(imageUrl)) {
            this.debugLogger.log(`Ignored image with following URL because it is invalid: ${imageUrl}`, "debug", image);
            return false;
        }

        if(this.isDetectionResultMemoizable(image, hasBackgroundImg)) {
            const urlSha256 = await sha256(imageUrl);

            if(this.memoizedResults.has(urlSha256)) {
                this.debugLogger?.log(`ImageProcessor detectDarkImage - Getting memoized result for image with URL: ${imageUrl}`);
                return this.memoizedResults.get(urlSha256);
            }
        }

        if(image instanceof HTMLImageElement && isCrossOrigin(imageUrl)) {
            /* If image is from a cross origin, we fetch the image from the background script/service worker
               to bypass CORS */
            const response = await sendMessageWithPromise({ type: "fetchImageData", imageUrl }, "fetchImageDataResponse");

            if(response && response.success) {
                image = new Image();
                image.src = response.data;
            }
        }

        // SVG element
        if((image instanceof SVGGraphicsElement) && image.nodeName.toLowerCase() === "svg") {
            try {
                image = svgElementToImage(imageUrl);
            } catch(e) {
                this.debugLogger?.log(`ImageProcessor detectDarkImage - Error converting SVG element to image - Image URL: ${imageUrl}`, "error", e);
                await this.memoizeDetectionResult(image, hasBackgroundImg, imageUrl, false);
                return false;
            }
        }

        // Background image element
        if(!(image instanceof HTMLImageElement) && !(image instanceof SVGImageElement)) {
            if(hasBackgroundImg) {
                try {
                    image = await backgroundImageToImage(imageUrl);
                } catch(e) {
                    this.debugLogger?.log(`ImageProcessor detectDarkImage - Error converting background to image - Image URL: ${imageUrl}`, "error", e);
                    await this.memoizeDetectionResult(image, hasBackgroundImg, imageUrl, false);
                    return false;
                }
            } else {
                await this.memoizeDetectionResult(image, hasBackgroundImg, imageUrl, false);
                return false;
            }
        }

        // If the image is not yet loaded, we wait
        if(!image.complete) {
            try {
                await this.awaitImageLoading(image);
            } catch(e) {
                this.debugLogger?.log("ImageProcessor detectDarkImage - Error loading image", "error", image, e);
                await this.memoizeDetectionResult(image, hasBackgroundImg, imageUrl, false);
                return false;
            }
        }

        // Draw image on canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const { newWidth, newHeight } = this.getResizedDimensions(image, maxImageSizeDarkImageDetection, maxImageSizeDarkImageDetection);
        canvas.width = newWidth;
        canvas.height = newHeight;

        try {
            ctx.drawImage(image, 0, 0, newWidth, newHeight);
        } catch(e) {
            this.debugLogger?.log(`ImageProcessor detectDarkImage - Error drawing image to canvas. Image URL: ${imageUrl}`, "error", e);

            await this.memoizeDetectionResult(image, hasBackgroundImg, imageUrl, false);
            canvas.remove();

            return false;
        }

        // Check if the image is dark
        const isDarkImage = this.isImageDark(canvas, newWidth, newHeight);

        canvas.remove();

        if(isDarkImage) {
            this.debugLogger?.log(`Detected dark image. Image URL: ${image.src}`);
        }

        await this.memoizeDetectionResult(image, hasBackgroundImg, imageUrl, isDarkImage);

        return isDarkImage;
    }

    getResizedDimensions(image, maxWidth, maxHeight) {
        const width = image.width;
        const height = image.height;

        let newWidth = width;
        let newHeight = height;

        if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const resizeRatio = Math.min(widthRatio, heightRatio);

            newWidth = Math.round(width * resizeRatio);
            newHeight = Math.round(height * resizeRatio);
        }

        return { newWidth, newHeight };
    }

    isImageDark(canvas, width, height) {
        const ctx = canvas.getContext("2d");

        try {
            const blockSize = this.websiteSpecialFiltersConfig.darkImageDetectionBlockSize;

            if(width <= 0 || height <= 0) {
                return false;
            }

            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;

            let totalDarkPixels = 0;
            let totalTransparentPixels = 0;
            let totalOtherPixels = 0;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const red = data[index];
                    const green = data[index + 1];
                    const blue = data[index + 2];
                    const alpha = data[index + 3];

                    if (this.isPixelDark(red, green, blue, alpha)) {
                        if (this.hasTransparentSurroundingPixels(x, y, data, width, height, blockSize)) {
                            return true;
                        }

                        totalDarkPixels++;
                    } else if(alpha == 0) {
                        totalTransparentPixels++;
                    } else {
                        totalOtherPixels++;
                    }
                }
            }

            // Fallback for all black images with transparent background only, not detected by the algorithm
            if(totalDarkPixels > 0 && totalTransparentPixels > 0 && totalOtherPixels == 0) {
                return true;
            }

            return false;
        } catch(e) {
            this.debugLogger?.log("ImageProcessor isImageDark - Error analyzing canvas", "error", e);
            return false;
        }
    }

    isPixelDark(red, green, blue, alpha) {
        if (alpha >= this.websiteSpecialFiltersConfig.darkImageDetectionMinAlpha) {
            const hsl = rgbTohsl(red / 255, green / 255, blue / 255);

            if(hsl[2] <= this.websiteSpecialFiltersConfig.darkImageDetectionHslTreshold) {
                return true;
            }
        }

        return false;
    }

    hasTransparentSurroundingPixels(x, y, data, width, height, blockSize) {
        let transparentPixelCount = 0;
        let darkPixelCount = 0;
        let nonTransparentPixelCount = 0;
        let totalPixelCount = 0;

        const startX = Math.max(0, x - blockSize / 2);
        const startY = Math.max(0, y - blockSize / 2);
        const endX = Math.min(width, x + blockSize / 2);
        const endY = Math.min(height, y + blockSize / 2);

        for (let j = startY; j < endY; j++) {
            for (let i = startX; i < endX; i++) {
                const index = (j * width + i) * 4;
                const red = data[index];
                const green = data[index + 1];
                const blue = data[index + 2];
                const alpha = data[index + 3];

                if (alpha === 0) {
                    transparentPixelCount++;
                } else {
                    nonTransparentPixelCount++;
                }

                if (this.isPixelDark(red, green, blue, alpha)) {
                    darkPixelCount++;
                }

                totalPixelCount++;
            }
        }

        return transparentPixelCount / totalPixelCount > this.websiteSpecialFiltersConfig.darkImageDetectionTransparentPixelsRatio
            && darkPixelCount / nonTransparentPixelCount > this.websiteSpecialFiltersConfig.darkImageDetectionDarkPixelsRatio;
    }

    awaitImageLoading(image) {
        return new Promise((resolve, reject) => {
            if(image.complete) {
                resolve(image);
                return;
            }

            const onLoad = () => {
                cleanup();
                resolve(image);
            };

            const onError = () => {
                cleanup();
                reject(new Error(`Image failed to load: ${image.src}`));
            };

            const cleanup = () => {
                image.removeEventListener("load", onLoad);
                image.removeEventListener("error", onError);
            };

            image.addEventListener("load", onLoad);
            image.addEventListener("error", onError);
        });
    }

    detectionCanBeAwaited(element) {
        if(element) {
            return !element.hasAttribute("loading");
        }

        return true;
    }

    elementIsImage(element, hasBackgroundImg) {
        return element instanceof HTMLImageElement || element instanceof SVGImageElement || element instanceof SVGGraphicsElement || hasBackgroundImg;
    }

    isDetectionResultMemoizable(element, hasBackgroundImg) {
        return this.websiteSpecialFiltersConfig.enableDarkImageDetectionCache && (element instanceof HTMLImageElement || element instanceof SVGImageElement || hasBackgroundImg);
    }

    async memoizeDetectionResult(element, hasBackgroundImg, imageUrl, result) {
        if(this.isDetectionResultMemoizable(element, hasBackgroundImg)) {
            if(this.memoizedResults.size >= this.websiteSpecialFiltersConfig.darkImageDetectionMaxCacheSize) {
                const oldestKey = this.memoizedResults.keys().next().value;
                this.memoizedResults.delete(oldestKey);
            }

            this.memoizedResults.set(await sha256(imageUrl), result);
        }
    }
}