/* Page Shadow
 *
 * Copyright (C) 2015-2018 Eliastik (eliastiksofts.com)
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
if(typeof(window["defaultHourEnable"]) == "undefined") defaultHourEnable = "20";
if(typeof(window["defaultMinuteEnable"]) == "undefined") defaultMinuteEnable = "0";
if(typeof(window["defaultHourDisable"]) == "undefined") defaultHourDisable = "7";
if(typeof(window["defaultMinuteDisable"]) == "undefined") defaultMinuteDisable = "0";
var autoEnableActivated = false;
var lastAutoEnableDetected = null;

function setPopup() {
    if(typeof(chrome.browserAction) !== 'undefined' && typeof(chrome.browserAction.setPopup) !== 'undefined') {
        chrome.browserAction.setPopup({
            popup: "../extension.html"
        });
    } else if(typeof(chrome.browserAction) !== 'undefined' && typeof(chrome.browserAction.onClicked) !== 'undefined' && typeof(chrome.tabs) !== 'undefined' && typeof(chrome.tabs.create) !== 'undefined') {
        // For Firefox for Android
        chrome.browserAction.onClicked.addListener(function(tab) {
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
    if(typeof(chrome.contextMenus) !== 'undefined' && typeof(chrome.contextMenus.create) !== 'undefined') {
        chrome.contextMenus.create({
            id: id,
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        }, function() {
            if(chrome.runtime.lastError) return; // ignore the error messages
        });
    }
}

function updateContextMenu(id, type, title, contexts, checked) {
    if(typeof(chrome.contextMenus) !== 'undefined' && typeof(chrome.contextMenus.update) !== 'undefined') {
        chrome.contextMenus.update(id, {
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        }, function() {
            if(chrome.runtime.lastError) return; // ignore the error messages
        });
    }
}

function deleteContextMenu(id) {
    if(typeof(chrome.contextMenus) !== 'undefined' && typeof(chrome.contextMenus.remove) !== 'undefined') {
        chrome.contextMenus.remove(id);
    }
}

function menu() {
    function createMenu() {
        if(typeof(chrome.storage) !== 'undefined' && typeof(chrome.storage.local) !== 'undefined') {
            chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList', 'globallyEnable'], function (result) {
                if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == 'undefined' || result.sitesInterditPageShadow.trim() == '') {
                    var siteInterdits = "";
                } else {
                    var siteInterdits = result.sitesInterditPageShadow.split("\n");
                }

                if(typeof(chrome.tabs) !== 'undefined' && typeof(chrome.tabs.query) !== 'undefined') {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        var tabUrl = tabs[0].url;

                        var url = new URL(tabUrl);
                        var domain = url.hostname;
                        var href = url.href;

                        if(result.whiteList == "true") {
                            if(strict_in_array(domain, siteInterdits)) {
                                createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
                            } else {
                                createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
                            }
                        } else {
                            if(strict_in_array(domain, siteInterdits)) {
                                createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
                            } else {
                                createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
                            }

                            if(strict_in_array(href, siteInterdits)) {
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
        chrome.storage.local.get(['globallyEnable'], function (result) {
            if(result.globallyEnable == "false") {
                createContextMenu("disable-globally", "checkbox", getUImessage("disableGlobally"), ["all"], true);
            } else {
                createContextMenu("disable-globally", "checkbox", getUImessage("disableGlobally"), ["all"], false);
            }

            presetsEnabled(function(resultat) {
                if(resultat !== false && Array.isArray(resultat) && resultat.length > 0) {
                    createContextMenu("separator-presets", "separator", null, ["all"], false);

                    for(var i = 0; i < resultat.length; i++) {
                        if(resultat[i] <= nbPresets) {
                            createContextMenu("load-preset-" + resultat[i], "normal", getUImessage("loadPreset") + resultat[i], ["all"], false);
                        }
                    }
                }
            });
        });
    }

    if(typeof(chrome.contextMenus) !== 'undefined' && typeof(chrome.contextMenus.removeAll) !== 'undefined') {
        chrome.contextMenus.removeAll(function() {
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
    if(typeof(chrome.tabs) !== 'undefined' && typeof(chrome.tabs.query) !== 'undefined') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            pageShadowAllowed(tabs[0].url, function(enabled) {
                if(typeof(chrome.browserAction) !== 'undefined' && typeof(chrome.browserAction.setBadgeText) !== 'undefined') {
                    chrome.browserAction.setBadgeText({
                        text: " "
                    });
                }

                if(typeof(chrome.browserAction) !== 'undefined' && typeof(chrome.browserAction.setBadgeBackgroundColor) !== 'undefined') {
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

                if(typeof(chrome.browserAction) !== 'undefined' && typeof(chrome.browserAction.setTitle) !== 'undefined') {
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
            });
        });
    }
}

function checkAutoEnable() {
    if(autoEnableActivated) {
        getAutoEnableSavedData(function(data) {
            var enabled = checkAutoEnableStartup(data[6], data[4], data[7], data[5]);

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

function autoEnable(changed) {
    if(typeof(chrome.storage) !== 'undefined' && typeof(chrome.storage.local) !== 'undefined') {
        chrome.storage.local.get("autoEnable", function (result) {
            if(result.autoEnable == "true") {
                autoEnableActivated = true;
            } else {
                autoEnableActivated = false;
            }

            if(typeof(changed) === "undefined" || changed == null || checkChangedStorageData(["hourEnable", 'minuteEnable', 'hourDisable', 'minuteDisable'], changed)) {
                lastAutoEnableDetected = null;
                checkAutoEnable();
            }
        });
    }
}

setPopup();
menu();
updateBadge();
autoEnable();
var intervalCheckAutoEnable = setInterval(function() { checkAutoEnable(); }, 1000);

if(typeof(chrome.storage) !== 'undefined' && typeof(chrome.storage.onChanged) !== 'undefined') {
    chrome.storage.onChanged.addListener(function() {
        menu();
        updateBadge();
    });
}

if(typeof(chrome.tabs) !== 'undefined' && typeof(chrome.tabs.onActivated) !== 'undefined') {
    chrome.tabs.onActivated.addListener(function() {
        menu();
        updateBadge();
    });
}

if(typeof(chrome.tabs) !== 'undefined' && typeof(chrome.tabs.onUpdated) !== 'undefined') {
    chrome.tabs.onUpdated.addListener(function() {
        menu();
        updateBadge();
    });
}

if(typeof(chrome.storage) !== 'undefined' && typeof(chrome.storage.onChanged) !== 'undefined') {
    chrome.storage.onChanged.addListener(function(changes) {
        autoEnable(changes);
    });
}

if(typeof(chrome.contextMenus) !== 'undefined' && typeof(chrome.contextMenus.onClicked) !== 'undefined') {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList'], function (result) {
            var disabledWebsites = '';
            var disabledWebsitesEmpty = false;
            var url = new URL(tab.url);
            var domain = url.hostname;

            if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == 'undefined') {
                var disabledWebsitesEmpty = true;
                var disabledWebsitesArray = [];
            } else {
                var disabledWebsites = result.sitesInterditPageShadow;
                var disabledWebsitesArray = disabledWebsites.split("\n");
                var disabledWebsitesEmpty = false;
            }

            switch(info.menuItemId) {
                case "disable-website":
                    if(result.whiteList == "true") {
                        if(info.checked == true && info.wasChecked == false) {
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, domain);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                        } else {
                            disabledWebsitesArray.push(domain);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                        }
                    } else {
                        if(info.checked == true && info.wasChecked == false) {
                            disabledWebsitesArray.push(domain);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                        } else {
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, domain);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                        }
                    }
                    break;
                case "disable-webpage":
                    if(info.checked == true && info.wasChecked == false) {
                        disabledWebsitesArray.push(tab.url);
                        var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                        setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                    } else {
                        var disabledWebsitesNew = removeA(disabledWebsitesArray, tab.url);
                        var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                        setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                    }
                    break;
                case "disable-globally":
                    if(info.checked == true && info.wasChecked == false) {
                        setSettingItem("globallyEnable", "false");
                    } else {
                        setSettingItem("globallyEnable", "true");
                    }
                    break;
            }

            if(info.menuItemId.substring(0, 11) == "load-preset") {
                var nbPreset = info.menuItemId.substr(12, info.menuItemId.length - 11);
                loadPreset(nbPreset, function(resultat){});
            }
        });
    });
}
