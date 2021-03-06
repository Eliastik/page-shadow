/* Page Shadow
 *
 * Copyright (C) 2015-2019 Eliastik (eliastiksofts.com)
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

// Global configuration of the extension
var extensionVersion = "2.7";
var nbThemes = 15; // nb of themes for the function Increase the contrast (used globally in the extension)
var colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"]; // color temperatures available for the function Night Mode (used globally in the extension)
var minBrightnessPercentage = 0; // the minimum percentage of brightness
var maxBrightnessPercentage = 0.9; // the maximum percentage of brightness
var brightnessDefaultValue = 0.15; // the default percentage value of brightness
var defaultBGColorCustomTheme = "000000";
var defaultTextsColorCustomTheme = "FFFFFF";
var defaultLinksColorCustomTheme = "1E90FF";
var defaultVisitedLinksColorCustomTheme = "FF00FF";
var defaultFontCustomTheme = "";
var defaultCustomCSSCode = "/* Example - Add a blue border around the page:\nbody {\n\tborder: 2px solid blue;\n} */";
var defaultAutoEnableHourFormat = "24";
var defaultHourEnable = "20";
var defaultMinuteEnable = "0";
var defaultHourEnableFormat = "PM";
var defaultHourDisable = "7";
var defaultMinuteDisable = "0";
var defaultHourDisableFormat = "AM";
var settingNames = ['pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'sitesInterditPageShadow', 'liveSettings', 'whiteList', 'colorTemp', 'colorInvert', 'invertPageColors', 'invertImageColors', 'invertEntirePage', 'invertVideoColors', 'invertBgColor', 'globallyEnable', 'customThemeInfoDisable', 'autoEnable', 'autoEnableHourFormat', 'hourEnable', 'minuteEnable', 'hourEnableFormat', 'hourDisable', 'minuteDisable', 'hourDisableFormat', 'disableImgBgColor', 'defaultLoad', 'presets', 'customThemes'];
var settingsToSavePresets = ['pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'liveSettings', 'colorTemp', 'colorInvert', 'invertPageColors', 'invertImageColors', 'invertEntirePage', 'invertVideoColors', 'invertBgColor', 'autoEnable', 'disableImgBgColor'];
var nbPresets = 5;
var defaultPresets = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
var nbCustomThemesSlots = 5;
var defaultCustomThemes = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
// End of the global configuration of the extension

function in_array(needle, haystack) {
    for(var key in haystack) {
        if(needle.indexOf(haystack[key]) != -1) {
            return true;
        }
    }

    return false;
}

function strict_in_array(needle, haystack) {
    for(var key in haystack) {
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
              var regex = new RegExp(rule.substring(1, rule.length - 1), "gi");

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
    for(var key in haystack) {
        if(matchWebsite(needle, haystack[key])) {
            return true;
        }
    }

    return false;
}

function disableEnableToggle(type, checked, url, func) {
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList'], function (result) {
        var disabledWebsites = "";
        var domain = url.hostname;
        var href = url.href;
        var match = domain;

        if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
            var disabledWebsitesArray = [];
        } else {
            var disabledWebsites = result.sitesInterditPageShadow;
            var disabledWebsitesArray = disabledWebsites.split("\n");
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
            if((checked && result.whiteList == "true") || (!checked && result.whiteList != "true")) {
                var disabledWebsitesNew = removeA(disabledWebsitesArray, match);
                var disabledWebsitesNew = commentMatched(disabledWebsitesNew, match);
                var disabledWebsitesNew = removeA(disabledWebsitesNew, "").join("\n");

                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
            } else if((!checked && result.whiteList == "true") || (checked && result.whiteList != "true")) {
                disabledWebsitesArray.push(match);
                var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");

                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
            }
        }

        if(func != undefined) {
            return func();
        }
    });
}

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;

    while(L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }

    return arr;
}

function commentMatched(arr, website) {
    var res = [];

    for(var key in arr) {
        if(matchWebsite(website, arr[key])) {
            res.push("#" + arr[key]);
        } else {
            res.push(arr[key]);
        }
    }

    return res;
}

