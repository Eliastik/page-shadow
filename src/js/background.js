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
import { in_array_website, disableEnableToggle, pageShadowAllowed, getUImessage, getAutoEnableSavedData, checkAutoEnableStartup, checkChangedStorageData, presetsEnabled, loadPreset, getSettings } from "./util.js";
import { defaultFilters, nbPresets } from "./constants.js";
import { setSettingItem, checkFirstLoad, migrateSettings } from "./storage.js";
import { updateOneFilter, updateAllFilters, toggleFilter, cleanAllFilters, addFilter, removeFilter, toggleAutoUpdate, getCustomFilter, updateCustomFilter, getRules, getRulesForWebsite, getNumberOfRulesFor, reinstallDefaultFilters, isPerformanceModeEnabledFor, getNumberOfTotalRules, getFiltersSize } from "./filters.js";
import browser from "webextension-polyfill";

let autoEnableActivated = false;
let lastAutoEnableDetected = null;

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
            if(browser.runtime.lastError) return; // ignore the error messages
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
            if(browser.runtime.lastError) return; // ignore the error messages
        });
    }
}

function deleteContextMenu(id) {
    if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.remove) !== "undefined") {
        browser.contextMenus.remove(id);
    }
}

async function menu() {
    async function createMenu() {
        if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.local) !== "undefined") {
            const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"]);
            let sitesInterdits;

            if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
                sitesInterdits = "";
            } else {
                sitesInterdits = result.sitesInterditPageShadow.split("\n");
            }

            if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.query) !== "undefined") {
                const tabs = await browser.tabs.query({active: true, currentWindow: true});
                if(!tabs) return;
                const tabUrl = tabs[0].url;
                if(!tabUrl || tabUrl.trim() == "") return;

                const url = new URL(tabUrl);
                const domain = url.hostname;
                const href = url.href;

                if(result.whiteList == "true") {
                    if(in_array_website(domain, sitesInterdits) || in_array_website(href, sitesInterdits)) {
                        createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
                    } else {
                        createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
                    }

                    if(in_array_website(href, sitesInterdits) || in_array_website(domain, sitesInterdits)) {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], false);

                        if(in_array_website(domain, sitesInterdits)) {
                            deleteContextMenu("disable-webpage");
                        } else if(in_array_website(href, sitesInterdits)) {
                            deleteContextMenu("disable-website");
                        }
                    } else {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], true);
                    }
                } else {
                    if(in_array_website(domain, sitesInterdits)) {
                        createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
                    } else {
                        createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
                    }

                    if(in_array_website(href, sitesInterdits)) {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], true);
                    } else {
                        createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], false);
                    }
                }

                createMenuOthers();
            } else {
                createMenuOthers();
            }
        }
    }

    async function createMenuOthers() {
        const data = await browser.storage.local.get(["globallyEnable"]);

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

    if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.removeAll) !== "undefined") {
        await browser.contextMenus.removeAll();
        createMenu();
    } else {
        createMenu();
    }
}

function updateMenu() {
    menu();
}

async function updateBadge() {
    if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.query) !== "undefined") {
        const tabs = await browser.tabs.query({ active: true });

        for(const tab of tabs) {
            if(!tab || tab.url.trim() == "") continue;

            const enabled = await pageShadowAllowed(tab.url);
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
                    enabled: enabled
                }).catch(() => {
                    if(browser.runtime.lastError) return; // ignore the error messages
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
            setSettingItem("globallyEnable", "true");
            lastAutoEnableDetected = true;
        } else if(!enabled && lastAutoEnableDetected || !enabled && lastAutoEnableDetected == null) {
            setSettingItem("globallyEnable", "false");
            lastAutoEnableDetected = false;
        }
    }
}

async function checkAutoUpdateFilters() {
    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
    const lastUpdate = filters.lastUpdated;
    const updateInterval = filters.updateInterval;
    const enableAutoUpdate = filters.enableAutoUpdate;
    const currentDate = Date.now();

    if(enableAutoUpdate && updateInterval > 0 && (lastUpdate <= 0 || (currentDate - lastUpdate) >= updateInterval)) {
        updateAllFilters(true);
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
    browser.storage.onChanged.addListener(() => {
        menu();
        updateBadge();
    });
}

if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.onActivated) !== "undefined") {
    browser.tabs.onActivated.addListener(() => {
        menu();
        updateBadge();
    });
}

if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.onUpdated) !== "undefined") {
    browser.tabs.onUpdated.addListener(() => {
        menu();
        updateBadge();
    });
}

if(typeof(browser.windows) !== "undefined" && typeof(browser.windows.onFocusChanged) !== "undefined") {
    browser.windows.onFocusChanged.addListener(windowId => {
        if(windowId != browser.windows.WINDOW_ID_NONE) {
            menu();
        }
    });
}

