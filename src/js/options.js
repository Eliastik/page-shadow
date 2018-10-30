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

/* Check if the configuration variables are set, if not set some default values (the variables are set globally, so we use window[variableName]) */
if(typeof(window["extensionVersion"]) == "undefined") extensionVersion = "???";
if(typeof(window["defaultBGColorCustomTheme"]) == "undefined") defaultBGColorCustomTheme = "000000";
if(typeof(window["defaultTextsColorCustomTheme"]) == "undefined") defaultTextsColorCustomTheme = "FFFFFF";
if(typeof(window["defaultLinksColorCustomTheme"]) == "undefined") defaultLinksColorCustomTheme = "1E90FF";
if(typeof(window["defaultVisitedLinksColorCustomTheme"]) == "undefined") defaultVisitedLinksColorCustomTheme = "ff00ff";
if(typeof(window["defaultFontCustomTheme"]) == "undefined") defaultFontCustomTheme = "";
if(typeof(window["defaultPresets"]) == "undefined") defaultPresets = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};

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
    loadPresetSelect("loadPresetSelect");
    loadPresetSelect("savePresetSelect");
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
    
    chrome.storage.local.clear(function() {
        setFirstSettings(function() {
            $("#textareaAssomPage").val("");
            $("#checkWhiteList").prop("checked", false);
            init_i18next();
            $('#reset').modal("show");
            loadPresetSelect("loadPresetSelect");
            loadPresetSelect("savePresetSelect");
            localStorage.clear();
        });
    });
}
function displaySettings() {
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList', 'customThemeBg', 'customThemeTexts', 'customThemeLinks', 'customThemeLinksVisited', 'customThemeFont', 'customCSSCode'], function (result) {
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

        if(typeof result.customCSSCode !== "undefined" && typeof result.customCSSCode !== null && result.customCSSCode.trim() !== "") {
            codeMirrorUserCSS.getDoc().setValue(result.customCSSCode);
        } else {
            codeMirrorUserCSS.getDoc().setValue('/* Example - Add a blue border around the page:\nbody {\n\tborder: 2px solid blue;\n} */');
        }
    });
}
function archiveSettings() {
    $("#archiveError").hide();

    chrome.storage.local.get(null, function (data) {
        try {
            data["ispageshadowarchive"] = "true";
            var date = new Date();
            var dateString = date.getFullYear() + "-" + (parseInt(date.getMonth()) + 1).toString() + "-" + date.getDate() + "-" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
            var dataStr = JSON.stringify(data);
            var filename = "page-shadow-backupdata-" + dateString + ".json";

            codeMirrorJSONArchive.getDoc().setValue(JSON.stringify(data));
            $("#archiveSuggestedName").val(filename);
            $("#helpArchive").show();

            downloadData(dataStr, filename, "application/json");
        } catch(e) {
            $("#archiveError").fadeIn(500);
        }
    });
}
function restoreSettings(event) {
    $("#restoreError").hide();
    $("#restoreSuccess").hide();
    $("#restoreErrorFilesize").hide();
    $("#restoreErrorExtension").hide();
    $("#restoreErrorArchive").hide();

    if (typeof FileReader !== "undefined") {
        var reader = new FileReader();
        reader.onload = onReaderLoad;

        reader.onerror = function() {
            $("#restoreError").fadeIn(500);
        };

        var fileExtension = event.target.files[0].name.split('.').pop().toLowerCase();

        if(fileExtension == "json") {
            var filesize = event.target.files[0].size;

            if(filesize <= 2000000) { // max size of 2 Mo
                reader.readAsText(event.target.files[0]);
            } else {
                $("#restoreErrorFilesize").fadeIn(500);
                return false;
            }
        } else {
            $("#restoreErrorExtension").fadeIn(500);
            return false;
        }

        function onReaderLoad(event){
            try {
                var obj = JSON.parse(event.target.result);
            } catch(e) {
                $("#restoreError").fadeIn(500);
                return false;
            }

            // Check if it's a Page Shadow archive file
            var ispageshadowarchive = false;

            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if(key === "ispageshadowarchive" && obj[key] === "true") {
                        var ispageshadowarchive = true;
                    }
                }
            }

            if(ispageshadowarchive == false) {
                $("#restoreErrorArchive").fadeIn(500);
                return false;
            }

            // Reset data
            chrome.storage.local.clear(function() {
                setFirstSettings(function() {
                    $("#textareaAssomPage").val("");
                    $("#checkWhiteList").prop("checked", false);

                    for (var key in obj) {
                        if(typeof(key) === "string") {
                            if (obj.hasOwnProperty(key)) {
                                setSettingItem(key, obj[key]); // invalid data are ignored by the function
                            }
                        }
                    }

                    $("#restoreSuccess").fadeIn(500);
                    loadPresetSelect("loadPresetSelect");
                    loadPresetSelect("savePresetSelect");
                });
            });
        }
    } else {
        $("#restoreError").hide();
    }
}
$(document).ready(function() {
    $("#validerButton").click(function() {
        setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        setSettingItem("customThemeBg", $("#colorpicker1").attr("value"));
        setSettingItem("customThemeTexts", $("#colorpicker2").attr("value"));
        setSettingItem("customThemeLinks", $("#colorpicker3").attr("value"));
        setSettingItem("customThemeLinksVisited", $("#colorpicker4").attr("value"));
        setSettingItem("customThemeFont", $("#customThemeFont").val());

        codeMirrorUserCSS.save();
        setSettingItem("customCSSCode", $("#codeMirrorUserCSSTextarea").val());

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

    $("#loadPresetBtn").click(function() {
        $("#loadPreset").show();
        $("#savePreset").hide();
    });

    $("#savePresetBtn").click(function() {
        $("#loadPreset").hide();
        $("#savePreset").show();
    });

    $('span[data-toggle="tooltip"]').tooltip({
        trigger: 'hover',
        container: 'body',
        placement: 'auto top'
    });

    $('i[data-toggle="tooltip"]').tooltip({
        trigger: 'hover',
        container: 'body',
        placement: 'auto top'
    });

    $("#confirmReset").click(function() {
        resetSettings();
    });

    $("#versionExtension").text(extensionVersion);
    $("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion);

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

    $("#archiveDataButton").click(function() {
        archiveSettings();
    });

    $("#restoreDataButton").click(function() {
        $("#inputFileJSON").trigger('click');
    });

    $("#inputFileJSON").change(function(event) {
        restoreSettings(event);
        $(this).val("");
    });

    $("#customThemeFont").on("input", function() {
        if($("#customThemeFont").val().trim() !== "") {
            $("#previsualisationDiv").css("font-family", '"' + $("#customThemeFont").val() + '"');
        } else {
            $("#previsualisationDiv").css("font-family", '');
        }
    });

    $("#archiveSuggestedName").click(function() {
        this.focus();
        this.select();
    });

    codeMirrorUserCSS = CodeMirror.fromTextArea(document.getElementById("codeMirrorUserCSSTextarea"), {
        lineNumbers: true,
        mode: "css",
        theme: "material",
        autoRefresh: true
    });

    codeMirrorJSONArchive = CodeMirror.fromTextArea(document.getElementById("codeMirrorJSONArchiveTextarea"), {
        lineNumbers: true,
        theme: "material",
        autoRefresh: true,
        readOnly: true
    });

    codeMirrorJSONArchive.setSize(null, 50);

    displaySettings();

    loadPresetSelect("loadPresetSelect");
    loadPresetSelect("savePresetSelect");

    if(getBrowser() == "Firefox") {
        $("#firefoxHelpArchive").show();
    }

    // Hash
    if(window.location.hash) {
        if(window.location.hash == "#customTheme") {
            $("#customTheme").modal("show");
        } else if(window.location.hash == "#presets") {
            $("#archive").modal("show");
            $("#archiveTabLink").removeClass("active");
            $("#archiveTab").removeClass("active");
            $("#presetTabLink").addClass("active");
            $("#presetTab").addClass("active");
        }
    }

    $("#loadPresetValid").click(function() {
        $("#restorePresetSuccess").hide();
        $("#restorePresetEmpty").hide();
        $("#restorePresetError").hide();

        loadPreset(parseInt($("#loadPresetSelect").val()), function(result) {
            if(result == "success") {
                $("#restorePresetSuccess").fadeIn(500);
            } else if(result == "empty") {
                $("#restorePresetEmpty").fadeIn(500);
            } else {
                $("#restorePresetError").fadeIn(500);
            }
        });
    });

    $("#savePresetValid").click(function() {
        $("#savePresetError").hide();
        $("#savePresetSuccess").hide();

        savePreset(parseInt($("#savePresetSelect").val()), $("#savePresetTitle").val(), function(result) {
            if(result == "success") {
                $("#savePresetSuccess").fadeIn(500);
            } else {
                $("#savePresetError").fadeIn(500);
            }

            loadPresetSelect("loadPresetSelect");
            loadPresetSelect("savePresetSelect");
        });
    });
});
