// Global configuration of the extension
var extensionVersion = "2.1.2";
var nbThemes = 15; // nb of themes for the function Increase the contrast (used globally in the extension)
var colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"]; // color temperatures available for the function Night Mode (used globally in the extension)
var minBrightnessPercentage = 0; // the minimum percentage of brightness
var maxBrightnessPercentage = 0.9; // the maximum percentage of brightness
var brightnessDefaultValue = 0.15; // the default percentage value of brightness
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
