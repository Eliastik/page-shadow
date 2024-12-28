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
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used by the image processor (dark image detection) */

const debugLogger = new DebugLogger();

function normalizeURL(url) {
    if(url) {
        const urlNormalized = url.split("#:~:text=");

        if(urlNormalized.length > 0) {
            return urlNormalized[0];
        }
    }

    return url;
}

function getCurrentURL() {
    let url = "";

    try {
        url = window.opener ? window.opener.location.href : window.location.href;
    } catch(e) {
        debugLogger.log(e, "error");
        url = window.location.href;
    }

    return normalizeURL(url);
}

function isCrossOrigin(imageSrc) {
    try {
        if(!imageSrc) return false;

        if(imageSrc.trim().toLowerCase().startsWith("data:")) {
            return false;
        }

        const url = new URL(imageSrc);
        return window.location.origin !== url.origin;
    } catch(e) {
        debugLogger.log(e + " - URL: " + imageSrc, "error");
        return false;
    }
}

function isValidURL(url) {
    try {
        new URL(url);
    // eslint-disable-next-line no-unused-vars
    } catch(e) {
        return false;
    }

    return true;
}

function safeDecodeURIComponent(str) {
    try {
        if(/%[0-9A-Fa-f]{2}/.test(str)) {
            return decodeURIComponent(str);
        }
    } catch(e) {
        debugLogger.log(`Error decoding URI component: ${str}`, "error", e);
    }

    return str;
}

export { normalizeURL, getCurrentURL, isCrossOrigin, isValidURL, safeDecodeURIComponent };