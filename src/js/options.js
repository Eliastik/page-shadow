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
/* Check if the configuration variables are set, if not set some default values (the variables are set globally, so we use window[variableName]) */
if(typeof(window["extensionVersion"]) == "undefined") extensionVersion = "???";
/* translation */
function init_i18next() {
    i18next.use(window.i18nextBrowserLanguageDetector).use(window.i18nextXHRBackend).init({
        fallbackLng: ['en', 'fr'],
        ns: 'options',
        load: 'languageOnly',
        defaultNS: 'options',
            detection: {
                order: ['localStorage', 'navigator'],
                lookupLocalStorage: 'i18nextLng',
                caches: ['localStorage'],
            },
            backend: {
                loadPath: '/_locales/{{lng}}/{{ns}}.json',
            },
    }, function(err, t) {
        translateContent();
    });
}

init_i18next();

function listTranslations(languages) {
    $("#languageSelect").text("");
    $.each(languages, function(index, value) {
        $("#languageSelect").append('<option data-i18n="container.language.'+ value +'" value="'+ value +'"></option>');
    });
    $("#languageSelect").val(i18next.language.substr(0, 2));
}
function translateContent() {
    jqueryI18next.init(i18next, $, {
      handleName: 'localize',
      selectorAttr: 'data-i18n'
    });
    listTranslations(i18next.languages);
    $("nav").localize();
    $(".container").localize();
    $(".modal").localize();
}
function changeLng(lng) {
    i18next.changeLanguage(lng);
}
i18next.on('languageChanged', () => {
    translateContent();
});
function resetSettings() {
    $('span[data-toggle="tooltip"]').tooltip("hide");
    $('i[data-toggle="tooltip"]').tooltip("hide");
    chrome.storage.local.clear();
    localStorage.clear();
    $("#textareaAssomPage").val("");
    $("#checkWhiteList").prop("checked", false);
    init_i18next();
    $('#reset').modal("show");
}
function displaySettings() {
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList', 'customThemeBg', 'customThemeTexts', 'customThemeLinks'], function (result) {
        if(typeof result.sitesInterditPageShadow !== "undefined" && typeof result.sitesInterditPageShadow !== null) {
            $("#textareaAssomPage").val(result.sitesInterditPageShadow);
        }

        if(result.whiteList == "true" && $("#checkWhiteList").is(':checked') == false) {
            $("#checkWhiteList").prop("checked", true);
        } else if(result.whiteList !== "true" && $("#checkWhiteList").is(':checked') == true) {
            $("#checkWhiteList").prop("checked", false);
        }
        
        if(typeof result.customThemeBg !== "undefined" && typeof result.customThemeBg !== null) {
            $("#colorpicker1").css("background-color", "#"+ result.customThemeBg);
            $("#colorpicker1").attr("value", result.customThemeBg);
            $("#colorpicker1").colpickSetColor(result.customThemeBg);
            $("#previsualisationDiv").css("background-color", "#"+ result.customThemeBg);
        } else {
            $("#colorpicker1").css("background-color", "#000000");
            $("#colorpicker1").attr("value", "000000");
            $("#previsualisationDiv").css("background-color", "#000000");
            $("#colorpicker1").colpickSetColor("000000");
        }
        
        if(typeof result.customThemeTexts !== "undefined" && typeof result.customThemeTexts !== null) {
            $("#colorpicker2").css("background-color", "#"+ result.customThemeTexts);
            $("#colorpicker2").attr("value", result.customThemeTexts);
            $("#colorpicker2").colpickSetColor(result.customThemeTexts);
            $("#textPreview").css("color", "#"+ result.customThemeTexts);
        } else {
            $("#colorpicker2").css("background-color", "#FFFFFF");
            $("#colorpicker2").attr("value", "FFFFFF");
            $("#colorpicker2").colpickSetColor("FFFFFF");
            $("#textPreview").css("color", "#FFFFFF");
        }
        
        if(typeof result.customThemeLinks !== "undefined" && typeof result.customThemeLinks !== null) {
            $("#colorpicker3").css("background-color", "#"+ result.customThemeLinks);
            $("#colorpicker3").attr("value", result.customThemeLinks);
            $("#colorpicker3").colpickSetColor(result.customThemeLinks);
            $("#linkPreview").css("color", "#"+ result.customThemeLinks);
        } else {
            $("#colorpicker3").css("background-color", "#1E90FF");
            $("#colorpicker3").attr("value", "1E90FF");
            $("#colorpicker3").colpickSetColor("1E90FF");
            $("#linkPreview").css("color", "#1E90FF");
        }
    });
}
$(document).ready(function() {
    $("#validerButton").click(function() {
        setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        setSettingItem("customThemeBg", $("#colorpicker1").attr("value"));
        setSettingItem("customThemeTexts", $("#colorpicker2").attr("value"));
        setSettingItem("customThemeLinks", $("#colorpicker3").attr("value"));
        
        chrome.storage.local.get('whiteList', function (result) {
            if($("#checkWhiteList").prop("checked") == true) {
                if(result.whiteList !== "true") {
                    setSettingItem("sitesInterditPageShadow", "");
                }

                setSettingItem("whiteList", "true");
            } else {
                if(result.whiteList == "true") {
                    setSettingItem("sitesInterditPageShadow", "");
                }

                setSettingItem("whiteList", "false");
            }
        });
        changeLng($("#languageSelect").val());
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('i[data-toggle="tooltip"]').tooltip("hide");
        $('#saved').modal("show");
    });

    $("#aboutDialogBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('i[data-toggle="tooltip"]').tooltip("hide");
    });

    $("#resetConfirmBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('i[data-toggle="tooltip"]').tooltip("hide");
    });

    $('span[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });

    $('i[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });

    $("#confirmReset").click(function() {
        resetSettings();
    });

    $("#versionExtension").text(extensionVersion);
    $("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion);

    displaySettings();

    if(typeof(chrome.storage.onChanged) !== 'undefined') {
        chrome.storage.onChanged.addListener(function() {
            displaySettings();
        });
    }
    
    $('#colorpicker1').colpick({
        layout:'hex',
        submit:0,
        color: '000000',
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker1").css("background-color", "#"+hex);
            $("#previsualisationDiv").css("background-color", "#"+hex);
            $("#colorpicker1").attr("value", hex);
        }
    });
    
    $('#colorpicker2').colpick({
        layout:'hex',
        submit:0,
        color: 'FFFFFF',
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker2").css("background-color", "#"+hex);
            $("#textPreview").css("color", "#"+hex);
            $("#colorpicker2").attr("value", hex);
        }
    });
    
    $('#colorpicker3').colpick({
        layout:'hex',
        submit:0,
        color: '1E90FF',
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker3").css("background-color", "#"+hex);
            $("#linkPreview").css("color", "#"+hex);
            $("#colorpicker3").attr("value", hex);
        }
    });
});
