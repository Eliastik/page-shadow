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
import { inArrayWebsite, disableEnableToggle, pageShadowAllowed, getUImessage, getAutoEnableSavedData, checkAutoEnableStartup, checkChangedStorageData, presetsEnabled, loadPreset, getSettings, normalizeURL, processShadowRootStyle, archiveCloud } from "./utils/util.js";
import { defaultFilters, nbPresets, ruleCategory, failedUpdateAutoReupdateDelay } from "./constants.js";
import { setSettingItem, checkFirstLoad, migrateSettings } from "./storage.js";
import FilterProcessor from "./classes/filters.js";
import browser from "webextension-polyfill";
import PresetCache from "./classes/presetCache.js";
import SettingsCache from "./classes/settingsCache.js";
import DebugLogger from "./classes/debugLogger.js";

let autoEnableActivated = false;
let lastAutoEnableDetected = null;
let isAutoUpdatingFilters = false;
const globalPageShadowStyleCache = {};
const globalPageShadowStyleShadowRootsCache = {};

const filters = new FilterProcessor();
const presetCache = new PresetCache();
const settingsCache = new SettingsCache();
const debugLogger = new DebugLogger();

let updatingMenu = false;

function setPopup() {
    if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setPopup) !== "undefined") {
        browser.browserAction.setPopup({
            popup: "../extension.html"
        });
    } else if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.onClicked) !== "undefined" && typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.create) !== "undefined") {
        // For Firefox for Android
        browser.browserAction.onClicked.addListener(tab => {
            if(typeof(tab.id) !== "undefined") {
                browser.tabs.create({
                    url: "../extension.html?tabId="+ tab.id
                });
            } else {
                browser.tabs.create({
                    url: "../extension.html"
                });
            }
        });
    }
}

function createContextMenu(id, type, title, contexts, checked) {
    if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.create) !== "undefined") {
        browser.contextMenus.create({
            id: id,
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        }, () => {
            if(browser.runtime.lastError) {
                debugLogger.log(`Error creating context menu - id = ${id} / type = ${type} / title = ${title} / contexts = ${contexts} / checked = ${checked}`, "error", browser.runtime.lastError);
                return; // ignore the error messages
            }
        });
    }
}

// eslint-disable-next-line no-unused-vars
function updateContextMenu(id, type, title, contexts, checked) {
    if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.update) !== "undefined") {
        browser.contextMenus.update(id, {
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        }).then(() => {
            if(browser.runtime.lastError) {
                debugLogger.log(`Error updating context menu - id = ${id} / type = ${type} / title = ${title} / contexts = ${contexts} / checked = ${checked}`, "error", browser.runtime.lastError);
                return; // ignore the error messages
            }
        });
    }
}

async function deleteContextMenu(id) {
    if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.remove) !== "undefined") {
        await browser.contextMenus.remove(id);
    }
}

