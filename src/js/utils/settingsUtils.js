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
import { sendMessageWithPromise } from "./browserUtils.js";
import { getPriorityPresetEnabledForWebsite, presetsEnabledForWebsiteWithData, presetsEnabledForWebsite } from "./presetUtils.js";
import { settingsToLoad, defaultSettings } from "../constants.js";
import browser from "webextension-polyfill";

/** Utils function used to get settings of Page Shadow */

function getDefaultSettingsToLoad() {
    const settings = {};

    for(const setting of settingsToLoad) {
        if(Object.prototype.hasOwnProperty.call(defaultSettings, setting)) {
            settings[setting] = defaultSettings[setting];
        }
    }

    return settings;
}

function fillSettings(settings, newSettings) {
    for(const key of Object.keys(settings)) {
        settings[key] = newSettings[key];
    }
}

async function getGlobalSettings(disableCache, settingsData) {
    const settings = getDefaultSettingsToLoad();

    let newSettings = {};

    if(settingsData) {
        newSettings = settingsData;
    } else if(!disableCache) {
        const settingsResponse = await sendMessageWithPromise({ "type": "getSettings" }, "getSettingsResponse");
        newSettings = settingsResponse.data;
    } else {
        newSettings = await browser.storage.local.get(settingsToLoad);
    }

    fillSettings(settings, newSettings);
    migrateDeprecatedSettings(settings);

    return settings;
}

async function getSettingsFromPresets(url, disableCache, allPresetData) {
    // Automatically enable preset ?
    let presetsEnabled;

    if(allPresetData) {
        presetsEnabled = await presetsEnabledForWebsiteWithData(url, allPresetData);
    } else {
        presetsEnabled = await presetsEnabledForWebsite(url, disableCache);
    }

    if(presetsEnabled && presetsEnabled.length > 0) {
        const presetEnabled = getPriorityPresetEnabledForWebsite(presetsEnabled);

        if(presetEnabled && presetEnabled.presetNb > 0) {
            const settings = getDefaultSettingsToLoad();
            const presetData = presetEnabled.presetData;

            fillSettings(settings, presetData);
            migrateDeprecatedSettings(settings);

            return settings;
        }
    }

    return null;
}

async function getSettings(url, disableCache, settingsData, allPresetData) {
    const presetData = await getSettingsFromPresets(url, disableCache, allPresetData);

    if(presetData) {
        return presetData;
    }

    return getGlobalSettings(disableCache, settingsData);
}

function migrateDeprecatedSettings(settings) {
    if (settings.colorInvert == "true") {
        settings.colorInvert = "true";
        settings.invertImageColors = "true";
    } else if (settings.invertPageColors == "true") {
        settings.colorInvert = "true";
    } else {
        settings.colorInvert = "false";
    }

    if (settings.attenuateImageColor == "true") {
        settings.attenuateColors = "true";
        settings.attenuateImgColors = "true";
        settings.attenuateBgColors = "true";
    }

    if (settings.nightModeEnabled == "true" && settings.pageLumEnabled == "true") {
        settings.blueLightReductionEnabled = "true";
        settings.percentageBlueLightReduction = settings.pourcentageLum;
        settings.nightModeEnabled = "false";
    }
}

function hasSettingsChanged(currentSettings, newSettings, customThemeChanged) {
    if(currentSettings == null) {
        return true;
    }

    for(const settingKey of Object.keys(currentSettings)) {
        if(currentSettings[settingKey] !== newSettings[settingKey]) {
            return true;
        }
    }

    if(currentSettings.theme && newSettings.theme
        && currentSettings.theme.startsWith("custom") && newSettings.theme.startsWith("custom") && customThemeChanged) {
        return true;
    }

    return false;
}

export { getDefaultSettingsToLoad, fillSettings, getSettings, hasSettingsChanged, getGlobalSettings, getSettingsFromPresets };