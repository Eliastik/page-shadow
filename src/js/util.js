/* Page Shadow
 *
 * Copyright (C) 2015-2021 Eliastik (eliastiksofts.com)
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
import { setSettingItem } from "./storage.js";
import $ from "jquery";
import i18next from "i18next";

// Global configuration of the extension
const extensionVersion = "2.7";
const nbThemes = 15; // nb of themes for the function Increase the contrast (used globally in the extension)
const colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"]; // color temperatures available for the function Night Mode (used globally in the extension)
const minBrightnessPercentage = 0; // the minimum percentage of brightness
const maxBrightnessPercentage = 0.9; // the maximum percentage of brightness
const brightnessDefaultValue = 0.15; // the default percentage value of brightness
const defaultBGColorCustomTheme = "000000";
const defaultTextsColorCustomTheme = "FFFFFF";
const defaultLinksColorCustomTheme = "1E90FF";
const defaultVisitedLinksColorCustomTheme = "FF00FF";
const defaultFontCustomTheme = "";
const defaultCustomCSSCode = "/* Example - Add a blue border around the page:\nbody {\n\tborder: 2px solid blue;\n} */";
const defaultAutoEnableHourFormat = "24";
const defaultHourEnable = "20";
const defaultMinuteEnable = "0";
const defaultHourEnableFormat = "PM";
const defaultHourDisable = "7";
const defaultMinuteDisable = "0";
const defaultHourDisableFormat = "AM";
const settingNames = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "sitesInterditPageShadow", "liveSettings", "whiteList", "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "globallyEnable", "customThemeInfoDisable", "autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat", "disableImgBgColor", "defaultLoad", "presets", "customThemes", "filtersSettings", "customFilter"];
const settingsToSavePresets = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "liveSettings", "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "autoEnable", "disableImgBgColor"];
const nbPresets = 5;
const defaultPresets = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
const nbCustomThemesSlots = 5;
const defaultCustomThemes = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
const defaultFilters = {
    "filters": [
        {
            "filterName": "Filtre intégré/Built-in filter",
            "sourceName": "Page Shadow",
            "sourceUrl": "/filters/standard.txt",
            "lastUpdated": 0,
            "enabled": true,
            "hasError": false,
            "local": true,
            "homepage": "",
            "builtIn": true,
            "content": null
        },
        {
            "filterName": "Filtre par défaut/Default filter",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/standard.txt",
            "lastUpdated": 0,
            "enabled": true,
            "hasError": false,
            "local": false,
            "homepage": "https://www.eliastiksofts.com/page-shadow/",
            "builtIn": true,
            "content": null
        },
        {
            "filterName": "Filtre pour la fonction Inverser les couleurs/Filter for the feature Invert colors",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/invert.txt",
            "lastUpdated": 0,
            "enabled": true,
            "hasError": false,
            "local": false,
            "homepage": "https://www.eliastiksofts.com/page-shadow/",
            "builtIn": true,
            "content": null
        },
        {
            "filterName": "Mon filtre/My filter",
            "sourceName": "Page Shadow",
            "sourceUrl": "",
            "lastUpdated": 0,
            "enabled": true,
            "hasError": false,
            "customFilter": true,
            "local": false,
            "homepage": "",
            "builtIn": true,
            "content": null
        }
    ],
    "lastUpdated": 0,
    "updateInterval": 24 * 60 * 60 * 1000
};
const defaultFiltersContent = {};
// End of the global configuration of the extension

function in_array(needle, haystack) {
    for(const key in haystack) {
        if(needle.indexOf(haystack[key]) != -1) {
            return true;
        }
    }

    return false;
}

function strict_in_array(needle, haystack) {
    for(const key in haystack) {
        if(needle == haystack[key]) {
            return true;
        }
    }

    return false;
}

function matchWebsite(needle, rule) {
    if(!rule.trim().startsWith("#")) {
        if(!rule.trim().startsWith("/") && !rule.trim().endsWith("/") && rule.indexOf("*") != -1) {
            rule = rule.replace("*", "(.*)");
            rule = "/" + rule + "/";
        }

        if(rule.trim().startsWith("/") && rule.trim().endsWith("/")) {
            try {
                const regex = new RegExp(rule.substring(1, rule.length - 1), "gi");

                if(regex.test(needle)) {
                    return true;
                }
            } catch(e) {
                return false;
            }
        } else {
            if(needle == rule) {
                return true;
            }
        }
    }

    return false;
}

