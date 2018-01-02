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
