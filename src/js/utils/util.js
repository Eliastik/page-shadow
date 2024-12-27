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
import { getPriorityPresetEnabledForWebsite, presetsEnabledForWebsite, presetsEnabledForWebsiteWithData } from "./presetUtils.js";
import browser from "webextension-polyfill";
import { defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomThemes, defaultWebsiteSpecialFiltersConfig, defaultSettings, settingsToLoad, defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack, permissionOrigin, pageAnalyzerCSSClasses, colorTemperaturesAvailable, regexpMatchURL } from "../constants.js";
import { Sha256 } from "@aws-crypto/sha256-browser";
import DebugLogger from "./../classes/debugLogger.js";

const debugLogger = new DebugLogger();

function inArray(needle, haystack) {
    for(const key in haystack) {
        if(needle.indexOf(haystack[key]) != -1) {
            return true;
        }
    }

    return false;
}

function strictInArray(needle, haystack) {
    for(const key in haystack) {
        if(needle == haystack[key]) {
            return true;
        }
    }

    return false;
}

function commentAllLines(string) {
    const arr = string.split("\n");
    const res = [];

    for(const key in arr) {
        if(arr[key].trim() != "" && !arr[key].trim().startsWith("#")) {
            res.push("#" + arr[key]);
        } else {
            res.push(arr[key]);
        }
    }

    return res.join("\n");
}

