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
import { removeClass, addClass, rgb2hsl, svgElementToImage, backgroundImageToImage, isCrossOrigin } from "../utils/util.js";
import { maxImageSizeDarkImageDetection } from "../constants.js";

export default class ImageProcessor {

    debugLogger;
    websiteSpecialFiltersConfig;

    constructor(debugLogger, websiteSpecialFiltersConfig) {
        this.debugLogger = debugLogger;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    async detectDarkImage(element, hasBackgroundImg) {
        if(!element) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let image = element;

        // Image element
        if (image instanceof HTMLImageElement && isCrossOrigin(image.src)) {
            image = image.cloneNode();
            image.crossOrigin = "Anonymous";
        }

        // SVG element
        if((element instanceof SVGGraphicsElement) && element.nodeName.toLowerCase() === "svg") {
            try {
                removeClass(image, "pageShadowDisableStyling", "pageShadowElementDisabled");

                image = svgElementToImage(element, image);
                
                addClass(image, "pageShadowDisableStyling", "pageShadowElementDisabled");
            } catch(e) {
                this.debugLogger?.log(e.message, "error");
                return false;
            }
        }
        
        // Background image element
        if(!(image instanceof HTMLImageElement) && !(image instanceof SVGImageElement)) {
            if(hasBackgroundImg) {
                try {
                    image = await backgroundImageToImage(element, image);
                } catch(e) {
                    this.debugLogger?.log(e.message, "error");
                    return false;
                }
            } else {
                return false;
            }
        }

        // If the image is not yet loaded, we wait
        if(!image.complete) {
            await this.awaitImageLoading(image);
        }

        // Draw image on canvas
        const { newWidth, newHeight } = this.getResizedDimensions(image, maxImageSizeDarkImageDetection, maxImageSizeDarkImageDetection);
        canvas.width = newWidth;
        canvas.height = newHeight;

        try {
            ctx.drawImage(image, 0, 0, newWidth, newHeight);
        } catch(e) {
            this.debugLogger?.log(e.message, "error");
            return false;
        }

        // Check if the image is dark
        const isDarkImage = this.isImageDark(canvas, newWidth, newHeight);

        canvas.remove();

        if (isDarkImage) {
            this.debugLogger?.log(`Detected dark image - image URL: ${image.src}`);
        }

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
                    } else {
                        if(alpha == 0) {
                            totalTransparentPixels++;
                        } else {
                            totalOtherPixels++;
                        }
                    }
                }
            }

            // Fallback for all black images with transparent background only, not detected by the algorithm
            if(totalDarkPixels > 0 && totalTransparentPixels > 0 && totalOtherPixels == 0) {
                return true;
            }

            return false;
        } catch(e) {
            this.debugLogger?.log(e.message, "error");
            return false;
        }
    }

    isPixelDark(red, green, blue, alpha) {
        if (alpha >= this.websiteSpecialFiltersConfig.darkImageDetectionMinAlpha) {
            const hsl = rgb2hsl(red / 255, green / 255, blue / 255);

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

    async awaitImageLoading(image) {
        return new Promise(resolve => {
            image.addEventListener("load", () => {
                resolve(image);
            });
        });
    }

    elementIsImage(element, hasBackgroundImg) {
        return element instanceof HTMLImageElement || element instanceof SVGImageElement || element instanceof SVGGraphicsElement || hasBackgroundImg;
    }
}