if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.onChanged) !== "undefined") {
    browser.storage.onChanged.addListener(changes => {
        autoEnable(changes);
    });
}

if(typeof(browser.runtime) !== "undefined" && typeof(browser.runtime.onMessage) !== "undefined") {
    browser.runtime.onMessage.addListener((message, sender) => {
        new Promise(resolve => {
            if(message) {
                const url = sender.tab.url;

                if(message.type == "isEnabledForThisPage") {
                    pageShadowAllowed(url).then(async(enabled) => {
                        const settings = await getSettings(url);
                        resolve({ type: "isEnabledForThisPageResponse", enabled: enabled, settings: settings });
                    });
                } else if(message.type == "updateAllFilters") {
                    updateAllFilters().then(result => {
                        resolve({ type: "updateAllFiltersFinished", result: result });
                    });
                } else if(message.type == "updateFilter") {
                    updateOneFilter(message.filterId).then(result => {
                        resolve({ type: "updateFilterFinished", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "disableFilter") {
                    toggleFilter(message.filterId, false).then(result => {
                        resolve({ type: "disabledFilter", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "enableFilter") {
                    toggleFilter(message.filterId, true).then(result => {
                        resolve({ type: "enabledFilter", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "cleanAllFilters") {
                    cleanAllFilters().then(result => {
                        resolve({ type: "cleanAllFiltersFinished", result: result });
                    });
                } else if(message.type == "addFilter") {
                    addFilter(message.address).then(result => {
                        resolve({ type: "addFilterFinished", result: result });
                    }).catch(error => {
                        resolve({ type: "addFilterError", error: error });
                    });
                } else if(message.type == "removeFilter") {
                    removeFilter(message.filterId).then(result => {
                        resolve({ type: "addFilterFinished", result: result, filterId: message.filterId });
                    });
                } else if(message.type == "toggleAutoUpdate") {
                    toggleAutoUpdate(message.enabled).then(result => {
                        resolve({ type: "toggleAutoUpdateFinished", result: result });
                    });
                } else if(message.type == "getCustomFilter") {
                    getCustomFilter().then(result => {
                        resolve({ type: "getCustomFilterFinished", result: result });
                    });
                } else if(message.type == "updateCustomFilter" || message.type == "updateCustomFilterAndClose") {
                    updateCustomFilter(message.text).then(result => {
                        resolve({ type: message.type == "updateCustomFilter" ?
                            "updateCustomFilterFinished" : "updateCustomFilterAndCloseFinished", result: result });
                    });
                } else if(message.type == "getAllFilters") {
                    resolve({ type: "getFiltersResponse", filters: getRules() });
                } else if(message.type == "getFiltersForThisWebsite") {
                    resolve({ type: "getFiltersResponse", filters: getRulesForWebsite(sender.url) });
                } else if(message.type == "reinstallDefaultFilters") {
                    reinstallDefaultFilters().then(result => {
                        resolve({ type: "reinstallDefaultFiltersResponse", result: result });
                    });
                } else if(message.type == "getNumberOfRules") {
                    getNumberOfRulesFor(message.idFilter).then(count => {
                        resolve({ type: "getNumberOfRulesResponse", count: count });
                    });
                } else if(message.type == "isPerformanceModeEnabledForThisPage") {
                    resolve({ type: "isPerformanceModeEnabledForThisPageResponse", enabled: isPerformanceModeEnabledFor(url) });
                } else if(message.type == "getNumberOfTotalRules") {
                    resolve({ type: "getNumberOfTotalRulesResponse", count: getNumberOfTotalRules() });
                } else if(message.type == "getFiltersSize") {
                    getFiltersSize().then(size => {
                        resolve({ type: "getFiltersSizeResponse", size: size });
                    });
                }
            }
        }).then(result => {
            if(typeof(browser.tabs.sendMessage) !== "undefined") {
                browser.tabs.sendMessage(sender.tab.id, result, {
                    frameId: sender.frameId
                });
            }
        });
    });
}

if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.onClicked) !== "undefined") {
    browser.contextMenus.onClicked.addListener(async(info, tab) => {
        await disableEnableToggle(info.menuItemId, info.checked && !info.wasChecked, new URL(tab.url));

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
                setSettingItem("globallyEnable", "true");
            } else {
                setSettingItem("globallyEnable", "false");
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
        }
    });
}

setPopup();
menu();
updateBadge();
autoEnable();
checkFirstLoad();
migrateSettings();
setInterval(() => {
    checkAutoEnable();
    checkAutoUpdateFilters();
}, 1000);