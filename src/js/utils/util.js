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
import { setSettingItem, migrateSettings } from "../storage.js";
import browser from "webextension-polyfill";
import { defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingsToSavePresets, nbPresets, defaultPresets, defaultCustomThemes, defaultWebsiteSpecialFiltersConfig, defaultSettings, settingsToLoad, defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack, permissionOrigin, quotaBytesPerItemMargin, attenuateDefaultValue, pageAnalyzerCSSClasses, colorTemperaturesAvailable, regexpMatchURL } from "../constants.js";
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

function matchWebsite(needle, rule) {
    if(!rule.trim().startsWith("#")) {
        if(!rule.trim().startsWith("/") && !rule.trim().endsWith("/") && rule.indexOf("*") != -1) {
            rule = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&"); // Escape string for regex
            rule = rule.replaceAll(/(?<!\\)\*/g, "(.*)");
            rule = rule.replace(/\\\\\*/g, "\\*");
            rule = "/" + rule + "/";
        }

        if(rule.trim().startsWith("/") && rule.trim().endsWith("/")) {
            try {
                const regex = new RegExp(rule.substring(1, rule.length - 1), "gi");

                if(regex.test(needle)) {
                    return true;
                }
            } catch(e) {
                debugLogger.log(e, "error");
                return false;
            }
        } else if(needle == rule) {
            return true;
        }
    }

    return false;
}

function inArrayWebsite(needle, haystack) {
    for(const key in haystack) {
        if(matchWebsite(needle, haystack[key])) {
            return true;
        }
    }

    return false;
}

async function disableEnableToggle(type, checked, url) {
    const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]);

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
            await setSettingItem("globallyEnable", "false");
        } else {
            await setSettingItem("globallyEnable", "true");
        }
        break;
    }

    if(type == "disable-website" || type == "disable-webpage") {
        let disabledWebsitesNew;

        if((checked && result.whiteList == "true") || (!checked && result.whiteList != "true")) {
            disabledWebsitesNew = removeA(disabledWebsitesArray, match);
            disabledWebsitesNew = commentMatched(disabledWebsitesNew, match);
            disabledWebsitesNew = removeA(disabledWebsitesNew, "").join("\n");

            await setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
        } else if((!checked && result.whiteList == "true") || (checked && result.whiteList != "true")) {
            disabledWebsitesArray.push(match);
            disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");

            await setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
        }
    }

    return true;
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

/** Function to know if the execution of Page Shadow is allowed for a page - return true if allowed, false if not */
async function pageShadowAllowed(url, settingsCache) {
    const result = settingsCache || await browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"]);

    if(result.globallyEnable !== "false") {
        let forbiddenWebsites = [];

        if(result.sitesInterditPageShadow !== undefined && result.sitesInterditPageShadow !== "") {
            forbiddenWebsites = result.sitesInterditPageShadow.trim().split("\n");
        }

        let websiteUrlTmp;

        try {
            websiteUrlTmp = new URL(url);
        } catch(e) {
            debugLogger.log(e, "error");
            return;
        }

        const domain = websiteUrlTmp.hostname;

        if((result.whiteList == "true" && (inArrayWebsite(domain, forbiddenWebsites) || inArrayWebsite(url, forbiddenWebsites))) || (result.whiteList !== "true" && !inArrayWebsite(domain, forbiddenWebsites) && !inArrayWebsite(url, forbiddenWebsites))) {
            return true;
        }
    }

    return false;
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

async function processRules(style, themeConfig, isShadowRoot) {
    if(!style.sheet) return;

    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const response = await sendMessageWithPromise({ "type": "getGlobalPageShadowStyle" }, "getGlobalPageShadowStyleResponse");

    style.textContent = processRulesConfig(response.data, themeConfig);

    if(style.sheet) {
        if(isShadowRoot) {
            style.sheet.insertRule(":host { color: unset !important; background: unset !important; }");
        }
    }
}

function processShadowRootStyle(style) {
    let newStyle = style.replaceAll(/html\.pageShadowBackgroundContrast\b/g, ":host");
    newStyle = newStyle.replaceAll(/html\.pageShadowContrastBlack\b/g, ":host");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertImageColor\b/g, ":host(.pageShadowInvertImageColor)");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertBgColor\b/g, ":host(.pageShadowInvertBgColor)");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertVideoColor\b/g, ":host(.pageShadowInvertVideoColor)");
    newStyle = newStyle.replaceAll(/.pageShadowCustomFontFamily\b/g, ":host");
    newStyle = newStyle.replaceAll(/\.pageShadowContrastBlack(?=[\s\S]*\{)/g, ":host");
    newStyle = newStyle.replaceAll(/:root/g, ":host");
    newStyle = newStyle.replaceAll(/:host:host/g, ":host");
    newStyle = newStyle.replaceAll(/:host(?:\s*:\s*not\([^)]+\))+\s/g, ":host ");

    return newStyle;
}