function commentAllLines(string) {
    var arr = string.split("\n");
    var res = [];

    for(var key in arr) {
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
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList', 'globallyEnable'], function (result) {
        if(result.globallyEnable !== "false") {
            if(result.sitesInterditPageShadow !== undefined && result.sitesInterditPageShadow !== "") {
                var siteInterdits = result.sitesInterditPageShadow.trim().split("\n");
            } else {
                var siteInterdits = "";
            }

            var websuteUrl_tmp = new URL(url);
            var domain = websuteUrl_tmp.hostname;

            if((result.whiteList == "true" && (in_array_website(domain, siteInterdits) || in_array_website(url, siteInterdits))) || (result.whiteList !== "true" && !in_array_website(domain, siteInterdits) && !in_array_website(url, siteInterdits))) {
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
    var disableCustomCSS = disableCustomCSS == undefined ? false : disableCustomCSS;
    var nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    chrome.storage.local.get("customThemes", function(result) {
        if(result.customThemes != undefined && result.customThemes[nb] != undefined) {
            var customThemes = result.customThemes[nb];
        } else {
            var customThemes = defaultCustomThemes[nb];
        }

        if(customThemes["customThemeBg"] != undefined) {
            var backgroundTheme = customThemes["customThemeBg"];
        } else {
            var backgroundTheme = defaultBGColorCustomTheme;
        }

        if(customThemes["customThemeTexts"] != undefined) {
            var textsColorTheme = customThemes["customThemeTexts"];
        } else {
            var textsColorTheme = defaultTextsColorCustomTheme;
        }

        if(customThemes["customThemeLinks"] != undefined) {
            var linksColorTheme = customThemes["customThemeLinks"];
        } else {
            var linksColorTheme = defaultLinksColorCustomTheme;
        }

        if(customThemes["customThemeLinksVisited"] != undefined) {
            var linksVisitedColorTheme = customThemes["customThemeLinksVisited"];
        } else {
            var linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
        }

        if(customThemes["customThemeFont"] != undefined && customThemes["customThemeFont"].trim() != "") {
            var fontTheme = '"' + customThemes["customThemeFont"] + '"';
        } else {
            var fontTheme = defaultFontCustomTheme;
        }

        if(document.getElementsByTagName('head')[0].contains(style)) { // remove style element
            document.getElementsByTagName('head')[0].removeChild(style);
        }

        // Append style element
        document.getElementsByTagName('head')[0].appendChild(style);

        if(style.cssRules) { // Remove all rules
            for(var i = 0; i < style.cssRules.length; i++) {
                style.sheet.deleteRule(i);
            }
        }

        // Create rules
        style.sheet.insertRule("html.pageShadowBackgroundCustom { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom { background: #"+ backgroundTheme +" !important; background-image: url(); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon) { background-color: #"+ backgroundTheme +" !important; color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom input { border: 1px solid #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom * {  font-family: " + fontTheme + " !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom :not(.pageShadowInvertImageColor) svg { color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a { color: #"+ linksColorTheme +" !important; background-color: transparent !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom img, .pageShadowContrastBlackCustom video, .pageShadowContrastBlackCustom canvas { filter: invert(0%); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom.pageShadowBackgroundDetected *:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(.pageShadowHasBackgroundImg):not(.pageShadowDisableStyling):not(.pageShadowHasHiddenElement) { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:visited:not(#pageShadowLinkNotVisited), .pageShadowContrastBlackCustom #pageShadowLinkVisited { color: #"+ linksVisitedColorTheme +" !important; }", 0);

        // Custom CSS
        if(!disableCustomCSS && customThemes["customCSSCode"] != undefined && typeof(customThemes["customCSSCode"]) == "string" && customThemes["customCSSCode"].trim() != "") {
            lnkCssElement.setAttribute('rel', 'stylesheet');
            lnkCssElement.setAttribute('type', 'text/css');
            lnkCssElement.setAttribute('id', 'pageShadowCustomCSS');
            lnkCssElement.setAttribute('name', 'pageShadowCustomCSS');
            lnkCssElement.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(customThemes["customCSSCode"]));
            document.getElementsByTagName('head')[0].appendChild(lnkCssElement);
        }
    });
}

function hourToPeriodFormat(value, convertTo, format) {
    if(typeof(value) === "string") var value = parseInt(value);

    if(convertTo == 12) {
        var ampm = value >= 12 ? 'PM' : 'AM';
        var hours = value % 12;
        var hours = hours ? hours : 12;

        return [ampm, hours.toString()];
    } else if(convertTo == 24) {
        if(format == "PM") {
            if(value < 12) var value = 12 + value;

            return value.toString();
        } else if(format == "AM") {
            if(value == 12) var value = 0;

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
    chrome.storage.local.get(['autoEnable', 'autoEnableHourFormat', 'hourEnable', 'minuteEnable', 'hourEnableFormat', 'hourDisable', 'minuteDisable', 'hourDisableFormat'], function (result) {
        var autoEnable = result.autoEnable || "false";
        var format = result.autoEnableHourFormat || defaultAutoEnableHourFormat;
        var hourEnable = result.hourEnable || defaultHourEnable;
        var minuteEnable = result.minuteEnable || defaultMinuteEnable;
        var hourEnableFormat = result.hourEnableFormat || defaultHourEnableFormat;
        var hourDisable = result.hourDisable || defaultHourDisable;
        var minuteDisable = result.minuteDisable || defaultMinuteDisable;
        var hourDisableFormat = result.hourDisableFormat || defaultHourDisableFormat;

        // Verifications
        var autoEnable = autoEnable == "true" || autoEnable == "false" ? autoEnable : "false";
        var format = format == "24" || format == "12" ? format : defaultAutoEnableHourFormat;
        var hourEnableFormat = hourEnableFormat == "PM" || hourEnableFormat == "AM" ? hourEnableFormat : defaultHourEnableFormat;
        var hourDisableFormat = hourDisableFormat == "PM" || hourDisableFormat == "AM" ? hourDisableFormat : defaultHourDisableFormat;
        var minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
        var minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;
        var hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
        var hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;

        return func([autoEnable, format, hourEnableFormat, hourDisableFormat, minuteEnable, minuteDisable, hourEnable, hourDisable]);
    });
}

function getAutoEnableFormData() {
    var format = $("#autoEnableHourFormat").val();
    var format = format == "24" || format == "12" ? format : defaultAutoEnableHourFormat;
    var hourEnableFormat = $("#hourEnableFormat").val();
    var hourEnableFormat = hourEnableFormat == "PM" || hourEnableFormat == "AM" ? hourEnableFormat : defaultHourEnableFormat;
    var hourDisableFormat = $("#hourDisableFormat").val();
    var hourDisableFormat = hourDisableFormat == "PM" || hourDisableFormat == "AM" ? hourDisableFormat : defaultHourDisableFormat;
    var minuteEnable = $("#minuteEnable").val();
    var minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
    var minuteDisable = $("#minuteDisable").val();
    var minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;
    var hourEnable = $("#hourEnable").val();
    var hourDisable = $("#hourDisable").val();

    if(format == "12") {
        var hourEnable = checkNumber(hourEnable, 0, 12) ? hourEnable : hourToPeriodFormat(defaultHourEnable, 12, null)[1];
        var hourEnable = hourToPeriodFormat(hourEnable, 24, hourEnableFormat);
        var hourDisable = checkNumber(hourDisable, 0, 12) ? hourDisable : hourToPeriodFormat(defaultHourDisable, 12, null)[1];
        var hourDisable = hourToPeriodFormat(hourDisable, 24, hourDisableFormat);
    } else {
        var hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
        var hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;
    }

    return [format, hourEnable, minuteEnable, hourEnableFormat, hourDisable, minuteDisable, hourDisableFormat];
}

function checkAutoEnableStartup(hourEnable, minuteEnable, hourDisable, minuteDisable) {
    var date = new Date();
    var hours = date.getHours();
    var minutes = date.getMinutes();

    var timeNow = ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":00";

    var hourEnable = hourEnable || defaultHourEnable;
    var minuteEnable = minuteEnable || defaultMinuteEnable;
    var hourDisable = hourDisable || defaultHourDisable;
    var minuteDisable = minuteDisable || defaultMinuteDisable;

    var hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
    var hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;
    var minuteEnable = checkNumber(minuteEnable, 0, 59) ? minuteEnable : defaultMinuteEnable;
    var minuteDisable = checkNumber(minuteDisable, 0, 59) ? minuteDisable : defaultMinuteDisable;

    var timeEnable = ("0" + hourEnable).slice(-2) + ":" + ("0" + minuteEnable).slice(-2) + ":00";
    var timeDisable = ("0" + hourDisable).slice(-2) + ":" + ("0" + minuteDisable).slice(-2) + ":00";

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
        return object.hasOwnProperty(key);
    } else if(Array.isArray(key)) {
        for(var i = 0; i < key.length; i++) {
            if(object.hasOwnProperty(key[i])) {
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

    if(getBrowser() == "Firefox") {
        var blob = new Blob([data], {type: "application/octet-stream"});
    } else {
        var blob = new Blob([data], {type: dataType});
    }

    if(getBrowser() == "Firefox") {
        var downloadElement = document.createElement('iframe');
        downloadElement.style.display = "none";
        downloadElement.src = window.URL.createObjectURL(blob);
        document.body.appendChild(downloadElement);
    } else {
        var downloadElement = document.createElement('a');
        downloadElement.style.display = "none";
        downloadElement.download = name;
        downloadElement.href = window.URL.createObjectURL(blob);
        document.body.appendChild(downloadElement);
        downloadElement.click();
        document.body.removeChild(downloadElement);
    }
}

function loadPresetSelect(selectId) {
    var presetSelected = $("#" + selectId).val();

    if(presetSelected == null) {
        var presetSelected = 1;
    }

    chrome.storage.local.get('presets', function(data) {
        try {
            if(data.presets == null || typeof(data.presets) == 'undefined') {
                setSettingItem("presets", defaultPresets);
                var presets = defaultPresets;
            } else {
                var presets = data.presets;
            }

            $("#" + selectId).html("");

            var nbValue = 1;
            var optionTitle = "";

            for(var name in presets) {
                if(presets.hasOwnProperty(name)) {
                    if(!presets[name].hasOwnProperty("name")) {
                        var optionTitle = optionTitle + "<option value=\"" + nbValue + "\">" + i18next.t("modal.archive.presetTitle") + nbValue + " : " + i18next.t("modal.archive.presetEmpty") + "</option>";
                    } else {
                        if(presets[name]["name"].trim() == "") {
                            var optionTitle = optionTitle + "<option value=\"" + nbValue + "\">" + i18next.t("modal.archive.presetTitle") + nbValue + " : " + i18next.t("modal.archive.presetTitleEmpty") + "</option>";
                        } else {
                            var optionTitle = optionTitle + "<option value=\"" + nbValue + "\">" + i18next.t("modal.archive.presetTitle") + nbValue  + " : " + $('<div/>').text(presets[name]["name"].substring(0, 50)).html() + "</option>";
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
    chrome.storage.local.get('presets', function (data) {
        try {
            if(data.presets == null || typeof(data.presets) == 'undefined') {
                setSettingItem("presets", defaultPresets);
                var presets = defaultPresets;
            } else {
                var presets = data.presets;
            }

            var listPreset = [];
            var numPreset = 1;

            for (var name in presets) {
                if (presets.hasOwnProperty(name)) {
                    if(presets[name].hasOwnProperty("name")) {
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
      var func = function(res) {};
    }

    if(nb < 1 || nb > nbPresets) {
        return func("error");
    }

    chrome.storage.local.get('presets', function (data) {
        try {
            if(data.presets == null || typeof(data.presets) == 'undefined') {
                setSettingItem("presets", defaultPresets);
                return func("empty");
            } else {
                var presets = data.presets;
            }

            var namePreset = nb;
            var preset = presets[namePreset];
            var settingsRestored = 0;

            for (var key in preset) {
                if(typeof(key) === "string") {
                    if(preset.hasOwnProperty(key) && settingsToSavePresets.indexOf(key) !== -1) {
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

    chrome.storage.local.get('presets', function (dataPreset) {
        chrome.storage.local.get(settingsToSavePresets, function (data) {
            try {
                if(dataPreset.presets == null || typeof(dataPreset.presets) == 'undefined') {
                    var presets = defaultPresets;
                } else {
                    var presets = dataPreset.presets;
                }

                var namePreset = nb;
                var preset = presets;
                preset[namePreset]["name"] = name.substring(0, 50);

                for(var key in data) {
                    if(typeof(key) === "string") {
                        if(data.hasOwnProperty(key) && settingsToSavePresets.indexOf(key) !== -1) {
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

    chrome.storage.local.get('presets', function (dataPreset) {
        try {
            if(dataPreset.presets == null || typeof(dataPreset.presets) == 'undefined') {
                var presets = defaultPresets;
            } else {
                var presets = dataPreset.presets;
            }

            var preset = presets;
            preset[nb] = {};

            setSettingItem("presets", preset);

            return func("success");
        } catch(e) {
            return func("error");
        }
    });
}
