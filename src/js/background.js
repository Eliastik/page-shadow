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
import { updateOneFilter, updateAllFilters, toggleFilter, cleanAllFilters, addFilter, removeFilter } from "./filters.js";

let autoEnableActivated = false;
let lastAutoEnableDetected = null;

function setPopup() {
    if(typeof(chrome.browserAction) !== "undefined" && typeof(chrome.browserAction.setPopup) !== "undefined") {
        chrome.browserAction.setPopup({
            popup: "../extension.html"
        });
    } else if(typeof(chrome.browserAction) !== "undefined" && typeof(chrome.browserAction.onClicked) !== "undefined" && typeof(chrome.tabs) !== "undefined" && typeof(chrome.tabs.create) !== "undefined") {
        // For Firefox for Android
        chrome.browserAction.onClicked.addListener(tab => {
            if(typeof(tab.id) !== "undefined") {
                chrome.tabs.create({
                    url: "../extension.html?tabId="+ tab.id
                });
            } else {
                chrome.tabs.create({
                    url: "../extension.html"
                });
            }
        });
    }
}

function createContextMenu(id, type, title, contexts, checked) {
    if(typeof(chrome.contextMenus) !== "undefined" && typeof(chrome.contextMenus.create) !== "undefined") {
        chrome.contextMenus.create({
            id: id,
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        }, () => {
            if(chrome.runtime.lastError) return; // ignore the error messages
        });
    }
}

// eslint-disable-next-line no-unused-vars
function updateContextMenu(id, type, title, contexts, checked) {
    if(typeof(chrome.contextMenus) !== "undefined" && typeof(chrome.contextMenus.update) !== "undefined") {
        chrome.contextMenus.update(id, {
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        }, () => {
            if(chrome.runtime.lastError) return; // ignore the error messages
        });
    }
}

function deleteContextMenu(id) {
    if(typeof(chrome.contextMenus) !== "undefined" && typeof(chrome.contextMenus.remove) !== "undefined") {
        chrome.contextMenus.remove(id);
    }
}

