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
import { settingNames, brightnessDefaultValue, defaultAutoEnableHourFormat, defaultHourEnable, defaultMinuteEnable, defaultHourEnableFormat, defaultHourDisable, defaultMinuteDisable, defaultHourDisableFormat, defaultPresets, defaultCustomThemes, defaultFilters, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode } from "./util.js";

function setSettingItem(name, value) {
    if(settingNames.indexOf(name) !== -1) {
        const newSetting = {};
        newSetting[name] = value;

        return chrome.storage.local.set(newSetting);
    } else {
        return false;
    }
}

function removeSettingItem(name) {
    if(name != undefined) {
        if(typeof(name) === "string") {
            chrome.storage.local.remove(name);
        } else if(Array.isArray(name)) {
            for(let i = 0; i < name.length; i++) {
                chrome.storage.local.remove(name[i]);
            }
        }
    }
}

function checkFirstLoad() {
    chrome.storage.local.get("defaultLoad", result => {
        if(result.defaultLoad == undefined) {
            chrome.storage.local.set({ "defaultLoad": "0" }, () => {
                setFirstSettings();
            });
        }
    });
}

function setFirstSettings(func) {
    // Set default settings values
    chrome.storage.local.set({
        "pageShadowEnabled": "false",
        "theme": "1",
        "pageLumEnabled": "false",
        "pourcentageLum": (brightnessDefaultValue * 100).toString(),
        "nightModeEnabled": "false",
        "sitesInterditPageShadow": "",
        "liveSettings": "true",
        "whiteList": "false",
        "colorTemp": "5",
        "colorInvert": "false",
        "invertPageColors": "false",
        "invertImageColors": "true",
        "invertEntirePage": "false",
        "invertVideoColors": "false",
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
        "defaultLoad": "0"
    }, () => {
        if(func) func();
    });
}

// Migrate deprecated settings
function migrateSettings() {
    chrome.storage.local.get(null, result => {
        // Migrate old custom theme settings
        if(result.customThemeBg != undefined || result.customThemeTexts != undefined || result.customThemeLinks != undefined || result.customThemeLinksVisited != undefined || result.customThemeFont != undefined || result.customCSSCode != undefined) {
            let customThemeBg = defaultBGColorCustomTheme;
            let customThemeTexts = defaultTextsColorCustomTheme;
            let customThemeLinks = defaultLinksColorCustomTheme;
            let customThemeLinksVisited = defaultVisitedLinksColorCustomTheme;
            let customThemeFont = defaultFontCustomTheme;
            let customCSSCode = defaultCustomCSSCode;
            let customThemes = defaultCustomThemes;

            if(result.customThemeBg != undefined) {
                customThemeBg = result.customThemeBg;
            }

            if(result.customThemeTexts != undefined) {
                customThemeTexts = result.customThemeTexts;
            }

            if(result.customThemeLinks != undefined) {
                customThemeLinks = result.customThemeLinks;
            }

            if(result.customThemeLinksVisited != undefined) {
                customThemeLinksVisited = result.customThemeLinksVisited;
            }

            if(result.customThemeFont != undefined) {
                customThemeFont = result.customThemeFont;
            }

            if(result.customCSSCode != undefined) {
                customCSSCode = result.customCSSCode;
            }

            if(result.customThemes != undefined && result.customThemes != undefined) {
                customThemes = result.customThemes;
            }

            customThemes["1"]["customThemeBg"] = customThemeBg;
            customThemes["1"]["customThemeTexts"] = customThemeTexts;
            customThemes["1"]["customThemeLinks"] = customThemeLinks;
            customThemes["1"]["customThemeLinksVisited"] = customThemeLinksVisited;
            customThemes["1"]["customThemeFont"] = customThemeFont;
            customThemes["1"]["customCSSCode"] = customCSSCode;

            setSettingItem("customThemes", customThemes);
            removeSettingItem(["customThemeBg", "customThemeTexts", "customThemeLinks", "customThemeLinksVisited", "customThemeFont", "customCSSCode"]);
        }
    });
}

export { setSettingItem, removeSettingItem, checkFirstLoad, setFirstSettings, migrateSettings };