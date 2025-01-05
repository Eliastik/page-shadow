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
import { permissionOrigin } from "../constants.js";
import DebugLogger from "./../classes/debugLogger.js";
import browser from "webextension-polyfill";
import { v4 as uuidv4 } from "uuid";

const debugLogger = new DebugLogger();

function getBrowser() {
    const isFirefox = navigator.userAgent.split(" ").find(element => element.toLowerCase().startsWith("firefox")) != null;
    const isEdge = navigator.userAgent.split(" ").find(element => element.toLowerCase().startsWith("edg/")) != null;
    const isOpera = navigator.userAgent.split(" ").find(element => element.toLowerCase().startsWith("opera")) != null;

    if(isFirefox) {
        return "Firefox";
    } else if(isEdge) {
        return "Edge";
    } else if(isOpera) {
        return "Opera";
    } else {
        return "Chrome";
    }
}

function isRunningInPopup() {
    try {
        return window.opener && window.opener !== window;
    } catch(e) {
        debugLogger.log(e, "error");
        return false;
    }
}

function isRunningInIframe() {
    try {
        return window !== window.top;
    } catch(e) {
        debugLogger.log(e, "error");
        return false;
    }
}

function sendMessageWithPromise(data, ...expectedMessageType) {
    // Random UUID to filter correct responses
    const uuid = uuidv4();
    data.uuid = uuid;

    debugLogger.log(`Sending message to background process with type: ${data.type} - expected response type: ${expectedMessageType}`, "debug", data);

    return new Promise((resolve, reject) => {
        // Timeout if no response received after 60 seconds
        const timeout = setTimeout(() => {
            browser.runtime.onMessage.removeListener(listener);
            debugLogger.log(`Timeout exceeded waiting for response from background process. Type: ${data.type} / Expected message type = ${expectedMessageType}`, "error", data);
            reject(new Error("Timeout: No response received"));
        }, 60000);

        const listener = message => {
            if(message && message.uuid === uuid && expectedMessageType.includes(message.type)) {
                clearTimeout(timeout);
                resolve(message);
                browser.runtime.onMessage.removeListener(listener);
                debugLogger.log(`Received response ${expectedMessageType} from background process for message with data with type: ${data.type}`, "debug", message);
            }
        };

        if(expectedMessageType && expectedMessageType.length > 0) {
            browser.runtime.onMessage.addListener(listener);
        }

        browser.runtime.sendMessage(data).catch(err => {
            browser.runtime.onMessage.removeListener(listener);

            if(browser.runtime.lastError) {
                debugLogger.log(`Error sending message to background process. Type: ${data.type} / Expected message type = ${expectedMessageType}`, "error", err);
                clearTimeout(timeout);
                reject(browser.runtime.lastError);
            }
        });

        if(!expectedMessageType || expectedMessageType.length === 0) {
            browser.runtime.onMessage.removeListener(listener);
            clearTimeout(timeout);
            resolve();
        }
    });
}

function checkPermissions() {
    return browser.permissions.contains({
        origins: permissionOrigin
    });
}

function isElementNotVisible(element, computedStyles) {
    if(element === document.body) {
        return false;
    }

    if(element.checkVisibility && !element.checkVisibility()) {
        return true;
    }

    if(computedStyles && (computedStyles.display === "none" || computedStyles.visibility === "hidden"
        || computedStyles.opacity === "0")) {
        return true;
    }

    const rect = element.getBoundingClientRect();

    if(rect.top < 0 || rect.left < 0 || rect.right < 0 || rect.bottom < 0) {
        return true;
    }

    return false;
}

export { getBrowser, isRunningInPopup, isRunningInIframe, sendMessageWithPromise, checkPermissions, isElementNotVisible };