function processRulesConfig(style, themeConfig) {
    const colorMap = {
        "--page-shadow-bgcolor": themeConfig.backgroundColor,
        "--page-shadow-txtcolor": themeConfig.textColor,
        "--page-shadow-lnkcolor": themeConfig.linkColor,
        "--page-shadow-visitedlnkcolor": themeConfig.visitedLinkColor,
        "--page-shadow-selectbgcolor": themeConfig.selectBackgroundColor || defaultThemesSelectBgColors[0],
        "--page-shadow-selecttxtcolor": themeConfig.selectTextColor || defaultThemesSelectTextColors[0],
        "--page-shadow-insbgcolor": themeConfig.insBackgroundColor || defaultThemesInsBgColors[0],
        "--page-shadow-instcolor": themeConfig.insTextColor || defaultThemesInsTextColors[0],
        "--page-shadow-delbgcolor": themeConfig.delBackgroundColor || defaultThemesDelBgColors[0],
        "--page-shadow-deltcolor": themeConfig.delTextColor || defaultThemesDelTextColors[0],
        "--page-shadow-markbgcolor": themeConfig.markBackgroundColor || defaultThemesMarkBgColors[0],
        "--page-shadow-marktxtcolor": themeConfig.markTxtColor || defaultThemesMarkTextColors[0],
        "--page-shadow-imgbgcolor": themeConfig.imageBackgroundColor || defaultThemesImgBgColors[0],
        "--page-shadow-customfontfamily": themeConfig.fontFamily || "default",
        "--page-shadow-brightcolorxtwhite": themeConfig.brightColorTextWhite || defaultThemesBrightColorTextWhite[0],
        "--page-shadow-brightcolortxtblack": themeConfig.brightColorTextBlack || defaultThemesBrightColorTextBlack[0]
    };

    return style.replace(/var\((--page-shadow-[a-zA-Z-]+)\)/g, (match, varName) => {
        return colorMap[varName] || match;
    });
}

