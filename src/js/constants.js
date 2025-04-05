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
const extensionVersion = "2.11.3";
const versionDate = new Date(2025, 3, 6);
const nbThemes = 16; // nb of themes for the function Increase the contrast (used globally in the extension)
const colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"]; // color temperatures available for the function Night Mode (used globally in the extension)
const minBrightnessPercentage = 0; // the minimum percentage of brightness
const maxBrightnessPercentage = 0.9; // the maximum percentage of brightness
const brightnessDefaultValue = 0.15; // the default percentage value of brightness
const attenuateDefaultValue = 0.5; // Default value percentage for attenuate colors
const percentageBlueLightDefaultValue = 0.25;
const brightnessReductionElementId = "pageShadowBrightness";
const blueLightReductionElementId = "pageShadowBrightnessNightMode";
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
const settingNames = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", disabledWebsitesKey, "liveSettings", whitelistKey, "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "globallyEnable", "customThemeInfoDisable", "autoEnable", "autoEnableHourFormat", "hourEnable", "minuteEnable", "hourEnableFormat", "hourDisable", "minuteDisable", "hourDisableFormat", "disableImgBgColor", "defaultLoad", "presets", customThemesKey, "filtersSettings", "customFilter", "updateNotification", "selectiveInvert", "interfaceDarkTheme", "popupTheme", "advancedOptionsFiltersSettings", "blueLightReductionEnabled", "percentageBlueLightReduction", "nightModeEnabled", "archiveInfoLastShowed", "archiveInfoDisable", "autoBackupCloudInterval", "lastAutoBackupCloud", "lastAutoBackupFailed", "attenuateImageColor", "brightColorPreservation", "disableRightClickMenu", "increaseContrastInformationShowed", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors",  "attenuateBrightColors", "attenuateColors", "permissionsInfoDisable", "lastAutoBackupFailedDate", "lastAutoBackupFailedLastShowed", "percentageAttenuateColors", "invertBrightColors", "migratedAdvancedOptions", "autoDisableDarkThemedWebsite", "autoDisableDarkThemedWebsiteType"];
const settingsToSavePresets = ["pageShadowEnabled", "theme", "disableImgBgColor", "brightColorPreservation", "pageLumEnabled", "pourcentageLum", "blueLightReductionEnabled", "percentageBlueLightReduction", "colorTemp", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "selectiveInvert", "invertBrightColors", "attenuateImageColor", "attenuateColors", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors",  "attenuateBrightColors", "percentageAttenuateColors", "autoEnable", "liveSettings"];
const settingsToLoad = ["pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "colorTemp", "globallyEnable", "invertVideoColors", "disableImgBgColor", "invertBgColor", "selectiveInvert", "invertBrightColors", "blueLightReductionEnabled", "percentageBlueLightReduction", "attenuateImageColor", "brightColorPreservation", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors",  "attenuateBrightColors", "attenuateColors", "percentageAttenuateColors", "autoDisableDarkThemedWebsite", "autoDisableDarkThemedWebsiteType"];
const pageShadowClassListsMutationsToProcess = ["pageShadowHasBackgroundImg", "pageShadowPseudoElementHasBackgroundImgAfter", "pageShadowPseudoElementHasBackgroundImgBefore", "pageShadowHasTransparentBackground", "pageShadowPseudoElementHasTransparentBackgroundAfter", "pageShadowPseudoElementHasTransparentBackgroundBefore", "pageShadowHasBrightColorBackground", "pageShadowPseudoElementHasBrightColorBackgroundAfter", "pageShadowPseudoElementHasBrightColorBackgroundBefore", "pageShadowBrightColorWithBlackText", "pageShadowPseudoElementBrightColorWithBlackTextAfter", "pageShadowPseudoElementBrightColorWithBlackTextBefore", "pageShadowBrightColorWithWhiteText", "pageShadowPseudoElementBrightColorWithWhiteTextAfter", "pageShadowPseudoElementBrightColorWithWhiteTextBefore", "pageShadowBackgroundDetected", "pageShadowHasPseudoElement"];
const pageShadowClassListsMutationsToIgnore = ["pageShadowForceBlackColor"];
const nbPresets = 15;
const defaultPresets = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}, 11: {}, 12: {}, 13: {}, 14: {}, 15: {}};
const nbCustomThemesSlots = 10;
const defaultCustomThemes = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}, 8: {}, 9: {}, 10: {}};

