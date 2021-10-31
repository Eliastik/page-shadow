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
import browser from "webextension-polyfill";
import { defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingsToSavePresets, nbPresets, defaultPresets, defaultCustomThemes } from "./constants.js";

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

function disableEnableToggle(type, checked, url) {
    return new Promise(resolve => {
        browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]).then(result => {
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
    
            resolve();
        });
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
function pageShadowAllowed(url) {
    return new Promise(resolve => {
        browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"]).then(result => {
            if(result.globallyEnable !== "false") {
                let forbiddenWebsites = [];
    
                if(result.sitesInterditPageShadow !== undefined && result.sitesInterditPageShadow !== "") {
                    forbiddenWebsites = result.sitesInterditPageShadow.trim().split("\n");
                }
    
                const websuteUrl_tmp = new URL(url);
                const domain = websuteUrl_tmp.hostname;
    
                if((result.whiteList == "true" && (in_array_website(domain, forbiddenWebsites) || in_array_website(url, forbiddenWebsites))) || (result.whiteList !== "true" && !in_array_website(domain, forbiddenWebsites) && !in_array_website(url, forbiddenWebsites))) {
                    return resolve(true);
                }
            }
            
            return resolve(false);
        });
    });
}

function getUImessage(id) {
    return browser.i18n.getMessage(id);
}

