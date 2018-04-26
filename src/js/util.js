/* Page Shadow
 *
 * Copyright (C) 2015-2018 Eliastik (eliastiksofts.com)
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
var extensionVersion = "2.4";
var nbThemes = 15; // nb of themes for the function Increase the contrast (used globally in the extension)
var colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"]; // color temperatures available for the function Night Mode (used globally in the extension)
var minBrightnessPercentage = 0; // the minimum percentage of brightness
var maxBrightnessPercentage = 0.9; // the maximum percentage of brightness
var brightnessDefaultValue = 0.15; // the default percentage value of brightness
var defaultBGColorCustomTheme = "000000";
var defaultTextsColorCustomTheme = "FFFFFF";
var defaultLinksColorCustomTheme = "1E90FF";
var defaultVisitedLinksColorCustomTheme = "ff00ff";
var defaultFontCustomTheme = "";
// End of the global configuration of the extension

function in_array(needle, haystack) {
    var key = '';

    for (key in haystack) {
        if (needle.indexOf(haystack[key]) != -1) {
            return true;
        }
    }

    return false;
}

function strict_in_array(needle, haystack) {
    var key = '';

    for (key in haystack) {
        if (needle == haystack[key]) {
            return true;
        }
    }

    return false;
}

function removeA(arr) {
    var what, a = arguments, L = a.length, ax;

    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }

    return arr;
}

function getUImessage(id) {
    return chrome.i18n.getMessage(id);
}

function customTheme(style, disableCustomCSS, lnkCssElement) {
    var disableCustomCSS = disableCustomCSS || false;

    chrome.storage.local.get(['customThemeBg', 'customThemeTexts', 'customThemeLinks', 'customThemeLinksVisited', 'customThemeFont', 'customCSSCode'], function (result) {
        if(typeof result.customThemeBg !== "undefined" && typeof result.customThemeBg !== null) {
            var backgroundTheme = result.customThemeBg;
        } else {
            var backgroundTheme = defaultBGColorCustomTheme;
        }

        if(typeof result.customThemeTexts !== "undefined" && typeof result.customThemeTexts !== null) {
            var textsColorTheme = result.customThemeTexts;
        } else {
            var textsColorTheme = defaultTextsColorCustomTheme;
        }

        if(typeof result.customThemeLinks !== "undefined" && typeof result.customThemeLinks !== null) {
            var linksColorTheme = result.customThemeLinks;
        } else {
            var linksColorTheme = defaultLinksColorCustomTheme;
        }

        if(typeof result.customThemeLinksVisited !== "undefined" && typeof result.customThemeLinksVisited !== null) {
            var linksVisitedColorTheme = result.customThemeLinksVisited;
        } else {
            var linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
        }

        if(typeof result.customThemeFont !== "undefined" && typeof result.customThemeFont !== null && result.customThemeFont.trim() !== "") {
            var fontTheme = '"' + result.customThemeFont + '"';
        } else {
            var fontTheme = defaultFontCustomTheme;
        }

        if(document.getElementsByTagName('head')[0].contains(style)) { // remove style element
            document.getElementsByTagName('head')[0].removeChild(style);
        }

        // Append style element
        document.getElementsByTagName('head')[0].appendChild(style);

        if(style.cssRules) { // Remove all rules
            for(var i=0; i < style.cssRules.length; i++) {
                style.sheet.deleteRule(i);
            }
        }

        // Create rules
        style.sheet.insertRule(".pageShadowContrastBlackCustom { background: #"+ backgroundTheme +" !important; background-image: url(); }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(svg):not(yt-icon) { background-color: #"+ backgroundTheme +" !important; color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom input { border: 1px solid #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom * {  font-family: " + fontTheme + " !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom :not(.pageShadowInvertImageColor) svg { color: #"+ textsColorTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a { color: #"+ linksColorTheme +" !important; background-color: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom.pageShadowBackgroundDetected *:not(img):not(svg):not(select):not(ins):not(del):not(mark):not(.pageShadowHasBackgroundImg):not(.pageShadowDisableStyling) { background: #"+ backgroundTheme +" !important; }", 0);
        style.sheet.insertRule(".pageShadowContrastBlackCustom a:visited:not(#pageShadowLinkNotVisited), .pageShadowContrastBlackCustom #pageShadowLinkVisited { color: #"+ linksVisitedColorTheme +" !important; }", 0);

        // Custom CSS
        if(disableCustomCSS !== true && typeof result.customCSSCode !== "undefined" && typeof result.customCSSCode !== null && result.customCSSCode.trim() !== "") {
            lnkCssElement.setAttribute('rel', 'stylesheet');
            lnkCssElement.setAttribute('type', 'text/css');
            lnkCssElement.setAttribute('id', 'pageShadowCustomCSS');
            lnkCssElement.setAttribute('name', 'pageShadowCustomCSS');
            lnkCssElement.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(result.customCSSCode));
            document.getElementsByTagName('head')[0].appendChild(lnkCssElement);
        }
    });
}

// Callback function to know if the execution of Page Shadow is allowed for a page - return true if allowed, false if not
function pageShadowAllowed(func) {
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList', 'globallyEnable'], function (result) {
        if(result.globallyEnable !== "false") {
            if(result.sitesInterditPageShadow !== null && typeof(result.sitesInterditPageShadow) !== "undefined" && result.sitesInterditPageShadow !== "") {
                var siteInterdits = result.sitesInterditPageShadow.trim().split("\n");
            } else {
                var siteInterdits = "";
            }

            var websiteUrl = window.location.href;
            var websuteUrl_tmp = new URL(websiteUrl);
            var domain = websuteUrl_tmp.hostname;

            if(result.whiteList == "true" && strict_in_array(domain, siteInterdits) == true || result.whiteList !== "true" && strict_in_array(domain, siteInterdits) !== true && strict_in_array(websiteUrl, siteInterdits) !== true) {
                return func(true);
            } else {
                return func(false);
            }
        } else {
            return func(false);
        }

        return func(false);
    });
}
