/* Page Shadow
 *
 * Copyright (C) 2015-2019 Eliastik (eliastiksofts.com)
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
    loadPresetSelect("deletePresetSelect");
    $("nav").localize();
    $(".container").localize();
    $(".modal").localize();

    $("#themeSelect").text("");

    for(var i = 1; i <= nbCustomThemesSlots; i++) {
        $("#themeSelect").append('<option value="' + i + '">' + i18next.t("container.customTheme", { count: i }) + '</option>');
    }

    if(getBrowser() != "Chrome") {
        $("#keyboardShortcuts").tooltip({
            trigger: 'focus',
            container: 'body',
            placement: 'auto bottom',
            title: i18next.t("container.keyboardShortcutsInfos")
        });

        $("#keyboardShortcuts").attr("data-original-title", i18next.t("container.keyboardShortcutsInfos"));
    }

    displaySettings();
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
            loadPresetSelect("deletePresetSelect");
            localStorage.clear();
        });
    });
}

function displaySettings(areaName) {
    chrome.storage.local.get(["sitesInterditPageShadow", "whiteList"], function(result) {
        if(areaName != "sync") {
            if(result.sitesInterditPageShadow != undefined) {
                $("#textareaAssomPage").val(result.sitesInterditPageShadow);
            }

            if(result.whiteList == "true" && $("#checkWhiteList").is(':checked') == false) {
                $("#checkWhiteList").prop("checked", true);
            } else if(result.whiteList !== "true" && $("#checkWhiteList").is(':checked') == true) {
                $("#checkWhiteList").prop("checked", false);
            }
        }

        if(typeof(chrome.storage) != 'undefined' && typeof(chrome.storage.sync) != 'undefined') {
            $("#archiveCloudBtn").removeClass("disabled");
        } else {
            $("#archiveCloudNotCompatible").show();
        }

        archiveCloudAvailable(function(result, date, device) {
            if(result) {
                $("#restoreCloudBtn").removeClass("disabled");
                $("#infoCloudLastArchive").show();
                $("#dateCloudArchive").text(i18next.t("modal.archive.dateCloudLastArchive", { device: device, date: new Intl.DateTimeFormat(i18next.language).format(date), hour: new Intl.DateTimeFormat(i18next.language, { hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short" }).format(date), interpolation: { escapeValue: false } }));
            } else {
                $("#restoreCloudBtn").addClass("disabled");
                $("#infoCloudLastArchive").hide();
            }
        });
    });

    if(areaName != "sync") {
        displayTheme($("#themeSelect").val());
        $("#restoreDataButton").removeClass("disabled");
    }
}

function displayTheme(nb, defaultSettings) {
    var nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;
    var defaultSettings = defaultSettings == undefined ? false : defaultSettings;

    chrome.storage.local.get("customThemes", function(result) {
        if(result.customThemes != undefined && result.customThemes[nb] != undefined) {
            var customThemes = result.customThemes[nb];
        } else {
            var customThemes = defaultCustomThemes[nb];
        }

        if(!defaultSettings && customThemes["customThemeBg"] != undefined) {
            var backgroundTheme = customThemes["customThemeBg"];
        } else {
            var backgroundTheme = defaultBGColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeTexts"] != undefined) {
            var textsColorTheme = customThemes["customThemeTexts"];
        } else {
            var textsColorTheme = defaultTextsColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeLinks"] != undefined) {
            var linksColorTheme = customThemes["customThemeLinks"];
        } else {
            var linksColorTheme = defaultLinksColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeLinksVisited"] != undefined) {
            var linksVisitedColorTheme = customThemes["customThemeLinksVisited"];
        } else {
            var linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeFont"] != undefined && customThemes["customThemeFont"].trim() != "") {
            var fontTheme = '"' + customThemes["customThemeFont"] + '"';
            var fontName = customThemes["customThemeFont"];
        } else {
            var fontTheme = defaultFontCustomTheme;
            var fontName = defaultFontCustomTheme;
        }

        if(!defaultSettings && customThemes["customCSSCode"] != undefined && typeof(customThemes["customCSSCode"]) == "string" && customThemes["customCSSCode"].trim() != "") {
            var customCSS = customThemes["customCSSCode"];
        } else {
            var customCSS = defaultCustomCSSCode;
        }

        $("#colorpicker1").css("background-color", "#" + backgroundTheme);
        $("#colorpicker1").attr("value", backgroundTheme);
        $("#colorpicker1").colpickSetColor(backgroundTheme);
        $("#previsualisationDiv").css("background-color", "#" + backgroundTheme);

        $("#colorpicker2").css("background-color", "#" + textsColorTheme);
        $("#colorpicker2").attr("value", textsColorTheme);
        $("#colorpicker2").colpickSetColor(textsColorTheme);
        $("#textPreview").css("color", "#" + textsColorTheme);

        $("#colorpicker3").css("background-color", "#" + linksColorTheme);
        $("#colorpicker3").attr("value", linksColorTheme);
        $("#colorpicker3").colpickSetColor(linksColorTheme);
        $("#linkPreview").css("color", "#" + linksColorTheme);

        $("#colorpicker4").css("background-color", "#" + linksVisitedColorTheme);
        $("#colorpicker4").attr("value", linksVisitedColorTheme);
        $("#colorpicker4").colpickSetColor(linksVisitedColorTheme);
        $("#linkVisitedPreview").css("color", "#" + linksVisitedColorTheme);

        $("#customThemeFont").val(fontName);
        $("#previsualisationDiv").css("font-family", fontTheme);

        codeMirrorUserCSS.getDoc().setValue(customCSS);
    });
}

function saveThemeSettings(nb) {
    var nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    chrome.storage.local.get("customThemes", function (result) {
        var customThemes = defaultCustomThemes;

        if(result.customThemes != undefined) {
            var customThemes = result.customThemes;
        }

        customThemes[nb]["customThemeBg"] = $("#colorpicker1").attr("value");
        customThemes[nb]["customThemeTexts"] = $("#colorpicker2").attr("value");
        customThemes[nb]["customThemeLinks"] = $("#colorpicker3").attr("value");
        customThemes[nb]["customThemeLinksVisited"] = $("#colorpicker4").attr("value");
        customThemes[nb]["customThemeFont"] = $("#customThemeFont").val();
        codeMirrorUserCSS.save();
        customThemes[nb]["customCSSCode"] = $("#codeMirrorUserCSSTextarea").val();

        setSettingItem("customThemes", customThemes);
    });
}

function saveSettings() {
    setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());

    chrome.storage.local.get(["whiteList", "sitesInterditPageShadow"], function(result) {
        if($("#checkWhiteList").prop("checked") == true) {
            if(result.whiteList !== "true") {
                setSettingItem("sitesInterditPageShadow", commentAllLines(result.sitesInterditPageShadow));
            }

            setSettingItem("whiteList", "true");
        } else {
            if(result.whiteList == "true") {
                setSettingItem("sitesInterditPageShadow", commentAllLines(result.sitesInterditPageShadow));
            }

            setSettingItem("whiteList", "false");
        }
    });

    changeLng($("#languageSelect").val());
    $('span[data-toggle="tooltip"]').tooltip("hide");
    $('i[data-toggle="tooltip"]').tooltip("hide");
    $('#saved').modal("show");
    displaySettings("local");
}

function archiveSettings() {
    $("#archiveError").hide();
    $("#archiveDataButton").addClass("disabled");

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
            $("#archiveDataButton").removeClass("disabled");

            downloadData(dataStr, filename, "application/json");
        } catch(e) {
            $("#archiveError").fadeIn(500);
            $("#archiveDataButton").removeClass("disabled");
        }
    });
}

function restoreSettings(object, func) {
    // Check if it's a Page Shadow archive file
    var ispageshadowarchive = false;

    for(var key in object) {
        if(object.hasOwnProperty(key)) {
            if(key === "ispageshadowarchive" && object[key] === "true") {
                var ispageshadowarchive = true;
            }
        }
    }

    if(ispageshadowarchive == false) {
        return func(false);
    }

    // Reset data
    chrome.storage.local.clear(function() {
        setFirstSettings(function() {
            for(var key in object) {
                if(typeof(key) === "string") {
                    if(object.hasOwnProperty(key)) {
                        setSettingItem(key, object[key]); // invalid data are ignored by the function
                    }
                }
            }

            return func(true);
        });
    });
}

function restoreSettingsFile(event) {
    $("#restoreError").hide();
    $("#restoreSuccess").hide();
    $("#restoreErrorFilesize").hide();
    $("#restoreErrorExtension").hide();
    $("#restoreErrorArchive").hide();
    $("#restoreDataButton").addClass("disabled");

    if (typeof FileReader !== "undefined") {
        var reader = new FileReader();
        reader.onload = onReaderLoad;

        reader.onerror = function() {
            $("#restoreError").fadeIn(500);
            displaySettings("local");
        };

        var fileExtension = event.target.files[0].name.split('.').pop().toLowerCase();

        if(fileExtension == "json") {
            var filesize = event.target.files[0].size;

            if(filesize <= 5000000) { // max size of 5 MB
                reader.readAsText(event.target.files[0]);
            } else {
                $("#restoreErrorFilesize").fadeIn(500);
                displaySettings("local");
                return false;
            }
        } else {
            $("#restoreErrorExtension").fadeIn(500);
            displaySettings("local");
            return false;
        }

        function onReaderLoad(event){
            try {
                var obj = JSON.parse(event.target.result);
            } catch(e) {
                $("#restoreError").fadeIn(500);
                displaySettings("local");
                return false;
            }

            $("#textareaAssomPage").val("");
            $("#checkWhiteList").prop("checked", false);

            restoreSettings(obj, function(result) {
                if(result) {
                    $("#restoreSuccess").fadeIn(500);
                    loadPresetSelect("loadPresetSelect");
                    loadPresetSelect("savePresetSelect");
                    loadPresetSelect("deletePresetSelect");
                } else {
                    $("#restoreErrorArchive").fadeIn(500);
                    displaySettings("local");
                }
            });
        }
    } else {
        $("#restoreError").hide();
    }
}

function archiveCloudSettings() {
    if(typeof(chrome.storage) != 'undefined' && typeof(chrome.storage.sync) != 'undefined') {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudBtn").addClass("disabled");
        $("#restoreCloudBtn").addClass("disabled");

        chrome.storage.local.get(null, function(data) {
            try {
                data["ispageshadowarchive"] = "true";

                var dataStr = JSON.stringify(data);
                var newSetting = {};
                newSetting["pageShadowStorageBackup"] = dataStr;

                var dateSettings = {};
                dateSettings["dateLastBackup"] = Date.now().toString();

                var deviceSettings = {};
                deviceSettings["deviceBackup"] = window.navigator.platform;

                chrome.storage.sync.set(newSetting);
                chrome.storage.sync.set(dateSettings);
                chrome.storage.sync.set(deviceSettings);

                $("#archiveCloudSuccess").fadeIn(500);
                displaySettings("sync");
            } catch(e) {
                $("#archiveCloudError").fadeIn(500);
                $("#archiveCloudBtn").removeClass("disabled");
                $("#restoreCloudBtn").removeClass("disabled");
            }
        });
    }
}

function archiveCloudAvailable(func) {
    if(typeof(chrome.storage) == 'undefined' && typeof(chrome.storage.sync) == 'undefined') {
        return func(false, null, null);
    }

    chrome.storage.sync.get(["dateLastBackup", "pageShadowStorageBackup", "deviceBackup"], function(data) {
        if(data.dateLastBackup != undefined && data.pageShadowStorageBackup != "undefined" && data.deviceBackup != "undefined") {
            return func(true, data.dateLastBackup, data.deviceBackup);
        } else {
            return func(false, null, null);
        }
    });
}

function restoreCloudSettings() {
    if(typeof(chrome.storage) != 'undefined' && typeof(chrome.storage.sync) != 'undefined') {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudBtn").addClass("disabled");
        $("#restoreCloudBtn").addClass("disabled");

        chrome.storage.sync.get("pageShadowStorageBackup", function(data) {
            if(data.pageShadowStorageBackup != undefined) {
                try {
                    var dataObj = JSON.parse(data.pageShadowStorageBackup);

                    $("#textareaAssomPage").val("");
                    $("#checkWhiteList").prop("checked", false);

                    restoreSettings(dataObj, function(result) {
                        if(result) {
                            $("#restoreCloudSuccess").fadeIn(500);
                            loadPresetSelect("loadPresetSelect");
                            loadPresetSelect("savePresetSelect");
                            loadPresetSelect("deletePresetSelect");
                        } else {
                            $("#restoreCloudError").fadeIn(500);
                            displaySettings("sync");
                        }
                    });
                } catch(e) {
                    $("#restoreCloudError").fadeIn(500);
                    displaySettings("sync");
                }
            } else {
                $("#restoreCloudError").fadeIn(500);
                displaySettings("sync");
            }
        });
    }
}

function createPreset() {
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
        loadPresetSelect("deletePresetSelect");
    });
}

$(document).ready(function() {
    var savedTimeout;

    $("#validerButton").click(function() {
        saveSettings();
    });

    $("#themeSelect").change(function() {
        displayTheme($("#themeSelect").val());
    });

    $("#customThemeSave").click(function() {
        saveThemeSettings($("#themeSelect").val());

        clearTimeout(savedTimeout);
        savedTimeout = setTimeout(function(){
            $("#customThemeSave").attr("data-original-title", "");
            $('#customThemeSave').tooltip('hide');
            $('#customThemeSave').tooltip('disable');
        }, 3000);

        $("#customThemeSave").attr("data-original-title", i18next.t("modal.customTheme.saved"));
        $('#customThemeSave').tooltip('enable');
        $('#customThemeSave').tooltip('show');
    });

    $("#customThemeCancel").click(function() {
        displayTheme($("#themeSelect").val());
    });

    $("#customThemeReset").click(function() {
        displayTheme($("#themeSelect").val(), true);
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
        $("#deletePreset").hide();
    });

    $("#savePresetBtn").click(function() {
        $("#loadPreset").hide();
        $("#savePreset").show();
        $("#deletePreset").hide();
    });

    $("#deletePresetBtn").click(function() {
        $("#loadPreset").hide();
        $("#savePreset").hide();
        $("#deletePreset").show();
    });

    $("#archiveCloudBtn").click(function() {
        archiveCloudSettings();
    });

    $("#restoreCloudBtn").click(function() {
        restoreCloudSettings();
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
        chrome.storage.onChanged.addListener(function(changes, areaName) {
            displaySettings(areaName);
        });
    }

    $('#colorpicker1').colpick({
        layout:'hex',
        submit: false,
        color: '000000',
        appendTo: $("#customTheme"),
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker1").css("background-color", "#"+hex);
            $("#previsualisationDiv").css("background-color", "#"+hex);
            $("#colorpicker1").attr("value", hex);
        }
    });

    $('#colorpicker2').colpick({
        layout:'hex',
        submit: false,
        color: 'FFFFFF',
        appendTo: $("#customTheme"),
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker2").css("background-color", "#"+hex);
            $("#textPreview").css("color", "#"+hex);
            $("#colorpicker2").attr("value", hex);
        }
    });

    $('#colorpicker3').colpick({
        layout:'hex',
        submit: false,
        color: '1E90FF',
        appendTo: $("#customTheme"),
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            $("#colorpicker3").css("background-color", "#"+hex);
            $("#linkPreview").css("color", "#"+hex);
            $("#colorpicker3").attr("value", hex);
        }
    });

    $('#colorpicker4').colpick({
        layout:'hex',
        submit: false,
        color: '800080',
        appendTo: $("#customTheme"),
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
        restoreSettingsFile(event);
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

    displaySettings("local");

    loadPresetSelect("loadPresetSelect");
    loadPresetSelect("savePresetSelect");
    loadPresetSelect("deletePresetSelect");

    if(getBrowser() == "Firefox") {
        $("#firefoxHelpArchive").show();
    }

    if(getBrowser() == "Chrome") {
        $("#keyboardShortcuts").click(function() {
            chrome.tabs.create({
                url: "chrome://extensions/configureCommands"
            });
        });
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
        createPreset();
    });

    $("#savePresetTitle").keyup(function(e) {
        if(e.keyCode === 13) {
            createPreset();
        }
    });

    $("#deletePresetValid").click(function() {
        $("#deletePresetError").hide();
        $("#deletePresetSuccess").hide();

        deletePreset(parseInt($("#deletePresetSelect").val()), function(result) {
            if(result == "success") {
                $("#deletePresetSuccess").fadeIn(500);
            } else {
                $("#deletePresetError").fadeIn(500);
            }

            loadPresetSelect("loadPresetSelect");
            loadPresetSelect("savePresetSelect");
            loadPresetSelect("deletePresetSelect");
        });
    });
});
