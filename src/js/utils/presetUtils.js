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
import { sendMessageWithPromise, removeA } from "./util.js";
import { inArrayWebsite, commentMatched } from "./enableDisableUtils.js";
import { setSettingItem, migrateSettings } from "../storage.js";
import { settingsToSavePresets, nbPresets, defaultPresets, defaultSettings } from "../constants.js";
import browser from "webextension-polyfill";
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used for the preset feature of Page Shadow */

const debugLogger = new DebugLogger();

async function loadPresetSelect(selectId, i18next) {
    const selectElement = document.getElementById(selectId);

    let presetSelected = selectElement.value;

    if(!presetSelected) {
        presetSelected = "1";
    }

    let optionTitle = "";

    for(let i = 1; i <= nbPresets; i++) {
        const preset = await getPresetData(i);

        if(!preset || !Object.prototype.hasOwnProperty.call(preset, "name")) {
            optionTitle += `<option value="${i}">${i18next.t("modal.archive.presetTitle")}${i} : ${i18next.t("modal.archive.presetEmpty")}</option>`;
        } else {
            const presetName = preset["name"].trim() === ""
                ? i18next.t("modal.archive.presetTitleEmpty")
                : preset["name"].substring(0, 50);

            const element = document.createElement("div");
            element.textContent = presetName;

            optionTitle += `<option value="${i}">${i18next.t("modal.archive.presetTitle")}${i} : ${element.innerHTML}</option>`;
        }
    }

    selectElement.innerHTML = optionTitle;

    if(Array.from(selectElement.options).some(option => option.value === presetSelected)) {
        selectElement.value = presetSelected;
    } else {
        selectElement.value = selectElement.options[0]?.value || "1";
    }
}

async function presetsEnabled() {
    const data = await browser.storage.local.get("presets");

    try {
        let presets;

        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
            presets = defaultPresets;
        } else {
            presets = data.presets;
        }

        const listPreset = [];

        for(let i = 1; i <= nbPresets; i++) {
            if(presets[i]) {
                if(Object.prototype.hasOwnProperty.call(presets[i], "name")) {
                    listPreset.push(i);
                }
            }
        }

        return listPreset;
    } catch(e) {
        debugLogger.log(e, "error");
        throw "";
    }
}

