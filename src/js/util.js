/* Page Shadow
 *
 * Copyright (C) 2015-2022 Eliastik (eliastiksofts.com)
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
import { setSettingItem, migrateSettings } from "./storage.js";
import browser from "webextension-polyfill";
import { defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingsToSavePresets, nbPresets, defaultPresets, defaultCustomThemes, defaultWebsiteSpecialFiltersConfig } from "./constants.js";

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

// Function to know if the execution of Page Shadow is allowed for a page - return true if allowed, false if not
async function pageShadowAllowed(url) {
    const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"]);

    if(result.globallyEnable !== "false") {
        let forbiddenWebsites = [];

        if(result.sitesInterditPageShadow !== undefined && result.sitesInterditPageShadow !== "") {
            forbiddenWebsites = result.sitesInterditPageShadow.trim().split("\n");
        }

        const websuteUrl_tmp = new URL(url);
        const domain = websuteUrl_tmp.hostname;

        if((result.whiteList == "true" && (in_array_website(domain, forbiddenWebsites) || in_array_website(url, forbiddenWebsites))) || (result.whiteList !== "true" && !in_array_website(domain, forbiddenWebsites) && !in_array_website(url, forbiddenWebsites))) {
            return true;
        }
    }

    return false;
}

function getUImessage(id) {
    return browser.i18n.getMessage(id);
}

async function customTheme(nb, style, disableCustomCSS, lnkCssElement, isShadowRoot) {
    disableCustomCSS = disableCustomCSS == undefined ? false : disableCustomCSS;
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    let customThemes, backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme, fontTheme;

    const result = await browser.storage.local.get("customThemes");

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

    if(!isShadowRoot) {
        if(document.getElementsByTagName("head")[0].contains(style)) { // remove style element
            document.getElementsByTagName("head")[0].removeChild(style);
        }

        // Append style element
        document.getElementsByTagName("head")[0].appendChild(style);
    }

    // Create rules
    processRules(style, backgroundTheme, linksColorTheme, linksVisitedColorTheme, textsColorTheme, fontTheme, isShadowRoot);

    // Custom CSS
    if(!isShadowRoot && !disableCustomCSS && customThemes["customCSSCode"] != undefined && typeof(customThemes["customCSSCode"]) == "string" && customThemes["customCSSCode"].trim() != "") {
        lnkCssElement.setAttribute("rel", "stylesheet");
        lnkCssElement.setAttribute("type", "text/css");
        lnkCssElement.setAttribute("id", "pageShadowCustomCSS");
        lnkCssElement.setAttribute("name", "pageShadowCustomCSS");
        lnkCssElement.setAttribute("href", "data:text/css;charset=UTF-8," + encodeURIComponent(customThemes["customCSSCode"]));
        document.getElementsByTagName("head")[0].appendChild(lnkCssElement);
    }
}

function processRules(style, backgroundTheme, linksColorTheme, linksVisitedColorTheme, textsColorTheme, fontTheme, isShadowRoot) {
    if(!style.sheet) return;
    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const ruleSelector = isShadowRoot ? ":host" : ".pageShadowContrastBlackCustom:not(.pageShadowDisableStyling)";

    if(!isShadowRoot) {
        style.sheet.insertRule("html.pageShadowBackgroundCustom:not(.pageShadowDisableBackgroundStyling) { background: #" + backgroundTheme + " !important; }", 0);
        style.sheet.insertRule("html.pageShadowBackgroundCustom.pageShadowForceCustomLinkColorAsBackground:not(.pageShadowDisableBackgroundStyling) { background: #" + linksColorTheme + " !important; }", 0);
        style.sheet.insertRule("html.pageShadowBackgroundCustom.pageShadowForceCustomLinkVisitedColorAsBackground:not(.pageShadowDisableBackgroundStyling) { background: #" + linksVisitedColorTheme + " !important; }", 0);
        style.sheet.insertRule("html.pageShadowBackgroundCustom.pageShadowForceCustomTextColorAsBackground:not(.pageShadowDisableBackgroundStyling) { background: #" + textsColorTheme + " !important; }", 0);
    }

    style.sheet.insertRule(ruleSelector + ":not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasBackgroundImg) { background: #" + backgroundTheme + " !important; background-image: url(); color: #" + textsColorTheme + "; }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowHasBackgroundImg:not(.pageShadowDisableBackgroundStyling) { background-color: #" + backgroundTheme + " !important; color: #" + textsColorTheme + "; }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowForceCustomLinkColorAsBackground:not(.pageShadowDisableBackgroundStyling) { background: #" + linksColorTheme + " !important; background-image: url(); }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowForceCustomLinkVisitedColorAsBackground:not(.pageShadowDisableBackgroundStyling) { background: #" + linksVisitedColorTheme + " !important; background-image: url(); }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowForceCustomTextColorAsBackground:not(.pageShadowDisableBackgroundStyling) { background: #" + textsColorTheme + " !important; background-image: url(); }", 0);
    style.sheet.insertRule(ruleSelector + " *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasBackgroundImg):not(.pageShadowDisableStyling):not(.pageShadowHasTransparentBackground), " + ruleSelector + " *.pageShadowForceCustomBackgroundColor, " + ruleSelector + " *.pageShadowEnablePseudoElementStyling::after, " + ruleSelector + " *.pageShadowEnablePseudoElementStyling::before { background-color: #" + backgroundTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableColorStyling):not(.pageShadowForceCustomVisitedLinkColor):not(.pageShadowForceCustomLinkColor), " + ruleSelector + " *.pageShadowForceCustomTextColor, " + ruleSelector + " *.pageShadowEnablePseudoElementStyling::after, " + ruleSelector + " *.pageShadowEnablePseudoElementStyling::before { color: #" + textsColorTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " input:not(.pageShadowElementDisabled):not(.pageShadowDisableInputBorderStyling), " + ruleSelector + " textarea:not(.pageShadowElementDisabled):not(.pageShadowDisableInputBorderStyling) { border-color: #" + textsColorTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " input.pageShadowForceInputBorderStyling, " + ruleSelector + " textarea.pageShadowForceInputBorderStyling { border: 1px solid #" + textsColorTheme + " !important; }", 0);
    if(!isShadowRoot) style.sheet.insertRule(ruleSelector + " *:not(.pageShadowElementDisabled):not(.pageShadowDisableFontFamilyStyling), " + ruleSelector + " *.pageShadowForceFontFamilyStyling { font-family: " + fontTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " :not(.pageShadowInvertImageColor) svg:not(.pageShadowElementDisabled):not(.pageShadowDisableColorStyling):not(.pageShadowForceCustomVisitedLinkColor):not(.pageShadowForceCustomLinkColor) { color: #" + textsColorTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " a:not(.pageShadowElementDisabled):not(.pageShadowDisableColorStyling):not(.pageShadowDisableLinkStyling):not(.pageShadowForceCustomVisitedLinkColor):not(.pageShadowForceCustomTextColor), " + ruleSelector + " *.pageShadowForceCustomLinkColor { color: #" + linksColorTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected a:not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowDisableLinkStyling):not(.pageShadowHasTransparentBackground):not(.pageShadowDisableStyling) { background-color: transparent !important; }", 0);
    style.sheet.insertRule(ruleSelector + " img, " + ruleSelector + " video, " + ruleSelector + " canvas { filter: invert(0%); }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected * > *:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground), " + ruleSelector + " *.pageShadowForceCustomBackgroundColor, " + ruleSelector + " *.pageShadowEnablePseudoElementStyling::after, " + ruleSelector + " *.pageShadowEnablePseudoElementStyling::before { background: #" + backgroundTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected > *:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + backgroundTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " a:visited:not(#pageShadowLinkNotVisited):not(.pageShadowElementDisabled):not(.pageShadowDisableLinkStyling):not(.pageShadowDisableColorStyling):not(.pageShadowDisableCustomVisitedLinkColor):not(.pageShadowForceCustomLinkColor):not(.pageShadowForceCustomTextColor), " + ruleSelector + " #pageShadowLinkVisited:not(.pageShadowElementDisabled):not(.pageShadowDisableLinkStyling):not(.pageShadowDisableColorStyling):not(.pageShadowDisableCustomVisitedLinkColor):not(.pageShadowForceCustomLinkColor):not(.pageShadowForceCustomTextColor), " + ruleSelector + " *:visited.pageShadowForceCustomLinkColor, " + ruleSelector + " *.pageShadowForceCustomVisitedLinkColor { color: #" + linksVisitedColorTheme + " !important; }", 0);
    style.sheet.insertRule(ruleSelector + " *.pageShadowForceCustomLinkColorAsBackground:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasBackgroundImg):not(.pageShadowDisableStyling):not(.pageShadowHasTransparentBackground) { background-color: #" + linksColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + " *.pageShadowForceCustomLinkVisitedColorAsBackground:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasBackgroundImg):not(.pageShadowDisableStyling):not(.pageShadowHasTransparentBackground) { background-color: #" + linksVisitedColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + " *.pageShadowForceCustomTextColorAsBackground:not(select):not(ins):not(del):not(mark):not(a):not(img):not(video):not(canvas):not(svg):not(yt-icon):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasBackgroundImg):not(.pageShadowDisableStyling):not(.pageShadowHasTransparentBackground) { background-color: #" + textsColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected * > *.pageShadowForceCustomLinkColorAsBackground:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + linksColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected * > *.pageShadowForceCustomLinkVisitedColorAsBackground:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + linksVisitedColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected * > *.pageShadowForceCustomTextColorAsBackground:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + textsColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected > *.pageShadowForceCustomLinkColorAsBackground:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + linksColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected > *.pageShadowForceCustomLinkVisitedColorAsBackground:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + linksVisitedColorTheme + " !important; }");
    style.sheet.insertRule(ruleSelector + ".pageShadowBackgroundDetected > *.pageShadowForceCustomTextColorAsBackground:not(img):not(video):not(canvas):not(a):not(svg):not(select):not(ins):not(del):not(mark):not(yt-icon):not(.pageShadowHasBackgroundImg):not(.pageShadowHasHiddenElement):not(.pageShadowDisableStyling):not(.pageShadowElementDisabled):not(.pageShadowDisableBackgroundStyling):not(.pageShadowHasTransparentBackground) { background: #" + textsColorTheme + " !important; }");

    if(isShadowRoot) {
        style.sheet.insertRule(":host { color: unset !important; background: unset !important; }");
    }
}

function processRulesInvert(style, enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert) {
    if(!style.sheet) return;
    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    if(enabled == "true") {
        if((invertEntirePage != "true" && invertImageColors == "true") || (invertEntirePage == "true" && invertImageColors != "true")) {
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; background-color: transparent !important; }");

            if(invertEntirePage != "true" && selectiveInvert != "true") {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; background-color: transparent !important; }");
            }

            if(selectiveInvert == "true") {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert),:host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; background-color: transparent !important; }");
            }

            if(invertEntirePage != "true" && selectiveInvert == "true") {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host  :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host  :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; background-color: transparent !important; }");
            }
        }

        if(invertEntirePage == "true") {
            style.sheet.insertRule(":host .pageShadowDisableElementInvert { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host .pageShadowDisableElementInvert > * { filter: invert(0%) !important; -moz-filter: invert(0%) !important; -o-filter: invert(0%) !important; -webkit-filter: invert(0%) !important; }");
        }

        if((invertEntirePage != "true" && invertVideoColors == "true") || (invertEntirePage == "true" && invertVideoColors != "true")) {
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");

            if(invertEntirePage != "true" && selectiveInvert != "true") {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            }

            if(selectiveInvert == "true") {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert),:host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            }

            if(invertEntirePage != "true" && selectiveInvert == "true") {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host  :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host  :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            }
        }

        if((invertEntirePage != "true" && invertBgColors == "true") || (invertEntirePage == "true" && invertBgColors != "true")) {
            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert), :host :not(.pageShadowDisableElementInvert) .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert) > *, :host *:not(.pageShadowDisableElementInvert) > .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) > * { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertPseudoElement:not(.pageShadowDisableElementInvert):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertPseudoElement:not(.pageShadowDisableElementInvert):after { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
        }

        if((invertEntirePage != "true" && selectiveInvert == "true") || (invertEntirePage == "true" && selectiveInvert != "true")) {
            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert):not(img):not(svg):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo) { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert):not(img):not(svg):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo) > * { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert) .pageShadowSelectiveInvertPseudoElement:not(.pageShadowDisableElementInvert):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert) .pageShadowSelectiveInvertPseudoElement:not(.pageShadowDisableElementInvert):after { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
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
        throw "";
    }
}

async function loadPreset(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const data = await browser.storage.local.get("presets");

    try {
        let presets;

        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
            return "empty";
        } else {
            presets = data.presets;
        }

        const namePreset = nb;
        const preset = presets[namePreset];
        let settingsRestored = 0;

        for(const key in preset) {
            if(typeof(key) === "string") {
                if(Object.prototype.hasOwnProperty.call(preset, key) && (settingsToSavePresets.indexOf(key) !== -1 || key == "nightModeEnabled")) {
                    await setSettingItem(key, preset[key]);
                    settingsRestored++;
                }
            }
        }

        await migrateSettings();

        if(settingsRestored > 0) {
            return "success";
        } else {
            return "empty";
        }
    } catch(e) {
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

        return preset;
    } catch(e) {
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
        }

        await setSettingItem("presets", preset);

        return "success";
    } catch(e) {
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
        return "error";
    }
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

async function getSettings(url) {
    const result = await browser.storage.local.get(["sitesInterditPageShadow", "pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertEntirePage", "whiteList", "colorTemp", "globallyEnable", "invertVideoColors", "disableImgBgColor", "invertBgColor", "selectiveInvert", "blueLightReductionEnabled", "percentageBlueLightReduction"]);

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
    let blueLightReductionEnabled = result.blueLightReductionEnabled;
    let percentageBlueLightReduction = result.percentageBlueLightReduction;
    let invertPageColors = result.invertPageColors;
    let disableImgBgColor = result.disableImgBgColor;
    let colorInvert = result.colorInvert;
    let selectiveInvert = result.selectiveInvert;

    // Automatically enable preset ?
    const presetsEnabled = await presetsEnabledForWebsite(url);

    if(presetsEnabled && presetsEnabled.length > 0) {
        const presetEnabled = getPriorityPresetEnabledForWebsite(presetsEnabled);

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
            selectiveInvert = presetData.selectiveInvert;
            blueLightReductionEnabled = presetData.blueLightReductionEnabled;
            percentageBlueLightReduction = presetData.percentageBlueLightReduction;
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

    if(nightModeEnabled == "true" && pageLumEnabled == "true") {
        blueLightReductionEnabled = "true";
        percentageBlueLightReduction = pourcentageLum;
        nightModeEnabled = "false";
    }

    return {
        pageShadowEnabled,
        theme,
        pageLumEnabled,
        pourcentageLum,
        colorInvert,
        invertPageColors,
        invertImageColors,
        invertEntirePage,
        colorTemp,
        globallyEnable: result.globallyEnable,
        invertVideoColors,
        disableImgBgColor,
        invertBgColor,
        selectiveInvert,
        blueLightReductionEnabled,
        percentageBlueLightReduction
    };
}

function hasSettingsChanged(currentSettings, newSettings) {
    if(currentSettings == null) return true;

    for(const settingKey of Object.keys(currentSettings)) {
        if(currentSettings[settingKey] !== newSettings[settingKey]) return true;
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
        url = window.location.href;
    }

    return normalizeURL(url);
}

function processShadowRootStyle(style) {
    let newStyle = style.replaceAll(/body\.pageShadowInvertImageColor.*?/g, ":host(.pageShadowInvertImageColor)");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertBgColor.*?/g, ":host(.pageShadowInvertBgColor)");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertVideoColor.*?/g, ":host(.pageShadowInvertVideoColor)");

    return newStyle;
}

function removeClass(element, ...classes) {
    if(!element) return;

    classes.forEach(c => {
        if(element.classList.contains(c)) {
            element.classList.remove(c);
        }
    });
}

function addClass(element, ...classes) {
    if(!element) return;

    classes.forEach(c => {
        if(!element.classList.contains(c)) {
            element.classList.add(c);
        }
    });
}

function isRunningInPopup() {
    try {
        return window.opener && window.opener !== window;
    } catch(e) {
        return false;
    }
}

function isRunningInIframe() {
    try {
        return window !== window.top;
    } catch(e) {
        return false;
    }
}

async function isInterfaceDarkTheme() {
    const setting = await browser.storage.local.get(["interfaceDarkTheme"]);

    return new Promise(resolve => {
        if (setting.interfaceDarkTheme === "enabled") {
            resolve(true);
        }

        if (!setting.interfaceDarkTheme || setting.interfaceDarkTheme === "auto") {
            if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                resolve(true);
            }
        }

        resolve(false);
    });
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
        });
    }

    return websiteSpecialFiltersConfig;
}

export { in_array, strict_in_array, matchWebsite, in_array_website, disableEnableToggle, removeA, commentMatched, commentAllLines, pageShadowAllowed, getUImessage, customTheme, hourToPeriodFormat, checkNumber, getAutoEnableSavedData, getAutoEnableFormData, checkAutoEnableStartup, checkChangedStorageData, getBrowser, downloadData, loadPresetSelect, presetsEnabled, loadPreset, savePreset, deletePreset, getSettings, getPresetData, getCurrentURL, presetsEnabledForWebsite, disableEnablePreset, convertBytes, getSizeObject, normalizeURL, getPriorityPresetEnabledForWebsite, hasSettingsChanged, processShadowRootStyle, processRules, removeClass, addClass, processRulesInvert, isRunningInPopup, isRunningInIframe, toggleTheme, isInterfaceDarkTheme, loadWebsiteSpecialFiltersConfig };