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
    if(typeof(window["settingNames"]) == "undefined") settingNames = ['pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'sitesInterditPageShadow', 'liveSettings', 'whiteList', 'colorTemp', 'customThemeBg', 'customThemeTexts', 'customThemeLinks', 'customThemeLinksVisited', 'customThemeFont', 'colorInvert', 'invertPageColors', 'invertImageColors', 'invertEntirePage', 'invertVideoColors', 'invertBgColor', 'globallyEnable', 'customThemeInfoDisable', 'customCSSCode', 'autoEnable', 'autoEnableHourFormat', 'hourEnable', 'minuteEnable', 'hourEnableFormat', 'hourDisable', 'minuteDisable', 'hourDisableFormat', 'disableImgBgColor', 'defaultLoad', 'presets'];
    
    if(settingNames.indexOf(name) !== -1) {
        var newSetting = {};
        newSetting[name] = value;
        
        return chrome.storage.local.set(newSetting);
    } else {
        return false;
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
    if(typeof(window["defaultPresets"]) == "undefined") defaultPresets = {"preset1": {}, "preset2": {}, "preset3": {}, "preset4": {}, "preset5": {}};

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
        'invertBgColor': 'true',
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
        'disableImgBgColor': 'false',
        'presets': defaultPresets
    });
}

checkFirstLoad();

if(typeof(chrome.storage.onChanged) !== 'undefined') {
    chrome.storage.onChanged.addListener(function() {
        checkFirstLoad();
    });
}