async function loadPreset(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const data = await browser.storage.local.get("presets");

    try {
        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
            return "empty";
        }

        const preset = await getPresetData(nb);

        if(!preset) {
            return "empty";
        }

        let settingsRestored = 0;

        const settingsNames = JSON.parse(JSON.stringify(settingsToSavePresets));
        settingsNames.push("nightModeEnabled");
        settingsNames.push("attenuateImageColor");

        const finalRestoreObject = {};

        for(const key of settingsNames) {
            if(typeof(key) === "string") {
                if(Object.prototype.hasOwnProperty.call(preset, key)) {
                    if(key && settingsNames.indexOf(key) !== -1) {
                        finalRestoreObject[key] = preset[key];
                    }

                    settingsRestored++;
                } else {
                    finalRestoreObject[key] = defaultSettings[key];
                }
            }
        }

        await browser.storage.local.set(finalRestoreObject);
        await migrateSettings();
        sendMessageWithPromise({ "type": "updateSettingsCache" });
        sendMessageWithPromise({ "type": "updatePresetCache" });

        if(settingsRestored > 0) {
            return "success";
        } else {
            return "empty";
        }
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function getPresetData(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const data = await browser.storage.local.get("presets");

    try {
        let presets;

        if(data.presets == null || typeof(data.presets) == "undefined") {
            await setSettingItem("presets", defaultPresets);
        } else {
            presets = data.presets;
        }

        const namePreset = nb;
        const preset = presets[namePreset];

        if(!preset || Object.keys(preset).length <= 0) {
            return preset;
        }

        const settingsNames = JSON.parse(JSON.stringify(settingsToSavePresets));

        // Migrate Invert bright colors
        if (!preset["invertBrightColors"] && preset["invertEntirePage"] == "true") {
            preset["invertBrightColors"] = "true";
        }

        for(const key of settingsNames) {
            if(typeof(key) === "string") {
                if(!Object.prototype.hasOwnProperty.call(preset, key)) {
                    preset[key] = defaultSettings[key];
                }
            }
        }

        // Migrate Night mode filter
        if(preset["nightModeEnabled"] && preset["pageLumEnabled"] && preset["nightModeEnabled"] == "true" && preset["pageLumEnabled"] == "true") {
            preset["pageLumEnabled"] = "false";
            preset["blueLightReductionEnabled"] = "true";
            preset["percentageBlueLightReduction"] = preset["pourcentageLum"];
            preset["nightModeEnabled"] = undefined;
        }

        // Migrate Attenuate image color
        if(preset["attenuateImageColor"] == "true") {
            preset["attenuateColors"] = "true";
            preset["attenuateImgColors"] = "true";
            preset["attenuateBgColors"] = "true";
            preset["attenuateImageColor"] = undefined;
        }

        return preset;
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function getPresetWithAutoEnableForDarkWebsites() {
    const dataPreset = await browser.storage.local.get("presets");

    let presets;

    if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
        presets = defaultPresets;
    } else {
        presets = dataPreset.presets;
    }

    for(const presetKey in Object.keys(presets)) {
        const preset = presets[presetKey];

        if(preset && preset.autoEnablePresetForDarkWebsites && preset.autoEnablePresetForDarkWebsitesType) {
            return presetKey;
        }
    }

    return null;
}

async function savePreset(nb, name, websiteListToApply, saveNewSettings, saveAutoEnable, autoEnablePresetForDarkWebsites, autoEnablePresetForDarkWebsitesType) {
    const dataPreset = await browser.storage.local.get("presets");
    const data = await browser.storage.local.get(settingsToSavePresets);

    try {
        let presets;

        if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
            presets = defaultPresets;
        } else {
            presets = dataPreset.presets;
        }

        const namePreset = nb;

        if(!presets[namePreset]) presets[namePreset] = {};
        presets[namePreset].name = name.substring(0, 50);
        presets[namePreset].websiteListToApply = websiteListToApply;

        if(saveAutoEnable) {
            presets[namePreset].autoEnablePresetForDarkWebsites = autoEnablePresetForDarkWebsites ? true : false;
            presets[namePreset].autoEnablePresetForDarkWebsitesType = autoEnablePresetForDarkWebsitesType;
        }

        if(saveNewSettings) {
            for(const key in data) {
                if(typeof(key) === "string") {
                    if(Object.prototype.hasOwnProperty.call(data, key) && settingsToSavePresets.indexOf(key) !== -1) {
                        presets[namePreset][key] = data[key];
                    }
                }
            }

            presets[namePreset]["nightModeEnabled"] = false;
            presets[namePreset]["attenuateImageColor"] = false;
        }

        await setSettingItem("presets", presets);

        return "success";
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function deletePreset(nb) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const dataPreset = await browser.storage.local.get("presets");

    try {
        let presets;

        if(dataPreset.presets == null || typeof(dataPreset.presets) == "undefined") {
            presets = defaultPresets;
        } else {
            presets = dataPreset.presets;
        }

        const preset = presets;
        preset[nb] = {};

        await setSettingItem("presets", preset);

        return "success";
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

async function presetsEnabledForWebsite(url, disableCache) {
    let allPresetData;

    if(!disableCache) { // Get preset with cache
        const response = await sendMessageWithPromise({ "type": "getAllPresets" }, "getAllPresetsResponse");
        allPresetData = response.data;
    }

    return presetsEnabledForWebsiteWithData(url, allPresetData);
}

async function presetsEnabledForWebsiteWithData(url, allPresetData) {
    const presetListEnabled = [];

    if(url && url.trim() != "") {
        for(let i = 1; i <= nbPresets; i++) {
            let presetData;

            if(!allPresetData) {
                presetData = await getPresetData(i);
            } else {
                presetData = allPresetData[i];
            }

            if(presetData) {
                const websiteSettings = presetData.websiteListToApply;
                let websiteList = [];

                if(websiteSettings !== undefined && websiteSettings !== "") {
                    websiteList = websiteSettings.trim().split("\n");
                }

                let websiteUrlTmp;

                try {
                    websiteUrlTmp = new URL(url);
                } catch(e) {
                    debugLogger.log(e, "error");
                    return;
                }

                const domain = websiteUrlTmp.hostname;
                const autoEnabledWebsite = inArrayWebsite(domain, websiteList);
                const autoEnabledPage = inArrayWebsite(url, websiteList);

                if(autoEnabledWebsite || autoEnabledPage) {
                    presetListEnabled.push({
                        presetNb: i,
                        presetData,
                        autoEnabledWebsite: autoEnabledWebsite,
                        autoEnabledPage: autoEnabledPage
                    });
                }
            }
        }
    }

    return presetListEnabled;
}

function getPriorityPresetEnabledForWebsite(presetsEnabled) {
    // Priority : a preset auto enabled for a page has a higher priority than a preset auto enabled for a webiste
    let presetEnabled = presetsEnabled[0];

    for(let i = 0, len = presetsEnabled.length; i < len; i++) {
        const preset = presetsEnabled[i];

        if((preset.autoEnabledWebsite && !presetEnabled.autoEnabledPage && !presetEnabled.autoEnabledWebsite) || preset.autoEnabledPage) {
            presetEnabled = preset;
        }
    }

    return presetEnabled;
}

async function disableEnablePreset(type, nb, checked, url) {
    if(nb < 1 || nb > nbPresets) {
        return "error";
    }

    const preset = await getPresetData(nb);
    if(!preset) return "error";

    try {
        const domain = url.hostname;
        const href = url.href;
        let match = domain;
        let websitesPagesArray;

        const websiteListToApply = preset["websiteListToApply"];

        if(websiteListToApply == undefined && websiteListToApply !== "") {
            websitesPagesArray = [];
        } else {
            websitesPagesArray = websiteListToApply.split("\n");
        }

        switch(type) {
        case "toggle-website":
            match = domain;
            break;
        case "toggle-webpage":
            match = href;
            break;
        }

        let disabledWebsitesNew;

        if(checked) {
            websitesPagesArray.push(match);
            websitesPagesArray = removeA(websitesPagesArray, "").join("\n");
            disabledWebsitesNew = websitesPagesArray;
        } else {
            disabledWebsitesNew = removeA(websitesPagesArray, match);
            disabledWebsitesNew = commentMatched(disabledWebsitesNew, match);
            disabledWebsitesNew = removeA(disabledWebsitesNew, "").join("\n");
        }

        await savePreset(nb, preset.name, disabledWebsitesNew, false);

        return "success";
    } catch(e) {
        debugLogger.log(e, "error");
        return "error";
    }
}

export { deletePreset, getPresetData, getPresetWithAutoEnableForDarkWebsites, getPriorityPresetEnabledForWebsite, loadPreset, loadPresetSelect, presetsEnabled, presetsEnabledForWebsite, presetsEnabledForWebsiteWithData, savePreset, disableEnablePreset };