function menu() {
    function createMenu() {
        if(typeof(chrome.storage) !== "undefined" && typeof(chrome.storage.local) !== "undefined") {
            chrome.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"], result => {
                let sitesInterdits;

                if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
                    sitesInterdits = "";
                } else {
                    sitesInterdits = result.sitesInterditPageShadow.split("\n");
                }

                if(typeof(chrome.tabs) !== "undefined" && typeof(chrome.tabs.query) !== "undefined") {
                    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
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
        chrome.storage.local.get(["globallyEnable"], result => {
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

    if(typeof(chrome.contextMenus) !== "undefined" && typeof(chrome.contextMenus.removeAll) !== "undefined") {
        chrome.contextMenus.removeAll(() => {
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
    if(typeof(chrome.tabs) !== "undefined" && typeof(chrome.tabs.query) !== "undefined") {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            pageShadowAllowed(tabs[0].url, enabled => {
                if(typeof(chrome.browserAction) !== "undefined" && typeof(chrome.browserAction.setBadgeText) !== "undefined") {
                    chrome.browserAction.setBadgeText({
                        text: " "
                    });
                }

                if(typeof(chrome.browserAction) !== "undefined" && typeof(chrome.browserAction.setBadgeBackgroundColor) !== "undefined") {
                    if(enabled) {
                        chrome.browserAction.setBadgeBackgroundColor({
                            color: "#2ecc71"
                        });
                    } else {
                        chrome.browserAction.setBadgeBackgroundColor({
                            color: "#e74c3c"
                        });
                    }
                }

                if(typeof(chrome.browserAction) !== "undefined" && typeof(chrome.browserAction.setTitle) !== "undefined") {
                    if(!enabled) {
                        chrome.browserAction.setTitle({
                            title: "Page Shadow (" + getUImessage("pageShadowDisabled") + ")"
                        });
                    } else {
                        chrome.browserAction.setTitle({
                            title: "Page Shadow"
                        });
                    }
                }

                if(typeof(chrome.tabs.sendMessage) !== "undefined") {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: "websiteUrlUpdated",
                        enabled: enabled
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
    chrome.storage.local.get("filtersSettings", result => {
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        const lastUpdate = filters.lastUpdated;
        const updateInterval = filters.updateInterval;
        const currentDate = Date.now();

        if(updateInterval > 0 && (lastUpdate <= 0 || (currentDate - lastUpdate) >= updateInterval)) {
            updateAllFilters();
        }
    });
}

function autoEnable(changed) {
    if(typeof(chrome.storage) !== "undefined" && typeof(chrome.storage.local) !== "undefined") {
        chrome.storage.local.get("autoEnable", result => {
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

if(typeof(chrome.storage) !== "undefined" && typeof(chrome.storage.onChanged) !== "undefined") {
    chrome.storage.onChanged.addListener(() => {
        menu();
        updateBadge();
    });
}

if(typeof(chrome.tabs) !== "undefined" && typeof(chrome.tabs.onActivated) !== "undefined") {
    chrome.tabs.onActivated.addListener(() => {
        menu();
        updateBadge();
    });
}

if(typeof(chrome.tabs) !== "undefined" && typeof(chrome.tabs.onUpdated) !== "undefined") {
    chrome.tabs.onUpdated.addListener(() => {
        menu();
        updateBadge();
    });
}

if(typeof(chrome.storage) !== "undefined" && typeof(chrome.storage.onChanged) !== "undefined") {
    chrome.storage.onChanged.addListener(changes => {
        autoEnable(changes);
    });
}

if(typeof(chrome.runtime) !== "undefined" && typeof(chrome.runtime.onMessage) !== "undefined") {
    chrome.runtime.onMessage.addListener((message, sender, sendMessage) => {
        if(message) {
            if(message.type == "isEnabledForThisPage") {
                pageShadowAllowed(sender.tab.url, enabled => {
                    sendMessage({ type: "isEnabledForThisPageResponse", enabled: enabled });
                });
            } else if(message.type == "updateAllFilters") {
                updateAllFilters().then(result => {
                    sendMessage({ type: "updateAllFiltersFinished", result: result });
                });
            } else if(message.type == "updateFilter") {
                updateOneFilter(message.filterId).then(result => {
                    sendMessage({ type: "updateFilterFinished", result: result, filterId: message.filterId });
                });
            } else if(message.type == "disableFilter") {
                toggleFilter(message.filterId, false).then(result => {
                    sendMessage({ type: "disabledFilter", result: result, filterId: message.filterId });
                });
            } else if(message.type == "enableFilter") {
                toggleFilter(message.filterId, true).then(result => {
                    sendMessage({ type: "enabledFilter", result: result, filterId: message.filterId });
                });
            } else if(message.type == "cleanAllFilters") {
                cleanAllFilters().then(result => {
                    sendMessage({ type: "cleanAllFiltersFinished", result: result });
                });
            } else if(message.type == "addFilter") {
                addFilter(message.address).then(result => {
                    sendMessage({ type: "addFilterFinished", result: result });
                }).catch(error => {
                    sendMessage({ type: "addFilterError", error: error });
                });
            } else if(message.type == "removeFilter") {
                removeFilter(message.filterId).then(result => {
                    sendMessage({ type: "addFilterFinished", result: result, filterId: message.filterId });
                });
            }
        }

        return true;
    });
}

if(typeof(chrome.contextMenus) !== "undefined" && typeof(chrome.contextMenus.onClicked) !== "undefined") {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        disableEnableToggle(info.menuItemId, info.checked && !info.wasChecked, new URL(tab.url), () => {
            if(info.menuItemId.substring(0, 11) == "load-preset") {
                const nbPreset = info.menuItemId.substr(12, info.menuItemId.length - 11);
                loadPreset(nbPreset);
            }

            updateMenu();
        });
    });
}

if(typeof(chrome.commands) !== "undefined" && typeof(chrome.commands.onCommand) !== "undefined") {
    chrome.commands.onCommand.addListener(command => {
        if(command == "enableDisable") {
            chrome.storage.local.get("globallyEnable", result => {
                if(result.globallyEnable == "false") {
                    setSettingItem("globallyEnable", "true");
                } else {
                    setSettingItem("globallyEnable", "false");
                }
            });
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