function in_array_website(needle, haystack) {
    for(const key in haystack) {
        if(matchWebsite(needle, haystack[key])) {
            return true;
        }
    }

    return false;
}

function disableEnableToggle(type, checked, url, func) {
    chrome.storage.local.get(["sitesInterditPageShadow", "whiteList"], result => {
        let disabledWebsites = "";
        const domain = url.hostname;
        const href = url.href;
        let match = domain;
        let disabledWebsitesArray;

        if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
            disabledWebsitesArray = [];
        } else {
            disabledWebsites = result.sitesInterditPageShadow;
            disabledWebsitesArray = disabledWebsites.split("\n");
        }

        switch(type) {
        case "disable-website":
            match = domain;
            break;
        case "disable-webpage":
            match = href;
            break;
        case "disable-globally":
            if(checked) {
                setSettingItem("globallyEnable", "false");
            } else {
                setSettingItem("globallyEnable", "true");
            }
            break;
        }

        if(type == "disable-website" || type == "disable-webpage") {
            let disabledWebsitesNew;

            if((checked && result.whiteList == "true") || (!checked && result.whiteList != "true")) {
                disabledWebsitesNew = removeA(disabledWebsitesArray, match);
                disabledWebsitesNew = commentMatched(disabledWebsitesNew, match);
                disabledWebsitesNew = removeA(disabledWebsitesNew, "").join("\n");

                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
            } else if((!checked && result.whiteList == "true") || (checked && result.whiteList != "true")) {
                disabledWebsitesArray.push(match);
                disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");

                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
            }
        }

        if(func != undefined) {
            return func();
        }
    });
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

function commentMatched(arr, website) {
    const res = [];

    for(const key in arr) {
        if(matchWebsite(website, arr[key])) {
            res.push("#" + arr[key]);
        } else {
            res.push(arr[key]);
        }
    }

    return res;
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

// Callback function to know if the execution of Page Shadow is allowed for a page - return true if allowed, false if not
function pageShadowAllowed(url, func) {
    chrome.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"], result => {
        if(result.globallyEnable !== "false") {
            let forbiddenWebsites;

            if(result.sitesInterditPageShadow !== undefined && result.sitesInterditPageShadow !== "") {
                forbiddenWebsites = result.sitesInterditPageShadow.trim().split("\n");
            } else {
                forbiddenWebsites = "";
            }

            const websuteUrl_tmp = new URL(url);
            const domain = websuteUrl_tmp.hostname;

            if((result.whiteList == "true" && (in_array_website(domain, forbiddenWebsites) || in_array_website(url, forbiddenWebsites))) || (result.whiteList !== "true" && !in_array_website(domain, forbiddenWebsites) && !in_array_website(url, forbiddenWebsites))) {
                return func(true);
            } else {
                return func(false);
            }
        } else {
            return func(false);
        }
    });
}

function getUImessage(id) {
    return chrome.i18n.getMessage(id);
}