function removeA(arr) {
    let what;
    const a = arguments;
    let L = a.length;
    let ax;

    while(L > 1 && arr.length) {
        what = a[--L];
        while((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }

    return arr;
}

function getUImessage(id) {
    return browser.i18n.getMessage(id);
}

async function getCustomThemeConfig(nb, customThemesSettings) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    let customThemes, backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme, fontTheme, customCSSCode;

    const result = customThemesSettings ? customThemesSettings : await browser.storage.local.get("customThemes");

    if(result.customThemes != undefined && result.customThemes[nb] != undefined) {
        customThemes = result.customThemes[nb];
    } else {
        customThemes = defaultCustomThemes[nb];
    }

    if(customThemes["customThemeBg"] != undefined) {
        backgroundTheme = customThemes["customThemeBg"];
    } else {
        backgroundTheme = defaultBGColorCustomTheme;
    }

    if(customThemes["customThemeTexts"] != undefined) {
        textsColorTheme = customThemes["customThemeTexts"];
    } else {
        textsColorTheme = defaultTextsColorCustomTheme;
    }

    if(customThemes["customThemeLinks"] != undefined) {
        linksColorTheme = customThemes["customThemeLinks"];
    } else {
        linksColorTheme = defaultLinksColorCustomTheme;
    }

    if(customThemes["customThemeLinksVisited"] != undefined) {
        linksVisitedColorTheme = customThemes["customThemeLinksVisited"];
    } else {
        linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
    }

    if(customThemes["customThemeFont"] != undefined && customThemes["customThemeFont"].trim() != "") {
        fontTheme = "\"" + customThemes["customThemeFont"] + "\"";
    } else {
        fontTheme = defaultFontCustomTheme;
    }

    if(customThemes["customCSSCode"] != undefined && typeof(customThemes["customCSSCode"]) == "string" && customThemes["customCSSCode"].trim() != "") {
        customCSSCode = customThemes["customCSSCode"];
    } else {
        customCSSCode = "";
    }

    return {
        backgroundColor: "#" + backgroundTheme,
        textColor: "#" + textsColorTheme,
        linkColor: "#" + linksColorTheme,
        visitedLinkColor: "#" + linksVisitedColorTheme,
        selectBackgroundColor: defaultThemesSelectBgColors[0],
        selectTextColor: defaultThemesSelectTextColors[0],
        insBackgroundColor: defaultThemesInsBgColors[0],
        insTextColor: defaultThemesInsTextColors[0],
        delBackgroundColor: defaultThemesDelBgColors[0],
        delTextColor: defaultThemesDelTextColors[0],
        markBackgroundColor: defaultThemesMarkBgColors[0],
        markTxtColor: defaultThemesMarkTextColors[0],
        imageBackgroundColor: defaultThemesImgBgColors[0],
        brightColorTextWhite: defaultThemesBrightColorTextWhite[0],
        brightColorTextBlack: defaultThemesBrightColorTextBlack[0],
        fontFamily: fontTheme,
        customCSSCode
    };
}

/**
 *
 * @param {*} nb theme number
 * @param {*} disableCustomCSS disable applying custom CSS code
 * @param {*} lnkCssElement link element for applying custom CSS code
 * @returns true if applying custom font family, false otherwise
 */
async function customTheme(nb, disableCustomCSS, lnkCssElement, customThemesSettings) {
    const config = await getCustomThemeConfig(nb, customThemesSettings);
    disableCustomCSS = disableCustomCSS == undefined ? false : disableCustomCSS;

    applyContrastPageVariables(config, customThemesSettings);

    // Apply custom CSS
    if(!disableCustomCSS && config.customCSSCode != "") {
        lnkCssElement.setAttribute("rel", "stylesheet");
        lnkCssElement.setAttribute("type", "text/css");
        lnkCssElement.setAttribute("id", "pageShadowCustomCSS");
        lnkCssElement.setAttribute("name", "pageShadowCustomCSS");
        lnkCssElement.setAttribute("href", "data:text/css;charset=UTF-8," + encodeURIComponent(config.customCSSCode));
        document.getElementsByTagName("head")[0].appendChild(lnkCssElement);
    }

    if(config.fontFamily && config.fontFamily.trim() != "") {
        return true;
    }

    return false;
}

function checkChangedStorageData(key, object) {
    if(typeof(key) === "string") {
        return Object.prototype.hasOwnProperty.call(object, key);
    } else if(Array.isArray(key)) {
        for(let i = 0; i < key.length; i++) {
            if(Object.prototype.hasOwnProperty.call(object, key[i])) {
                return true;
            }
        }
    }

    return false;
}

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

function downloadData(data, name) {
    const url = "data:text/plain;charset=utf-8," + encodeURIComponent(data);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", name || "");
    a.setAttribute("type", "text/plain");
    a.dispatchEvent(new MouseEvent("click"));
}

function getDefaultSettingsToLoad() {
    const settings = {};

    for(const setting of settingsToLoad) {
        if(Object.prototype.hasOwnProperty.call(defaultSettings, setting)) {
            settings[setting] = defaultSettings[setting];
        }
    }

    return settings;
}

function fillSettings(defaultSettings, newSettings) {
    for(const key of Object.keys(defaultSettings)) {
        defaultSettings[key] = newSettings[key];
    }
}

async function getSettings(url, disableCache, settingsData, allPresetData) {
    const settings = getDefaultSettingsToLoad();
    let loadGlobalSettings = true;

    // Automatically enable preset ?
    let presetsEnabled;

    if(allPresetData) {
        presetsEnabled = await presetsEnabledForWebsiteWithData(url, allPresetData);
    } else {
        presetsEnabled = await presetsEnabledForWebsite(url, disableCache);
    }

    if(presetsEnabled && presetsEnabled.length > 0) {
        const presetEnabled = getPriorityPresetEnabledForWebsite(presetsEnabled);

        if(presetEnabled && presetEnabled.presetNb > 0) {
            const presetData = presetEnabled.presetData;
            fillSettings(settings, presetData);
            loadGlobalSettings = false;
        }
    }

    // Else, load the global settings
    if(loadGlobalSettings) {
        let newSettings = {};

        if(settingsData) {
            newSettings = settingsData;
        } else if(!disableCache) {
            const settingsResponse = await sendMessageWithPromise({ "type": "getSettings" }, "getSettingsResponse");
            newSettings = settingsResponse.data;
        } else {
            newSettings = await browser.storage.local.get(settingsToLoad);
        }

        fillSettings(settings, newSettings);
    }

    // Migrate deprecated/old settings
    if(settings.colorInvert == "true") {
        settings.colorInvert = "true";
        settings.invertImageColors = "true";
    } else if(settings.invertPageColors == "true") {
        settings.colorInvert = "true";
    } else {
        settings.colorInvert = "false";
    }

    if(settings.attenuateImageColor == "true") {
        settings.attenuateColors = "true";
        settings.attenuateImgColors = "true";
        settings.attenuateBgColors = "true";
    }

    if(settings.nightModeEnabled == "true" && settings.pageLumEnabled == "true") {
        settings.blueLightReductionEnabled = "true";
        settings.percentageBlueLightReduction = settings.pourcentageLum;
        settings.nightModeEnabled = "false";
    }

    return settings;
}

function hasSettingsChanged(currentSettings, newSettings, customThemeChanged) {
    if(currentSettings == null) return true;

    for(const settingKey of Object.keys(currentSettings)) {
        if(currentSettings[settingKey] !== newSettings[settingKey]) return true;
    }

    if(currentSettings.theme && newSettings.theme
        && currentSettings.theme.startsWith("custom") && newSettings.theme.startsWith("custom") && customThemeChanged) {
        return true;
    }

    return false;
}

function convertBytes(size) {
    const result = {
        size: 0,
        unit: "byte"
    };

    if(size >= 1000000000) {
        result.size = (size / 1000000000).toFixed(2).replace(".", ",");
        result.unit = "gigabyte";
    } else if(size >= 1000000) {
        result.size = (size / 1000000).toFixed(2).replace(".", ",");
        result.unit = "megabyte";
    } else if(size >= 1000) {
        result.size = (size / 1000).toFixed(2).replace(".", ",");
        result.unit = "kilobyte";
    } else {
        result.size = size;
        result.unit = "byte";
    }

    return result;
}

function getSizeObject(object) {
    if(!object) return 0;

    return new TextEncoder().encode(
        Object.entries(object)
            .map(([key, value]) => key + JSON.stringify(value))
            .join("")
    ).length;
}

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

function removeClass(element, ...classes) {
    if(!element) return;

    classes.forEach(c => {
        if(c && element.classList.contains(c)) {
            element.classList.remove(c);
        }
    });
}

function addClass(element, ...classes) {
    if(!element) return;
    const classToAdd = [];

    classes.forEach(c => {
        if(c && !element.classList.contains(c)) {
            classToAdd.push(c);
        }
    });

    element.classList.add(...classToAdd);
}

function addNewStyleAttribute(element, styleToAdd) {
    const oldStyleAttribute = element.getAttribute("style") || "";

    const styleToAddParts = styleToAdd.split(";").map(part => part.trim()).filter(Boolean);
    const oldStyleParts = oldStyleAttribute.split(";").map(part => part.trim()).filter(Boolean);

    const stylesToActuallyAdd = styleToAddParts.filter(newStyle => {
        return !oldStyleParts.some(oldStyle => oldStyle === newStyle);
    });

    if(stylesToActuallyAdd.length > 0) {
        let newStyleAttribute = oldStyleAttribute.trim();

        if(newStyleAttribute && !newStyleAttribute.endsWith(";")) {
            newStyleAttribute += "; ";
        }

        newStyleAttribute += stylesToActuallyAdd.join("; ");
        element.setAttribute("style", newStyleAttribute);
    }
}

function removeStyleAttribute(element, styleToRemove) {
    const oldStyleAttribute = element.getAttribute("style");
    if (!oldStyleAttribute) return;
    const stylesArray = oldStyleAttribute.split(";").map(s => s.trim()).filter(s => s.length > 0);
    const newStylesArray = stylesArray.filter(style => !style.startsWith(styleToRemove.split(":")[0].trim()));
    const newStyleAttribute = newStylesArray.join("; ");

    if (newStyleAttribute.trim() === "") {
        element.removeAttribute("style");
    } else {
        element.setAttribute("style", newStyleAttribute);
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

async function isInterfaceDarkTheme() {
    const setting = await browser.storage.local.get(["interfaceDarkTheme"]);

    if(setting.interfaceDarkTheme === "enabled") {
        return true;
    }

    if (!setting.interfaceDarkTheme || setting.interfaceDarkTheme === "auto") {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return true;
        }
    }

    return false;
}

function loadStyles(id, styles) {
    return new Promise(resolve => {
        const oldStylesObjects = [];
        const stylesObjects = [];
        let loadedStyles = 0;
        let hasError = false;

        for(let i = 0; i < id.length; i++) {
            const currentOldStylesObjects = [...document.querySelectorAll("#" + id[i])];
            oldStylesObjects.push(...currentOldStylesObjects);

            if (styles[i] != null) {
                const styleObject = document.createElement("link");
                styleObject.setAttribute("id", id[i]);
                styleObject.setAttribute("rel", "stylesheet");
                styleObject.setAttribute("type", "text/css");
                styleObject.setAttribute("href", styles[i]);
                styleObject.addEventListener("load", onload);
                styleObject.addEventListener("error", onerror);

                stylesObjects.push(styleObject);
            } else {
                for(let i = 0; i < currentOldStylesObjects.length; i++) {
                    if (currentOldStylesObjects[i] && document.head.contains(currentOldStylesObjects[i])) {
                        document.head.removeChild(currentOldStylesObjects[i]);
                    }
                }
            }
        }

        function onload() {
            if(!hasError) {
                loadedStyles++;

                if(loadedStyles >= id.length) {
                    for(let i = 0; i < oldStylesObjects.length; i++) {
                        if (oldStylesObjects[i] && document.head.contains(oldStylesObjects[i])) {
                            document.head.removeChild(oldStylesObjects[i]);
                        }
                    }

                    resolve(true);
                }
            }
        }

        function onerror() {
            hasError = true;

            for(let i = 0; i < stylesObjects.length; i++) {
                document.head.removeChild(stylesObjects[i]);
            }

            resolve(false);
        }

        for(let i = 0; i < stylesObjects.length; i++) {
            document.head.appendChild(stylesObjects[i]);
        }
    });
}

async function toggleTheme() {
    const isDarkTheme = await isInterfaceDarkTheme();

    if (isDarkTheme) {
        await loadStyles(["darkThemeStyle"], ["css/dark-theme.css"]);
    } else {
        await loadStyles(["darkThemeStyle"], [null]);
    }
}

async function loadWebsiteSpecialFiltersConfig() {
    const settings = await browser.storage.local.get("advancedOptionsFiltersSettings");
    const websiteSpecialFiltersConfig = JSON.parse(JSON.stringify(defaultWebsiteSpecialFiltersConfig));

    if (settings && settings.advancedOptionsFiltersSettings) {
        Object.keys(settings.advancedOptionsFiltersSettings).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(websiteSpecialFiltersConfig, key)) {
                websiteSpecialFiltersConfig[key] = settings.advancedOptionsFiltersSettings[key];
            }

            const config = websiteSpecialFiltersConfig[key];

            if(typeof config === "string") {
                websiteSpecialFiltersConfig[key] = parseFloat(config);
            } else {
                websiteSpecialFiltersConfig[key] = config;
            }
        });
    }

    return websiteSpecialFiltersConfig;
}

