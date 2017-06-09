function setSettingItem(name, value) {
    switch(name) {
        case 'pageShadowEnabled':
            chrome.storage.local.set({'pageShadowEnabled': value});
            break;
        case 'theme':
            chrome.storage.local.set({'theme': value});
            break;
        case 'colorInvert':
            chrome.storage.local.set({'colorInvert': value});
            break;
        case 'pageLumEnabled':
            chrome.storage.local.set({'pageLumEnabled': value});
            break;
        case 'pourcentageLum':
            chrome.storage.local.set({'pourcentageLum': value});
            break;
        case 'nightModeEnabled':
            chrome.storage.local.set({'nightModeEnabled': value});
            break;
        case 'sitesInterditPageShadow':
            chrome.storage.local.set({'sitesInterditPageShadow': value});
            break;
        case 'defaultLoad':
            chrome.storage.local.set({'defaultLoad': value});
            break;
    }
}
function checkFirstLoad() {
    chrome.storage.local.get('defaultLoad', function (result) {
        if (result.defaultLoad == undefined) {
            chrome.storage.local.set({'defaultLoad': '0'}, function() {
                setFirstSettings();
            });
        }
    });
}
function setFirstSettings() {
    chrome.storage.local.set({
        'pageShadowEnabled': 'false',
        'theme': '1',
        'colorInvert': 'false',
        'pageLumEnabled': 'false',
        'pourcentageLum': '15',
        'nightModeEnabled': 'false',
        'sitesInterditPageShadow': ''
    });
}
checkFirstLoad();
