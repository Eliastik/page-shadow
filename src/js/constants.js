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
const extensionVersion = "2.8";
const versionDate = new Date(2021, 9, 24);
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
const settingNames = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "sitesInterditPageShadow", "liveSettings", "whiteList", "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "globallyEnable", "customThemeInfoDisable", "autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat", "disableImgBgColor", "defaultLoad", "presets", "customThemes", "filtersSettings", "customFilter", "updateNotification"];
const settingsToSavePresets = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "liveSettings", "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "autoEnable", "disableImgBgColor"];
const nbPresets = 10;
const defaultPresets = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}};
const nbCustomThemesSlots = 5;
const defaultCustomThemes = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}};
const defaultFilters = {
    "filters": [
        {
            "filterName": "Filtre par défaut/Default filter",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/standard.2.8.1.txt",
            "lastUpdated": 0,
            "enabled": true,
            "hasError": false,
            "local": false,
            "homepage": "https://www.eliastiksofts.com/page-shadow/",
            "builtIn": true,
            "expiresIn": 1, // days
            "description": "",
            "version": "0",
            "license": "",
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
            "expiresIn": 1, // days
            "description": "",
            "version": "0",
            "license": "",
            "content": null
        },
        {
            "filterName": "Mode performance/Performance mode",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/performance.txt",
            "lastUpdated": 0,
            "enabled": true,
            "hasError": false,
            "local": false,
            "homepage": "https://www.eliastiksofts.com/page-shadow/",
            "builtIn": true,
            "expiresIn": 1, // days
            "description": "",
            "version": "0",
            "license": "",
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
            "expiresIn": 0,
            "description": "",
            "version": "0",
            "license": "",
            "content": null
        }
    ],
    "lastUpdated": 0,
    "updateInterval": 24 * 60 * 60 * 1000,
    "enableAutoUpdate": true
};
const customFilterGuideURL = "https://www.eliastiksofts.com/page-shadow/filters/guide/";
const regexpDetectionPattern = /^\/(.*)(?<!\\)(.*)\//;
const opacityDetectedAsTransparentThresholdDefault = 0.1;
const availableFilterRulesType = ["disableContrastFor", "forceTransparentBackground", "disableBackgroundStylingFor", "disableTextColorStylingFor", "disableInputBorderStylingFor", "disableLinkStylingFor", "disableFontFamilyStylingFor", "disableElementInvertFor", "hasBackgroundImg", "forceCustomLinkColorFor", "forceCustomBackgroundColorFor", "forceCustomTextColorFor", "disableShadowRootsCustomStyle", "enablePerformanceMode", "disablePerformanceMode", "disableTransparentBackgroundAutoDetect", "enableTransparentBackgroundAutoDetect", "opacityDetectedAsTransparentThreshold", "enableMutationObserversForSubChilds", "disableMutationObserversForSubChilds", "enableMutationObserverAttributes", "enableMutationObserverClass", "disableMutationObserverAttributes", "disableMutationObserverClass", "enableMutationObserverStyle", "disableMutationObserverStyle"];
const specialFilterRules = ["enablePerformanceMode", "disablePerformanceMode", "disableTransparentBackgroundAutoDetect", "enableTransparentBackgroundAutoDetect", "opacityDetectedAsTransparentThreshold", "enableMutationObserversForSubChilds", "disableMutationObserversForSubChilds", "enableMutationObserverAttributes", "enableMutationObserverClass", "enableMutationObserverStyle", "disableMutationObserverAttributes", "disableMutationObserverClass", "disableMutationObserverStyle"];
const ruleCategory = {
    STANDARD_RULES: "STANDARD_RULES",
    SPECIAL_RULES: "SPECIAL_RULES"
};
const filterSyntaxErrorTypes = {
    "NO_TYPE": "NO_TYPE",
    "NO_FILTER": "NO_FILTER",
    "UNKNOWN_TYPE": "UNKNOWN_TYPE",
    "INCORRECT_REGEXP": "INCORRECT_REGEXP",
    "WRONG_CSS_SELECTOR": "WRONG_CSS_SELECTOR",
    "EMPTY": "EMPTY"
};
const defaultWebsiteSpecialFiltersConfig = {
    performanceModeEnabled: false,
    autoDetectTransparentBackgroundEnabled: true,
    enableMutationObserversForSubChilds: true,
    opacityDetectedAsTransparentThreshold: opacityDetectedAsTransparentThresholdDefault,
    enableMutationObserverAttributes: true,
    enableMutationObserverStyle: true,
    enableMutationObserverClass: false
};

export { extensionVersion, versionDate, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingNames, settingsToSavePresets, nbPresets, defaultPresets, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, customFilterGuideURL, regexpDetectionPattern, availableFilterRulesType, filterSyntaxErrorTypes, specialFilterRules, ruleCategory, opacityDetectedAsTransparentThresholdDefault, defaultWebsiteSpecialFiltersConfig };