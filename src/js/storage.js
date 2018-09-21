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
        case 'customThemeInfoDisable':
            chrome.storage.local.set({'customThemeInfoDisable': value});
            break;
        case 'customThemeLinksVisited':
            chrome.storage.local.set({'customThemeLinksVisited': value});
            break;
        case 'customThemeFont':
            chrome.storage.local.set({'customThemeFont': value});
            break;
        case 'globallyEnable':
            chrome.storage.local.set({'globallyEnable': value});
            break;
        case 'invertPageColors':
            chrome.storage.local.set({'invertPageColors': value});
            break;
        case 'invertImageColors':
            chrome.storage.local.set({'invertImageColors': value});
            break;
        case 'customCSSCode':
            chrome.storage.local.set({'customCSSCode': value});
            break;
        case 'autoEnable':
            chrome.storage.local.set({'autoEnable': value});
            break;
        case 'autoEnableHourFormat':
            chrome.storage.local.set({'autoEnableHourFormat': value});
            break;
        case 'hourEnable':
            chrome.storage.local.set({'hourEnable': value});
            break;
        case 'minuteEnable':
            chrome.storage.local.set({'minuteEnable': value});
            break;
        case 'hourEnableFormat':
            chrome.storage.local.set({'hourEnableFormat': value});
            break;
        case 'hourDisable':
            chrome.storage.local.set({'hourDisable': value});
            break;
        case 'minuteDisable':
            chrome.storage.local.set({'minuteDisable': value});
            break;
        case 'hourDisableFormat':
            chrome.storage.local.set({'hourDisableFormat': value});
            break;
        case 'defaultLoad':
            chrome.storage.local.set({'defaultLoad': value});
            break;
        case 'invertVideoColors':
            chrome.storage.local.set({'invertVideoColors': value});
            break;
        case 'disableImgBgColor':
            chrome.storage.local.set({'disableImgBgColor': value});
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
    if(typeof(window["defaultVisitedLinksColorCustomTheme"]) == "undefined") defaultVisitedLinksColorCustomTheme = "ff00ff";
    if(typeof(window["defaultFontCustomTheme"]) == "undefined") defaultFontCustomTheme = "";
    if(typeof(window["brightnessDefaultValue"]) == "undefined") brightnessDefaultValue = 0.15;
    if(typeof(window["defaultAutoEnableHourFormat"]) == "undefined") defaultAutoEnableHourFormat = "24";
    if(typeof(window["defaultHourEnable"]) == "undefined") defaultHourEnable = "20";
    if(typeof(window["defaultMinuteEnable"]) == "undefined") defaultMinuteEnable = "0";
    if(typeof(window["defaultHourEnableFormat"]) == "undefined") defaultHourEnableFormat = "PM";
    if(typeof(window["defaultHourDisable"]) == "undefined") defaultHourDisable = "7";
    if(typeof(window["defaultMinuteDisable"]) == "undefined") defaultMinuteDisable = "0";
    if(typeof(window["defaultHourDisableFormat"]) == "undefined") defaultHourDisableFormat = "AM";

    // Set default settings values
    chrome.storage.local.set({
        'pageShadowEnabled': 'false',
        'theme': '1',
        'pageLumEnabled': 'false',
        'pourcentageLum': (brightnessDefaultValue * 100).toString(),
        'nightModeEnabled': 'false',
        'sitesInterditPageShadow': '',
        'liveSettings': 'true',
        'whiteList': 'false',
        'colorTemp': '5',
        'customThemeBg': defaultBGColorCustomTheme,
        'customThemeTexts': defaultTextsColorCustomTheme,
        'customThemeLinks': defaultLinksColorCustomTheme,
        'customThemeLinksVisited': defaultVisitedLinksColorCustomTheme,
        'customThemeFont': defaultFontCustomTheme,
        'colorInvert': 'false',
        'invertPageColors': 'false',
        'invertImageColors': 'true',
        'invertEntirePage': 'false',
        'invertVideoColors': 'false',
        'globallyEnable': 'true',
        'customThemeInfoDisable': 'false',
        'customCSSCode': '',
        'autoEnable': 'false',
        'autoEnableHourFormat': defaultAutoEnableHourFormat,
        'hourEnable': defaultHourEnable,
        'minuteEnable': defaultMinuteEnable,
        'hourEnableFormat': defaultHourEnableFormat,
        'hourDisable': defaultHourDisable,
        'minuteDisable': defaultMinuteDisable,
        'hourDisableFormat': defaultHourDisableFormat,
        'disableImgBgColor': 'false'
    });
}

checkFirstLoad();

if(typeof(chrome.storage.onChanged) !== 'undefined') {
    chrome.storage.onChanged.addListener(function() {
        checkFirstLoad();
    });
}