async function updateMenu() {
    async function createMenu() {
        if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.local) !== "undefined") {
            const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable", "disableRightClickMenu"]);
            if(result.disableRightClickMenu == "true") return;

            let sitesInterdits;

            if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
                sitesInterdits = "";
            } else {
                sitesInterdits = result.sitesInterditPageShadow.split("\n");
            }

            if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.query) !== "undefined") {
                const tabs = await browser.tabs.query({active: true, currentWindow: true});
                if(!tabs || tabs.length <= 0) return;

                const tabUrl = tabs[0].url;
                if(!tabUrl || tabUrl.trim() == "") return;

                // Don't show the right-click menu on extension pages
                const extensionDomain = browser.runtime.getURL("");
                if(tabUrl.startsWith(extensionDomain)) return;

                const urlStr = normalizeURL(tabUrl);
                let url;

                try {
                    url = new URL(urlStr);
                } catch(e) {
                    debugLogger.log(e, "error");
                    return;
                }

                const domain = url.hostname;
                const href = url.href;
                const isFileURL = urlStr.startsWith("file:///") || urlStr.startsWith("about:");

                if(result.whiteList == "true") {
                    if(!isFileURL) {
                        if(inArrayWebsite(domain, sitesInterdits) || inArrayWebsite(href, sitesInterdits)) {
                            createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
                        } else {
                            createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
                        }
                    }

                    if(inArrayWebsite(href, sitesInterdits) || inArrayWebsite(domain, sitesInterdits)) {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], false);

                        if(inArrayWebsite(domain, sitesInterdits)) {
                            await deleteContextMenu("disable-webpage");
                        } else if(inArrayWebsite(href, sitesInterdits)) {
                            await deleteContextMenu("disable-website");
                        }
                    } else {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], true);
                    }
                } else {
                    if(!isFileURL) {
                        if(inArrayWebsite(domain, sitesInterdits)) {
                            createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
                        } else {
                            createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
                        }
                    }

                    if(inArrayWebsite(href, sitesInterdits)) {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], true);
                    } else {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], false);
                    }
                }

                await createMenuOthers();
            } else {
                await createMenuOthers();
            }
        }
    }

    async function createMenuOthers() {
        const data = await browser.storage.local.get(["globallyEnable", "disableRightClickMenu"]);
        if(data.disableRightClickMenu == "true") return;

        if(data.globallyEnable == "false") {
            createContextMenu("disable-globally", "checkbox", getUImessage("disableGlobally"), ["all"], true);
        } else {
            createContextMenu("disable-globally", "checkbox", getUImessage("disableGlobally"), ["all"], false);
        }

        const result = await presetsEnabled();

        if(result !== false && Array.isArray(result) && result.length > 0) {
            createContextMenu("separator-presets", "separator", null, ["all"], false);

            for(let i = 0; i < result.length; i++) {
                if(result[i] <= nbPresets) {
                    createContextMenu("load-preset-" + result[i], "normal", getUImessage("loadPreset") + result[i], ["all"], false);
                }
            }
        }
    }

    if(updatingMenu) {
        return;
    }

    updatingMenu = true;

    try {
        if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.removeAll) !== "undefined") {
            await browser.contextMenus.removeAll();
            await createMenu();
        } else {
            await createMenu();
        }
    } catch(e) {
        debugLogger.log("Background - updateMenu - Error updating menu", "error", e);
    } finally {
        updatingMenu = false;
    }
}

async function updateBadge(storageChanged) {
    if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.query) !== "undefined") {
        const tabs = await browser.tabs.query({ active: true });

        for(const tab of tabs) {
            if(!tab || tab.url.trim() == "") continue;

            const url = tab.url;
            const enabled = await pageShadowAllowed(normalizeURL(url));

            if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setBadgeText) !== "undefined") {
                browser.browserAction.setBadgeText({
                    text: " ",
                    tabId: tab.id
                });
            }

            if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setBadgeBackgroundColor) !== "undefined") {
                if(enabled) {
                    browser.browserAction.setBadgeBackgroundColor({
                        color: "#2ecc71",
                        tabId: tab.id
                    });
                } else {
                    browser.browserAction.setBadgeBackgroundColor({
                        color: "#e74c3c",
                        tabId: tab.id
                    });
                }
            }

            if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setTitle) !== "undefined") {
                if(!enabled) {
                    browser.browserAction.setTitle({
                        title: "Page Shadow (" + getUImessage("pageShadowDisabled") + ")",
                        tabId: tab.id
                    });
                } else {
                    browser.browserAction.setTitle({
                        title: "Page Shadow",
                        tabId: tab.id
                    });
                }
            }

            if(typeof(browser.tabs.sendMessage) !== "undefined") {
                browser.tabs.sendMessage(tab.id, {
                    type: "websiteUrlUpdated",
                    enabled,
                    storageChanged
                }).catch(() => {
                    if(browser.runtime.lastError) {
                        debugLogger.log(`Error sending message with type = websiteUrlUpdated / enabled = ${enabled} / storageChanged = ${storageChanged} / url = ${url} to tab with id = ${tab.id}`, "error", browser.runtime.lastError);
                        return; // ignore the error messages
                    }
                });
            }
        }
    }
}

