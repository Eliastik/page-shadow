/* Page Shadow
 * 
 * Copyright (C) 2015-2017 Eliastik (eliastiksofts.com)
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
        case 'liveSettings':
            chrome.storage.local.set({'liveSettings': value});
            break;
        case 'whiteList':
            chrome.storage.local.set({'whiteList': value});
            break;
        case 'colorTemp':
            chrome.storage.local.set({'colorTemp': value});
            break;
        case 'customThemeBg':
            chrome.storage.local.set({'customThemeBg': value});
            break;
        case 'customThemeTexts':
            chrome.storage.local.set({'customThemeTexts': value});
            break;
        case 'customThemeLinks':
            chrome.storage.local.set({'customThemeLinks': value});
            break;
        case 'invertEntirePage':
            chrome.storage.local.set({'invertEntirePage': value});
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
    if(typeof(window["defaultBGColorCustomTheme"]) == "undefined") defaultBGColorCustomTheme = "000000";
    if(typeof(window["defaultTextsColorCustomTheme"]) == "undefined") defaultTextsColorCustomTheme = "FFFFFF";
    if(typeof(window["defaultLinksColorCustomTheme"]) == "undefined") defaultLinksColorCustomTheme = "1E90FF";
    
    // Set default settings values
    chrome.storage.local.set({
        'pageShadowEnabled': 'false',
        'theme': '1',
        'colorInvert': 'false',
        'pageLumEnabled': 'false',
        'pourcentageLum': '15',
        'nightModeEnabled': 'false',
        'sitesInterditPageShadow': '',
        'liveSettings': 'true',
        'whiteList': 'false',
        'colorTemp': '5',
        'customThemeBg': defaultBGColorCustomTheme,
        'customThemeTexts': defaultTextsColorCustomTheme,
        'customThemeLinks': defaultLinksColorCustomTheme,
        'invertEntirePage': 'false'
    });
}

checkFirstLoad();

if(typeof(chrome.storage.onChanged) !== 'undefined') {
    chrome.storage.onChanged.addListener(function() {
        checkFirstLoad();
    });
}
