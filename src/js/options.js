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
if(typeof(window["defaultBGColorCustomTheme"]) == "undefined") defaultBGColorCustomTheme = "000000";
if(typeof(window["defaultTextsColorCustomTheme"]) == "undefined") defaultTextsColorCustomTheme = "FFFFFF";
if(typeof(window["defaultLinksColorCustomTheme"]) == "undefined") defaultLinksColorCustomTheme = "1E90FF";
if(typeof(window["defaultVisitedLinksColorCustomTheme"]) == "undefined") defaultVisitedLinksColorCustomTheme = "ff00ff";
if(typeof(window["defaultFontCustomTheme"]) == "undefined") defaultFontCustomTheme = "";

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
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList', 'customThemeBg', 'customThemeTexts', 'customThemeLinks', 'customThemeLinksVisited', 'customThemeFont'], function (result) {
        if(typeof result.sitesInterditPageShadow !== "undefined" && typeof result.sitesInterditPageShadow !== null) {
            $("#textareaAssomPage").val(result.sitesInterditPageShadow);
        }

        if(result.whiteList == "true" && $("#checkWhiteList").is(':checked') == false) {
            $("#checkWhiteList").prop("checked", true);
        } else if(result.whiteList !== "true" && $("#checkWhiteList").is(':checked') == true) {
            $("#checkWhiteList").prop("checked", false);
        }

        if(typeof result.customThemeBg !== "undefined" && typeof result.customThemeBg !== null) {
            $("#colorpicker1").css("background-color", "#" + result.customThemeBg);
            $("#colorpicker1").attr("value", result.customThemeBg);
            $("#colorpicker1").colpickSetColor(result.customThemeBg);
            $("#previsualisationDiv").css("background-color", "#"+ result.customThemeBg);
        } else {
            $("#colorpicker1").css("background-color", "#" + defaultBGColorCustomTheme);
            $("#colorpicker1").attr("value", defaultBGColorCustomTheme);
            $("#colorpicker1").colpickSetColor(defaultBGColorCustomTheme);
            $("#previsualisationDiv").css("background-color", "#" + defaultBGColorCustomTheme);
        }

        if(typeof result.customThemeTexts !== "undefined" && typeof result.customThemeTexts !== null) {
            $("#colorpicker2").css("background-color", "#" + result.customThemeTexts);
            $("#colorpicker2").attr("value", result.customThemeTexts);
            $("#colorpicker2").colpickSetColor(result.customThemeTexts);
            $("#textPreview").css("color", "#"+ result.customThemeTexts);
        } else {
            $("#colorpicker2").css("background-color", "#" + defaultTextsColorCustomTheme);
            $("#colorpicker2").attr("value", defaultTextsColorCustomTheme);
            $("#colorpicker2").colpickSetColor(defaultTextsColorCustomTheme);
            $("#textPreview").css("color", "#" + defaultTextsColorCustomTheme);
        }

        if(typeof result.customThemeLinks !== "undefined" && typeof result.customThemeLinks !== null) {
            $("#colorpicker3").css("background-color", "#" + result.customThemeLinks);
            $("#colorpicker3").attr("value", result.customThemeLinks);
            $("#colorpicker3").colpickSetColor(result.customThemeLinks);
            $("#linkPreview").css("color", "#"+ result.customThemeLinks);
        } else {
            $("#colorpicker3").css("background-color", "#" + defaultLinksColorCustomTheme);
            $("#colorpicker3").attr("value", defaultLinksColorCustomTheme);
            $("#colorpicker3").colpickSetColor(defaultLinksColorCustomTheme);
            $("#linkPreview").css("color", "#" + defaultLinksColorCustomTheme);
        }
        
        if(typeof result.customThemeLinks !== "undefined" && typeof result.customThemeLinks !== null) {
            $("#colorpicker3").css("background-color", "#" + result.customThemeLinks);
            $("#colorpicker3").attr("value", result.customThemeLinks);
            $("#colorpicker3").colpickSetColor(result.customThemeLinks);
            $("#linkPreview").css("color", "#"+ result.customThemeLinks);
        } else {
            $("#colorpicker3").css("background-color", "#" + defaultLinksColorCustomTheme);
            $("#colorpicker3").attr("value", defaultLinksColorCustomTheme);
            $("#colorpicker3").colpickSetColor(defaultLinksColorCustomTheme);
            $("#linkPreview").css("color", "#" + defaultLinksColorCustomTheme);
        }
        
        if(typeof result.customThemeLinksVisited !== "undefined" && typeof result.customThemeLinksVisited !== null) {
            $("#colorpicker4").css("background-color", "#" + result.customThemeLinksVisited);
            $("#colorpicker4").attr("value", result.customThemeLinksVisited);
            $("#colorpicker4").colpickSetColor(result.customThemeLinksVisited);
            $("#linkVisitedPreview").css("color", "#"+ result.customThemeLinksVisited);
        } else {
            $("#colorpicker4").css("background-color", "#" + defaultVisitedLinksColorCustomTheme);
            $("#colorpicker4").attr("value", defaultVisitedLinksColorCustomTheme);
            $("#colorpicker4").colpickSetColor(defaultVisitedLinksColorCustomTheme);
            $("#linkVisitedPreview").css("color", "#" + defaultVisitedLinksColorCustomTheme);
        }
        
        if(typeof result.customThemeFont !== "undefined" && typeof result.customThemeFont !== null && result.customThemeFont.trim() !== "") {
            $("#customThemeFont").val(result.customThemeFont);
            $("#previsualisationDiv").css("font-family", '"' + result.customThemeFont + '"');
        } else {
            $("#customThemeFont").val(defaultFontCustomTheme);
            $("#previsualisationDiv").css("font-family", defaultFontCustomTheme);
        }
    });
}
$(document).ready(function() {
    $("#validerButton").click(function() {
        setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        setSettingItem("customThemeBg", $("#colorpicker1").attr("value"));
        setSettingItem("customThemeTexts", $("#colorpicker2").attr("value"));
        setSettingItem("customThemeLinks", $("#colorpicker3").attr("value"));
        setSettingItem("customThemeLinksVisited", $("#colorpicker4").attr("value"));
        setSettingItem("customThemeFont", $("#customThemeFont").val());
        console.log($("#customThemeFont").val());

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
    
    $('#colorpicker4').colpick({
        layout:'hex',
        submit:0,
        color: '800080',
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker4").css("background-color", "#"+hex);
            $("#linkVisitedPreview").css("color", "#"+hex);
            $("#colorpicker4").attr("value", hex);
        }
    });
    
    $("#customThemeFont").change(function() {
        if($("#customThemeFont").val().trim() !== "") {
            $("#previsualisationDiv").css("font-family", '"' + $("#customThemeFont").val() + '"');
        } else {
            $("#previsualisationDiv").css("font-family", '');
        }
    });
});