const customFilterGuideURL = "https://www.eliastiksofts.com/page-shadow/filters/guide/2.11.1.php";
const regexpDetectionPattern = /^((.*)\/(?:[^\\]|\\.)*?\/)(\|)/;
const regexpDetectionPatternHighlight = /^(\/(?:[^\\]|\\.)*?\/)(\|)/;
const regexpMatchURL = /url\((['"]?)(.*?)\1\)/;
const opacityDetectedAsTransparentThresholdDefault = 0.6;

const ignoredElementsContentScript = ["style", "script", "br", "head", "link", "meta", "hr"];
const ignoredElementsBrightTextColorDetection = ["img", "g", "path", "svg"];
const failedUpdateAutoReupdateDelay = 5 * 60 * 1000; // ms

// Max size used to detect dark image. If the image size is above this size, we resize the image before analyze
const maxImageSizeDarkImageDetection = 150;

// Margin used to calculate the max quota bytes per item limit in cloud backup
const quotaBytesPerItemMargin = 100;

// Max elements per batch to treat for throttled tasks
const maxElementsPerBatch = 10000;

// Margin of max execution time compared to real execution time to reduce throttling
const throttledTaskReduceThrottleMargin = 0.8;

// URL to report website problem
const enableReportWebsiteProblem = true;
const reportWebsiteProblemBackendURL = "https://www.eliastiksofts.com/page-shadow/report?data=";

// Default settings
const updateNotification = {};
updateNotification[extensionVersion] = true;

const defaultInterfaceDarkTheme = "auto"; // auto/on/off
const defaultPopupTheme = "modern"; // switch/classic/modern

// Timeout before receiving response when using sendMessageWithPromise method
const sendMessageWithPromiseTimeout = 90000; // ms

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
            "sourceUrl": "https://www.eliastiksofts.com/page-shadow/filters/ultra.performance.2.11.txt",
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

const defaultSettings = {
    "pageShadowEnabled": "false",
    "theme": "1",
    "pageLumEnabled": "false",
    "pourcentageLum": (brightnessDefaultValue * 100).toString(),
    "sitesInterditPageShadow": "",
    "liveSettings": "true",
    "whiteList": "false",
    "autoDisableDarkThemedWebsite": "false",
    "autoDisableDarkThemedWebsiteType": "website",
    "colorTemp": "5",
    "colorInvert": "false",
    "invertPageColors": "false",
    "invertImageColors": "false",
    "invertEntirePage": "false",
    "invertVideoColors": "false",
    "selectiveInvert": "true",
    "invertBrightColors": "false",
    "invertBgColor": "false",
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
    "disableImgBgColor": "true",
    "presets": defaultPresets,
    "customThemes": defaultCustomThemes,
    "filtersSettings": defaultFilters,
    "customFilter": "",
    "defaultLoad": "0",
    updateNotification,
    "interfaceDarkTheme": defaultInterfaceDarkTheme,
    "popupTheme": defaultPopupTheme,
    "advancedOptionsFiltersSettings": {},
    "blueLightReductionEnabled": "false",
    "percentageBlueLightReduction": (percentageBlueLightDefaultValue * 100).toString(),
    "percentageAttenuateColors": (attenuateDefaultValue * 100).toString(),
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
const defaultThemesBackgrounds = ["#000000", "#142634", "#222", "#263238", "#333a49", "#020315", "#192338", "#1A1A1A", "#1d4e6d", "#272822", "#FFFFFF", "#002b36", "#000D00", "#272822", "#2e3436", "#202124"]; // Colors of the backgrounds
const defaultThemesTextColors = ["#AAA", "#BDC7C1", "#AAA", "#C3CEE3", "#dfcbd3", "#b9cace", "#6f9bb0", "#FFFFB3", "#BED6FF", "#39B7FF", "#000000", "#b58901", "#00ca00", "#91e22d", "#d2dde3", "#bdc1c6"];
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

// Filters rules

const availableFilterRulesType = ["disableContrastFor", "forceTransparentBackground", "disableBackgroundStylingFor", "disableTextColorStylingFor", "disableInputBorderStylingFor", "disableLinkStylingFor", "disableFontFamilyStylingFor", "disableElementInvertFor", "hasBackgroundImg", "forceCustomLinkColorFor", "forceCustomBackgroundColorFor", "forceCustomTextColorFor", "disableShadowRootsCustomStyle", "enablePerformanceMode", "disablePerformanceMode", "disableTransparentBackgroundAutoDetect", "enableTransparentBackgroundAutoDetect", "opacityDetectedAsTransparentThreshold", "enableMutationObserversForSubChilds", "disableMutationObserversForSubChilds", "enableMutationObserverAttributes", "enableMutationObserverClass", "disableMutationObserverAttributes", "disableMutationObserverClass", "enableMutationObserverStyle", "disableMutationObserverStyle", "forceCustomVisitedLinkColor", "disableCustomVisitedLinkColor", "forceFontFamilyStylingFor", "forceInputBorderStylingFor", "forceCustomLinkColorAsBackground", "forceCustomTextColorAsBackground", "forceCustomLinkVisitedColorAsBackground", "forceDisableDefaultBackgroundColor", "forceDisableDefaultBackground", "forceDisableDefaultFontColor", "enableShadowRootStyleOverride", "disableShadowRootStyleOverride", "overrideShadowRootsCustomStyle", "shadowRootStyleOverrideDelay", "invertElementAsImage", "invertElementAsVideo", "invertElementAsBackground", "enableSelectiveInvert", "enablePseudoElementSelectiveInvert", "invertPseudoElement", "enableThrottleMutationObserverBackgrounds", "disableThrottleMutationObserverBackgrounds", "delayMutationObserverBackgrounds", "throttledMutationObserverTreatedByCall", "delayApplyMutationObserversSafeTimer", "enableObserveBodyChange", "disableObserveBodyChange", "observeBodyChangeTimerInterval", "enableBrightColorDetection", "disableBrightColorDetection", "brightColorLightnessTresholdMin", "brightColorLightnessTresholdTextMin", "brightColorLightnessTresholdMax", "preserveBrightColor", "enableThrottleBackgroundDetection", "disableThrottleBackgroundDetection", "throttleBackgroundDetectionElementsTreatedByCall", "backgroundDetectionStartDelay", "useBackgroundDetectionAlreadyProcessedNodes", "enableBrightColorDetectionSubelement", "disableBrightColorDetectionSubelement", "observeDocumentChange", "observeDocumentChangeTimerInterval", "enableDarkImageDetection", "disableDarkImageDetection", "darkImageDetectionHslTreshold", "brightColorSaturationTresholdMin", "enableNotMatchingFiltersDetection", "disableNotMatchingFiltersDetection", "intervalApplyClassChanges", "classChangeMaxElementsTreatedByCall", "darkImageDetectionMinAlpha", "darkImageDetectionBlockSize", "darkImageDetectionTransparentPixelsRatio", "darkImageDetectionDarkPixelsRatio", "forcePseudoElementsTransparentBackground", "enableThrottleDarkImageDetection", "disableThrottleDarkImageDetection", "throttleDarkImageDetectionDelay", "throttleDarkImageDetectionBatchSize", "enableThrottleMutationObserverBackgroundsSubChilds", "disableThrottleMutationObserverBackgroundsSubChilds", "delayMutationObserverBackgroundsSubchilds", "throttledMutationObserverSubchildsTreatedByCall", "delayApplyClassChanges", "throttleBackgroundDetectionMaxExecutionTime", "throttleDarkImageDetectionMaxExecutionTime", "throttledMutationObserverMaxExecutionTime", "throttledMutationObserverSubchildsMaxExecutionTime", "applyClassChangesMaxExecutionTime", "autoThrottleBackgroundDetectionTime", "enableThrottleApplyClassChanges", "disableThrottleApplyClassChanges", "enableURLChangeDetection", "disableURLChangeDetection", "hasBrightColorWithWhiteText", "hasBrightColorWithBlackText", "disablePseudoElementsAnalysis", "enablePseudoElementsAnalysis", "enablePseudoElementsStyling", "enableDarkImageDetectionCache", "disableDarkImageDetectionCache", "darkImageDetectionMaxCacheSize", "enableMutationObserverProcessNewestFirst", "disableMutationObserverProcessNewestFirst", "enableSelectiveInvertPreserveColors", "disableSelectiveInvertPreserveColors", "darkThemeDetectionMaxLightness", "darkThemeDetectionMaxSaturation", "darkThemeDetectionMinLightnessLightElements", "darkThemeDetectionPercentageRatioDarkLightElements", "darkImageDetectionEnableFetchUseHref", "darkImageDetectionDisableFetchUseHref", "darkImageDetectionEnableCorsFetch", "darkImageDetectionDisableCorsFetch", "darkImageDetectionEnableRedirectionCheck", "darkImageDetectionDisableRedirectionCheck", "enableThrottleBackgroundDetectionDestylePerElement", "disableThrottleBackgroundDetectionDestylePerElement"];

const specialFilterRules = ["enablePerformanceMode", "disablePerformanceMode", "disableTransparentBackgroundAutoDetect", "enableTransparentBackgroundAutoDetect", "opacityDetectedAsTransparentThreshold", "enableMutationObserversForSubChilds", "disableMutationObserversForSubChilds", "enableMutationObserverAttributes", "enableMutationObserverClass", "enableMutationObserverStyle", "disableMutationObserverAttributes", "disableMutationObserverClass", "disableMutationObserverStyle", "enableShadowRootStyleOverride", "disableShadowRootStyleOverride", "shadowRootStyleOverrideDelay", "enableThrottleMutationObserverBackgrounds", "disableThrottleMutationObserverBackgrounds", "delayMutationObserverBackgrounds", "throttledMutationObserverTreatedByCall", "delayApplyMutationObserversSafeTimer", "enableObserveBodyChange", "disableObserveBodyChange", "observeBodyChangeTimerInterval", "enableBrightColorDetection", "disableBrightColorDetection", "brightColorLightnessTresholdMin", "brightColorLightnessTresholdTextMin", "brightColorLightnessTresholdMax", "enableThrottleBackgroundDetection", "disableThrottleBackgroundDetection", "throttleBackgroundDetectionElementsTreatedByCall", "backgroundDetectionStartDelay", "useBackgroundDetectionAlreadyProcessedNodes", "enableBrightColorDetectionSubelement", "disableBrightColorDetectionSubelement", "observeDocumentChange", "observeDocumentChangeTimerInterval", "enableDarkImageDetection", "disableDarkImageDetection", "darkImageDetectionHslTreshold", "brightColorSaturationTresholdMin", "enableNotMatchingFiltersDetection", "disableNotMatchingFiltersDetection", "intervalApplyClassChanges", "classChangeMaxElementsTreatedByCall", "darkImageDetectionMinAlpha", "darkImageDetectionBlockSize", "darkImageDetectionTransparentPixelsRatio", "darkImageDetectionDarkPixelsRatio", "enableThrottleDarkImageDetection", "disableThrottleDarkImageDetection", "throttleDarkImageDetectionDelay", "throttleDarkImageDetectionBatchSize", "enableThrottleMutationObserverBackgroundsSubChilds", "disableThrottleMutationObserverBackgroundsSubChilds", "delayMutationObserverBackgroundsSubchilds", "throttledMutationObserverSubchildsTreatedByCall", "delayApplyClassChanges", "throttleBackgroundDetectionMaxExecutionTime", "throttleDarkImageDetectionMaxExecutionTime", "throttledMutationObserverMaxExecutionTime", "throttledMutationObserverSubchildsMaxExecutionTime", "applyClassChangesMaxExecutionTime", "autoThrottleBackgroundDetectionTime", "enableThrottleApplyClassChanges", "disableThrottleApplyClassChanges", "enableURLChangeDetection", "disableURLChangeDetection", "disablePseudoElementsAnalysis", "enablePseudoElementsAnalysis", "enableDarkImageDetectionCache", "disableDarkImageDetectionCache", "darkImageDetectionMaxCacheSize", "enableMutationObserverProcessNewestFirst", "disableMutationObserverProcessNewestFirst", "enableSelectiveInvertPreserveColors", "disableSelectiveInvertPreserveColors", "darkThemeDetectionMaxLightness", "darkThemeDetectionMaxSaturation", "darkThemeDetectionMinLightnessLightElements", "darkThemeDetectionPercentageRatioDarkLightElements", "darkImageDetectionEnableFetchUseHref", "darkImageDetectionDisableFetchUseHref", "darkImageDetectionEnableCorsFetch", "darkImageDetectionDisableCorsFetch", "darkImageDetectionEnableRedirectionCheck", "darkImageDetectionDisableRedirectionCheck", "enableThrottleBackgroundDetectionDestylePerElement", "disableThrottleBackgroundDetectionDestylePerElement"];

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

// CSS classes used by the PageAnalyzer class
const pageAnalyzerCSSClasses = {
    pageShadowHasBackgroundImg: {
        normal: "pageShadowHasBackgroundImg",
        pseudoElt: "pageShadowPseudoElementHasBackgroundImg"
    },
    pageShadowHasTransparentBackground: {
        normal: "pageShadowHasTransparentBackground",
        pseudoElt: "pageShadowPseudoElementHasTransparentBackground"
    },
    pageShadowSelectiveInvert: {
        normal: "pageShadowSelectiveInvert",
        pseudoElt: "pageShadowSelectiveInvertPseudoElement"
    },
    pageShadowHasBrightColorBackground: {
        normal: "pageShadowHasBrightColorBackground",
        pseudoElt: "pageShadowPseudoElementHasBrightColorBackground"
    },
    pageShadowHasBrightColorText: {
        normal: "pageShadowHasBrightColorText",
        pseudoElt: "pageShadowPseudoElementHasBrightColorText"
    },
    pageShadowBrightColorWithBlackText: {
        normal: "pageShadowBrightColorWithBlackText",
        pseudoElt: "pageShadowPseudoElementBrightColorWithBlackText"
    },
    pageShadowBrightColorWithWhiteText: {
        normal: "pageShadowBrightColorWithWhiteText",
        pseudoElt: "pageShadowPseudoElementBrightColorWithWhiteText"
    },
    pageShadowBrightColorForceCustomTextLinkColor: {
        normal: "pageShadowBrightColorForceCustomTextLinkColor",
        pseudoElt: "pageShadowPseudoElementBrightColorForceCustomTextLinkColor"
    },
    pageShadowForceBlackColor: {
        normal: "pageShadowForceBlackColor",
        pseudoElt: "pageShadowForceBlackColor"
    }
};

// Internal options that change how Page Shadow works internally (pages processing)
const defaultWebsiteSpecialFiltersConfig = {
    debugMode: false,
    performanceModeEnabled: false,
    throttleBackgroundDetection: false,
    throttleBackgroundDetectionElementsTreatedByCall: 25,
    throttleBackgroundDetectionMaxExecutionTime: 300,
    backgroundDetectionStartDelay: 5,
    autoThrottleBackgroundDetectionTime: 500,
    throttleBackgroundDetectionDestylePerElement: true,
    useBackgroundDetectionAlreadyProcessedNodes: false,
    autoDetectTransparentBackgroundEnabled: true,
    opacityDetectedAsTransparentThreshold: opacityDetectedAsTransparentThresholdDefault,
    enableBrightColorDetection: true,
    enableBrightColorDetectionSubelement: true,
    brightColorLightnessTresholdMin: 0.05,
    brightColorLightnessTresholdMax: 0.9,
    brightColorLightnessTresholdTextMin: 0.25,
    brightColorSaturationTresholdMin: 0.25,
    enableDarkImageDetection: true,
    darkImageDetectionHslTreshold: 0.18,
    darkImageDetectionMinAlpha: 0.5,
    darkImageDetectionBlockSize: 16,
    darkImageDetectionTransparentPixelsRatio: 0.5,
    darkImageDetectionDarkPixelsRatio: 0.8,
    throttleDarkImageDetection: true,
    throttleDarkImageDetectionDelay: 50,
    throttleDarkImageDetectionBatchSize: 15,
    throttleDarkImageDetectionMaxExecutionTime: 30,
    enableDarkImageDetectionCache: true,
    darkImageDetectionMaxCacheSize: 250,
    darkImageDetectionEnableRedirectionCheck: true,
    darkImageDetectionEnableCorsFetch: true,
    darkImageDetectionEnableFetchUseHref: false,
    darkThemeDetectionMaxLightness: 0.25,
    darkThemeDetectionMaxSaturation: 0.5,
    darkThemeDetectionMinLightnessLightElements: 0.9,
    darkThemeDetectionPercentageRatioDarkLightElements: 0.9,
    enableMutationObserversForSubChilds: true,
    enableMutationObserverAttributes: true,
    enableMutationObserverStyle: true,
    enableMutationObserverClass: true,
    delayApplyMutationObserversSafeTimer: 0,
    throttleMutationObserverBackgrounds: true,
    delayMutationObserverBackgrounds: 5,
    throttledMutationObserverTreatedByCall: 500,
    throttledMutationObserverMaxExecutionTime: 500,
    throttleMutationObserverBackgroundsSubChilds: true,
    delayMutationObserverBackgroundsSubchilds: 50,
    throttledMutationObserverSubchildsTreatedByCall: 250,
    throttledMutationObserverSubchildsMaxExecutionTime: 250,
    mutationObserverProcessNewestFirst: false,
    observeBodyChange: true,
    observeBodyChangeTimerInterval: 1,
    observeDocumentChange: true,
    observeDocumentChangeTimerInterval: 100,
    enableThrottleApplyClassChanges: true,
    intervalApplyClassChanges: 5,
    classChangeMaxElementsTreatedByCall: 5000,
    delayApplyClassChanges: 5,
    applyClassChangesMaxExecutionTime: 150,
    enableShadowRootStyleOverride: true,
    shadowRootStyleOverrideDelay: 100, // <= 0 to disable
    enableNotMatchingFiltersDetection: true,
    enableURLChangeDetection: true,
    enablePseudoElementsAnalysis: true,
    enableSelectiveInvertPreserveColors: true
};

const websiteSpecialFiltersConfigThemes = {
    enableMutationObserversForSubChilds: "mutationsObservers",
    debugMode: "general",
    enableShadowRootStyleOverride: "shadowRoots",
    observeBodyChange: "observePageChanges",
    autoDetectTransparentBackgroundEnabled: "backgroundAnalysis",
    enableBrightColorDetection: "brightColorAnalysis",
    throttleBackgroundDetection: "generalPageAnalysis",
    enableNotMatchingFiltersDetection: "filterEngine",
    enableDarkImageDetection: "imageAnalyze",
    enableThrottleApplyClassChanges: "applyCssTimer",
    enableURLChangeDetection: "others",
    darkThemeDetectionMaxLightness: "darkThemeDetection"
};

// Map between filters and applied class
const mapFiltersCSSClass = {
    disableContrastFor: "pageShadowElementDisabled",
    forceTransparentBackground: "pageShadowElementForceTransparentBackground",
    disableBackgroundStylingFor: "pageShadowDisableBackgroundStyling",
    disableTextColorStylingFor: "pageShadowDisableColorStyling",
    disableInputBorderStylingFor: "pageShadowDisableInputBorderStyling",
    forceInputBorderStylingFor: "pageShadowForceInputBorderStyling",
    disableLinkStylingFor: "pageShadowDisableLinkStyling",
    disableFontFamilyStylingFor: "pageShadowDisableFontFamilyStyling",
    forceFontFamilyStylingFor: "pageShadowForceFontFamilyStyling",
    disableElementInvertFor: "pageShadowDisableElementInvert",
    hasBackgroundImg: "pageShadowHasBackgroundImg",
    forceCustomLinkColorFor: "pageShadowForceCustomLinkColor",
    forceCustomBackgroundColorFor: "pageShadowForceCustomBackgroundColor",
    forceCustomTextColorFor: "pageShadowForceCustomTextColor",
    forceCustomVisitedLinkColor: "pageShadowForceCustomVisitedLinkColor",
    disableCustomVisitedLinkColor: "pageShadowDisableCustomVisitedLinkColor",
    forceCustomLinkColorAsBackground: "pageShadowForceCustomLinkColorAsBackground",
    forceCustomTextColorAsBackground: "pageShadowForceCustomTextColorAsBackground",
    forceCustomLinkVisitedColorAsBackground: "pageShadowForceCustomLinkVisitedColorAsBackground",
    invertElementAsImage: "pageShadowInvertElementAsImage",
    invertElementAsVideo: "pageShadowInvertElementAsVideo",
    invertElementAsBackground: "pageShadowInvertElementAsBackground",
    enableSelectiveInvert: "pageShadowSelectiveInvert",
    enablePseudoElementSelectiveInvert: "pageShadowSelectiveInvertPseudoElement",
    invertPseudoElement: "pageShadowInvertPseudoElement",
    forceDisableDefaultBackgroundColor: "pageShadowforceDisableDefaultBackgroundColor",
    forceDisableDefaultBackground: "pageShadowforceDisableDefaultBackground",
    forceDisableDefaultFontColor: "pageShadowforceDisableDefaultFontColor",
    preserveBrightColor: "pageShadowHasBrightColorBackground",
    forcePseudoElementsTransparentBackground: "pageShadowForcePseudoElementTransparentBackground",
    hasBrightColorWithWhiteText: "pageShadowBrightColorWithWhiteText",
    hasBrightColorWithBlackText: "pageShadowBrightColorWithBlackText",
    enablePseudoElementsStyling: "pageShadowEnablePseudoElementStyling"
};

// This config is used by the method "processSpecialRules" in the class "PageFilterProcessor"
// It is used to map a special filter to an action on advanced config (see defaultWebsiteSpecialFiltersConfig)
const websiteSpecialFiltersProcessingConfig = {
    enablePerformanceMode: {
        type: "enable",
        name: "performanceModeEnabled"
    },
    disablePerformanceMode: {
        type: "disable",
        name: "performanceModeEnabled"
    },
    enableTransparentBackgroundAutoDetect: {
        type: "enable",
        name: "autoDetectTransparentBackgroundEnabled"
    },
    disableTransparentBackgroundAutoDetect: {
        type: "disable",
        name: "autoDetectTransparentBackgroundEnabled"
    },
    enableMutationObserversForSubChilds: {
        type: "enable",
        name: "enableMutationObserversForSubChilds"
    },
    disableMutationObserversForSubChilds: {
        type: "disable",
        name: "enableMutationObserversForSubChilds"
    },
    opacityDetectedAsTransparentThreshold: {
        type: "value",
        name: "opacityDetectedAsTransparentThreshold"
    },
    enableMutationObserverAttributes: {
        type: "enable",
        name: "enableMutationObserverAttributes"
    },
    disableMutationObserverAttributes: {
        type: "disable",
        name: "enableMutationObserverAttributes"
    },
    enableMutationObserverClass: {
        type: "enable",
        name: "enableMutationObserverClass"
    },
    disableMutationObserverClass: {
        type: "disable",
        name: "enableMutationObserverClass"
    },
    enableMutationObserverStyle: {
        type: "enable",
        name: "enableMutationObserverStyle"
    },
    disableMutationObserverStyle: {
        type: "disable",
        name: "enableMutationObserverStyle"
    },
    enableShadowRootStyleOverride: {
        type: "enable",
        name: "enableShadowRootStyleOverride"
    },
    disableShadowRootStyleOverride: {
        type: "disable",
        name: "enableShadowRootStyleOverride"
    },
    shadowRootStyleOverrideDelay: {
        type: "value",
        name: "shadowRootStyleOverrideDelay"
    },
    enableThrottleMutationObserverBackgrounds: {
        type: "enable",
        name: "throttleMutationObserverBackgrounds"
    },
    disableThrottleMutationObserverBackgrounds: {
        type: "disable",
        name: "throttleMutationObserverBackgrounds"
    },
    delayMutationObserverBackgrounds: {
        type: "value",
        name: "delayMutationObserverBackgrounds"
    },
    throttledMutationObserverTreatedByCall: {
        type: "value",
        name: "throttledMutationObserverTreatedByCall"
    },
    delayApplyMutationObserversSafeTimer: {
        type: "value",
        name: "delayApplyMutationObserversSafeTimer"
    },
    enableObserveBodyChange: {
        type: "enable",
        name: "observeBodyChange"
    },
    disableObserveBodyChange: {
        type: "disable",
        name: "observeBodyChange"
    },
    observeBodyChangeTimerInterval: {
        type: "value",
        name: "observeBodyChangeTimerInterval"
    },
    enableBrightColorDetection: {
        type: "enable",
        name: "enableBrightColorDetection"
    },
    disableBrightColorDetection: {
        type: "disable",
        name: "enableBrightColorDetection"
    },
    brightColorLightnessTresholdMin: {
        type: "value",
        name: "brightColorLightnessTresholdMin"
    },
    brightColorLightnessTresholdTextMin: {
        type: "value",
        name: "brightColorLightnessTresholdTextMin"
    },
    brightColorLightnessTresholdMax: {
        type: "value",
        name: "brightColorLightnessTresholdMax"
    },
    brightColorSaturationTresholdMin: {
        type: "value",
        name: "brightColorSaturationTresholdMin"
    },
    enableThrottleBackgroundDetection: {
        type: "enable",
        name: "throttleBackgroundDetection"
    },
    disableThrottleBackgroundDetection: {
        type: "disable",
        name: "throttleBackgroundDetection"
    },
    throttleBackgroundDetectionElementsTreatedByCall: {
        type: "value",
        name: "throttleBackgroundDetectionElementsTreatedByCall"
    },
    backgroundDetectionStartDelay: {
        type: "value",
        name: "backgroundDetectionStartDelay"
    },
    useBackgroundDetectionAlreadyProcessedNodes: {
        type: "enable",
        name: "useBackgroundDetectionAlreadyProcessedNodes"
    },
    enableBrightColorDetectionSubelement: {
        type: "enable",
        name: "enableBrightColorDetectionSubelement"
    },
    disableBrightColorDetectionSubelement: {
        type: "disable",
        name: "enableBrightColorDetectionSubelement"
    },
    enableObserveDocumentChange: {
        type: "enable",
        name: "observeDocumentChange"
    },
    disableObserveDocumentChange: {
        type: "disable",
        name: "observeDocumentChange"
    },
    observeDocumentChangeTimerInterval: {
        type: "value",
        name: "observeDocumentChangeTimerInterval"
    },
    enableDarkImageDetection: {
        type: "enable",
        name: "enableDarkImageDetection"
    },
    disableDarkImageDetection: {
        type: "disable",
        name: "enableDarkImageDetection"
    },
    darkImageDetectionHslTreshold: {
        type: "value",
        name: "darkImageDetectionHslTreshold"
    },
    enableNotMatchingFiltersDetection: {
        type: "enable",
        name: "enableNotMatchingFiltersDetection"
    },
    disableNotMatchingFiltersDetection: {
        type: "disable",
        name: "enableNotMatchingFiltersDetection"
    },
    intervalApplyClassChanges: {
        type: "value",
        name: "intervalApplyClassChanges"
    },
    classChangeMaxElementsTreatedByCall: {
        type: "value",
        name: "classChangeMaxElementsTreatedByCall"
    },
    darkImageDetectionMinAlpha: {
        type: "value",
        name: "darkImageDetectionMinAlpha"
    },
    darkImageDetectionBlockSize: {
        type: "value",
        name: "darkImageDetectionBlockSize"
    },
    darkImageDetectionTransparentPixelsRatio: {
        type: "value",
        name: "darkImageDetectionTransparentPixelsRatio"
    },
    darkImageDetectionDarkPixelsRatio: {
        type: "value",
        name: "darkImageDetectionDarkPixelsRatio"
    },
    throttleDarkImageDetectionDelay: {
        type: "value",
        name: "throttleDarkImageDetectionDelay"
    },
    throttleDarkImageDetectionBatchSize: {
        type: "value",
        name: "throttleDarkImageDetectionBatchSize"
    },
    enableThrottleDarkImageDetection: {
        type: "enable",
        name: "throttleDarkImageDetection"
    },
    disableThrottleDarkImageDetection: {
        type: "disable",
        name: "throttleDarkImageDetection"
    },
    enableThrottleMutationObserverBackgroundsSubChilds: {
        type: "enable",
        name: "throttleMutationObserverBackgroundsSubChilds"
    },
    disableThrottleMutationObserverBackgroundsSubChilds: {
        type: "disable",
        name: "throttleMutationObserverBackgroundsSubChilds"
    },
    delayMutationObserverBackgroundsSubchilds: {
        type: "value",
        name: "delayMutationObserverBackgroundsSubchilds"
    },
    throttledMutationObserverSubchildsTreatedByCall: {
        type: "value",
        name: "throttledMutationObserverSubchildsTreatedByCall"
    },
    delayApplyClassChanges: {
        type: "value",
        name: "delayApplyClassChanges"
    },
    throttleBackgroundDetectionMaxExecutionTime: {
        type: "value",
        name: "throttleBackgroundDetectionMaxExecutionTime"
    },
    throttleDarkImageDetectionMaxExecutionTime: {
        type: "value",
        name: "throttleDarkImageDetectionMaxExecutionTime"
    },
    throttledMutationObserverMaxExecutionTime: {
        type: "value",
        name: "throttledMutationObserverMaxExecutionTime"
    },
    throttledMutationObserverSubchildsMaxExecutionTime: {
        type: "value",
        name: "throttledMutationObserverSubchildsMaxExecutionTime"
    },
    applyClassChangesMaxExecutionTime: {
        type: "value",
        name: "applyClassChangesMaxExecutionTime"
    },
    autoThrottleBackgroundDetectionTime: {
        type: "value",
        name: "autoThrottleBackgroundDetectionTime"
    },
    enableThrottleApplyClassChanges: {
        type: "enable",
        name: "enableThrottleApplyClassChanges"
    },
    disableThrottleApplyClassChanges: {
        type: "disable",
        name: "enableThrottleApplyClassChanges"
    },
    enableURLChangeDetection: {
        type: "enable",
        name: "enableURLChangeDetection"
    },
    disableURLChangeDetection: {
        type: "disable",
        name: "enableURLChangeDetection"
    },
    enablePseudoElementsAnalysis: {
        type: "enable",
        name: "enablePseudoElementsAnalysis"
    },
    disablePseudoElementsAnalysis: {
        type: "disable",
        name: "enablePseudoElementsAnalysis"
    },
    enableDarkImageDetectionCache: {
        type: "disable",
        name: "enableDarkImageDetectionCache"
    },
    disableDarkImageDetectionCache: {
        type: "disable",
        name: "enableDarkImageDetectionCache"
    },
    darkImageDetectionMaxCacheSize: {
        type: "value",
        name: "darkImageDetectionMaxCacheSize"
    },
    enableMutationObserverProcessNewestFirst: {
        type: "enable",
        name: "mutationObserverProcessNewestFirst"
    },
    disableMutationObserverProcessNewestFirst: {
        type: "disable",
        name: "mutationObserverProcessNewestFirst"
    },
    enableSelectiveInvertPreserveColors: {
        type: "enable",
        name: "enableSelectiveInvertPreserveColors"
    },
    disableSelectiveInvertPreserveColors: {
        type: "disable",
        name: "enableSelectiveInvertPreserveColors"
    },
    darkThemeDetectionMaxLightness: {
        type: "value",
        name: "darkImageDetectionMaxCacheSize"
    },
    darkThemeDetectionMaxSaturation: {
        type: "value",
        name: "darkImageDetectionMaxCacheSize"
    },
    darkThemeDetectionMinLightnessLightElements: {
        type: "value",
        name: "darkImageDetectionMaxCacheSize"
    },
    darkThemeDetectionPercentageRatioDarkLightElements: {
        type: "value",
        name: "darkImageDetectionMaxCacheSize"
    },
    darkImageDetectionEnableFetchUseHref: {
        type: "enable",
        name: "darkImageDetectionEnableFetchUseHref"
    },
    darkImageDetectionDisableFetchUseHref: {
        type: "disable",
        name: "darkImageDetectionEnableFetchUseHref"
    },
    darkImageDetectionEnableCorsFetch: {
        type: "enable",
        name: "darkImageDetectionEnableCorsFetch"
    },
    darkImageDetectionDisableCorsFetch: {
        type: "disable",
        name: "darkImageDetectionEnableCorsFetch"
    },
    darkImageDetectionEnableRedirectionCheck: {
        type: "enable",
        name: "darkImageDetectionEnableRedirectionCheck"
    },
    darkImageDetectionDisableRedirectionCheck: {
        type: "disable",
        name: "darkImageDetectionEnableRedirectionCheck"
    },
    enableThrottleBackgroundDetectionDestylePerElement: {
        type: "enable",
        name: "throttleBackgroundDetectionDestylePerElement"
    },
    disableThrottleBackgroundDetectionDestylePerElement: {
        type: "disable",
        name: "throttleBackgroundDetectionDestylePerElement"
    }
};

const wordToNumberMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15
};

export { extensionVersion, versionDate, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, settingNames, settingsToSavePresets, nbPresets, defaultPresets, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, customFilterGuideURL, regexpDetectionPattern, availableFilterRulesType, filterSyntaxErrorTypes, specialFilterRules, ruleCategory, opacityDetectedAsTransparentThresholdDefault, defaultWebsiteSpecialFiltersConfig, defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, regexpDetectionPatternHighlight, ignoredElementsContentScript, failedUpdateAutoReupdateDelay, defaultInterfaceDarkTheme, defaultPopupTheme, percentageBlueLightDefaultValue, archiveInfoShowInterval, defaultSettings, settingsToLoad, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack, pageShadowClassListsMutationsToProcess, pageShadowClassListsMutationsToIgnore, permissionOrigin, customThemesKey, disabledWebsitesKey, whitelistKey, attenuateDefaultValue, maxImageSizeDarkImageDetection, quotaBytesPerItemMargin, mapFiltersCSSClass, ignoredElementsBrightTextColorDetection, websiteSpecialFiltersConfigThemes, maxElementsPerBatch, throttledTaskReduceThrottleMargin, websiteSpecialFiltersProcessingConfig, enableReportWebsiteProblem, reportWebsiteProblemBackendURL, pageAnalyzerCSSClasses, brightnessReductionElementId, blueLightReductionElementId, regexpMatchURL, sendMessageWithPromiseTimeout, wordToNumberMap };