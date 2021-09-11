/* Page Shadow
 *
 * Copyright (C) 2015-2021 Eliastik (eliastiksofts.com)
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
import $ from "jquery";
import i18next from "i18next";
import jqueryI18next from "jquery-i18next";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/css/css.js";
import "codemirror/addon/display/autorefresh.js";
import { commentAllLines, getBrowser, downloadData, loadPresetSelect, loadPreset, savePreset, extensionVersion, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, deletePreset } from "./util.js";
import { setSettingItem, setFirstSettings } from "./storage.js";
import { init_i18next } from "./locales.js";

window.$ = $;
window.jQuery = $;

window.codeMirrorUserCss = null;
window.codeMirrorJSONArchive = null;

init_i18next("options", () => translateContent());

function listTranslations(languages) {
    const language = i18next.language.substr(0, 2);
    $("#languageSelect").text("");

    $.each(languages, (index, value) => {
        $("#languageSelect").append("<option data-i18n=\"container.language."+ value +"\" value=\"" + value + "\"" + (language == value ? " selected" : "") + "></option>");
    });
}

function translateContent() {
    jqueryI18next.init(i18next, $, {
        handleName: "localize",
        selectorAttr: "data-i18n"
    });
    listTranslations(i18next.languages);
    loadPresetSelect("loadPresetSelect");
    loadPresetSelect("savePresetSelect");
    loadPresetSelect("deletePresetSelect");
    $("nav").localize();
    $(".container").localize();
    $(".modal").localize();

    $("#themeSelect").text("");

    for(let i = 1; i <= nbCustomThemesSlots; i++) {
        $("#themeSelect").append("<option value=\"" + i + "\">" + i18next.t("container.customTheme", { count: i }) + "</option>");
    }

    if(getBrowser() != "Chrome") {
        $("#keyboardShortcuts").tooltip({
            trigger: "focus",
            container: "body",
            placement: "auto bottom",
            title: i18next.t("container.keyboardShortcutsInfos")
        });

        $("#keyboardShortcuts").attr("data-original-title", i18next.t("container.keyboardShortcutsInfos"));
    }

    displaySettings();
}

function changeLng(lng) {
    i18next.changeLanguage(lng);
}

i18next.on("languageChanged", () => {
    translateContent();
});

function resetSettings() {
    $("span[data-toggle=\"tooltip\"]").tooltip("hide");
    $("i[data-toggle=\"tooltip\"]").tooltip("hide");

    chrome.storage.local.clear(() => {
        setFirstSettings(() => {
            $("#textareaAssomPage").val("");
            $("#checkWhiteList").prop("checked", false);
            init_i18next();
            $("#reset").modal("show");
            loadPresetSelect("loadPresetSelect");
            loadPresetSelect("savePresetSelect");
            loadPresetSelect("deletePresetSelect");
            localStorage.clear();
        });
    });
}

function displaySettings(areaName) {
    chrome.storage.local.get(["sitesInterditPageShadow", "whiteList"], result => {
        if(areaName != "sync") {
            if(result.sitesInterditPageShadow != undefined) {
                $("#textareaAssomPage").val(result.sitesInterditPageShadow);
            }

            if(result.whiteList == "true" && $("#checkWhiteList").is(":checked") == false) {
                $("#checkWhiteList").prop("checked", true);
            } else if(result.whiteList !== "true" && $("#checkWhiteList").is(":checked") == true) {
                $("#checkWhiteList").prop("checked", false);
            }
        }

        if(typeof(chrome.storage) != "undefined" && typeof(chrome.storage.sync) != "undefined") {
            $("#archiveCloudBtn").removeClass("disabled");
        } else {
            $("#archiveCloudNotCompatible").show();
        }

        archiveCloudAvailable((result, date, device) => {
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
        displayFilters();
    }
}

function displayTheme(nb, defaultSettings) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;
    defaultSettings = defaultSettings == undefined ? false : defaultSettings;
    let customThemes, fontTheme, fontName, customCSS, backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme;

    chrome.storage.local.get("customThemes", result => {
        if(result.customThemes != undefined && result.customThemes[nb] != undefined) {
            customThemes = result.customThemes[nb];
        } else {
            customThemes = defaultCustomThemes[nb];
        }

        if(!defaultSettings && customThemes["customThemeBg"] != undefined) {
            backgroundTheme = customThemes["customThemeBg"];
        } else {
            backgroundTheme = defaultBGColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeTexts"] != undefined) {
            textsColorTheme = customThemes["customThemeTexts"];
        } else {
            textsColorTheme = defaultTextsColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeLinks"] != undefined) {
            linksColorTheme = customThemes["customThemeLinks"];
        } else {
            linksColorTheme = defaultLinksColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeLinksVisited"] != undefined) {
            linksVisitedColorTheme = customThemes["customThemeLinksVisited"];
        } else {
            linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
        }

        if(!defaultSettings && customThemes["customThemeFont"] != undefined && customThemes["customThemeFont"].trim() != "") {
            fontTheme = "\"" + customThemes["customThemeFont"] + "\"";
            fontName = customThemes["customThemeFont"];
        } else {
            fontTheme = defaultFontCustomTheme;
            fontName = defaultFontCustomTheme;
        }

        if(!defaultSettings && customThemes["customCSSCode"] != undefined && typeof(customThemes["customCSSCode"]) == "string" && customThemes["customCSSCode"].trim() != "") {
            customCSS = customThemes["customCSSCode"];
        } else {
            customCSS = defaultCustomCSSCode;
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

        window.codeMirrorUserCss.getDoc().setValue(customCSS);
    });
}

function displayFilters() {
    chrome.storage.local.get("filtersSettings", result => {
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        $("#filtersList").text("");

        filters.filters.forEach((filter, index) => {
            const element = document.createElement("li");
            element.setAttribute("class", "list-group-item filterButtons");

            const texts = document.createElement("div");

            const title = document.createElement("strong");
            title.textContent = filter.filterName + " – " + filter.sourceName;
            texts.appendChild(title);

            if(!filter.customFilter) {
                const lastUpdate = document.createElement("div");
                lastUpdate.textContent = filter.lastUpdated > 0 ? i18next.t("modal.filters.lastUpdate", { date: new Intl.DateTimeFormat(i18next.language).format(filter.lastUpdated), hour: new Intl.DateTimeFormat(i18next.language, { hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short" }).format(filter.lastUpdated), interpolation: { escapeValue: false } }) : i18next.t("modal.filters.lastUpdateNever");
                texts.appendChild(lastUpdate);

                if(filter.hasError) {
                    const hasError = document.createElement("div");
                    hasError.textContent = "Erreur lors de la dernière mise à jour";
                    hasError.style.color = "red";
                    texts.appendChild(hasError);
                }
            }

            element.appendChild(texts);

            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "inline-block";

            const buttonSee = document.createElement("button");
            buttonSee.setAttribute("class", "btn btn-sm btn-default");
            const iconSee = document.createElement("i");
            iconSee.setAttribute("class", "fa fa-eye fa-fw");
            buttonSee.appendChild(iconSee);

            buttonContainer.appendChild(buttonSee);

            if(!filter.customFilter) {
                const buttonHome = document.createElement("button");
                buttonHome.setAttribute("class", "btn btn-sm btn-default");
                const iconHome = document.createElement("i");
                iconHome.setAttribute("class", "fa fa-home fa-fw");
                buttonHome.appendChild(iconHome);
    
                const buttonUpdate = document.createElement("button");
                buttonUpdate.setAttribute("class", "btn btn-sm btn-default");
                const iconUpdate = document.createElement("i");
                iconUpdate.setAttribute("class", "fa fa-refresh fa-fw");
                buttonUpdate.appendChild(iconUpdate);

                buttonUpdate.addEventListener("click", () => {
                    chrome.runtime.sendMessage({
                        "type": "updateFilter",
                        "filterId": index
                    // eslint-disable-next-line no-unused-vars
                    }, response => {
                        //
                    });
                });

                buttonContainer.appendChild(buttonHome);
                buttonContainer.appendChild(buttonUpdate);
            } else {
                const buttonEdit = document.createElement("button");
                buttonEdit.setAttribute("class", "btn btn-sm btn-default");
                const iconEdit = document.createElement("i");
                iconEdit.setAttribute("class", "fa fa-pencil fa-fw");
                buttonEdit.appendChild(iconEdit);

                buttonContainer.appendChild(buttonEdit);
            }
            
            element.appendChild(buttonContainer);
            document.getElementById("filtersList").appendChild(element);
        });
    });
}

function saveThemeSettings(nb) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    chrome.storage.local.get("customThemes", result => {
        let customThemes = defaultCustomThemes;

        if(result.customThemes != undefined) {
            customThemes = result.customThemes;
        }

        customThemes[nb]["customThemeBg"] = $("#colorpicker1").attr("value");
        customThemes[nb]["customThemeTexts"] = $("#colorpicker2").attr("value");
        customThemes[nb]["customThemeLinks"] = $("#colorpicker3").attr("value");
        customThemes[nb]["customThemeLinksVisited"] = $("#colorpicker4").attr("value");
        customThemes[nb]["customThemeFont"] = $("#customThemeFont").val();
        window.codeMirrorUserCss.save();
        customThemes[nb]["customCSSCode"] = $("#codeMirrorUserCSSTextarea").val();

        setSettingItem("customThemes", customThemes);
    });
}

function saveSettings() {
    setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());

    chrome.storage.local.get(["whiteList", "sitesInterditPageShadow"], result => {
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
    $("span[data-toggle=\"tooltip\"]").tooltip("hide");
    $("i[data-toggle=\"tooltip\"]").tooltip("hide");
    $("#saved").modal("show");
    displaySettings("local");
}

function archiveSettings() {
    $("#archiveError").hide();
    $("#archiveDataButton").addClass("disabled");

    chrome.storage.local.get(null, data => {
        try {
            data["ispageshadowarchive"] = "true";
            const date = new Date();
            const dateString = date.getFullYear() + "-" + (parseInt(date.getMonth()) + 1).toString() + "-" + date.getDate() + "-" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
            const dataStr = JSON.stringify(data);
            const filename = "page-shadow-backupdata-" + dateString + ".json";

            window.codeMirrorJSONArchive.getDoc().setValue(JSON.stringify(data));
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
    let ispageshadowarchive = false;

    for(const key in object) {
        if(Object.prototype.hasOwnProperty.call(object, key)) {
            if(key === "ispageshadowarchive" && object[key] === "true") {
                ispageshadowarchive = true;
            }
        }
    }

    if(ispageshadowarchive == false) {
        return func(false);
    }

    // Reset data
    chrome.storage.local.clear(() => {
        setFirstSettings(() => {
            for(const key in object) {
                if(typeof(key) === "string") {
                    if(Object.prototype.hasOwnProperty.call(object, key)) {
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
        const reader = new FileReader();
        reader.onload = event => {
            let obj;

            try {
                obj = JSON.parse(event.target.result);
            } catch(e) {
                $("#restoreError").fadeIn(500);
                displaySettings("local");
                return false;
            }

            $("#textareaAssomPage").val("");
            $("#checkWhiteList").prop("checked", false);

            restoreSettings(obj, result => {
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
        };

        reader.onerror = function() {
            $("#restoreError").fadeIn(500);
            displaySettings("local");
        };

        const fileExtension = event.target.files[0].name.split(".").pop().toLowerCase();

        if(fileExtension == "json") {
            const filesize = event.target.files[0].size;

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
    } else {
        $("#restoreError").hide();
    }
}

function archiveCloudSettings() {
    if(typeof(chrome.storage) != "undefined" && typeof(chrome.storage.sync) != "undefined") {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudBtn").addClass("disabled");
        $("#restoreCloudBtn").addClass("disabled");

        chrome.storage.local.get(null, data => {
            try {
                data["ispageshadowarchive"] = "true";

                const dataStr = JSON.stringify(data);
                const newSetting = {};
                newSetting["pageShadowStorageBackup"] = dataStr;

                const dateSettings = {};
                dateSettings["dateLastBackup"] = Date.now().toString();

                const deviceSettings = {};
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
    if(typeof(chrome.storage) == "undefined" && typeof(chrome.storage.sync) == "undefined") {
        return func(false, null, null);
    }

    chrome.storage.sync.get(["dateLastBackup", "pageShadowStorageBackup", "deviceBackup"], data => {
        if(data.dateLastBackup != undefined && data.pageShadowStorageBackup != "undefined" && data.deviceBackup != "undefined") {
            return func(true, data.dateLastBackup, data.deviceBackup);
        } else {
            return func(false, null, null);
        }
    });
}

function restoreCloudSettings() {
    if(typeof(chrome.storage) != "undefined" && typeof(chrome.storage.sync) != "undefined") {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudBtn").addClass("disabled");
        $("#restoreCloudBtn").addClass("disabled");

        chrome.storage.sync.get("pageShadowStorageBackup", data => {
            if(data.pageShadowStorageBackup != undefined) {
                try {
                    const dataObj = JSON.parse(data.pageShadowStorageBackup);

                    $("#textareaAssomPage").val("");
                    $("#checkWhiteList").prop("checked", false);

                    restoreSettings(dataObj, result => {
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

    savePreset(parseInt($("#savePresetSelect").val()), $("#savePresetTitle").val(), result => {
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

$(document).ready(() => {
    let savedTimeout;

    $("#validerButton").click(() => {
        saveSettings();
    });

    $("#themeSelect").change(() => {
        displayTheme($("#themeSelect").val());
    });

    $("#customThemeSave").click(() => {
        saveThemeSettings($("#themeSelect").val());

        clearTimeout(savedTimeout);
        savedTimeout = setTimeout(()=> {
            $("#customThemeSave").attr("data-original-title", "");
            $("#customThemeSave").tooltip("hide");
            $("#customThemeSave").tooltip("disable");
        }, 3000);

        $("#customThemeSave").attr("data-original-title", i18next.t("modal.customTheme.saved"));
        $("#customThemeSave").tooltip("enable");
        $("#customThemeSave").tooltip("show");
    });

    $("#customThemeCancel").click(() => {
        displayTheme($("#themeSelect").val());
    });

    $("#customThemeReset").click(() => {
        displayTheme($("#themeSelect").val(), true);
    });

    $("#aboutDialogBtn").click(() => {
        $("span[data-toggle=\"tooltip\"]").tooltip("hide");
        $("i[data-toggle=\"tooltip\"]").tooltip("hide");
    });

    $("#resetConfirmBtn").click(() => {
        $("span[data-toggle=\"tooltip\"]").tooltip("hide");
        $("i[data-toggle=\"tooltip\"]").tooltip("hide");
    });

    $("#loadPresetBtn").click(() => {
        $("#loadPreset").show();
        $("#savePreset").hide();
        $("#deletePreset").hide();
    });

    $("#savePresetBtn").click(() => {
        $("#loadPreset").hide();
        $("#savePreset").show();
        $("#deletePreset").hide();
    });

    $("#deletePresetBtn").click(() => {
        $("#loadPreset").hide();
        $("#savePreset").hide();
        $("#deletePreset").show();
    });

    $("#archiveCloudBtn").click(() => {
        archiveCloudSettings();
    });

    $("#restoreCloudBtn").click(() => {
        restoreCloudSettings();
    });

    $("span[data-toggle=\"tooltip\"]").tooltip({
        trigger: "hover",
        container: "body",
        placement: "auto top"
    });

    $("i[data-toggle=\"tooltip\"]").tooltip({
        trigger: "hover",
        container: "body",
        placement: "auto top"
    });

    $("#confirmReset").click(() => {
        resetSettings();
    });

    $("#versionExtension").text(extensionVersion);
    $("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion);

    if(typeof(chrome.storage.onChanged) !== "undefined") {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            displaySettings(areaName);
        });
    }

    $("#colorpicker1").colpick({
        layout:"hex",
        submit: false,
        color: "000000",
        appendTo: $("#customTheme"),
        onChange: (hsb, hex) => {
            $("#colorpicker1").css("background-color", "#"+hex);
            $("#previsualisationDiv").css("background-color", "#"+hex);
            $("#colorpicker1").attr("value", hex);
        }
    });

    $("#colorpicker2").colpick({
        layout:"hex",
        submit: false,
        color: "FFFFFF",
        appendTo: $("#customTheme"),
        onChange: (hsb, hex) => {
            $("#colorpicker2").css("background-color", "#"+hex);
            $("#textPreview").css("color", "#"+hex);
            $("#colorpicker2").attr("value", hex);
        }
    });

    $("#colorpicker3").colpick({
        layout:"hex",
        submit: false,
        color: "1E90FF",
        appendTo: $("#customTheme"),
        onChange: (hsb, hex) => {
            $("#colorpicker3").css("background-color", "#"+hex);
            $("#linkPreview").css("color", "#"+hex);
            $("#colorpicker3").attr("value", hex);
        }
    });

    $("#colorpicker4").colpick({
        layout:"hex",
        submit: false,
        color: "800080",
        appendTo: $("#customTheme"),
        onChange: (hsb, hex) => {
            $("#colorpicker4").css("background-color", "#"+hex);
            $("#linkVisitedPreview").css("color", "#"+hex);
            $("#colorpicker4").attr("value", hex);
        }
    });

    $("#archiveDataButton").click(() => {
        archiveSettings();
    });

    $("#restoreDataButton").click(() => {
        $("#inputFileJSON").trigger("click");
    });

    $("#inputFileJSON").change(function(event) {
        restoreSettingsFile(event);
        $(this).val("");
    });

    $("#customThemeFont").on("input", () => {
        if($("#customThemeFont").val().trim() !== "") {
            $("#previsualisationDiv").css("font-family", "\"" + $("#customThemeFont").val() + "\"");
        } else {
            $("#previsualisationDiv").css("font-family", "");
        }
    });

    $("#archiveSuggestedName").click(function() {
        this.focus();
        this.select();
    });

    window.codeMirrorUserCss = CodeMirror.fromTextArea(document.getElementById("codeMirrorUserCSSTextarea"), {
        lineNumbers: true,
        mode: "css",
        theme: "material",
        autoRefresh: true
    });

    window.codeMirrorJSONArchive = CodeMirror.fromTextArea(document.getElementById("codeMirrorJSONArchiveTextarea"), {
        lineNumbers: true,
        theme: "material",
        autoRefresh: true,
        readOnly: true
    });

    window.codeMirrorJSONArchive.setSize(null, 50);

    displaySettings("local");

    loadPresetSelect("loadPresetSelect");
    loadPresetSelect("savePresetSelect");
    loadPresetSelect("deletePresetSelect");

    if(getBrowser() == "Firefox") {
        $("#firefoxHelpArchive").show();
    }

    if(getBrowser() == "Chrome") {
        $("#keyboardShortcuts").click(() => {
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

    $("#loadPresetValid").click(() => {
        $("#restorePresetSuccess").hide();
        $("#restorePresetEmpty").hide();
        $("#restorePresetError").hide();

        loadPreset(parseInt($("#loadPresetSelect").val()), result => {
            if(result == "success") {
                $("#restorePresetSuccess").fadeIn(500);
            } else if(result == "empty") {
                $("#restorePresetEmpty").fadeIn(500);
            } else {
                $("#restorePresetError").fadeIn(500);
            }
        });
    });

    $("#savePresetValid").click(() => {
        createPreset();
    });

    $("#savePresetTitle").keyup((e) => {
        if(e.keyCode === 13) {
            createPreset();
        }
    });

    $("#deletePresetValid").click(() => {
        $("#deletePresetError").hide();
        $("#deletePresetSuccess").hide();

        deletePreset(parseInt($("#deletePresetSelect").val()), result => {
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

    $("#updateAllFilters").click(() => {
        chrome.runtime.sendMessage({
            "type": "updateAllFilters"
        // eslint-disable-next-line no-unused-vars
        }, response => {
            //
        });
    });
});
