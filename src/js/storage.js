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
import { extensionVersion, defaultSettings, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, settingNames, defaultCustomThemes, settingsToLoad, customThemesKey, disabledWebsitesKey, whitelistKey, attenuateDefaultValue, defaultWebsiteSpecialFiltersConfig } from "./constants.js";
import { sendMessageWithPromise } from "./utils/util.js";
import browser from "webextension-polyfill";

async function setSettingItem(name, value, disableCacheUpdating) {
    if(name && settingNames.indexOf(name) !== -1) {
        const newSetting = {};
        newSetting[name] = value;

        await browser.storage.local.set(newSetting);

        // If we update a website setting (increase contrast, invert colors, etc.)
        // The cache is updated
        if(!disableCacheUpdating && (settingsToLoad.includes(name) || name === customThemesKey
            || name === disabledWebsitesKey || name === whitelistKey)) {
            sendMessageWithPromise({ "type": "updateSettingsCache" });
        }

        // If the presets are updated, we update the cache
        if(!disableCacheUpdating && name.toLowerCase() === "presets") {
            sendMessageWithPromise({ "type": "updatePresetCache" });
        }

        return true;
    }

    return false;
}

async function removeSettingItem(name) {
    if(name != undefined) {
        if(typeof(name) === "string") {
            await browser.storage.local.remove(name);
        } else if(Array.isArray(name)) {
            for(let i = 0; i < name.length; i++) {
                await browser.storage.local.remove(name[i]);
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
    sendMessageWithPromise({ "type": "updateSettingsCache" });
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

        await setSettingItem("customThemes", customThemes, true);
        await removeSettingItem(["customThemeBg", "customThemeTexts", "customThemeLinks", "customThemeLinksVisited", "customThemeFont", "customCSSCode"]);
    }

    // Migrate default filters
    if(filters && result.updateNotification && !result.updateNotification[extensionVersion]) {
        await filters.updateDefaultFilters();
    }

    // Migrate Night mode filter
    if(result.nightModeEnabled && result.pageLumEnabled && result.nightModeEnabled == "true" && result.pageLumEnabled == "true") {
        await setSettingItem("pageLumEnabled", "false", true);
        await setSettingItem("blueLightReductionEnabled", "true", true);
        await setSettingItem("percentageBlueLightReduction", result.pourcentageLum, true);
    }

    // Migrate Attenuate color settings
    if(result.attenuateImageColor) {
        if(result.attenuateImageColor == "true") {
            await setSettingItem("attenuateColors", "true", true);
        } else {
            await setSettingItem("attenuateColors", "false", true);
        }

        await setSettingItem("attenuateImgColors", "true", true);
        await setSettingItem("attenuateBgColors", "true", true);
    }

    // Migrate Invert colors settings
    if(!result.invertBrightColors && result.invertEntirePage == "true") {
        await setSettingItem("invertBrightColors", "true", true);
    }

    // Migrate Attenuate color settings (filter intensity)
    if(!result.percentageAttenuateColors) {
        await setSettingItem("percentageAttenuateColors", (attenuateDefaultValue * 100).toString(), true);
    }

    await removeSettingItem(["nightModeEnabled", "attenuateImageColor"]);

    // Migrate advanced options
    const currentMigratedAdvancedOptions = result.migratedAdvancedOptions;

    if(!currentMigratedAdvancedOptions || !currentMigratedAdvancedOptions[extensionVersion]) {
        const currentAdvancedOptions = result.advancedOptionsFiltersSettings;

        if (currentAdvancedOptions) {
            currentAdvancedOptions.backgroundDetectionStartDelay = defaultWebsiteSpecialFiltersConfig.backgroundDetectionStartDelay;
            currentAdvancedOptions.darkImageDetectionHslTreshold = defaultWebsiteSpecialFiltersConfig.darkImageDetectionHslTreshold;
            currentAdvancedOptions.delayMutationObserverBackgrounds = defaultWebsiteSpecialFiltersConfig.delayMutationObserverBackgrounds;
            currentAdvancedOptions.enableDarkImageDetection = defaultWebsiteSpecialFiltersConfig.enableDarkImageDetection;
            currentAdvancedOptions.throttleBackgroundDetectionElementsTreatedByCall = defaultWebsiteSpecialFiltersConfig.throttleBackgroundDetectionElementsTreatedByCall;
            currentAdvancedOptions.throttleMutationObserverBackgrounds = defaultWebsiteSpecialFiltersConfig.throttleMutationObserverBackgrounds;
            currentAdvancedOptions.throttledMutationObserverTreatedByCall = defaultWebsiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall;
            currentAdvancedOptions.throttleBackgroundDetection = defaultWebsiteSpecialFiltersConfig.throttleBackgroundDetection;
            currentAdvancedOptions.opacityDetectedAsTransparentThreshold = defaultWebsiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold;
        }

        await setSettingItem("advancedOptionsFiltersSettings", currentAdvancedOptions);

        const newMigratedAdvancedOptions = currentMigratedAdvancedOptions || {};
        newMigratedAdvancedOptions[extensionVersion] = true;

        await setSettingItem("migratedAdvancedOptions", newMigratedAdvancedOptions);
    }
}

export { setSettingItem, removeSettingItem, checkFirstLoad, setFirstSettings, migrateSettings };