function customTheme(nb, style, disableCustomCSS, lnkCssElement) {
    disableCustomCSS = disableCustomCSS == undefined ? false : disableCustomCSS;
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    let customThemes, backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme, fontTheme;

    browser.storage.local.get("customThemes").then(result => {
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
        style.sheet.insertRule("html.pageShadowBackgroundCustom:not(.pageShadowDisableBackgroundStyling) { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom:not(.pageShadowDisableBackgroundStyling) { background: #"+ backgroundTheme +" !important; background-image: url(); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasBackgroundImg), .pageShadowContrastBlackCustom *.pageShadowForceCustomBackgroundColor { background-color: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableColorStyling), .pageShadowContrastBlackCustom *.pageShadowForceCustomTextColor { color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom input:not(.pageShadowElementDisabled):not(.pageShadowDisableInputBorderStyling) { border: 1px solid #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(.pageShadowElementDisabled):not(.pageShadowDisableFontFamilyStyling) { font-family: " + fontTheme + " !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom :not(.pageShadowInvertImageColor) svg:not(.pageShadowElementDisabled):not(.pageShadowDisableColorStyling) { color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:not(.pageShadowElementDisabled):not(.pageShadowDisableColorStyling):not(.pageShadowDisableLinkStyling), .pageShadowContrastBlackCustom *.pageShadowForceCustomLinkColor { color: #"+ linksColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowDisableLinkStyling) { background-color: transparent !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom img, .pageShadowContrastBlackCustom video, .pageShadowContrastBlackCustom canvas { filter: invert(0%); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom.pageShadowBackgroundDetected * > *:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling), .pageShadowContrastBlackCustom *.pageShadowForceCustomBackgroundColor { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:visited:not(#pageShadowLinkNotVisited):not(.pageShadowElementDisabled):not(.pageShadowDisableLinkStyling):not(.pageShadowDisableColorStyling), .pageShadowContrastBlackCustom #pageShadowLinkVisited:not(.pageShadowElementDisabled):not(.pageShadowDisableLinkStyling):not(.pageShadowDisableColorStyling), .pageShadowContrastBlackCustom *:visited.pageShadowForceCustomLinkColor { color: #"+ linksVisitedColorTheme +" !important; }", 0);

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

function getAutoEnableSavedData() {
    return new Promise(resolve => {
        browser.storage.local.get(["autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat"]).then(result => {
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
    
            resolve([autoEnable, format, hourEnableFormat, hourDisableFormat, minuteEnable, minuteDisable, hourEnable, hourDisable]);
        });
    });
}

function getAutoEnableFormData() {
    let format = document.getElementById("autoEnableHourFormat").value;
    format = format == "24" || format == "12" ? format : defaultAutoEnableHourFormat;
    let hourEnableFormat = document.getElementById("hourEnableFormat").value;
    hourEnableFormat = hourEnableFormat == "PM" || hourEnableFormat == "AM" ? hourEnableFormat : defaultHourEnableFormat;
    let hourDisableFormat = document.getElementById("hourDisableFormat").value;
    hourDisableFormat = hourDisableFormat == "PM" || hourDisableFormat == "AM" ? hourDisableFormat : defaultHourDisableFormat;
    let minuteEnable = document.getElementById("minuteEnable").value;
    minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
    let minuteDisable = document.getElementById("minuteDisable").value;
    minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;
    let hourEnable = document.getElementById("hourEnable").value;
    let hourDisable = document.getElementById("hourDisable").value;

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
    const isFirefox = navigator.userAgent.split(" ").find(element => element.toLowerCase().startsWith("firefox")) != null;

    if(isFirefox) {
        return "Firefox";
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

async function loadPresetSelect(selectId, i18next) {
    let presetSelected = document.getElementById(selectId).value;

    if(!presetSelected) {
        presetSelected = 1;
    }

    document.getElementById(selectId).innerHTML = "";

    let optionTitle = "";

    for(let i = 1; i <= nbPresets; i++) {
        const preset = await getPresetData(i);

        if(!preset || !Object.prototype.hasOwnProperty.call(preset, "name")) {
            optionTitle = optionTitle + "<option value=\"" + i + "\">" + i18next.t("modal.archive.presetTitle") + i + " : " + i18next.t("modal.archive.presetEmpty") + "</option>";
        } else {
            if(preset["name"].trim() == "") {
                optionTitle = optionTitle + "<option value=\"" + i+ "\">" + i18next.t("modal.archive.presetTitle") + i + " : " + i18next.t("modal.archive.presetTitleEmpty") + "</option>";
            } else {
                const element = document.createElement("div");
                element.textContent = preset["name"].substring(0, 50);
                optionTitle = optionTitle + "<option value=\"" + i + "\">" + i18next.t("modal.archive.presetTitle") + i  + " : " + element.innerHTML + "</option>";
            }
        }
    }

    document.getElementById(selectId).innerHTML = optionTitle;
    document.getElementById(selectId).value = presetSelected;
    document.getElementById(selectId).dispatchEvent(new Event("change"));
    if(document.getElementById(selectId).onchange) document.getElementById(selectId).onchange();
}

function presetsEnabled() {
    return new Promise((resolve, reject) => {
        browser.storage.local.get("presets").then(data => {
            try {
                let presets;
    
                if(data.presets == null || typeof(data.presets) == "undefined") {
                    setSettingItem("presets", defaultPresets);
                    presets = defaultPresets;
                } else {
                    presets = data.presets;
                }
    
                const listPreset = [];
    
                for(let i = 1; i <= nbPresets; i++) {
                    if(presets[i]) {
                        if(Object.prototype.hasOwnProperty.call(presets[i], "name")) {
                            listPreset.push(i);
                        }
                    }
                }
    
                resolve(listPreset);
            } catch(e) {
                reject();
            }
        });
    });
}

function loadPreset(nb) {
    return new Promise(resolve => {
        if(nb < 1 || nb > nbPresets) {
            return resolve("error");
        }

        browser.storage.local.get("presets").then(data => {
            try {
                let presets;

                if(data.presets == null || typeof(data.presets) == "undefined") {
                    setSettingItem("presets", defaultPresets);
                    return resolve("empty");
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
                    resolve("success");
                } else {
                    resolve("empty");
                }
            } catch(e) {
                resolve("error");
            }
        });
    });
}

function getPresetData(nb) {
    return new Promise(resolve => {
        if(nb < 1 || nb > nbPresets) {
            return resolve("error");
        }

        browser.storage.local.get("presets").then(data => {
            try {
                let presets;

                if(data.presets == null || typeof(data.presets) == "undefined") {
                    setSettingItem("presets", defaultPresets);
                } else {
                    presets = data.presets;
                }

                const namePreset = nb;
                const preset = presets[namePreset];

                resolve(preset);
            } catch(e) {
                resolve("error");
            }
        });
    });
}

function savePreset(nb, name, websiteListToApply, saveNewSettings) {
    return new Promise(resolve => {
        if(nb < 1 || nb > nbPresets) {
            return resolve("error");
        }

        browser.storage.local.get("presets").then(dataPreset => {
            browser.storage.local.get(settingsToSavePresets).then(data => {
                try {
                    let presets;

                    if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
                        presets = defaultPresets;
                    } else {
                        presets = dataPreset.presets;
                    }

                    const namePreset = nb;
                    const preset = presets;
                    if(!preset[namePreset]) preset[namePreset] = {};
                    preset[namePreset].name = name.substring(0, 50);
                    preset[namePreset].websiteListToApply = websiteListToApply;

                    if(saveNewSettings) {
                        for(const key in data) {
                            if(typeof(key) === "string") {
                                if(Object.prototype.hasOwnProperty.call(data, key) && settingsToSavePresets.indexOf(key) !== -1) {
                                    preset[namePreset][key] = data[key];
                                }
                            }
                        }
                    }

                    setSettingItem("presets", preset);

                    return resolve("success");
                } catch(e) {
                    return resolve("error");
                }
            });
        });
    });
}

function deletePreset(nb) {
    return new Promise(resolve => {
        if(nb < 1 || nb > nbPresets) {
            return resolve("error");
        }

        browser.storage.local.get("presets").then(dataPreset => {
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

                return resolve("success");
            } catch(e) {
                return resolve("error");
            }
        });
    });
}

function getCurrentURL() {
    return window.location.href;
}

async function presetsEnabledForWebsite(url) {
    const presetListEnabled = [];

    if(url && url.trim() != "") {
        for(let i = 1; i <= nbPresets; i++) {
            const presetData = await getPresetData(i);

            if(presetData) {
                const websiteSettings = presetData.websiteListToApply;
                let websiteList = [];
    
                if(websiteSettings !== undefined && websiteSettings !== "") {
                    websiteList = websiteSettings.trim().split("\n");
                }
    
                const websuteUrl_tmp = new URL(url);
                const domain = websuteUrl_tmp.hostname;
                const autoEnabledWebsite = in_array_website(domain, websiteList);
                const autoEnabledPage = in_array_website(url, websiteList);
    
                if(autoEnabledWebsite || autoEnabledPage) {
                    presetListEnabled.push({
                        presetNb: i,
                        autoEnabledWebsite: autoEnabledWebsite,
                        autoEnabledPage: autoEnabledPage
                    });
                }
            }
        }
    }

    return presetListEnabled;
}

async function getSettings(url) {
    return new Promise(resolve => {
        browser.storage.local.get(["sitesInterditPageShadow", "pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertEntirePage", "whiteList", "colorTemp", "globallyEnable", "invertVideoColors", "disableImgBgColor", "invertBgColor"]).then(async(result) => {
            let pageShadowEnabled = result.pageShadowEnabled;
            let theme = result.theme;
            let colorTemp = result.colorTemp;
            let invertEntirePage = result.invertEntirePage;
            let invertImageColors = result.invertImageColors;
            let invertVideoColors = result.invertVideoColors;
            let invertBgColor = result.invertBgColor;
            let pageLumEnabled = result.pageLumEnabled;
            let pourcentageLum = result.pourcentageLum;
            let nightModeEnabled = result.nightModeEnabled;
            let invertPageColors = result.invertPageColors;
            let disableImgBgColor = result.disableImgBgColor;
            let colorInvert = result.colorInvert;

            // Automatically enable preset ?
            const presetsEnabled = await presetsEnabledForWebsite(url);

            if(presetsEnabled && presetsEnabled.length > 0) {
                const presetEnabled = presetsEnabled[0];

                if(presetEnabled && presetEnabled.presetNb > 0) {
                    const presetData = await getPresetData(presetEnabled.presetNb);
    
                    pageShadowEnabled = presetData.pageShadowEnabled;
                    theme = presetData.theme;
                    colorTemp = presetData.colorTemp;
                    invertEntirePage = presetData.invertEntirePage;
                    invertImageColors = presetData.invertImageColors;
                    invertVideoColors = presetData.invertVideoColors;
                    invertBgColor = presetData.invertBgColor;
                    pageLumEnabled = presetData.pageLumEnabled;
                    pourcentageLum = presetData.pourcentageLum;
                    nightModeEnabled = presetData.nightModeEnabled;
                    invertPageColors = presetData.invertPageColors;
                    disableImgBgColor = presetData.disableImgBgColor;
                    colorInvert = presetData.colorInvert;
                }
            }

            if(colorInvert == "true") {
                colorInvert = "true";
                invertImageColors = "true";
            } else if(invertPageColors == "true") {
                colorInvert = "true";
            } else {
                colorInvert = "false";
            }

            resolve({
                pageShadowEnabled: pageShadowEnabled,
                theme: theme,
                pageLumEnabled: pageLumEnabled,
                pourcentageLum: pourcentageLum,
                nightModeEnabled: nightModeEnabled,
                colorInvert: colorInvert,
                invertPageColors: invertPageColors,
                invertImageColors: invertImageColors,
                invertEntirePage: invertEntirePage,
                colorTemp: colorTemp,
                globallyEnable: result.globallyEnable,
                invertVideoColors: invertVideoColors,
                disableImgBgColor: disableImgBgColor,
                invertBgColor: invertBgColor
            });
        });
    });
}

async function disableEnablePreset(type, nb, checked, url) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const preset = await getPresetData(nb);
    if(!preset) return "error";

    try {
        const domain = url.hostname;
        const href = url.href;
        let match = domain;
        let websitesPagesArray;

        const websiteListToApply = preset["websiteListToApply"];

        if(websiteListToApply == undefined && websiteListToApply !== "") {
            websitesPagesArray = [];
        } else {
            websitesPagesArray = websiteListToApply.split("\n");
        }

        switch(type) {
        case "toggle-website":
            match = domain;
            break;
        case "toggle-webpage":
            match = href;
            break;
        }
    
        let disabledWebsitesNew;
        
        if(checked) {
            websitesPagesArray.push(match);
            websitesPagesArray = removeA(websitesPagesArray, "").join("\n");
            disabledWebsitesNew = websitesPagesArray;
        } else {
            disabledWebsitesNew = removeA(websitesPagesArray, match);
            disabledWebsitesNew = commentMatched(disabledWebsitesNew, match);
            disabledWebsitesNew = removeA(disabledWebsitesNew, "").join("\n");
        }

        await savePreset(nb, preset.name, disabledWebsitesNew, false);

        return "success";
    } catch(e) {
        return "error";
    }
}

export { in_array, strict_in_array, matchWebsite, in_array_website, disableEnableToggle, removeA, commentMatched, commentAllLines, pageShadowAllowed, getUImessage, customTheme, hourToPeriodFormat, checkNumber, getAutoEnableSavedData, getAutoEnableFormData, checkAutoEnableStartup, checkChangedStorageData, getBrowser, downloadData, loadPresetSelect, presetsEnabled, loadPreset, savePreset, deletePreset, getSettings, getPresetData, getCurrentURL, presetsEnabledForWebsite, disableEnablePreset };