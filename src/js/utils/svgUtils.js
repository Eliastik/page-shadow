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
import { base64EncodeUnicode, htmlDecode } from "./commonUtils.js";
import { safeDecodeURIComponent } from "./urlUtils.js";
import { addClass, removeClass, getPageAnalyzerCSSClass } from "./cssClassUtils.js";
import { fetchCorsImage } from "./imageUtils.js";
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used by the image processor (dark image detection) for SVG images */

const debugLogger = new DebugLogger();

function extractSvgFromDataUrl(url, element, fetchUseHref) {
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

    return decodeSvgString(svgData, fetchUseHref);
}

async function decodeSvgString(svgString, fetchUseHref) {
    const { outerHTML } = await extractSvgUseHref(applyNamespaces(svgString.trim()), fetchUseHref);

    const svgDoc = new DOMParser().parseFromString(outerHTML, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    const errorNode = svgDoc.querySelector("parsererror");

    if(errorNode) {
        debugLogger.log(`decodeSvgString - Error parsing SVG from string: ${outerHTML}`, "error", errorNode);
        return null;
    }

    return svgElement;
}

function cloneSvgNode(svgNode, fetchUseHref) {
    return decodeSvgString(svgNode.outerHTML, fetchUseHref);
}

function processSvgAttribute(attribute) {
    const matchURLAttribute = attribute && attribute.match(regexpMatchURL);
    return matchURLAttribute && matchURLAttribute[2] ? `url(${matchURLAttribute[2]})` : attribute;
}

function applyStylesToClonedSvg(element, clonedSvg) {
    const originalElements = element.getElementsByTagName("*");
    const clonedElements = clonedSvg.getElementsByTagName("*");

    for(let i = 0; i < clonedElements.length; i++) {
        const originalElement = originalElements[i];
        const clonedElement = clonedElements[i];

        if(originalElement && clonedElement) {
            const originalElementStyles = window.getComputedStyle(originalElement);
            const { stroke, color, fill } = originalElementStyles;

            clonedElement.setAttribute("fill", processSvgAttribute(fill));
            clonedElement.setAttribute("stroke", processSvgAttribute(stroke));
            clonedElement.setAttribute("color", color);
        }
    }
}

function extractSvgNamespaces(innerHTML) {
    const namespaces = [];

    const namespaceTypes = {
        "xlink:": "xmlns:xlink=\"http://www.w3.org/1999/xlink\"",
        "xml:": "xmlns:xml=\"http://www.w3.org/XML/1998/namespace\"",
        "rdf:": "xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\"",
        "cc:": "xmlns:cc=\"http://creativecommons.org/ns#\"",
        "dc:": "xmlns:dc=\"http://purl.org/dc/elements/1.1/\"",
    };

    for(const [key, namespace] of Object.entries(namespaceTypes)) {
        if(innerHTML.includes(key) && !innerHTML.includes(namespace)) {
            namespaces.push(namespace);
        }
    }

    const namespaceString = namespaces.length > 0 ? ` ${namespaces.join(" ")}` : "";

    return namespaceString;
}

function applyNamespaces(outerHTML) {
    const namespaceString = extractSvgNamespaces(outerHTML);
    return outerHTML.replace(/^<svg/g, `<svg${namespaceString}`);
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

    const clonedSvg = await cloneSvgNode(element, fetchUseHref);

    if(!clonedSvg) {
        debugLogger.log("getImageUrlFromSvgElement - Error parsing SVG from element", "error", element);
        return null;
    }

    addClass(element, getPageAnalyzerCSSClass("pageShadowForceBlackColor", pseudoElt));

    computedStyles = computedStyles || window.getComputedStyle(element);

    const box = element && element.getBoundingClientRect && element.getBoundingClientRect();
    const width = box && box.width > 0 ? box.width : 100;
    const height = box && box.height > 0 ? box.height : 100;

    const { stroke, color, fill } = computedStyles;

    applyStylesToClonedSvg(element, clonedSvg);

    removeClass(element, getPageAnalyzerCSSClass("pageShadowForceBlackColor", pseudoElt));

    return createSvgDataUrl(clonedSvg.innerHTML, width, height, fill, color, stroke);
}

async function extractSvgUseHref(outerHTML, fetchHref) {
    const useHrefs = [];

    const matches = [...outerHTML.matchAll(/<(use|image)[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/(use|image)>/g)];

    for(const match of matches) {
        const value = match[0];
        const nodeName = match[1];
        const href = match[2];

        try {
            // Fetch symbol based on CSS selector from href attribute
            const symbol = document.querySelector(href);

            if(symbol) {
                useHrefs.push(href);

                const result = await extractSvgUseHref(symbol.innerHTML, false);

                useHrefs.push(...result.useHrefs);
                outerHTML = outerHTML.replace(value, result.outerHTML);
            }
        // eslint-disable-next-line no-unused-vars
        } catch(e) {
            const { url, svgElement } = await fetchSvgFromUsehref(href, fetchHref, nodeName);

            if(svgElement) {
                outerHTML = outerHTML.replace(value, svgElement.outerHTML);
            } else if(url) {
                outerHTML = outerHTML.replace(value, value.replace(href, url));
            }
        }
    }

    return { outerHTML, useHrefs };
}

async function fetchSvgFromUsehref(href, fetchHref, nodeName) {
    // Fetch image based on use element href URL
    const baseUrl = window.location.origin;

    try {
        const newUrl = new URL(htmlDecode(href), baseUrl);

        if(fetchHref) {
            const fetchedImage = await fetchCorsImage(newUrl.href);

            if(fetchedImage) {
                if(nodeName === "use") {
                    const extractedSvg = await extractSvgFromDataUrl(fetchedImage.src, fetchedImage, false);

                    if(extractedSvg) {
                        const anchorId = newUrl.hash ? newUrl.hash : null;
                        const url = newUrl.href;

                        let svgString = null;

                        if(anchorId) {
                            svgString = extractedSvg.querySelector(anchorId).innerHTML;
                        } else {
                            svgString = extractedSvg.innerHTML;
                        }

                        const svgElement = await extractSvgUseHref(svgString, false);

                        return { url, svgElement };
                    }
                } else if(nodeName === "image") {
                    return { url: fetchedImage.src, svgElement: null };
                }
            }
        }

        return { url: newUrl.href, svgElement: null };
    } catch (e) {
        debugLogger.log(`extractSvgUseHref - Error when parsing or fetching URL ${href} from use element`, "error", e);
    }

    return { url: null, svgElement: null };
}

export { getImageUrlFromSvgElement, extractSvgUseHref, extractSvgFromDataUrl };