async function checkAutoEnable() {
    if(autoEnableActivated) {
        const data = await getAutoEnableSavedData();
        const enabled = checkAutoEnableStartup(data[6], data[4], data[7], data[5]);

        if(enabled && !lastAutoEnableDetected || enabled && lastAutoEnableDetected == null) {
            await setSettingItem("globallyEnable", "true");
            lastAutoEnableDetected = true;
        } else if(!enabled && lastAutoEnableDetected || !enabled && lastAutoEnableDetected == null) {
            await setSettingItem("globallyEnable", "false");
            lastAutoEnableDetected = false;
        }
    }
}

async function checkAutoUpdateFilters() {
    const result = await browser.storage.local.get("filtersSettings");
    const filterResults = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
    const lastUpdate = filterResults.lastUpdated;
    const updateInterval = filterResults.updateInterval;
    const enableAutoUpdate = filterResults.enableAutoUpdate;
    const currentDate = Date.now();
    const lastFailedUpdate = filterResults.lastFailedUpdate;

    if(enableAutoUpdate && updateInterval > 0 && (lastUpdate <= 0 || (currentDate - lastUpdate) >= updateInterval)) {
        isAutoUpdatingFilters = true;
        filters.updateAllFilters(true, false).then(() => {
            isAutoUpdatingFilters = false;
        });
    } else if(enableAutoUpdate && lastFailedUpdate != null && lastFailedUpdate > -1 && ((currentDate - lastFailedUpdate) >= failedUpdateAutoReupdateDelay)) {
        isAutoUpdatingFilters = true;
        filters.updateAllFilters(true, true).then(() => {
            isAutoUpdatingFilters = false;
        });
    }
}

async function checkAutoBackupCloud() {
    const result = await browser.storage.local.get(["autoBackupCloudInterval", "lastAutoBackupCloud"]);
    const lastAutoBackupCloud = !result.lastAutoBackupCloud ? 0 : result.lastAutoBackupCloud;

    if(result.autoBackupCloudInterval > 0 && lastAutoBackupCloud + (result.autoBackupCloudInterval * 60 * 60 * 24 * 1000) <= Date.now()) {
        try {
            await archiveCloud();
            await setSettingItem("lastAutoBackupFailed", "false");
            await setSettingItem("lastAutoBackupFailedLastShowed", "false");
            await setSettingItem("lastAutoBackupFailedDate", -1);
            await setSettingItem("lastAutoBackupCloud", Date.now());
        } catch(e) {
            debugLogger.log(e, "error");
            await setSettingItem("lastAutoBackupFailed", "true");
            await setSettingItem("lastAutoBackupFailedDate", Date.now());
            await setSettingItem("lastAutoBackupCloud", Date.now());
        }
    }
}

async function autoEnable(changed) {
    if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.local) !== "undefined") {
        const result = await browser.storage.local.get("autoEnable");

        if(result.autoEnable == "true") {
            autoEnableActivated = true;
        } else {
            autoEnableActivated = false;
        }

        if(typeof(changed) === "undefined" || changed == null || checkChangedStorageData(["hourEnable", "minuteEnable", "hourDisable", "minuteDisable"], changed)) {
            lastAutoEnableDetected = null;
            checkAutoEnable();
        }
    }
}

if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.onChanged) !== "undefined") {
    browser.storage.onChanged.addListener((_changes, areaName) => {
        if(areaName == "local") {
            updateMenu();
            updateBadge(true);
        }
    });
}

if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.onActivated) !== "undefined") {
    browser.tabs.onActivated.addListener(() => {
        updateMenu();
        updateBadge(false);
    });
}

if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.onUpdated) !== "undefined") {
    browser.tabs.onUpdated.addListener(() => {
        updateMenu();
        updateBadge(false);
    });
}

if(typeof(browser.windows) !== "undefined" && typeof(browser.windows.onFocusChanged) !== "undefined") {
    browser.windows.onFocusChanged.addListener(windowId => {
        if(windowId != browser.windows.WINDOW_ID_NONE) {
            updateMenu();
        }
    });
}

if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.onChanged) !== "undefined") {
    browser.storage.onChanged.addListener(changes => {
        autoEnable(changes);
    });
}