function processRulesInvert(parentElement, style, settings, enablePreserveColorsSelectiveInvert) {
    if(!style.sheet) return;

    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const enabled = settings.colorInvert;
    const invertEntirePage = settings.invertEntirePage;

    let invertImageColors = settings.invertImageColors;
    let invertVideoColors = settings.invertVideoColors;
    let invertBgColors = settings.invertBgColor;
    let selectiveInvert = settings.selectiveInvert;
    let invertBrightColors = settings.invertBrightColors;

    let percentageAttenuateColors = settings.percentageAttenuateColors;

    if(percentageAttenuateColors / 100 > 1 || percentageAttenuateColors / 100 < 0 || typeof percentageAttenuateColors === "undefined" || percentageAttenuateColors == null) {
        percentageAttenuateColors = attenuateDefaultValue;
    }

    const attenuateEnabled = settings.attenuateColors;
    const attenuateImageColors = settings.attenuateImgColors;
    const attenuateBgColors = settings.attenuateBgColors;
    const attenuateVideoColors = settings.attenuateVideoColors;
    const attenuateBrightColors = settings.attenuateBrightColors;

    let invertImageFilter = "invert(100%)";
    let invertImageFilterSelective = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
    let invertBgFilter = "invert(100%)";
    let invertBgFilterSelective = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
    let invertVideoFilter = "invert(100%)";
    let invertVideoFilterSelective = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
    let invertBrightColorsFilter = "invert(100%)";

    if(invertEntirePage === "true") {
        if(selectiveInvert === "true") {
            invertImageFilterSelective = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
            invertBgFilterSelective = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
            invertVideoFilterSelective = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
        } else {
            invertImageFilterSelective = "invert(100%)";
            invertBgFilterSelective = "invert(100%)";
            invertVideoFilterSelective = "invert(100%)";
        }
    }

    if(attenuateEnabled == "true" && attenuateImageColors == "true") {
        invertImageFilter = invertImageFilter + " grayscale(" + percentageAttenuateColors + "%)";
        invertImageFilterSelective = invertImageFilterSelective + " grayscale(" + percentageAttenuateColors + "%)";
    }

    if(attenuateEnabled == "true" && attenuateBgColors == "true") {
        invertBgFilter = invertBgFilter + " grayscale(" + percentageAttenuateColors + "%)";
        invertBgFilterSelective = invertBgFilterSelective + " grayscale(" + percentageAttenuateColors + "%)";
    }

    if(attenuateEnabled == "true" && attenuateVideoColors == "true") {
        invertVideoFilter = invertVideoFilter + " grayscale(" + percentageAttenuateColors + "%)";
        invertVideoFilterSelective = invertVideoFilterSelective + " grayscale(" + percentageAttenuateColors + "%)";
    }

    if(attenuateEnabled == "true" && attenuateBrightColors == "true") {
        invertBrightColorsFilter = invertBrightColorsFilter + " grayscale(" + percentageAttenuateColors + "%)";
    }

    const closestBrightColorBackground = parentElement && parentElement.closest && parentElement.closest(".pageShadowHasBrightColorBackground");
    const parentHasBrightColorBackground = parentElement && (parentElement.classList.contains("pageShadowHasBrightColorBackground") || (closestBrightColorBackground != null && closestBrightColorBackground != document.body));
    const parentHasBrightColorText = parentElement && parentElement.classList.contains("pageShadowHasBrightColorText");

    // Conditions are inverted if inverting entire page
    if(invertEntirePage == "true") {
        invertImageColors = invertImageColors == "false" ? "true" : "false";
        invertVideoColors = invertVideoColors == "false" ? "true" : "false";
        invertBgColors = invertBgColors == "false" ? "true" : "false";
        invertBrightColors = invertBrightColors == "false" ? "true" : "false";
        selectiveInvert = selectiveInvert == "false" ? "true" : "false";
    }

    const shouldInvertBrightColors = invertBrightColors != "true" || (invertBrightColors == "true" && !parentHasBrightColorText && !parentHasBrightColorBackground);

    if(enabled == "true") {
        if(invertEntirePage == "true") {
            style.sheet.insertRule(":host .pageShadowDisableElementInvert { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host .pageShadowDisableElementInvert > * { filter: invert(0%) !important; -moz-filter: invert(0%) !important; -o-filter: invert(0%) !important; -webkit-filter: invert(0%) !important; }");

            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host iframe, :host frame { filter: invert(0%) !important; -moz-filter: invert(0%) !important; -o-filter: invert(0%) !important; -webkit-filter: invert(0%) !important; }");
            }
        }

        if(invertBrightColors == "true") {
            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg):not(:has(> .pageShadowHasBackgroundImg)) > *:not(.pageShadowHasBrightColorText):not(.pageShadowHasBrightColorBackground):not(.pageShadowSelectiveInvert) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");

                style.sheet.insertRule(":host .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg):has(> .pageShadowHasBackgroundImg) > *:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBackgroundImg):not(.pageShadowSelectiveInvert) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                if(shouldInvertBrightColors) {
                    style.sheet.insertRule(":host > .pageShadowHasBrightColorBackground:not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg), :host > .pageShadowHasBrightColorText { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(!parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) .pageShadowHasBrightColorBackground:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(!parentHasBrightColorText) {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:has(> .pageShadowHasBackgroundImg)) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }
            } else if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host > .pageShadowHasBrightColorBackground:not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg), :host > .pageShadowHasBrightColorText:not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText) .pageShadowHasBrightColorBackground:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText) .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(body.pageShadowInvertBgColor .pageShadowHasBackgroundImg > *):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg):not(:has(> .pageShadowHasBackgroundImg)) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
            }
        }

        if(invertImageColors == "true") {
            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *) use[href^=\"#\"], :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *) { filter: " + invertImageFilter + " !important; -moz-filter: " + invertImageFilter + " !important; -o-filter: " + invertImageFilter + " !important; -webkit-filter: " + invertImageFilter + " !important; background-color: transparent !important; }");
            }

            if(selectiveInvert == "true" && shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; background-color: transparent !important; }");
            }

            if(invertEntirePage == "true" && shouldInvertBrightColors) {
                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground) > * img { filter: " + invertImageFilter + " !important; -moz-filter: " + invertImageFilter + " !important; -o-filter: " + invertImageFilter + " !important; -webkit-filter: " + invertImageFilter + " !important; background-color: transparent !important; }");
            }
        }

        if(invertBrightColors == "true") {
            if(parentHasBrightColorBackground) {
                if(invertImageColors != "true") {
                    style.sheet.insertRule(":host img:not(.pageShadowHasBrightColorBackground), :host svg:not(.pageShadowHasBrightColorBackground), :host .pageShadowInvertElementAsImage:not(.pageShadowHasBrightColorBackground) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(invertBgColors != "true") {
                    style.sheet.insertRule(":host .pageShadowHasBackgroundImg:not(.pageShadowHasBrightColorBackground), :host .pageShadowInvertElementAsBackground:not(.pageShadowHasBrightColorBackground) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(invertVideoColors != "true") {
                    style.sheet.insertRule(":host video:not(.pageShadowHasBrightColorBackground), :host canvas:not(.pageShadowHasBrightColorBackground), :host .pageShadowInvertElementAsVideo:not(.pageShadowHasBrightColorBackground) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(invertEntirePage != "true") {
                    style.sheet.insertRule(":host iframe, :host frame { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) .pageShadowPseudoElementHasBrightColorBackgroundBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBrightColorBackgroundAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):after, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBrightColorTextBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBrightColorTextAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):after { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
            }
        }

        if((invertEntirePage != "true" && selectiveInvert == "true") || (invertEntirePage == "true" && selectiveInvert != "true" && !parentHasBrightColorBackground)) {
            // Image selective invert
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; }");

            style.sheet.insertRule(":host .pageShadowHasBrightColorText:not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) > img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host .pageShadowHasBrightColorText:not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) > svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host .pageShadowHasBrightColorText:not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) > .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; }");

            // Background images selective invert
            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo) { filter: " + invertBgFilterSelective + " !important; -moz-filter: " + invertBgFilterSelective + " !important; -o-filter: " + invertBgFilterSelective + " !important; -webkit-filter: " + invertBgFilterSelective + " !important; }");
        }

        if(selectiveInvert == "true") {
            // Pseudo-elements selective invert
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert) .pageShadowSelectiveInvertPseudoElementBefore:not(.pageShadowDisableElementInvert):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert) .pageShadowSelectiveInvertPseudoElementAfter:not(.pageShadowDisableElementInvert):after { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; }");

            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > svg.pageShadowSelectiveInvert:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(body.pageShadowInvertBrightColors .pageShadowHasBrightColorBackground *):not(.pageShadowDisableBackgroundStyling) { color: black; }");

            // Background images selective invert (subelements)
            if(!parentHasBrightColorBackground) {
                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo) > * { filter: " + invertBgFilterSelective + " !important; -moz-filter: " + invertBgFilterSelective + " !important; -o-filter: " + invertBgFilterSelective + " !important; -webkit-filter: " + invertBgFilterSelective + " !important; }");
            }
        }

        if(invertBgColors == "true") {
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertPseudoElement:not(.pageShadowDisableElementInvert):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertPseudoElement:not(.pageShadowDisableElementInvert):after { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) > * { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

            if(invertEntirePage != "true") {
                if(parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");
                }
            } else {
                if(!parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowDisableElementInvert) .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");
                }

                if(invertBrightColors == "true" && !parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host .pageShadowHasBrightColorText > *:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(body.pageShadowInvertBrightColors .pageShadowHasBrightColorBackground *):not(.pageShadowDisableBackgroundStyling) { color: black; }");
                }
            }

            if(!parentHasBrightColorBackground) {
                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground):not(select):not(.pageShadowHasBrightColorText):not(.pageShadowDisableBackgroundStyling) { color: white; }");

                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) *:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(.pageShadowDisableBackgroundStyling) { color: black; }");
            }

            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowDisableElementInvert) .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground) > * { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBackgroundImgBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowSelectiveInvertPseudoElementBefore):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBackgroundImgAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowSelectiveInvertPseudoElementAfter):after { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");
            }
        }

        if(invertVideoColors == "true") {
            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host > video:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host > canvas:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host > .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) { filter: " + invertVideoFilter + " !important; -moz-filter: " + invertVideoFilter + " !important; -o-filter: " + invertVideoFilter + " !important; -webkit-filter: " + invertVideoFilter + " !important; }");

                if(selectiveInvert != "true") {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert) { filter: " + invertVideoFilter + " !important; -moz-filter: " + invertVideoFilter + " !important; -o-filter: " + invertVideoFilter + " !important; -webkit-filter: " + invertVideoFilter + " !important; }");
                } else {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertVideoFilterSelective + " !important; -moz-filter: " + invertVideoFilterSelective + " !important; -o-filter: " + invertVideoFilterSelective + " !important; -webkit-filter: " + invertVideoFilterSelective + " !important; }");
                }
            }
        }
    }
}

