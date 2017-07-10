function setPopup() {
    if(typeof(chrome.browserAction.setPopup) !== 'undefined') {
        chrome.browserAction.setPopup({
            popup: "../extension.html"
        });
    } else if(typeof(chrome.browserAction.onClicked) !== 'undefined') {
        setSettingItem("pageShadowEnabled", "Oui");
        // For Firefox for Android
        chrome.browserAction.onClicked.addListener(function() {
            setSettingItem("theme", "2");
            chrome.tabs.create({
                url: "../extension.html"
            });
        });
    }
}

function createContextMenu(id, type, title, contexts, checked) {
    if(typeof(chrome.contextMenus.create) !== 'undefined') {
        chrome.contextMenus.create({
            id: id,
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        });
    }
}

function updateContextMenu(id, type, title, contexts, checked) {
    if(typeof(chrome.contextMenus.update) !== 'undefined') {
        chrome.contextMenus.update(id, {
            type: type,
            title: title,
            contexts: contexts,
            checked: checked
        });
    }
}

function menu() {
    if(typeof(chrome.contextMenus.removeAll) !== 'undefined') chrome.contextMenus.removeAll();

    createContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
    createContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], false);
}

function updateMenu() {
    chrome.storage.local.get('sitesInterditPageShadow', function (result) {
        if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == 'undefined' || result.sitesInterditPageShadow.trim() == '') {
            var siteInterdits = "";
        } else {
            var siteInterdits = result.sitesInterditPageShadow.split("\n");
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var tabUrl = tabs[0].url;

            var url = new URL(tabUrl);
            var domain = url.hostname;

            if(strict_in_array(domain, siteInterdits)) {
                updateContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], true);
            } else {
                updateContextMenu("disable-website", "checkbox", getUImessage("disableWebsite"), ["all"], false);
            }

            if(strict_in_array(tabUrl, siteInterdits)) {
                updateContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], true);
            } else {
                updateContextMenu("disable-webpage", "checkbox", getUImessage("disableWebpage"), ["all"], false);
            }
        });
    });
}

setPopup();
menu();
updateMenu();

if(typeof(chrome.storage.onChanged) !== 'undefined') {
    chrome.storage.onChanged.addListener(function() {
        updateMenu();
    });
}

if(typeof(chrome.tabs.onActivated) !== 'undefined') {
    chrome.tabs.onActivated.addListener(function() {
        updateMenu();
    });
}

if(typeof(chrome.tabs.onUpdated) !== 'undefined') {
    chrome.tabs.onUpdated.addListener(function() {
        updateMenu();
    });
}

if(typeof(chrome.contextMenus.onClicked) !== 'undefined') {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        chrome.storage.local.get('sitesInterditPageShadow', function (result) {
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

            switch (info.menuItemId) {
                case "disable-website":
                    if(info.checked == true && info.wasChecked == false) {
                        disabledWebsitesArray.push(domain);
                        var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                        setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                    } else {
                        var disabledWebsitesNew = removeA(disabledWebsitesArray, domain);
                        var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                        setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
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
            }

            updateMenu();
        });
    });
}
