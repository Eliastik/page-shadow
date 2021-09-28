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
import { in_array_website, disableEnableToggle, pageShadowAllowed, getUImessage, getAutoEnableSavedData, checkAutoEnableStartup, checkChangedStorageData, presetsEnabled, loadPreset, nbPresets, defaultFilters } from "./util.js";
import { setSettingItem, checkFirstLoad, migrateSettings } from "./storage.js";
import { updateOneFilter, updateAllFilters, toggleFilter, cleanAllFilters, addFilter, removeFilter, toggleAutoUpdate, getCustomFilter, updateCustomFilter, getRules } from "./filters.js";
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

function menu() {
    function createMenu() {
        if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.local) !== "undefined") {
            browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"]).then(result => {
                let sitesInterdits;

                if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
                    sitesInterdits = "";
                } else {
                    sitesInterdits = result.sitesInterditPageShadow.split("\n");
                }

                if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.query) !== "undefined") {
                    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
                        const tabUrl = tabs[0].url;

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
                    });
                } else {
                    createMenuOthers();
                }
            });
        }
    }

    function createMenuOthers() {
        browser.storage.local.get(["globallyEnable"]).then(result => {
            if(result.globallyEnable == "false") {
                createContextMenu("disable-globally", "checkbox", getUImessage("disableGlobally"), ["all"], true);
            } else {
                createContextMenu("disable-globally", "checkbox", getUImessage("disableGlobally"), ["all"], false);
            }

            presetsEnabled(resultat => {
                if(resultat !== false && Array.isArray(resultat) && resultat.length > 0) {
                    createContextMenu("separator-presets", "separator", null, ["all"], false);

                    for(let i = 0; i < resultat.length; i++) {
                        if(resultat[i] <= nbPresets) {
                            createContextMenu("load-preset-" + resultat[i], "normal", getUImessage("loadPreset") + resultat[i], ["all"], false);
                        }
                    }
                }
            });
        });
    }

    if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.removeAll) !== "undefined") {
        browser.contextMenus.removeAll().then(() => {
            createMenu();
        });
    } else {
        createMenu();
    }
}

function updateMenu() {
    menu();
}

function updateBadge() {
    if(typeof(browser.tabs) !== "undefined" && typeof(browser.tabs.query) !== "undefined") {
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            pageShadowAllowed(tabs[0].url, enabled => {
                if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setBadgeText) !== "undefined") {
                    browser.browserAction.setBadgeText({
                        text: " "
                    });
                }

                if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setBadgeBackgroundColor) !== "undefined") {
                    if(enabled) {
                        browser.browserAction.setBadgeBackgroundColor({
                            color: "#2ecc71"
                        });
                    } else {
                        browser.browserAction.setBadgeBackgroundColor({
                            color: "#e74c3c"
                        });
                    }
                }

                if(typeof(browser.browserAction) !== "undefined" && typeof(browser.browserAction.setTitle) !== "undefined") {
                    if(!enabled) {
                        browser.browserAction.setTitle({
                            title: "Page Shadow (" + getUImessage("pageShadowDisabled") + ")"
                        });
                    } else {
                        browser.browserAction.setTitle({
                            title: "Page Shadow"
                        });
                    }
                }

                if(typeof(browser.tabs.sendMessage) !== "undefined") {
                    browser.tabs.sendMessage(tabs[0].id, {
                        type: "websiteUrlUpdated",
                        enabled: enabled
                    }).then(() => {
                        if(browser.runtime.lastError) return; // ignore the error messages
                    });
                }
            });
        });
    }
}

function checkAutoEnable() {
    if(autoEnableActivated) {
        getAutoEnableSavedData(data => {
            const enabled = checkAutoEnableStartup(data[6], data[4], data[7], data[5]);

            if(enabled && !lastAutoEnableDetected || enabled && lastAutoEnableDetected == null) {
                setSettingItem("globallyEnable", "true");
                lastAutoEnableDetected = true;
            } else if(!enabled && lastAutoEnableDetected || !enabled && lastAutoEnableDetected == null) {
                setSettingItem("globallyEnable", "false");
                lastAutoEnableDetected = false;
            }
        });
    }
}

function checkAutoUpdateFilters() {
    browser.storage.local.get("filtersSettings").then(result => {
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        const lastUpdate = filters.lastUpdated;
        const updateInterval = filters.updateInterval;
        const enableAutoUpdate = filters.enableAutoUpdate;
        const currentDate = Date.now();

        if(enableAutoUpdate && updateInterval > 0 && (lastUpdate <= 0 || (currentDate - lastUpdate) >= updateInterval)) {
            updateAllFilters(true);
        }
    });
}

function autoEnable(changed) {
    if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.local) !== "undefined") {
        browser.storage.local.get("autoEnable").then(result => {
            if(result.autoEnable == "true") {
                autoEnableActivated = true;
            } else {
                autoEnableActivated = false;
            }

            if(typeof(changed) === "undefined" || changed == null || checkChangedStorageData(["hourEnable", "minuteEnable", "hourDisable", "minuteDisable"], changed)) {
                lastAutoEnableDetected = null;
                checkAutoEnable();
            }
        });
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

if(typeof(browser.storage) !== "undefined" && typeof(browser.storage.onChanged) !== "undefined") {
    browser.storage.onChanged.addListener(changes => {
        autoEnable(changes);
    });
}

if(typeof(browser.runtime) !== "undefined" && typeof(browser.runtime.onMessage) !== "undefined") {
    browser.runtime.onMessage.addListener((message, sender) => {
        new Promise(resolve => {
            if(message) {
                if(message.type == "isEnabledForThisPage") {
                    pageShadowAllowed(sender.tab.url, enabled => {
                        resolve({ type: "isEnabledForThisPageResponse", enabled: enabled });
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
                } else if(message && message.type == "getAllFilters") {
                    resolve({ type: "getAllFiltersResponse", filters: getRules() });
                }
            }
        }).then(result => {
            browser.tabs.sendMessage(sender.tab.id, result);
        });
    });
}

if(typeof(browser.contextMenus) !== "undefined" && typeof(browser.contextMenus.onClicked) !== "undefined") {
    browser.contextMenus.onClicked.addListener((info, tab) => {
        disableEnableToggle(info.menuItemId, info.checked && !info.wasChecked, new URL(tab.url), () => {
            if(info.menuItemId.substring(0, 11) == "load-preset") {
                const nbPreset = info.menuItemId.substr(12, info.menuItemId.length - 11);
                loadPreset(nbPreset);
            }

            updateMenu();
        });
    });
}

if(typeof(browser.commands) !== "undefined" && typeof(browser.commands.onCommand) !== "undefined") {
    browser.commands.onCommand.addListener(command => {
        switch(command) {
        case "enableDisable":
            browser.storage.local.get("globallyEnable").then(result => {
                if(result.globallyEnable == "false") {
                    setSettingItem("globallyEnable", "true");
                } else {
                    setSettingItem("globallyEnable", "false");
                }
            });
            break;
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