function processRulesAttenuate(style, settings) {
    if(!style.sheet) return;

    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const enabled = settings.attenuateColors;
    const attenuateImageColors = settings.attenuateImgColors;
    const attenuateBgColors = settings.attenuateBgColors;
    const attenuateVideoColors = settings.attenuateVideoColors;
    const attenuateBrightColors = settings.attenuateBrightColors;

    const enabledInvertPage = settings.colorInvert;
    const invertEntirePage = settings.invertEntirePage;
    const invertImageColors = settings.invertImageColors;
    const invertVideoColors = settings.invertVideoColors;
    const invertBgColors = settings.invertBgColor;
    const invertBrightColors = settings.invertBrightColors;

    let percentageAttenuateColors = settings.percentageAttenuateColors;

    if(percentageAttenuateColors / 100 > 1 || percentageAttenuateColors / 100 < 0 || typeof percentageAttenuateColors === "undefined" || percentageAttenuateColors == null) {
        percentageAttenuateColors = attenuateDefaultValue;
    }

    const attenuateFilter = "grayscale(" + percentageAttenuateColors + "%)";

    if(enabled == "true") {
        if(attenuateImageColors == "true") {
            if(enabledInvertPage == "true" && invertImageColors != "true") {
                style.sheet.insertRule(":host img:not(.pageShadowDisableElementInvert), :host svg:not(.pageShadowDisableElementInvert) { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host img.pageShadowDisableElementInvert, :host svg.pageShadowDisableElementInvert { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host img.pageShadowDisableElementInvert, :host svg.pageShadowDisableElementInvert { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }

        if(attenuateBgColors == "true") {
            if(enabledInvertPage == "true" && invertBgColors != "true") {
                style.sheet.insertRule(":host .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert), :host .pageShadowPseudoElementHasBackgroundImgBefore:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvertPseudoElementBefore):before, :host .pageShadowPseudoElementHasBackgroundImgAfter:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvertPseudoElementAfter):after { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host .pageShadowHasBackgroundImg.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBackgroundImgBefore.pageShadowDisableElementInvert:before, :host .pageShadowPseudoElementHasBackgroundImgAfter.pageShadowDisableElementInvert:after { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host .pageShadowHasBackgroundImg.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBackgroundImgBefore.pageShadowDisableElementInvert:before, :host .pageShadowPseudoElementHasBackgroundImgAfter.pageShadowDisableElementInvert:after { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }

        if(attenuateVideoColors == "true") {
            if(enabledInvertPage == "true" && invertVideoColors != "true") {
                style.sheet.insertRule(":host video:not(.pageShadowDisableElementInvert), :host canvas:not(.pageShadowDisableElementInvert) { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host video.pageShadowDisableElementInvert, :host canvas.pageShadowDisableElementInvert { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host video.pageShadowDisableElementInvert, :host canvas.pageShadowDisableElementInvert { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }

        if(attenuateBrightColors == "true") {
            if(enabledInvertPage == "true" && invertBrightColors != "true") {
                style.sheet.insertRule(":host .pageShadowHasBrightColorBackground:not(.pageShadowDisableElementInvert), :host .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert), :host .pageShadowPseudoElementHasBrightColorBackgroundAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorTextAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorBackgroundBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):before, :host .pageShadowPseudoElementHasBrightColorTextBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):before { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host .pageShadowHasBrightColorBackground.pageShadowDisableElementInvert, :host .pageShadowHasBrightColorText.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBrightColorBackground.pageShadowDisableElementInvertAfter:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorText.pageShadowDisableElementInvertAfter:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorBackgroundBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before, :host .pageShadowPseudoElementHasBrightColorTextBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host .pageShadowHasBrightColorBackground.pageShadowDisableElementInvert, :host .pageShadowHasBrightColorText.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBrightColorBackgroundAfter.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorTextAfter.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorBackgroundBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before, :host .pageShadowPseudoElementHasBrightColorTextBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }
    }
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

async function getAutoEnableSavedData() {
    const result = await browser.storage.local.get(["autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat"]);

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

    return [autoEnable, format, hourEnableFormat, hourDisableFormat, minuteEnable, minuteDisable, hourEnable, hourDisable];
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

async function loadPresetSelect(selectId, i18next) {
    const selectElement = document.getElementById(selectId);

    let presetSelected = selectElement.value;

    if(!presetSelected) {
        presetSelected = "1";
    }

    let optionTitle = "";

    for(let i = 1; i <= nbPresets; i++) {
        const preset = await getPresetData(i);

        if(!preset || !Object.prototype.hasOwnProperty.call(preset, "name")) {
            optionTitle += `<option value="${i}">${i18next.t("modal.archive.presetTitle")}${i} : ${i18next.t("modal.archive.presetEmpty")}</option>`;
        } else {
            const presetName = preset["name"].trim() === ""
                ? i18next.t("modal.archive.presetTitleEmpty")
                : preset["name"].substring(0, 50);

            const element = document.createElement("div");
            element.textContent = presetName;

            optionTitle += `<option value="${i}">${i18next.t("modal.archive.presetTitle")}${i} : ${element.innerHTML}</option>`;
        }
    }

    selectElement.innerHTML = optionTitle;

    if(Array.from(selectElement.options).some(option => option.value === presetSelected)) {
        selectElement.value = presetSelected;
    } else {
        selectElement.value = selectElement.options[0]?.value || "1";
    }
}

async function presetsEnabled() {
    const data = await browser.storage.local.get("presets");

    try {
        let presets;

        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
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

        return listPreset;
    } catch(e) {
        debugLogger.log(e, "error");
        throw "";
    }
}

async function loadPreset(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const data = await browser.storage.local.get("presets");

    try {
        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
            return "empty";
        }

        const preset = await getPresetData(nb);

        if(!preset) {
            return "empty";
        }

        let settingsRestored = 0;

        const settingsNames = JSON.parse(JSON.stringify(settingsToSavePresets));
        settingsNames.push("nightModeEnabled");
        settingsNames.push("attenuateImageColor");

        const finalRestoreObject = {};

        for(const key of settingsNames) {
            if(typeof(key) === "string") {
                if(Object.prototype.hasOwnProperty.call(preset, key)) {
                    if(key && settingsNames.indexOf(key) !== -1) {
                        finalRestoreObject[key] = preset[key];
                    }

                    settingsRestored++;
                } else {
                    finalRestoreObject[key] = defaultSettings[key];
                }
            }
        }

        await browser.storage.local.set(finalRestoreObject);
        await migrateSettings();
        sendMessageWithPromise({ "type": "updateSettingsCache" });
        sendMessageWithPromise({ "type": "updatePresetCache" });

        if(settingsRestored > 0) {
            return "success";
        } else {
            return "empty";
        }
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function getPresetData(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const data = await browser.storage.local.get("presets");

    try {
        let presets;

        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
        } else {
            presets = data.presets;
        }

        const namePreset = nb;
        const preset = presets[namePreset];

        if(!preset || Object.keys(preset).length <= 0) {
            return preset;
        }

        const settingsNames = JSON.parse(JSON.stringify(settingsToSavePresets));

        // Migrate Invert bright colors
        if (!preset["invertBrightColors"] && preset["invertEntirePage"] == "true") {
            preset["invertBrightColors"] = "true";
        }

        for(const key of settingsNames) {
            if(typeof(key) === "string") {
                if(!Object.prototype.hasOwnProperty.call(preset, key)) {
                    preset[key] = defaultSettings[key];
                }
            }
        }

        // Migrate Night mode filter
        if(preset["nightModeEnabled"] && preset["pageLumEnabled"] && preset["nightModeEnabled"] == "true" && preset["pageLumEnabled"] == "true") {
            preset["pageLumEnabled"] = "false";
            preset["blueLightReductionEnabled"] = "true";
            preset["percentageBlueLightReduction"] = preset["pourcentageLum"];
            preset["nightModeEnabled"] = undefined;
        }

        // Migrate Attenuate image color
        if(preset["attenuateImageColor"] == "true") {
            preset["attenuateColors"] = "true";
            preset["attenuateImgColors"] = "true";
            preset["attenuateBgColors"] = "true";
            preset["attenuateImageColor"] = undefined;
        }

        return preset;
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function savePreset(nb, name, websiteListToApply, saveNewSettings) {
    const dataPreset = await browser.storage.local.get("presets");
    const data = await browser.storage.local.get(settingsToSavePresets);

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

            preset[namePreset]["nightModeEnabled"] = false;
            preset[namePreset]["attenuateImageColor"] = false;
        }

        await setSettingItem("presets", preset);

        return "success";
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function deletePreset(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const dataPreset = await browser.storage.local.get("presets");

    try {
        let presets;

        if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
            presets = defaultPresets;
        } else {
            presets = dataPreset.presets;
        }

        const preset = presets;
        preset[nb] = {};

        await setSettingItem("presets", preset);

        return "success";
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function presetsEnabledForWebsite(url, disableCache) {
    let allPresetData;

    if(!disableCache) { // Get preset with cache
        const response = await sendMessageWithPromise({ "type": "getAllPresets" }, "getAllPresetsResponse");
        allPresetData = response.data;
    }

    return presetsEnabledForWebsiteWithData(url, allPresetData);
}

async function presetsEnabledForWebsiteWithData(url, allPresetData) {
    const presetListEnabled = [];

    if(url && url.trim() != "") {
        for(let i = 1; i <= nbPresets; i++) {
            let presetData;

            if(!allPresetData) {
                presetData = await getPresetData(i);
            } else {
                presetData = allPresetData[i];
            }

            if(presetData) {
                const websiteSettings = presetData.websiteListToApply;
                let websiteList = [];

                if(websiteSettings !== undefined && websiteSettings !== "") {
                    websiteList = websiteSettings.trim().split("\n");
                }

                let websiteUrlTmp;

                try {
                    websiteUrlTmp = new URL(url);
                } catch(e) {
                    debugLogger.log(e, "error");
                    return;
                }

                const domain = websiteUrlTmp.hostname;
                const autoEnabledWebsite = inArrayWebsite(domain, websiteList);
                const autoEnabledPage = inArrayWebsite(url, websiteList);

                if(autoEnabledWebsite || autoEnabledPage) {
                    presetListEnabled.push({
                        presetNb: i,
                        presetData,
                        autoEnabledWebsite: autoEnabledWebsite,
                        autoEnabledPage: autoEnabledPage
                    });
                }
            }
        }
    }

    return presetListEnabled;
}

function getPriorityPresetEnabledForWebsite(presetsEnabled) {
    // Priority : a preset auto enabled for a page has a higher priority than a preset auto enabled for a webiste
    let presetEnabled = presetsEnabled[0];

    for(let i = 0, len = presetsEnabled.length; i < len; i++) {
        const preset = presetsEnabled[i];

        if((preset.autoEnabledWebsite && !presetEnabled.autoEnabledPage && !presetEnabled.autoEnabledWebsite) || preset.autoEnabledPage) {
            presetEnabled = preset;
        }
    }

    return presetEnabled;
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
        debugLogger.log(e, "error");
        return "error";
    }
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

async function getSettingsToArchive() {
    const data = await browser.storage.local.get(null);

    try {
        data["ispageshadowarchive"] = "true";

        // Remove filter content
        const filters = data["filtersSettings"];

        filters.filters.forEach(filter => {
            filter.content = null;
            filter.lastUpdated = 0;
        });

        const dataStr = JSON.stringify(data);
        return dataStr;
    } catch(e) {
        debugLogger.log(e, "error");
        throw "";
    }
}

async function archiveCloud() {
    if (typeof browser.storage !== "undefined" && typeof browser.storage.sync !== "undefined") {
        try {
            const dataStr = await getSettingsToArchive();
            const dataObj = JSON.parse(dataStr);
            const currentStorage = await getCurrentArchiveCloud();

            const dateSettings = { "dateLastBackup": Date.now().toString() };
            const deviceSettings = { "deviceBackup": navigator.platform };

            const settingToSave = prepareDataForArchiveCloud(dataObj);

            try {
                await browser.storage.sync.clear();
                await browser.storage.sync.set(settingToSave);
            } catch(e) {
                // In case of error, restore the old cloud archive data
                await browser.storage.sync.clear();
                await browser.storage.sync.set(prepareDataForArchiveCloud(currentStorage));

                debugLogger.log(e, "error");

                if (e && (e.message.indexOf("QUOTA_BYTES_PER_ITEM") !== -1 || e.message.indexOf("QUOTA_BYTES") !== -1 || e.message.indexOf("QuotaExceededError") !== -1)) {
                    throw new Error("quota");
                } else {
                    throw new Error("standard");
                }
            }

            try {
                await Promise.all([
                    browser.storage.sync.set(dateSettings),
                    browser.storage.sync.set(deviceSettings),
                    browser.storage.sync.remove("pageShadowStorageBackup")
                ]);
            } catch(e) {
                debugLogger.log(e, "error");
                throw new Error("standard");
            }

            return;
        } catch(e) {
            debugLogger.log(e, "error");
            throw new Error(e.message);
        }
    } else {
        throw new Error("Browser storage is not supported");
    }
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

function lengthInUtf8Bytes(str) {
    return new TextEncoder().encode(str).length;
}

function prepareDataForArchiveCloud(dataObj) {
    const settingToSave = {};

    for (const key in dataObj) {
        if (typeof key === "string" && Object.prototype.hasOwnProperty.call(dataObj, key)) {
            const value = dataObj[key];
            const valueSizeByte = lengthInUtf8Bytes(JSON.stringify(value));

            if (valueSizeByte > browser.storage.sync.QUOTA_BYTES_PER_ITEM - quotaBytesPerItemMargin) {
                const [type, chunks] = chunkValue(key, value);

                for (let i = 0; i < chunks.length; i++) {
                    settingToSave[`${key}_${i}_${type}`] = chunks[i];
                }
            } else {
                settingToSave[key] = value;
            }
        }
    }

    return settingToSave;
}

async function getCurrentArchiveCloud() {
    const dataSync = await browser.storage.sync.get(null);
    const restoredData = {};

    if (dataSync !== undefined) {
        Object.keys(dataSync).forEach(key => {
            if(key.includes("_")) {
                const originalKey = key.split("_")[0];
                const index = key.split("_")[1];
                const type = key.split("_")[2] || "string";

                if (!Array.isArray(restoredData[originalKey])) {
                    restoredData[originalKey] = [];
                }

                restoredData[originalKey][parseInt(index)] = {
                    data: dataSync[key],
                    type
                };
            } else {
                restoredData[key] = dataSync[key];
            }
        });

        Object.keys(restoredData).forEach(key => {
            const valueChunks = restoredData[key];

            if(Array.isArray(valueChunks)) {
                const sortedIndices = Object.keys(valueChunks).sort((a, b) => parseInt(a) - parseInt(b));
                const type = restoredData[key][0].type;

                if(type === "string") {
                    restoredData[key] = sortedIndices.map(index => valueChunks[index].data).join("");
                } else {
                    const data = sortedIndices.map(index => valueChunks[index].data).join("");
                    restoredData[key] = JSON.parse(data);
                }
            }
        });
    }

    return restoredData;
}

function chunkString(key, str, type) {
    const chunks = [];
    const maxBytesPerItem = browser.storage.sync.QUOTA_BYTES_PER_ITEM - quotaBytesPerItemMargin;

    let i = 0;

    while (str.length > 0) {
        const finalKey = `${key}_${i++}_${type}`;
        const maxValueBytes = maxBytesPerItem - lengthInUtf8Bytes(finalKey);

        let counter = maxValueBytes;
        let segment = str.substr(0, counter);

        while (lengthInUtf8Bytes(JSON.stringify(segment)) > maxValueBytes) {
            segment = str.substr(0, --counter);
        }

        chunks.push(segment);
        str = str.substr(counter);
    }

    return chunks;
}

function chunkValue(key, value) {
    if(typeof value === "string") {
        return ["string", chunkString(key, value, "string")];
    } else if(typeof value === "object") {
        const valueString = JSON.stringify(value);
        return ["object", chunkString(key, valueString, "object")];
    } else {
        throw new Error("Unsupported data type");
    }
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

function rgb2hsl(r, g, b) {
    const v = Math.max(r, g, b), c = v - Math.min(r, g, b), f = (1 - Math.abs(v + v - c - 1));
    const h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));

    return [60 * (h < 0 ? h + 6 : h), f ? c / f : 0, (v + v - c) / 2];
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
        return getImageUrlFromSvgElement(element, computedStyles);
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

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

    const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    const result = regex.exec(hex);

    if(!result) {
        return "";
    }

    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
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

export { inArray, strictInArray, matchWebsite, inArrayWebsite, disableEnableToggle, removeA, commentMatched, commentAllLines, pageShadowAllowed, getUImessage, customTheme, hourToPeriodFormat, checkNumber, getAutoEnableSavedData, getAutoEnableFormData, checkAutoEnableStartup, checkChangedStorageData, getBrowser, downloadData, loadPresetSelect, presetsEnabled, loadPreset, savePreset, deletePreset, getSettings, getPresetData, getCurrentURL, presetsEnabledForWebsite, disableEnablePreset, convertBytes, getSizeObject, normalizeURL, getPriorityPresetEnabledForWebsite, hasSettingsChanged, processShadowRootStyle, processRules, removeClass, addClass, processRulesInvert, isRunningInPopup, isRunningInIframe, toggleTheme, isInterfaceDarkTheme, loadWebsiteSpecialFiltersConfig, getSettingsToArchive, archiveCloud, sendMessageWithPromise, addNewStyleAttribute, applyContrastPageVariables, applyContrastPageVariablesWithTheme, getCustomThemeConfig, rgb2hsl, isAutoEnable, sha256, checkPermissions, getPageVariablesToApply, areAllCSSVariablesDefinedForHTMLElement, svgElementToImage, backgroundImageToImage, chunkValue, getCurrentArchiveCloud, removeStyleAttribute, isCrossOrigin, processRulesAttenuate, areAllClassesDefinedForHTMLElement, getPageAnalyzerCSSClass, getImageUrlFromElement, hexToRgb, getInvertPageVariablesKeyValues, isValidURL, getBlueLightReductionFilterCSSClass };