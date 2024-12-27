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
import { isCrossOrigin, safeDecodeURIComponent } from "./urlUtils.js";
import { addClass, removeClass } from "./cssClassUtils.js";
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used by the image processor (dark image detection) */

const debugLogger = new DebugLogger();

function svgElementToImage(url) {
    const image = new Image();
    image.src = url;

    return image;
}

async function backgroundImageToImage(url) {
    const image = new Image();

    const imageLoadPromise = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    image.src = url;

    if (isCrossOrigin(url)) {
        image.crossOrigin = "anonymous";
    }

    await imageLoadPromise;
    await image.decode();

    return image;
}

function getImageUrlFromElement(element, hasBackgroundImg, computedStyles, pseudoElt) {
    if(element instanceof HTMLImageElement) {
        return element.src;
    }

    if((element instanceof SVGGraphicsElement) && element.nodeName.toLowerCase() === "svg") {
        addClass(element, "pageShadowForceBlackColor");

        const svgUrl = getImageUrlFromSvgElement(element, window.getComputedStyle(element));

        removeClass(element, "pageShadowForceBlackColor");

        return svgUrl;
    }

    if(!(element instanceof HTMLImageElement) && !(element instanceof SVGImageElement) && hasBackgroundImg) {
        const style = element.currentStyle || computedStyles;

        const styleContent = pseudoElt && computedStyles.content && computedStyles.content.match(regexpMatchURL);
        const styleBackground = style.background && style.background.match(regexpMatchURL);
        const styleBackgroundImage = style.backgroundImage && style.backgroundImage.match(regexpMatchURL);
        const maskImage = style.maskImage && style.maskImage.match(regexpMatchURL);
        const objectData = element instanceof HTMLObjectElement && element.data;

        const urlMatch = styleContent || styleBackground || styleBackgroundImage || maskImage;
        const url = objectData || (urlMatch ? urlMatch[2] : null);

        if(url && url.trim().toLowerCase().startsWith("data:image/svg+xml")) {
            const regexMatchSVGData = /^data:image\/svg\+xml(;(charset=)?([a-zA-Z0-9-]+))?(;base64)?,/;
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
            const svgDoc = new DOMParser().parseFromString(svgData, "image/svg+xml");
            const svgElement = svgDoc.documentElement;

            const errorNode = svgDoc.querySelector("parsererror");

            if(errorNode) {
                debugLogger.log(`Error parsing SVG from URL: ${url}`, "error", element);
                return null;
            }

            return getImageUrlFromSvgElement(svgElement, computedStyles);
        }

        return url;
    }

    return null;
}

function getImageUrlFromSvgElement(element, computedStyles) {
    const box = element && element.getBBox && element.getBBox();
    const width = box && box.width > 0 ? box.width : 100;
    const height = box && box.height > 0 ? box.height : 100;
    const stroke = computedStyles.stroke;
    const color = computedStyles.color;

    let fill = computedStyles.fill;

    if (fill === "rgb(0, 0, 0)" && !element.hasAttribute("fill")) {
        const childElements = element.children;

        fill = "none";

        for(const childrenElement of childElements) {
            if (childrenElement.tagName.toLowerCase() !== "title") {
                const computedStyles = window.getComputedStyle(childrenElement);
                const subFill = computedStyles.fill;

                if (subFill !== "none") {
                    fill = subFill;
                    break;
                }
            }
        }
    }

    const innerHTML = element.innerHTML;
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

    const matchURLFill = fill && fill.match(regexpMatchURL);
    const matchURLStroke = stroke && stroke.match(regexpMatchURL);

    const escapedFill = matchURLFill && matchURLFill[2] ? `url(${matchURLFill[2]})` : fill;
    const escapedStroke = matchURLStroke && matchURLStroke[2] ? `url(${matchURLStroke[2]})` : stroke;

    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg"${namespaceString} width="${width}" height="${height}" fill="${escapedFill}" color="${color}" stroke="${escapedStroke}">${innerHTML}</svg>`)}`;
}

export { svgElementToImage, backgroundImageToImage, getImageUrlFromElement, getImageUrlFromSvgElement };