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
import { base64EncodeUnicode } from "./commonUtils.js";
import { sendMessageWithPromise } from "../utils/browserUtils.js";
import { isCrossOrigin, safeDecodeURIComponent } from "./urlUtils.js";
import { addClass, removeClass, getPageAnalyzerCSSClass } from "./cssClassUtils.js";
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

async function svgElementToImage(url) {
    if(isCrossOrigin(url)) {
        const newImage = await fetchCorsImage(url);
        if(newImage) {
            return newImage;
        }
    }

    const image = new Image();
    image.src = url;

    return image;
}

async function backgroundImageToImage(url) {
    const image = new Image();

    if(isCrossOrigin(url)) {
        const newImage = await fetchCorsImage(url);
        if(newImage) {
            return newImage;
        }
    }

    const imageLoadPromise = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    image.src = url;

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

function getImageUrlFromBackground(element, computedStyles, pseudoElt, fetchUseHref) {
    const style = element.currentStyle || computedStyles;

    const styleContent = pseudoElt && computedStyles.content && computedStyles.content.match(regexpMatchURL);
    const styleBackground = style.background && style.background.match(regexpMatchURL);
    const styleBackgroundImage = style.backgroundImage && style.backgroundImage.match(regexpMatchURL);
    const maskImage = style.maskImage && style.maskImage.match(regexpMatchURL);
    const objectData = element instanceof HTMLObjectElement && element.data;

    const urlMatch = styleContent || styleBackground || styleBackgroundImage || maskImage;
    const url = objectData || (urlMatch ? urlMatch[2] : null);

    if(url && url.trim().toLowerCase().startsWith("data:image/svg+xml")) {
        const svgElement = extractSvgFromDataUrl(url, element);

        if(svgElement) {
            return getImageUrlFromSvgElement(svgElement, pseudoElt, computedStyles, fetchUseHref);
        }

        return null;
    }

    return url;
}

function extractSvgFromDataUrl(url, element) {
    const regexMatchSVGData = /^data:image\/svg\+xml(;(charset=)?([a-zA-Z0-9-\s]+))?(;base64)?,/;
    const match = regexMatchSVGData.exec(url.trim());

    if(!match) {
        debugLogger.log(`Invalid data URI format: ${url}`, "error", element);
        return null;
    }

    let decodedURL = url.trim().replace(regexMatchSVGData, "");

    // If the SVG contains base64 data
    if((match[3] && match[3].toLowerCase() === "base64")
                || (match[4] && match[4].toLowerCase() === ";base64")) {
        try {
            decodedURL = atob(safeDecodeURIComponent(decodedURL));
        } catch(e) {
            debugLogger.log(`Error decoding base64 data for URL: ${url}`, "error", e);
            return null;
        }
    }

    const svgData = safeDecodeURIComponent(decodedURL.replace(/\\"/g, "\""));
    const decodedSvg = decodeSvgString(svgData);


    if(!decodedSvg) {
        debugLogger.log(`extractSvgFromDataUrl - Error parsing SVG from URL: ${url}`, "error", element);
    }

    return decodedSvg;
}

function decodeSvgString(svgString) {
    const svgDoc = new DOMParser().parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    const errorNode = svgDoc.querySelector("parsererror");

    if(errorNode) {
        return null;
    }

    return svgElement;
}

function cloneSvgNode(svgNode) {
    const svgString = svgNode.outerHTML;
    return decodeSvgString(svgString);
}

function processSvgAttribute(attribute) {
    const matchURLAttribute = attribute && attribute.match(regexpMatchURL);
    return matchURLAttribute && matchURLAttribute[2] ? `url(${matchURLAttribute[2]})` : attribute;
}

function applyStylesToClonedSvg(element, clonedSvg) {
    const originalElements = element.getElementsByTagName("*");
    const clonedElements = clonedSvg.getElementsByTagName("*");

    for (let i = 0; i < clonedElements.length; i++) {
        const originalElement = originalElements[i];
        const clonedElement = clonedElements[i];

        const originalElementStyles = window.getComputedStyle(originalElement);
        const { stroke, color, fill } = originalElementStyles;

        clonedElement.setAttribute("fill", processSvgAttribute(fill));
        clonedElement.setAttribute("stroke", processSvgAttribute(stroke));
        clonedElement.setAttribute("color", color);
    }
}

function extractSvgNamespaces(innerHTML) {
    const namespaces = [];

    if(innerHTML.includes("xlink:")) {
        namespaces.push("xmlns:xlink=\"http://www.w3.org/1999/xlink\"");
    }

    if(innerHTML.includes("xml:")) {
        namespaces.push("xmlns:xml=\"http://www.w3.org/XML/1998/namespace\"");
    }

    if(innerHTML.includes("rdf:") || innerHTML.includes("cc:") || innerHTML.includes("dc:")) {
        namespaces.push("xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"");
        namespaces.push("xmlns:cc=\"http://creativecommons.org/ns#\"");
        namespaces.push("xmlns:dc=\"http://purl.org/dc/elements/1.1/\"");
    }

    const namespaceString = namespaces.length > 0 ? ` ${namespaces.join(" ")}` : "";

    return namespaceString;
}

function createSvgDataUrl(innerHTML, width, height, fill, color, stroke) {
    const namespaceString = extractSvgNamespaces(innerHTML);
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg"${namespaceString} width="${width}" height="${height}" fill="${processSvgAttribute(fill)}" color="${color}" stroke="${processSvgAttribute(stroke)}">${innerHTML}</svg>`;
    const dataUrlString = `data:image/svg+xml;base64,${base64EncodeUnicode(svgString)}`;

    return dataUrlString;
}

async function getImageUrlFromSvgElement(element, pseudoElt, computedStyles, fetchUseHref) {
    if(!element) {
        return null;
    }

    const clonedSvg = cloneSvgNode(element);

    if(!clonedSvg) {
        debugLogger.log("getImageUrlFromSvgElement - Error parsing SVG from element", "error", element);
        return null;
    }

    addClass(element, getPageAnalyzerCSSClass("pageShadowForceBlackColor", pseudoElt));

    computedStyles = computedStyles || window.getComputedStyle(element);

    const box = element && element.getBBox && element.getBBox();
    const width = box && box.width > 0 ? box.width : 100;
    const height = box && box.height > 0 ? box.height : 100;

    const { stroke, color, fill } = computedStyles;

    applyStylesToClonedSvg(element, clonedSvg);

    removeClass(element, getPageAnalyzerCSSClass("pageShadowForceBlackColor", pseudoElt));

    const { innerHTML } = await extractSvgUseHref(clonedSvg, fetchUseHref);

    return createSvgDataUrl(innerHTML, width, height, fill, color, stroke);
}

async function extractSvgUseHref(element, fetchHref) {
    const useHrefs = [];

    let { innerHTML } = element;

    const matches = [...innerHTML.matchAll(/<use[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/use>/g)];

    for(const match of matches) {
        const value = match[0];
        const href = match[1];

        try {
            // Fetch symbol based on CSS selector from href attribute
            const symbol = document.querySelector(href);

            if(symbol) {
                useHrefs.push(href);
                innerHTML = innerHTML.replace(value, symbol.innerHTML);
            }
        // eslint-disable-next-line no-unused-vars
        } catch(e) {
            const { url, svgElement } = await fetchSvgFromUsehref(href, fetchHref);

            if(svgElement) {
                innerHTML = innerHTML.replace(value, svgElement.innerHTML);
            } else if(url) {
                innerHTML.replace(value, value.replace(href, url));
            }
        }
    }

    return { innerHTML, useHrefs };
}

async function fetchSvgFromUsehref(href, fetchHref) {
    // Fetch image based on use element href URL
    const baseUrl = window.location.origin;

    try {
        const newUrl = new URL(href, baseUrl);

        if(fetchHref) {
            const fetchedImage = await fetchCorsImage(newUrl.href);

            if(fetchedImage) {
                const svgElement = extractSvgFromDataUrl(fetchedImage.src, fetchedImage);

                if(svgElement) {
                    const anchorId = newUrl.hash ? newUrl.hash : null;

                    if(anchorId) {
                        return {
                            url: newUrl.href,
                            svgElement: await extractSvgUseHref(svgElement.querySelector(anchorId), false)
                        };
                    }

                    return {
                        url: newUrl.href,
                        svgElement: await extractSvgUseHref(svgElement, false)
                    };
                }
            }
        }

        return {
            url: newUrl.href,
            svgElement: null
        };
    } catch (e) {
        debugLogger.log(`extractSvgUseHref - Error when parsing or fetching URL ${href} from use element`, "error", e);
    }

    return {
        url: null,
        svgElement: null
    };
}

async function getImageFromElement(image, imageUrl, hasBackgroundImg) {
    let isCrossOriginUrl = isCrossOrigin(imageUrl);

    if(!isCrossOriginUrl) {
        const isRedirectedImageResponse = await sendMessageWithPromise({ type: "checkImageRedirection", imageUrl }, "checkImageRedirectionResponse");

        if(isRedirectedImageResponse && isRedirectedImageResponse.redirected && isCrossOrigin(isRedirectedImageResponse.redirectedUrl)) {
            isCrossOriginUrl = true;
        }
    }

    if(image instanceof HTMLImageElement && isCrossOriginUrl) {
        const newImage = await fetchCorsImage(imageUrl);

        if(newImage) {
            image = newImage;
        }
    }

    // SVG element
    if((image instanceof SVGGraphicsElement) && image.nodeName.toLowerCase() === "svg") {
        try {
            image = await svgElementToImage(imageUrl);
        } catch(e) {
            debugLogger?.log(`ImageProcessor detectDarkImage - Error converting SVG element to image - Image URL: ${imageUrl}`, "error", e);
            return null;
        }
    }

    // Background image element
    if(!(image instanceof HTMLImageElement) && !(image instanceof SVGImageElement)) {
        if(hasBackgroundImg) {
            try {
                image = await backgroundImageToImage(imageUrl);
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

export { svgElementToImage, backgroundImageToImage, getImageUrlFromElement, getImageUrlFromSvgElement, fetchCorsImage, getImageFromElement, awaitImageLoading, elementIsImage, extractSvgUseHref, getImageUrlFromBackground, extractSvgFromDataUrl };