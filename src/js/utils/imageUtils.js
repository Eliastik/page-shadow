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
import { regexpMatchURL } from "../constants.js";
import { sendMessageWithPromise } from "../utils/browserUtils.js";
import { isCrossOrigin } from "./urlUtils.js";
import { extractSvgFromDataUrl, getImageUrlFromSvgElement } from "./svgUtils.js";
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used by the image processor (dark image detection) */

const debugLogger = new DebugLogger();

function elementIsImage(element, hasBackgroundImg) {
    return element instanceof HTMLImageElement || element instanceof SVGImageElement
        || element instanceof SVGGraphicsElement || hasBackgroundImg;
}

async function fetchCorsImage(imageUrl) {
    /* If image is from a cross origin, we fetch the image from the background script/service worker
       to bypass CORS */
    const response = await sendMessageWithPromise({ type: "fetchImageData", imageUrl }, "fetchImageDataResponse");

    if(response && response.success) {
        const image = new Image();
        image.src = response.data;
        return image;
    }

    return null;
}

async function svgElementToImage(url, enableCorsFetch) {
    if(isCrossOrigin(url) && enableCorsFetch) {
        const newImage = await fetchCorsImage(url);

        if(newImage) {
            return newImage;
        }
    }

    const image = new Image();
    image.src = url;

    if(isCrossOrigin(url)) {
        image.crossOrigin = "Anonymous";
    }

    return image;
}

async function backgroundImageToImage(url, enableCorsFetch) {
    if(isCrossOrigin(url) && enableCorsFetch) {
        const newImage = await fetchCorsImage(url);

        if(newImage) {
            return newImage;
        }
    }

    const image = new Image();

    const imageLoadPromise = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    image.src = url;

    if(isCrossOrigin(url)) {
        image.crossOrigin = "Anonymous";
    }

    await imageLoadPromise;
    await image.decode();

    return image;
}

function getImageUrlFromElement(element, hasBackgroundImg, computedStyles, pseudoElt, fetchUseHref) {
    if(element instanceof HTMLImageElement) {
        return element.src;
    }

    if((element instanceof SVGGraphicsElement) && element.nodeName.toLowerCase() === "svg") {
        return getImageUrlFromSvgElement(element, pseudoElt, null, fetchUseHref);
    }

    if(!(element instanceof HTMLImageElement) && !(element instanceof SVGImageElement) && hasBackgroundImg) {
        return getImageUrlFromBackground(element, computedStyles, pseudoElt, fetchUseHref);
    }

    return null;
}

async function getImageUrlFromBackground(element, computedStyles, pseudoElt, fetchUseHref) {
    const style = element.currentStyle || computedStyles;

    const styleContent = pseudoElt && computedStyles.content && computedStyles.content.match(regexpMatchURL);
    const styleBackground = style.background && style.background.match(regexpMatchURL);
    const styleBackgroundImage = style.backgroundImage && style.backgroundImage.match(regexpMatchURL);
    const maskImage = style.maskImage && style.maskImage.match(regexpMatchURL);
    const objectData = element instanceof HTMLObjectElement && element.data;

    const urlMatch = styleContent || styleBackground || styleBackgroundImage || maskImage;
    const url = objectData || (urlMatch ? urlMatch[2] : null);

    if(url && url.trim().toLowerCase().startsWith("data:image/svg+xml")) {
        const svgElement = await extractSvgFromDataUrl(url, element, fetchUseHref);

        if(svgElement) {
            return getImageUrlFromSvgElement(svgElement, pseudoElt, computedStyles, fetchUseHref);
        }

        return null;
    }

    return url;
}

async function getImageFromElement(image, imageUrl, hasBackgroundImg, enableCorsFetch, enableRedirectionCheck) {
    let isCrossOriginUrl = isCrossOrigin(imageUrl);

    if(!isCrossOriginUrl && enableRedirectionCheck) {
        const isRedirectedImageResponse = await sendMessageWithPromise({ type: "checkImageRedirection", imageUrl }, "checkImageRedirectionResponse");

        if(isRedirectedImageResponse && isRedirectedImageResponse.redirected && isCrossOrigin(isRedirectedImageResponse.redirectedUrl)) {
            isCrossOriginUrl = true;
        }
    }

    if(image instanceof HTMLImageElement && isCrossOriginUrl) {
        if(enableCorsFetch) {
            const newImage = await fetchCorsImage(imageUrl);

            if(newImage) {
                image = newImage;
            }
        } else {
            image = image.cloneNode();
            image.crossOrigin = "Anonymous";
        }
    }

    // SVG element
    if((image instanceof SVGGraphicsElement) && image.nodeName.toLowerCase() === "svg") {
        try {
            image = await svgElementToImage(imageUrl, enableCorsFetch);
        } catch(e) {
            debugLogger?.log(`ImageProcessor detectDarkImage - Error converting SVG element to image - Image URL: ${imageUrl}`, "error", e);
            return null;
        }
    }

    // Background image element
    if(!(image instanceof HTMLImageElement) && !(image instanceof SVGImageElement)) {
        if(hasBackgroundImg) {
            try {
                image = await backgroundImageToImage(imageUrl, enableCorsFetch);
            } catch(e) {
                debugLogger?.log(`ImageProcessor detectDarkImage - Error converting background to image - Image URL: ${imageUrl}`, "error", e);
                return null;
            }
        } else {
            return null;
        }
    }

    // If the image is not yet loaded, we wait
    if(!image.complete) {
        try {
            await awaitImageLoading(image);
        } catch(e) {
            debugLogger?.log("ImageProcessor detectDarkImage - Error loading image", "error", image, e);
            return null;
        }
    }

    return image;
}

function awaitImageLoading(image) {
    return new Promise((resolve, reject) => {
        if(image.complete) {
            resolve(image);
            return;
        }

        let cleanup = () => {};

        const onLoad = () => {
            cleanup();
            resolve(image);
        };

        const onError = () => {
            cleanup();
            reject(new Error(`Image failed to load: ${image.src}`));
        };

        cleanup = () => {
            image.removeEventListener("load", onLoad);
            image.removeEventListener("error", onError);
        };

        image.addEventListener("load", onLoad);
        image.addEventListener("error", onError);
    });
}

export { backgroundImageToImage, getImageUrlFromElement, fetchCorsImage, getImageFromElement, awaitImageLoading, elementIsImage, getImageUrlFromBackground };