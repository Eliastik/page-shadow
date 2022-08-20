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
import { extensionVersion, defaultSettings, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, settingNames, defaultCustomThemes } from "./constants.js";
import browser from "webextension-polyfill";

function setSettingItem(name, value) {
    if(settingNames.indexOf(name) !== -1) {
        const newSetting = {};
        newSetting[name] = value;

        return browser.storage.local.set(newSetting);
    } else {
        return false;
    }
}

function removeSettingItem(name) {
    if(name != undefined) {
        if(typeof(name) === "string") {
            browser.storage.local.remove(name);
        } else if(Array.isArray(name)) {
            for(let i = 0; i < name.length; i++) {
                browser.storage.local.remove(name[i]);
            }
        }
    }
}

async function checkFirstLoad() {
    const result = await browser.storage.local.get("defaultLoad");

    if(result.defaultLoad == undefined) {
        await browser.storage.local.set({ "defaultLoad": "0" });
        setFirstSettings();
    }
}

async function setFirstSettings() {
    // Set default settings values
    await browser.storage.local.set(defaultSettings);
    return true;
}

// Migrate deprecated settings
async function migrateSettings(filters) {
    const result = await browser.storage.local.get(null);

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

        await setSettingItem("customThemes", customThemes);
        removeSettingItem(["customThemeBg", "customThemeTexts", "customThemeLinks", "customThemeLinksVisited", "customThemeFont", "customCSSCode"]);
    }

    // Migrate default filters
    if(filters && result.updateNotification && !result.updateNotification[extensionVersion]) {
        filters.updateDefaultFilters();
    }

    // Migrate Night mode filter
    if(result.nightModeEnabled && result.pageLumEnabled && result.nightModeEnabled == "true" && result.pageLumEnabled == "true") {
        await setSettingItem("pageLumEnabled", "false");
        await setSettingItem("blueLightReductionEnabled", "true");
        await setSettingItem("percentageBlueLightReduction", result.pourcentageLum);
    }

    removeSettingItem(["nightModeEnabled"]);
}

export { setSettingItem, removeSettingItem, checkFirstLoad, setFirstSettings, migrateSettings };