async function isAutoEnable() {
    if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.local) !== "undefined") {
        const result = await browser.storage.local.get("autoEnable");

        if(result.autoEnable == "true") {
            return true;
        }
    }

    return false;
}

function sendMessageWithPromise(data, ...expectedMessageType) {
    debugLogger.log(`Sending message to background process with type: ${data.type} - expected response type: ${expectedMessageType}`, "debug", data);

    return new Promise(resolve => {
        const listener = message => {
            if (message && expectedMessageType.includes(message.type)) {
                resolve(message);
                browser.runtime.onMessage.removeListener(listener);
                debugLogger.log(`Received response ${expectedMessageType} from background process for message with data with type: ${data.type}`, "debug", message);
            }
        };

        if(expectedMessageType) {
            browser.runtime.onMessage.addListener(listener);
        }

        browser.runtime.sendMessage(data).catch(() => {
            browser.runtime.onMessage.removeListener(listener);
            if(browser.runtime.lastError) {
                debugLogger.log(`Error sending message to background process. Type: ${data.type} / Expected message type = ${expectedMessageType}`, "error", data);
                return;
            }
        });

        if(!expectedMessageType) {
            browser.runtime.onMessage.removeListener(listener);
            resolve();
        }
    });
}

function applyContrastPageVariablesWithTheme(theme) {
    const themeNumber = parseInt(theme) - 1;

    applyContrastPageVariables({
        backgroundColor: defaultThemesBackgrounds[themeNumber],
        textColor: defaultThemesTextColors[themeNumber],
        linkColor: defaultThemesLinkColors[themeNumber],
        visitedLinkColor: defaultThemesVisitedLinkColors[themeNumber],
        selectBackgroundColor: defaultThemesSelectBgColors[themeNumber],
        selectTextColor: defaultThemesSelectTextColors[themeNumber],
        insBackgroundColor: defaultThemesInsBgColors[themeNumber],
        insTextColor: defaultThemesInsTextColors[themeNumber],
        delBackgroundColor: defaultThemesDelBgColors[themeNumber],
        delTextColor: defaultThemesDelTextColors[themeNumber],
        markBackgroundColor: defaultThemesMarkBgColors[themeNumber],
        markTxtColor: defaultThemesMarkTextColors[themeNumber],
        imageBackgroundColor: defaultThemesImgBgColors[themeNumber],
        brightColorTextWhite: defaultThemesBrightColorTextWhite[themeNumber],
        brightColorTextBlack: defaultThemesBrightColorTextBlack[themeNumber]
    });
}