if(typeof(browser.runtime) !== "undefined" && typeof(browser.runtime.onMessage) !== "undefined") {
    browser.runtime.onMessage.addListener(async (message, sender) => {
        if (message && message.type === "ready") {
            const tabId = sender.tab.id;
            const url = sender.tab.url;

            // Update cache if needed
            if(presetCache.isInit) {
                await presetCache.updateCache();
            }

            if(settingsCache.isInit) {
                await settingsCache.updateCache();
            }

            const data = {
                settings: await getSettings(url, false, settingsCache.data, presetCache.data),
                customThemes: settingsCache.customThemes,
                enabled: await pageShadowAllowed(url, {
                    sitesInterditPageShadow: settingsCache.disabledWebsites,
                    whiteList: settingsCache.isWhiteList,
                    globallyEnable: settingsCache.data.globallyEnable
                })
            };

            browser.tabs.sendMessage(tabId, { type: "preApplySettings", data });
        }
    });

    browser.runtime.onMessage.addListener((message, sender) => {
        new Promise(resolve => {
            if(message) {
                if(message.type == "openTab") {
                    openTab(message.url, message.part);
                }

                if(message.type == "updatePresetCache") {
                    presetCache.updateCache();
                }

                if(message.type == "updateSettingsCache") {
                    settingsCache.updateCache();
                }

                if(!sender.tab) return;
                const tabURL = normalizeURL(sender.tab.url);
                const pageURL = normalizeURL(sender.url);

                if(message.type == "isEnabledForThisPage" || message.type == "applySettingsChanged") {
                    const checkEnabledForThisPage = () => {
                        pageShadowAllowed(tabURL, {
                            sitesInterditPageShadow: settingsCache.disabledWebsites,
                            whiteList: settingsCache.isWhiteList,
                            globallyEnable: settingsCache.data.globallyEnable
                        }).then(async(enabled) => {
                            const settings = await getSettings(tabURL, true);
                            resolve({ type: message.type + "Response", enabled, settings: settings });
                        });
                    };

                    if(message.type == "applySettingsChanged") {
                        settingsCache.updateCache().then(() => {
                            checkEnabledForThisPage();
                        });
                    } else {
                        checkEnabledForThisPage();
                    }
                } else if(message.type == "updateAllFilters") {
                    filters.updateAllFilters().then(() => {
                        resolve({ type: "updateAllFiltersFinished", result: true });
                    });
                } else if(message.type == "updateFilter") {
                    filters.updateOneFilter(message.filterId).then(result => {
                        resolve({ type: "updateFilterFinished", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "checkUpdateNeededForFilters") {
                    filters.checkAllFiltersNeedUpdate().then(result => {
                        resolve({ type: "getUpdateNeededForFilterFinished", result: result });
                    });
                } else if(message.type == "disableFilter") {
                    filters.toggleFilter(message.filterId, false).then(result => {
                        resolve({ type: "disabledFilter", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "enableFilter") {
                    filters.toggleFilter(message.filterId, true).then(result => {
                        resolve({ type: "enabledFilter", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "cleanAllFilters") {
                    filters.cleanAllFilters().then(result => {
                        resolve({ type: "cleanAllFiltersFinished", result: result });
                    });
                } else if(message.type == "addFilter") {
                    filters.addFilter(message.address).then(result => {
                        resolve({ type: "addFilterFinished", result: result });
                    }).catch(error => {
                        resolve({ type: "addFilterError", error: error });
                    });
                } else if(message.type == "removeFilter") {
                    filters.removeFilter(message.filterId).then(result => {
                        resolve({ type: "addFilterFinished", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "toggleAutoUpdate") {
                    filters.toggleAutoUpdate(message.enabled).then(result => {
                        resolve({ type: "toggleAutoUpdateFinished", result: result });
                    });
                } else if(message.type == "getCustomFilter") {
                    filters.getCustomFilter().then(result => {
                        resolve({ type: "getCustomFilterFinished", result: result });
                    });
                } else if(message.type == "updateCustomFilter" || message.type == "updateCustomFilterAndClose") {
                    filters.updateCustomFilter(message.text).then(result => {
                        resolve({ type: message.type == "updateCustomFilter" ?
                            "updateCustomFilterFinished" : "updateCustomFilterAndCloseFinished", result: result });
                    });
                } else if(message.type == "getAllFilters") {
                    resolve({ type: "getFiltersResponse", filters: filters.getRules() });
                } else if(message.type == "getFiltersForThisWebsite") {
                    resolve({ type: "getFiltersResponse", filters: filters.getRulesForWebsite(pageURL, ruleCategory.STANDARD_RULES), specialFilters: filters.getRulesForWebsite(pageURL, ruleCategory.SPECIAL_RULES) });
                } else if(message.type == "reinstallDefaultFilters") {
                    filters.reinstallDefaultFilters().then(result => {
                        resolve({ type: "reinstallDefaultFiltersResponse", result: result });
                    });
                } else if(message.type == "getNumberOfRules") {
                    filters.getNumberOfRulesFor(message.idFilter).then(count => {
                        resolve({ type: "getNumberOfRulesResponse", count: count });
                    });
                } else if(message.type == "getSpecialRules") {
                    resolve({ type: "getSpecialRulesResponse", filters: filters.getRulesForWebsite(pageURL, ruleCategory.SPECIAL_RULES) });
                } else if(message.type == "getNumberOfTotalRules") {
                    resolve({ type: "getNumberOfTotalRulesResponse", count: filters.getNumberOfTotalRules() });
                } else if(message.type == "getFiltersSize") {
                    filters.getFiltersSize().then(size => {
                        resolve({ type: "getFiltersSizeResponse", size: size });
                    });
                } else if(message.type == "getNumberOfCustomFilterRules") {
                    filters.getNumberOfRulesFor("customFilter").then(count => {
                        resolve({ type: "getNumberOfCustomFilterRulesResponse", count: count });
                    });
                } else if(message.type == "getRulesErrorsForCustomEdit" || message.type == "getRulesErrorCustomFilter") {
                    filters.getRulesErrors("customFilter").then(data => {
                        resolve({ type: message.type + "Response", data: data });
                    });
                } else if(message.type == "getRulesErrors") {
                    filters.getRulesErrors(message.idFilter).then(data => {
                        resolve({ type: "getRulesErrorsResponse", data: data, typeFilter: message.idFilter == "customFilter" ? "custom" : "normal" });
                    });
                } else if(message.type == "getFilterRuleNumberErrors") {
                    filters.getRulesErrors(message.idFilter).then(data => {
                        resolve({ type: "getFilterRuleNumberErrorsResponse", data: data });
                    });
                } else if(message.type == "getGlobalPageShadowStyle" || message.type == "getGlobalShadowRootPageShadowStyle") {
                    const url = message.what == "invert" ? "/css/content_invert.css" : "/css/content.css";

                    if(globalPageShadowStyleCache[url] && globalPageShadowStyleShadowRootsCache[url]) {
                        resolve({ type: message.type + "Response", data: message.type == "getGlobalShadowRootPageShadowStyle" ? globalPageShadowStyleShadowRootsCache[url] : globalPageShadowStyleCache[url] });
                    }

                    fetch(url).then(response => {
                        if(response) {
                            response.text().then(text => {
                                globalPageShadowStyleCache[url] = processShadowRootStyle(text);
                                globalPageShadowStyleShadowRootsCache[url] = processShadowRootStyle(text);

                                resolve({ type: message.type + "Response", data: message.type == "getGlobalShadowRootPageShadowStyle" ? globalPageShadowStyleShadowRootsCache[url] : globalPageShadowStyleCache[url] });
                            });
                        }
                    });
                } else if(message.type == "getPreset") {
                    const data = presetCache.getPresetData(message.idPreset);
                    resolve({ type: "getPresetResponse", data: data });
                } else if(message.type == "getAllPresets") {
                    const data = presetCache.getAllPresetsData();
                    resolve({ type: "getAllPresetsResponse", data: data });
                } else if(message.type == "getSettings") {
                    const data = settingsCache.data;
                    resolve({ type: "getSettingsResponse", data: data });
                }
            }
        }).then(result => {
            if(typeof(browser.tabs.sendMessage) !== "undefined") {
                browser.tabs.sendMessage(sender.tab.id, result, {
                    frameId: sender.frameId
                }).catch(() => {
                    if(browser.runtime.lastError) {
                        debugLogger.log(`Error sending message with type = ${result.type} and data = ${result.data} to tab with id ${sender.tab.id} and frameId = ${sender.frameId}`, "error", browser.runtime.lastError);
                        return; // ignore the error messages
                    }
                });
            }
        });
    });
}

if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.onClicked) !== "undefined") {
    browser.contextMenus.onClicked.addListener(async(info, tab) => {
        const url = normalizeURL(tab.url);
        let urlObj;

        try {
            urlObj = new URL(url);
        } catch(e) {
            debugLogger.log(e, "error");
            return;
        }

        await disableEnableToggle(info.menuItemId, info.checked && !info.wasChecked, urlObj);

        if(info.menuItemId.substring(0, 11) == "load-preset") {
            const nbPreset = info.menuItemId.substr(12, info.menuItemId.length - 11);
            loadPreset(nbPreset);
        }

        updateMenu();
    });
}

if(typeof(browser.commands) !== "undefined" && typeof(browser.commands.onCommand) !== "undefined") {
    browser.commands.onCommand.addListener(async(command) => {
        switch(command) {
        case "enableDisable": {
            const result = await browser.storage.local.get("globallyEnable");

            if(result.globallyEnable == "false") {
                await setSettingItem("globallyEnable", "true");
            } else {
                await setSettingItem("globallyEnable", "false");
            }
            break;
        }
        case "enablePresetOne":
            loadPreset(1);
            break;
        case "enablePresetTwo":
            loadPreset(2);
            break;
        case "enablePresetThree":
            loadPreset(3);
            break;
        case "enablePresetFour":
            loadPreset(4);
            break;
        case "enablePresetFive":
            loadPreset(5);
            break;
        case "enablePresetSix":
            loadPreset(6);
            break;
        case "enablePresetSeven":
            loadPreset(7);
            break;
        case "enablePresetEight":
            loadPreset(8);
            break;
        case "enablePresetNine":
            loadPreset(9);
            break;
        case "enablePresetTen":
            loadPreset(10);
            break;
        case "enablePresetEleven":
            loadPreset(11);
            break;
        case "enablePresetTwelve":
            loadPreset(12);
            break;
        case "enablePresetThirteen":
            loadPreset(13);
            break;
        case "enablePresetFourteen":
            loadPreset(14);
            break;
        case "enablePresetFifteen":
            loadPreset(15);
            break;
        }
    });
}

async function openTab(url, part) {
    const tabs = await browser.tabs.query({ url: url });
    const completeURL = url + "" + (part ? "#" + part : "");

    if(tabs.length === 0) {
        browser.tabs.create({
            url: completeURL
        });
    } else {
        const tab = tabs[0];

        const updateDetails = { active: true };

        if(!tab.url.startsWith(completeURL)) {
            updateDetails.url = completeURL;
        }

        const updateTab = await browser.tabs.update(tab.id, updateDetails);
        browser.windows.update(updateTab.windowId, { focused: true });

        if(part) {
            browser.tabs.sendMessage(updateTab.id, {
                type: "hashUpdated"
            }).catch(() => {
                if(browser.runtime.lastError) {
                    debugLogger.log(`Error sending message with type = hashUpdated to tab with id ${updateTab.id}`, "error", browser.runtime.lastError);
                    return; // ignore the error messages
                }
            });
        }
    }
}

async function setupPageShadow() {
    setPopup();
    await updateMenu();
    await checkFirstLoad();
    await migrateSettings(filters);
    await settingsCache.updateCache();
    await presetCache.updateCache();
    await autoEnable();
    await updateBadge(false);
    await checkAutoBackupCloud();
}

setupPageShadow();

setInterval(() => {
    checkAutoEnable();

    if(!isAutoUpdatingFilters) {
        checkAutoUpdateFilters();
    }
}, 1000);