function customTheme(nb, style, disableCustomCSS, lnkCssElement) {
    disableCustomCSS = disableCustomCSS == undefined ? false : disableCustomCSS;
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    let customThemes, backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme, fontTheme;

    chrome.storage.local.get("customThemes", result => {
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

        if(document.getElementsByTagName("head")[0].contains(style)) { // remove style element
            document.getElementsByTagName("head")[0].removeChild(style);
        }

        // Append style element
        document.getElementsByTagName("head")[0].appendChild(style);

        if(style.cssRules) { // Remove all rules
            for(let i = 0; i < style.cssRules.length; i++) {
                style.sheet.deleteRule(i);
            }
        }

        // Create rules
        style.sheet.insertRule("html.pageShadowBackgroundCustom { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom { background: #"+ backgroundTheme +" !important; background-image: url(); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled) { background-color: #"+ backgroundTheme +" !important; color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom input:not(.pageShadowElementDisabled) { border: 1px solid #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom * {  font-family: " + fontTheme + " !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom :not(.pageShadowInvertImageColor) svg:not(.pageShadowElementDisabled) { color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:not(.pageShadowElementDisabled) { color: #"+ linksColorTheme +" !important; background-color: transparent !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom img, .pageShadowContrastBlackCustom video, .pageShadowContrastBlackCustom canvas { filter: invert(0%); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom.pageShadowBackgroundDetected * > *:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled) { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:visited:not(#pageShadowLinkNotVisited):not(.pageShadowElementDisabled), .pageShadowContrastBlackCustom #pageShadowLinkVisited:not(.pageShadowElementDisabled) { color: #"+ linksVisitedColorTheme +" !important; }", 0);

        // Custom CSS
        if(!disableCustomCSS && customThemes["customCSSCode"] != undefined && typeof(customThemes["customCSSCode"]) == "string" && customThemes["customCSSCode"].trim() != "") {
            lnkCssElement.setAttribute("rel", "stylesheet");
            lnkCssElement.setAttribute("type", "text/css");
            lnkCssElement.setAttribute("id", "pageShadowCustomCSS");
            lnkCssElement.setAttribute("name", "pageShadowCustomCSS");
            lnkCssElement.setAttribute("href", "data:text/css;charset=UTF-8," + encodeURIComponent(customThemes["customCSSCode"]));
            document.getElementsByTagName("head")[0].appendChild(lnkCssElement);
        }
    });
}