function applyContrastPageVariables(config) {
    document.documentElement.style.setProperty("--page-shadow-bgcolor", config.backgroundColor);
    document.documentElement.style.setProperty("--page-shadow-txtcolor", config.textColor);
    document.documentElement.style.setProperty("--page-shadow-lnkcolor", config.linkColor);
    document.documentElement.style.setProperty("--page-shadow-visitedlnkcolor", config.visitedLinkColor);
    document.documentElement.style.setProperty("--page-shadow-selectbgcolor", config.selectBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-selectxtcolor", config.selectTextColor);
    document.documentElement.style.setProperty("--page-shadow-insbgcolor", config.insBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-instxtcolor", config.insTextColor);
    document.documentElement.style.setProperty("--page-shadow-delbgcolor", config.delBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-deltxtcolor", config.delTextColor);
    document.documentElement.style.setProperty("--page-shadow-markbgcolor", config.markBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-marktxtcolor", config.markTxtColor);
    document.documentElement.style.setProperty("--page-shadow-imgbgcolor", config.imageBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-brightcolortxtwhite", config.brightColorTextWhite);
    document.documentElement.style.setProperty("--page-shadow-brightcolortxtblack", config.brightColorTextBlack);

    if(config && config.fontFamily && config.fontFamily.trim() != "") {
        document.documentElement.style.setProperty("--page-shadow-customfontfamily", config.fontFamily);
    } else {
        document.documentElement.style.removeProperty("--page-shadow-customfontfamily");
    }
}

function getInvertPageVariablesKeyValues(invertEntirePage, selectiveInvert, enablePreserveColorsSelectiveInvert) {
    const invertPageVariables = new Map();

    invertPageVariables.set("--page-shadow-invert-filter", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-image-backgrounds", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-bg-backgrounds", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-video-backgrounds", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-bright-color-backgrounds", "invert(100%)");

    if(invertEntirePage === "true") {
        if(selectiveInvert === "true") {
            const filter = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
            invertPageVariables.set("--page-shadow-invert-filter-selective-image", filter);
            invertPageVariables.set("--page-shadow-invert-filter-selective-bg", filter);
            invertPageVariables.set("--page-shadow-invert-filter-selective-video", filter);
        } else {
            invertPageVariables.set("--page-shadow-invert-filter-selective-image", "invert(100%)");
            invertPageVariables.set("--page-shadow-invert-filter-selective-bg", "invert(100%)");
            invertPageVariables.set("--page-shadow-invert-filter-selective-video", "invert(100%)");
        }

        const filterParentBright = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
        invertPageVariables.set("--page-shadow-invert-filter-selective-image-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-bg-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-video-parent-bright", filterParentBright);
    } else {
        const filter = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
        invertPageVariables.set("--page-shadow-invert-filter-selective-image", filter);
        invertPageVariables.set("--page-shadow-invert-filter-selective-bg", filter);
        invertPageVariables.set("--page-shadow-invert-filter-selective-video", filter);

        const filterParentBright = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
        invertPageVariables.set("--page-shadow-invert-filter-selective-image-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-bg-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-video-parent-bright", filterParentBright);

    }

    return invertPageVariables;
}

function getPageVariablesToApply(contrastEnabled, invertEnabled, attenuateColors) {
    const pageVariablesToApply = [];

    if (contrastEnabled == "true") {
        pageVariablesToApply.push(
            "--page-shadow-bgcolor",
            "--page-shadow-txtcolor",
            "--page-shadow-lnkcolor",
            "--page-shadow-visitedlnkcolor",
            "--page-shadow-selectbgcolor",
            "--page-shadow-selectxtcolor",
            "--page-shadow-insbgcolor",
            "--page-shadow-instxtcolor",
            "--page-shadow-delbgcolor",
            "--page-shadow-deltxtcolor",
            "--page-shadow-markbgcolor",
            "--page-shadow-marktxtcolor",
            "--page-shadow-imgbgcolor",
            "--page-shadow-brightcolortxtwhite",
            "--page-shadow-brightcolortxtblack"
        );
    }

    if(invertEnabled == "true") {
        pageVariablesToApply.push(
            "--page-shadow-invert-filter",
            "--page-shadow-invert-filter-image-backgrounds",
            "--page-shadow-invert-filter-bg-backgrounds",
            "--page-shadow-invert-filter-video-backgrounds",
            "--page-shadow-invert-filter-bright-color-backgrounds",
            "--page-shadow-invert-filter-selective-image",
            "--page-shadow-invert-filter-selective-bg",
            "--page-shadow-invert-filter-selective-video",
            "--page-shadow-invert-filter-selective-image-parent-bright",
            "--page-shadow-invert-filter-selective-bg-parent-bright",
            "--page-shadow-invert-filter-selective-video-parent-bright"
        );
    }

    if(attenuateColors == "true") {
        pageVariablesToApply.push(
            "--page-shadow-attenuate-filter"
        );
    }

    return pageVariablesToApply;
}

function areAllCSSVariablesDefinedForHTMLElement(contrastEnabled, invertEnabled, attenuateColors) {
    const element = document.documentElement;

    if (element && element.style) {
        return getPageVariablesToApply(contrastEnabled, invertEnabled, attenuateColors).every(variable => element.style.getPropertyValue(variable) !== "");
    }
}

function areAllClassesDefinedForHTMLElement(contrastEnabled, invertEnabled, invertEntirePage, contrastTheme) {
    const element = document.documentElement;

    if (element) {
        const classAttribute = element.getAttribute("class") || "";

        if(invertEnabled == "true" && invertEntirePage == "true" &&
            (!classAttribute.includes("pageShadowInvertEntirePage") ||
            !classAttribute.includes("pageShadowBackground"))) {
            return false;
        }

        if(contrastEnabled == "true" && !classAttribute.includes("pageShadowBackgroundContrast")) {
            return false;
        }

        if(contrastEnabled == "true" && contrastTheme.startsWith("custom")
            && !classAttribute.includes("pageShadowBackgroundCustom")) {
            return false;
        }

        return true;
    }
}

async function sha256(url) {
    const hash = new Sha256();
    hash.update(url);
    const hashBuffer = await hash.digest();
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

function checkPermissions() {
    return browser.permissions.contains({
        origins: permissionOrigin
    });
}

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

function isCrossOrigin(imageSrc) {
    try {
        const url = new URL(imageSrc);
        return window.location.origin !== url.origin;
    } catch(e) {
        debugLogger.log(e + " - URL: " + imageSrc, "error");
        return false;
    }
}

function getPageAnalyzerCSSClass(cssClass, pseudoElt) {
    const type = pseudoElt ? "pseudoElt" : "normal";
    const cssClassData = pageAnalyzerCSSClasses[cssClass];

    if(!cssClassData) {
        debugLogger.log(`getPageAnalyzerCSSClass - Unknown class ${cssClass} - type: ${type}`, "warn");
        return cssClass;
    }

    let finalClass = cssClassData[type];

    if(pseudoElt) {
        finalClass += (pseudoElt === ":after" ? "After" : "Before");
    }

    if(!finalClass) {
        debugLogger.log(`getPageAnalyzerCSSClass - Unknown class ${cssClass} for type: ${type}`, "warn");
    }

    return finalClass;
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

function getBlueLightReductionFilterCSSClass(colorTemp) {
    const tempIndex = parseInt(colorTemp || "2000");
    return "k" + colorTemperaturesAvailable[tempIndex - 1];
}

export { inArray, strictInArray, removeA, commentAllLines, getUImessage, customTheme, checkChangedStorageData, getBrowser, downloadData, getSettings, getCurrentURL, convertBytes, getSizeObject, normalizeURL, hasSettingsChanged, removeClass, addClass, isRunningInPopup, isRunningInIframe, toggleTheme, isInterfaceDarkTheme, loadWebsiteSpecialFiltersConfig, sendMessageWithPromise, addNewStyleAttribute, applyContrastPageVariables, applyContrastPageVariablesWithTheme, getCustomThemeConfig, isAutoEnable, sha256, checkPermissions, getPageVariablesToApply, areAllCSSVariablesDefinedForHTMLElement, svgElementToImage, backgroundImageToImage, removeStyleAttribute, isCrossOrigin, areAllClassesDefinedForHTMLElement, getPageAnalyzerCSSClass, getImageUrlFromElement, getInvertPageVariablesKeyValues, isValidURL, getBlueLightReductionFilterCSSClass };