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
const extensionVersion = "2.10.4";
const versionDate = new Date(2024, 5, 9);
const nbThemes = 16; // nb of themes for the function Increase the contrast (used globally in the extension)
const colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"]; // color temperatures available for the function Night Mode (used globally in the extension)
const minBrightnessPercentage = 0; // the minimum percentage of brightness
const maxBrightnessPercentage = 0.9; // the maximum percentage of brightness
const brightnessDefaultValue = 0.15; // the default percentage value of brightness
const percentageBlueLightDefaultValue = 0.25;
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
const archiveInfoShowInterval = 7; // 7 days
// Settings keys
const customThemesKey = "customThemes";
const disabledWebsitesKey = "sitesInterditPageShadow";
const whitelistKey = "whiteList";
const settingNames = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", disabledWebsitesKey, "liveSettings", whitelistKey, "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "globallyEnable", "customThemeInfoDisable", "autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat", "disableImgBgColor", "defaultLoad", "presets", customThemesKey, "filtersSettings", "customFilter", "updateNotification", "selectiveInvert", "interfaceDarkTheme", "popupTheme", "advancedOptionsFiltersSettings", "blueLightReductionEnabled", "percentageBlueLightReduction", "nightModeEnabled", "archiveInfoLastShowed", "archiveInfoDisable", "autoBackupCloudInterval", "lastAutoBackupCloud", "lastAutoBackupFailed", "attenuateImageColor", "brightColorPreservation", "disableRightClickMenu", "increaseContrastInformationShowed", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors",  "attenuateBrightColors", "attenuateColors", "permissionsInfoDisable", "lastAutoBackupFailedDate", "lastAutoBackupFailedLastShowed"];
const settingsToSavePresets = ["pageShadowEnabled", "theme", "disableImgBgColor", "brightColorPreservation", "pageLumEnabled", "pourcentageLum", "blueLightReductionEnabled", "percentageBlueLightReduction", "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "selectiveInvert", "attenuateImageColor", "autoEnable", "liveSettings", "attenuateColors", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors",  "attenuateBrightColors"];
const settingsToLoad = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "colorTemp", "globallyEnable", "invertVideoColors", "disableImgBgColor", "invertBgColor", "selectiveInvert", "blueLightReductionEnabled", "percentageBlueLightReduction", "attenuateImageColor", "brightColorPreservation", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors",  "attenuateBrightColors", "attenuateColors"];
const pageShadowClassListsMutationsIgnore = ["pageShadowHasBackgroundImg", "pageShadowHasTransparentBackground", "pageShadowHasBrightColorBackground", "pageShadowBrightColorWithBlackText", "pageShadowBrightColorWithWhiteText", "pageShadowBackgroundDetected"];
const nbPresets = 10;
const defaultPresets = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}};
const nbCustomThemesSlots = 5;
const defaultCustomThemes = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
// Default filters object
const defaultFilters = {
    "filters": [
        {
            "filterName": "Filtre par défaut/Default filter",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/standard.2.9.txt",
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
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/performance.2.9.1.txt",
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
            "filterName": "Mode performance ultra/Ultra performance mode",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/ultra.performance.txt",
            "lastUpdated": 0,
            "enabled": false,
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
            "filterName": "Filtre expérimental/Experimental filter",
            "sourceName": "Eliastik's Softs",
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/experimental.txt",
            "lastUpdated": 0,
            "enabled": false,
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
    "enableAutoUpdate": true,
    "lastFailedUpdate": -1
};
const customFilterGuideURL = "https://www.eliastiksofts.com/page-shadow/filters/guide/2.10.4.php";
const regexpDetectionPattern = /^((.*)\/(?:[^\\]|\\.)*?\/)(\|)/;
const regexpDetectionPatternHighlight = /^(\/(?:[^\\]|\\.)*?\/)(\|)/;
const opacityDetectedAsTransparentThresholdDefault = 0.1;
const availableFilterRulesType = ["disableContrastFor", "forceTransparentBackground", "disableBackgroundStylingFor", "disableTextColorStylingFor", "disableInputBorderStylingFor", "disableLinkStylingFor", "disableFontFamilyStylingFor", "disableElementInvertFor", "hasBackgroundImg", "forceCustomLinkColorFor", "forceCustomBackgroundColorFor", "forceCustomTextColorFor", "disableShadowRootsCustomStyle", "enablePerformanceMode", "disablePerformanceMode", "disableTransparentBackgroundAutoDetect", "enableTransparentBackgroundAutoDetect", "opacityDetectedAsTransparentThreshold", "enableMutationObserversForSubChilds", "disableMutationObserversForSubChilds", "enableMutationObserverAttributes", "enableMutationObserverClass", "disableMutationObserverAttributes", "disableMutationObserverClass", "enableMutationObserverStyle", "disableMutationObserverStyle", "forceCustomVisitedLinkColor", "disableCustomVisitedLinkColor", "forceFontFamilyStylingFor", "forceInputBorderStylingFor", "forceCustomLinkColorAsBackground", "forceCustomTextColorAsBackground", "forceCustomLinkVisitedColorAsBackground", "forceDisableDefaultBackgroundColor", "forceDisableDefaultBackground", "forceDisableDefaultFontColor", "enablePseudoElementsStyling", "enableShadowRootStyleOverride", "disableShadowRootStyleOverride", "overrideShadowRootsCustomStyle", "shadowRootStyleOverrideDelay", "invertElementAsImage", "invertElementAsVideo", "invertElementAsBackground", "enableSelectiveInvert", "enablePseudoElementSelectiveInvert", "invertPseudoElement", "enableThrottleMutationObserverBackgrounds", "disableThrottleMutationObserverBackgrounds", "delayMutationObserverBackgrounds", "disableAutoThrottleMutationObserverBackgrounds", "enableAutoThrottleMutationObserverBackgrounds", "autoThrottleMutationObserverBackgroundsTreshold", "throttledMutationObserverTreatedByCall", "delayApplyMutationObserversSafeTimer", "enableObserveBodyChange", "disableObserveBodyChange", "observeBodyChangeTimerInterval", "enableBrightColorDetection", "disableBrightColorDetection", "brightColorLightnessTresholdMin", "brightColorLightnessTresholdMax", "preserveBrightColor", "enableThrottleBackgroundDetection", "disableThrottleBackgroundDetection", "throttleBackgroundDetectionElementsTreatedByCall", "backgroundDetectionStartDelay", "useBackgroundDetectionAlreadyProcessedNodes", "enableBrightColorDetectionSubelement", "disableBrightColorDetectionSubelement", "observeDocumentChange", "observeDocumentChangeTimerInterval", "enableDarkImageDetection", "disableDarkImageDetection", "darkImageDetectionHslTreshold", "darkImageDetectionDarkPixelCountTreshold"];
const specialFilterRules = ["enablePerformanceMode", "disablePerformanceMode", "disableTransparentBackgroundAutoDetect", "enableTransparentBackgroundAutoDetect", "opacityDetectedAsTransparentThreshold", "enableMutationObserversForSubChilds", "disableMutationObserversForSubChilds", "enableMutationObserverAttributes", "enableMutationObserverClass", "enableMutationObserverStyle", "disableMutationObserverAttributes", "disableMutationObserverClass", "disableMutationObserverStyle", "enableShadowRootStyleOverride", "disableShadowRootStyleOverride", "shadowRootStyleOverrideDelay", "enableThrottleMutationObserverBackgrounds", "disableThrottleMutationObserverBackgrounds", "delayMutationObserverBackgrounds", "disableAutoThrottleMutationObserverBackgrounds", "enableAutoThrottleMutationObserverBackgrounds", "autoThrottleMutationObserverBackgroundsTreshold", "throttledMutationObserverTreatedByCall", "delayApplyMutationObserversSafeTimer", "enableObserveBodyChange", "disableObserveBodyChange", "observeBodyChangeTimerInterval", "enableBrightColorDetection", "disableBrightColorDetection", "brightColorLightnessTresholdMin", "brightColorLightnessTresholdMax", "enableThrottleBackgroundDetection", "disableThrottleBackgroundDetection", "throttleBackgroundDetectionElementsTreatedByCall", "backgroundDetectionStartDelay", "useBackgroundDetectionAlreadyProcessedNodes", "enableBrightColorDetectionSubelement", "disableBrightColorDetectionSubelement", "observeDocumentChange", "observeDocumentChangeTimerInterval", "enableDarkImageDetection", "disableDarkImageDetection", "darkImageDetectionHslTreshold", "darkImageDetectionDarkPixelCountTreshold"];
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
    "EMPTY": "EMPTY",
    "UNKNOWN": "UNKNOWN"
};
const defaultWebsiteSpecialFiltersConfig = {
    performanceModeEnabled: false,
    autoDetectTransparentBackgroundEnabled: true,
    enableMutationObserversForSubChilds: true,
    opacityDetectedAsTransparentThreshold: opacityDetectedAsTransparentThresholdDefault,
    enableMutationObserverAttributes: true,
    enableMutationObserverStyle: true,
    enableMutationObserverClass: true,
    enableShadowRootStyleOverride: true,
    shadowRootStyleOverrideDelay: 100, // <= 0 to disable
    throttleMutationObserverBackgrounds: false,
    delayMutationObserverBackgrounds: 0,
    autoThrottleMutationObserverBackgroundsEnabled: true,
    autoThrottleMutationObserverBackgroundsTreshold: 75,
    throttledMutationObserverTreatedByCall: 50,
    delayApplyMutationObserversSafeTimer: 0,
    observeBodyChange: true,
    observeBodyChangeTimerInterval: 1,
    observeDocumentChange: true,
    observeDocumentChangeTimerInterval: 100,
    enableBrightColorDetection: true,
    enableBrightColorDetectionSubelement: true,
    brightColorLightnessTresholdMin: 0.05,
    brightColorLightnessTresholdMax: 0.9,
    throttleBackgroundDetection: false,
    throttleBackgroundDetectionElementsTreatedByCall: 500,
    backgroundDetectionStartDelay: 0,
    useBackgroundDetectionAlreadyProcessedNodes: false,
    enableDarkImageDetection: false,
    darkImageDetectionHslTreshold: 0.15,
    darkImageDetectionDarkPixelCountTreshold: 0.5
};
const ignoredElementsContentScript = ["style", "script", "br", "head", "link", "meta", "hr"];
const failedUpdateAutoReupdateDelay = 5 * 60 * 1000; // ms

// Default settings
const updateNotification = {};
updateNotification[extensionVersion] = true;

const defaultInterfaceDarkTheme = "auto"; // auto/on/off
const defaultPopupTheme = "modern"; // switch/classic/modern
const defaultSettings = {
    "pageShadowEnabled": "false",
    "theme": "1",
    "pageLumEnabled": "false",
    "pourcentageLum": (brightnessDefaultValue * 100).toString(),
    "sitesInterditPageShadow": "",
    "liveSettings": "true",
    "whiteList": "false",
    "colorTemp": "5",
    "colorInvert": "false",
    "invertPageColors": "false",
    "invertImageColors": "true",
    "invertEntirePage": "false",
    "invertVideoColors": "false",
    "selectiveInvert": "false",
    "invertBgColor": "true",
    "globallyEnable": "true",
    "customThemeInfoDisable": "false",
    "autoEnable": "false",
    "autoEnableHourFormat": defaultAutoEnableHourFormat,
    "hourEnable": defaultHourEnable,
    "minuteEnable": defaultMinuteEnable,
    "hourEnableFormat": defaultHourEnableFormat,
    "hourDisable": defaultHourDisable,
    "minuteDisable": defaultMinuteDisable,
    "hourDisableFormat": defaultHourDisableFormat,
    "disableImgBgColor": "false",
    "presets": defaultPresets,
    "customThemes": defaultCustomThemes,
    "filtersSettings": defaultFilters,
    "customFilter": "",
    "defaultLoad": "0",
    "updateNotification": updateNotification,
    "interfaceDarkTheme": defaultInterfaceDarkTheme,
    "popupTheme": defaultPopupTheme,
    "advancedOptionsFiltersSettings": {},
    "blueLightReductionEnabled": "false",
    "percentageBlueLightReduction": (percentageBlueLightDefaultValue * 100).toString(),
    "archiveInfoLastShowed": -1,
    "archiveInfoDisable": "false",
    "autoBackupCloudInterval": 0,
    "lastAutoBackupCloud": -1,
    "lastAutoBackupFailed": "false",
    "brightColorPreservation": "true",
    "disableRightClickMenu": "false",
    "increaseContrastInformationShowed": "false",
    "attenuateColors": "false",
    "attenuateImgColors": "true",
    "attenuateBgColors": "true",
    "attenuateVideoColors": "false",
    "attenuateBrightColors": "false"
};

// Color themes
const defaultThemesBackgrounds = ["black", "#142634", "#222", "#263238", "#333a49", "#020315", "#192338", "#1A1A1A", "#1d4e6d", "#272822", "white", "#002b36", "#000D00", "#272822", "#2e3436", "#202124"]; // Colors of the backgrounds
const defaultThemesTextColors = ["#AAA", "#BDC7C1", "#AAA", "#C3CEE3", "#dfcbd3", "#b9cace", "#6f9bb0", "#FFFFB3", "#BED6FF", "#39B7FF", "black", "#b58901", "#00ca00", "#91e22d", "#d2dde3", "#bdc1c6"];
const defaultThemesLinkColors = ["#1E90FF", "#7288D4", "#21C7AC", "#C792EA", "#FB77A6", "#d0a00c", "#978FCC", "#A6A6FF", "#F7A92C", "#52D252", "#CC4A00", "#1783d2", "#1e90ff", "#65d9ef", "#6792bf", "#8ab4f8"]; // Colors of the links
const defaultThemesVisitedLinkColors = ["#FF00FF", "#BC72D4", "#996DF2", "#92BEEA", "#BD8EF0", "#9FD00C", "#8FCCAE", "#E9A6FF", "#B3F72C", "#D2D252", "#6CD96C", "#A471F8", "#9F4AF4", "#7165EF", "#7667BF", "#C58AF9"]; // Colors of the visited links
const defaultThemesSelectBgColors = ["grey", "grey", "grey", "grey", "grey", "grey", "grey", "grey", "grey", "grey", "#424242", "grey", "grey", "grey", "grey", "grey"]; // Background color of the select
const defaultThemesSelectTextColors = ["black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black"]; // Text color of the select
const defaultThemesInsBgColors = ["green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "#FF7FFF", "green", "green", "green", "green", "green"]; // Background color of the ins elements
const defaultThemesInsTextColors = ["white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "black", "white", "white", "white", "white", "white"]; // Text color of the ins elements
const defaultThemesDelBgColors = ["red", "red", "red", "red", "red", "red", "red", "red", "red", "red", "#00FFFF", "red", "red", "red", "red", "red"]; // Background color of the del elements
const defaultThemesDelTextColors = ["white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "black", "white", "white", "white", "white", "white"]; // Text color of the del elements
const defaultThemesMarkBgColors = ["orange", "orange", "orange", "orange", "orange", "orange", "orange", "orange", "orange", "orange", "#005AFF", "orange", "orange", "orange", "orange", "orange"]; // Background color of the mark elements
const defaultThemesMarkTextColors = ["black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "white", "black", "black", "black", "black", "black"]; // Text color of the mark elements
const defaultThemesImgBgColors = ["#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#424242", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD", "#BDBDBD"]; // Background color of the images
const defaultThemesBrightColorTextWhite = ["white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"]; // Background color of the images
const defaultThemesBrightColorTextBlack = ["black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black", "black"]; // Background color of the images
const permissionOrigin = [
    "http://*/*",
    "https://*/*",
    "ftp://*/*"
];

export { extensionVersion, versionDate, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingNames, settingsToSavePresets, nbPresets, defaultPresets, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, customFilterGuideURL, regexpDetectionPattern, availableFilterRulesType, filterSyntaxErrorTypes, specialFilterRules, ruleCategory, opacityDetectedAsTransparentThresholdDefault, defaultWebsiteSpecialFiltersConfig, defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, regexpDetectionPatternHighlight, ignoredElementsContentScript, failedUpdateAutoReupdateDelay, defaultInterfaceDarkTheme, defaultPopupTheme, percentageBlueLightDefaultValue, archiveInfoShowInterval, defaultSettings, settingsToLoad, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack, pageShadowClassListsMutationsIgnore, permissionOrigin, customThemesKey, disabledWebsitesKey, whitelistKey };