function hourToPeriodFormat(value, convertTo, format) {
    if(typeof(value) === "string") value = parseInt(value);

    if(convertTo == 12) {
        const ampm = value >= 12 ? "PM" : "AM";
        let hours = value % 12;
        hours = hours ? hours : 12;

        return [ampm, hours.toString()];
    } else if(convertTo == 24) {
        if(format == "PM") {
            if(value < 12) value = 12 + value;

            return value.toString();
        } else if(format == "AM") {
            if(value == 12) value = 0;

            return value.toString();
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function checkNumber(number, min, max) {
    if(typeof(number) === "undefined" || number == null || number == "" || number.trim == "") return false;
    if(isNaN(number)) return false;
    if(number > max || number < min) return false;

    return true;
}

function getAutoEnableSavedData(func) {
    chrome.storage.local.get(["autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat"], result => {
        let autoEnable = result.autoEnable || "false";
        let format = result.autoEnableHourFormat || defaultAutoEnableHourFormat;
        let hourEnable = result.hourEnable || defaultHourEnable;
        let minuteEnable = result.minuteEnable || defaultMinuteEnable;
        let hourEnableFormat = result.hourEnableFormat || defaultHourEnableFormat;
        let hourDisable = result.hourDisable || defaultHourDisable;
        let minuteDisable = result.minuteDisable || defaultMinuteDisable;
        let hourDisableFormat = result.hourDisableFormat || defaultHourDisableFormat;

        // Checking
        autoEnable = autoEnable == "true" || autoEnable == "false" ? autoEnable : "false";
        format = format == "24" || format == "12" ? format : defaultAutoEnableHourFormat;
        hourEnableFormat = hourEnableFormat == "PM" || hourEnableFormat == "AM" ? hourEnableFormat : defaultHourEnableFormat;
        hourDisableFormat = hourDisableFormat == "PM" || hourDisableFormat == "AM" ? hourDisableFormat : defaultHourDisableFormat;
        minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
        minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;
        hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
        hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;

        return func([autoEnable, format, hourEnableFormat, hourDisableFormat, minuteEnable, minuteDisable, hourEnable, hourDisable]);
    });
}

function getAutoEnableFormData() {
    let format = $("#autoEnableHourFormat").val();
    format = format == "24" || format == "12" ? format : defaultAutoEnableHourFormat;
    let hourEnableFormat = $("#hourEnableFormat").val();
    hourEnableFormat = hourEnableFormat == "PM" || hourEnableFormat == "AM" ? hourEnableFormat : defaultHourEnableFormat;
    let hourDisableFormat = $("#hourDisableFormat").val();
    hourDisableFormat = hourDisableFormat == "PM" || hourDisableFormat == "AM" ? hourDisableFormat : defaultHourDisableFormat;
    let minuteEnable = $("#minuteEnable").val();
    minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
    let minuteDisable = $("#minuteDisable").val();
    minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;
    let hourEnable = $("#hourEnable").val();
    let hourDisable = $("#hourDisable").val();

    if(format == "12") {
        hourEnable = checkNumber(hourEnable, 0, 12) ? hourEnable : hourToPeriodFormat(defaultHourEnable, 12, null)[1];
        hourEnable = hourToPeriodFormat(hourEnable, 24, hourEnableFormat);
        hourDisable = checkNumber(hourDisable, 0, 12) ? hourDisable : hourToPeriodFormat(defaultHourDisable, 12, null)[1];
        hourDisable = hourToPeriodFormat(hourDisable, 24, hourDisableFormat);
    } else {
        hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
        hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;
    }

    return [format, hourEnable, minuteEnable, hourEnableFormat, hourDisable, minuteDisable, hourDisableFormat];
}

function checkAutoEnableStartup(hourEnable, minuteEnable, hourDisable, minuteDisable) {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const timeNow = ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":00";

    hourEnable = hourEnable || defaultHourEnable;
    minuteEnable = minuteEnable || defaultMinuteEnable;
    hourDisable = hourDisable || defaultHourDisable;
    minuteDisable = minuteDisable || defaultMinuteDisable;

    hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
    hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;
    minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
    minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;

    const timeEnable = ("0" + hourEnable).slice(-2) + ":" + ("0" + minuteEnable).slice(-2) + ":00";
    const timeDisable = ("0" + hourDisable).slice(-2) + ":" + ("0" + minuteDisable).slice(-2) + ":00";

    if(timeEnable > timeDisable) {
        if(timeNow >= timeEnable || timeNow < timeDisable) {
            return true;
        } else {
            return false;
        }
    } else if(timeEnable < timeDisable) {
        if(timeNow >= timeDisable || timeNow < timeEnable) {
            return false;
        } else {
            return true;
        }
    } else if(timeEnable == timeDisable) {
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
    if(typeof chrome !== "undefined") {
        if(typeof browser !== "undefined") {
            return "Firefox";
        } else {
            return "Chrome";
        }
    }
}

function downloadData(data, name, dataType) {
    window.URL = window.URL || window.webkitURL;
    let blob;

    if(getBrowser() == "Firefox") {
        blob = new Blob([data], {type: "application/octet-stream"});
    } else {
        blob = new Blob([data], {type: dataType});
    }

    if(getBrowser() == "Firefox") {
        const downloadElement = document.createElement("iframe");
        downloadElement.style.display = "none";
        downloadElement.src = window.URL.createObjectURL(blob);
        document.body.appendChild(downloadElement);
    } else {
        const downloadElement = document.createElement("a");
        downloadElement.style.display = "none";
        downloadElement.download = name;
        downloadElement.href = window.URL.createObjectURL(blob);
        document.body.appendChild(downloadElement);
        downloadElement.click();
        document.body.removeChild(downloadElement);
    }
}

function loadPresetSelect(selectId) {
    let presetSelected = $("#" + selectId).val();

    if(presetSelected == null) {
        presetSelected = 1;
    }

    chrome.storage.local.get("presets", data => {
        try {
            let presets;
            if(data.presets == null || typeof(data.presets) == "undefined") {
                setSettingItem("presets", defaultPresets);
                presets = defaultPresets;
            } else {
                presets = data.presets;
            }

            $("#" + selectId).html("");

            let nbValue = 1;
            let optionTitle = "";

            for(const name in presets) {
                if(Object.prototype.hasOwnProperty.call(presets, name)) {
                    if(!Object.prototype.hasOwnProperty.call(presets[name], "name")) {
                        optionTitle = optionTitle + "<option value=\"" + nbValue + "\">" + i18next.t("modal.archive.presetTitle") + nbValue + " : " + i18next.t("modal.archive.presetEmpty") + "</option>";
                    } else {
                        if(presets[name]["name"].trim() == "") {
                            optionTitle = optionTitle + "<option value=\"" + nbValue + "\">" + i18next.t("modal.archive.presetTitle") + nbValue + " : " + i18next.t("modal.archive.presetTitleEmpty") + "</option>";
                        } else {
                            optionTitle = optionTitle + "<option value=\"" + nbValue + "\">" + i18next.t("modal.archive.presetTitle") + nbValue  + " : " + $("<div/>").text(presets[name]["name"].substring(0, 50)).html() + "</option>";
                        }
                    }

                    nbValue++;
                }
            }

            $("#" + selectId).html(optionTitle);
            $("#" + selectId).val(presetSelected).change();
        } catch(e) {
            return false;
        }
    });
}

function presetsEnabled(func) {
    chrome.storage.local.get("presets", data => {
        try {
            let presets;

            if(data.presets == null || typeof(data.presets) == "undefined") {
                setSettingItem("presets", defaultPresets);
                presets = defaultPresets;
            } else {
                presets = data.presets;
            }

            const listPreset = [];
            let numPreset = 1;

            for(const name in presets) {
                if(Object.prototype.hasOwnProperty.call(presets, name)) {
                    if(Object.prototype.hasOwnProperty.call(presets[name], "name")) {
                        listPreset.push(numPreset);
                    }
                }

                numPreset++;
            }

            return func(listPreset);
        } catch(e) {
            return func(false);
        }
    });
}

function loadPreset(nb, func) {
    if(func == undefined) {
        func = function() {};
    }

    if(nb < 1 || nb > nbPresets) {
        return func("error");
    }

    chrome.storage.local.get("presets", data => {
        try {
            let presets;

            if(data.presets == null || typeof(data.presets) == "undefined") {
                setSettingItem("presets", defaultPresets);
                return func("empty");
            } else {
                presets = data.presets;
            }

            const namePreset = nb;
            const preset = presets[namePreset];
            let settingsRestored = 0;

            for(const key in preset) {
                if(typeof(key) === "string") {
                    if(Object.prototype.hasOwnProperty.call(preset, key) && settingsToSavePresets.indexOf(key) !== -1) {
                        setSettingItem(key, preset[key]);
                        settingsRestored++;
                    }
                }
            }

            if(settingsRestored > 0) {
                return func("success");
            } else {
                return func("empty");
            }
        } catch(e) {
            return func("error");
        }
    });
}

function savePreset(nb, name, func) {
    if(nb < 1 || nb > nbPresets) {
        return func("error");
    }

    chrome.storage.local.get("presets", dataPreset => {
        chrome.storage.local.get(settingsToSavePresets, data => {
            try {
                let presets;

                if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
                    presets = defaultPresets;
                } else {
                    presets = dataPreset.presets;
                }

                const namePreset = nb;
                const preset = presets;
                preset[namePreset]["name"] = name.substring(0, 50);

                for(const key in data) {
                    if(typeof(key) === "string") {
                        if(Object.prototype.hasOwnProperty.call(data, key) && settingsToSavePresets.indexOf(key) !== -1) {
                            preset[namePreset][key] = data[key];
                        }
                    }
                }

                setSettingItem("presets", preset);

                return func("success");
            } catch(e) {
                return func("error");
            }
        });
    });
}

function deletePreset(nb, func) {
    if(nb < 1 || nb > nbPresets) {
        return func("error");
    }

    chrome.storage.local.get("presets", dataPreset => {
        try {
            let presets;

            if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
                presets = defaultPresets;
            } else {
                presets = dataPreset.presets;
            }

            const preset = presets;
            preset[nb] = {};

            setSettingItem("presets", preset);

            return func("success");
        } catch(e) {
            return func("error");
        }
    });
}

export { in_array, strict_in_array, matchWebsite, in_array_website, disableEnableToggle, removeA, commentMatched, commentAllLines, pageShadowAllowed, getUImessage, customTheme, hourToPeriodFormat, checkNumber, getAutoEnableSavedData, getAutoEnableFormData, checkAutoEnableStartup, checkChangedStorageData, getBrowser, downloadData, loadPresetSelect, presetsEnabled, loadPreset, savePreset, extensionVersion, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingNames, settingsToSavePresets, nbPresets, defaultPresets, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, defaultFiltersContent, deletePreset };