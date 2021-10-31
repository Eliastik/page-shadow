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
import "jquery-colpick";
import "jquery-colpick/css/colpick.css";
import { commentAllLines, getBrowser, downloadData, loadPresetSelect, loadPreset, savePreset, extensionVersion, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, deletePreset, customFilterGuideURL, getPresetData, settingsToSavePresets, colorTemperaturesAvailable } from "./util.js";
import { setSettingItem, setFirstSettings } from "./storage.js";
import { init_i18next } from "./locales.js";
import browser from "webextension-polyfill";

window.$ = $;
window.jQuery = $;

window.codeMirrorUserCss = null;
window.codeMirrorJSONArchive = null;
window.codeMirrorFilterData = null;
window.codeMirrorEditFilter = null;

let filterSavedTimeout;

init_i18next("options").then(() => translateContent());

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
    loadPresetSelect("loadPresetSelect", i18next);
    loadPresetSelect("savePresetSelect", i18next);
    loadPresetSelect("deletePresetSelect", i18next);
    $("nav").localize();
    $(".container").localize();
    $(".modal").localize();

    $("#themeSelect").text("");

    for(let i = 1; i <= nbCustomThemesSlots; i++) {
        $("#themeSelect").append("<option value=\"" + i + "\">" + i18next.t("container.customTheme", { count: i }) + "</option>");
    }

    if(getBrowser() != "Chrome" && getBrowser() != "Firefox") {
        $("#keyboardShortcuts").tooltip({
            trigger: "focus",
            container: "body",
            placement: "auto bottom",
            title: i18next.t("container.keyboardShortcutsInfos")
        });

        $("#keyboardShortcuts").attr("data-original-title", i18next.t("container.keyboardShortcutsInfos"));
    }

    $("#customThemeHelp").attr("data-original-title", i18next.t("modal.customTheme.fontHelp"));

    if(getBrowser() == "Firefox" && navigator.platform.toLowerCase().startsWith("linux")) {
        $("#firefoxLinuxBugFonts").show();
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

    browser.storage.local.clear().then(() => {
        setFirstSettings().then(async() => {
            $("#textareaAssomPage").val("");
            $("#checkWhiteList").prop("checked", false);
            init_i18next("options").then(() => translateContent());
            $("#reset").modal("show");
            await loadPresetSelect("loadPresetSelect", i18next);
            await loadPresetSelect("savePresetSelect", i18next);
            await loadPresetSelect("deletePresetSelect", i18next);
            localStorage.clear();
        });
    });
}

function displaySettings(areaName) {
    browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]).then(result => {
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

        if(typeof(browser.storage) != "undefined" && typeof(browser.storage.sync) != "undefined") {
            $("#archiveCloudBtn").removeClass("disabled");
        } else {
            $("#archiveCloudNotCompatible").show();
        }

        isArchiveCloudAvailable().then(result => {
            if(result.available) {
                $("#restoreCloudBtn").removeClass("disabled");
                $("#infoCloudLastArchive").show();
                $("#dateCloudArchive").text(i18next.t("modal.archive.dateCloudLastArchive", { device: result.device, date: new Intl.DateTimeFormat(i18next.language).format(result.date), hour: new Intl.DateTimeFormat(i18next.language, { hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short" }).format(result.date), interpolation: { escapeValue: false } }));
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

    browser.storage.local.get("customThemes").then(result => {
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
    browser.storage.local.get("filtersSettings").then(result => {
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        document.getElementById("filtersList").innerHTML = "";

        if(filters.enableAutoUpdate) {
            document.getElementById("enableFilterAutoUpdate").checked = true;
        } else {
            document.getElementById("enableFilterAutoUpdate").checked = false;
        }

        filters.filters.forEach((filter, index) => {
            const element = document.createElement("li");
            element.setAttribute("class", "list-group-item filterButtons");

            const checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            if(filter.enabled) checkbox.checked = true;

            checkbox.addEventListener("click", () => {
                checkbox.disabled = true;
                let messageType = "enableFilter";

                if(!checkbox.checked) messageType = "disableFilter";

                browser.runtime.sendMessage({
                    "type": messageType,
                    "filterId": index
                });
            });

            element.appendChild(checkbox);

            const texts = document.createElement("div");
            texts.setAttribute("class", "filterText");

            const title = document.createElement("strong");
            title.textContent = filter.filterName + " – " + filter.sourceName;
            texts.appendChild(title);

            if(!filter.customFilter) {
                const lastUpdate = document.createElement("div");
                lastUpdate.textContent = filter.lastUpdated > 0 ? i18next.t("modal.filters.lastUpdate", { date: new Intl.DateTimeFormat(i18next.language).format(filter.lastUpdated), hour: new Intl.DateTimeFormat(i18next.language, { hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short" }).format(filter.lastUpdated), interpolation: { escapeValue: false } }) : i18next.t("modal.filters.lastUpdateNever");
                texts.appendChild(lastUpdate);

                if(filter.hasError) {
                    const hasError = document.createElement("div");
                    hasError.textContent = i18next.t("modal.filters.errorUpdate");
                    hasError.style.color = "red";
                    texts.appendChild(hasError);
                }
            }

            element.appendChild(texts);

            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "inline-block";

            if(!filter.customFilter) {
                const buttonSee = document.createElement("button");
                buttonSee.setAttribute("class", "btn btn-sm btn-default");
                buttonSee.setAttribute("data-toggle", "tooltip");
                buttonSee.setAttribute("title", i18next.t("modal.filters.seeDetails"));
                if(!filter.content) buttonSee.disabled = true;
                const iconSee = document.createElement("i");
                iconSee.setAttribute("class", "fa fa-eye fa-fw");
                buttonSee.appendChild(iconSee);

                buttonSee.addEventListener("click", () => {
                    displayDetailsFilter(index);
                });

                buttonContainer.appendChild(buttonSee);
            }

            if(!filter.customFilter) {
                if(filter.homepage && filter.homepage.trim() != "") {
                    const buttonHome = document.createElement("button");
                    buttonHome.setAttribute("class", "btn btn-sm btn-default");
                    buttonHome.setAttribute("data-toggle", "tooltip");
                    buttonHome.setAttribute("title", i18next.t("modal.filters.homepage"));
                    const iconHome = document.createElement("i");
                    iconHome.setAttribute("class", "fa fa-home fa-fw");
                    buttonHome.appendChild(iconHome);

                    buttonHome.addEventListener("click", () => {
                        browser.tabs.create({
                            url: filter.homepage
                        });
                    });

                    buttonContainer.appendChild(buttonHome);
                }
                
                const buttonInfos = document.createElement("button");
                buttonInfos.setAttribute("class", "btn btn-sm btn-default");
                buttonInfos.setAttribute("data-toggle", "tooltip");
                buttonInfos.setAttribute("title", i18next.t("modal.filters.filterInfosLabel"));
                const iconInfos = document.createElement("i");
                iconInfos.setAttribute("class", "fa fa-info-circle fa-fw");
                buttonInfos.appendChild(iconInfos);

                buttonInfos.addEventListener("click", () => {
                    displayInfosFilter(index);
                });

                buttonContainer.appendChild(buttonInfos);

                if(!filter.builtIn) {
                    const buttonDelete = document.createElement("button");
                    buttonDelete.setAttribute("class", "btn btn-sm btn-default");
                    buttonDelete.setAttribute("data-toggle", "tooltip");
                    buttonDelete.setAttribute("title", i18next.t("modal.filters.deleteSource"));
                    const iconDelete = document.createElement("i");
                    iconDelete.setAttribute("class", "fa fa-trash fa-fw");
                    buttonDelete.appendChild(iconDelete);

                    buttonDelete.addEventListener("click", () => {
                        buttonDelete.disabled = true;

                        browser.runtime.sendMessage({
                            "type": "removeFilter",
                            "filterId": index
                        });
                    });

                    buttonContainer.appendChild(buttonDelete);
                }
    
                const buttonUpdate = document.createElement("button");
                buttonUpdate.setAttribute("class", "btn btn-sm btn-default");
                buttonUpdate.setAttribute("data-toggle", "tooltip");
                buttonUpdate.setAttribute("title", i18next.t("modal.filters.updateFilter"));
                const iconUpdate = document.createElement("i");
                iconUpdate.setAttribute("class", "fa fa-refresh fa-fw");
                buttonUpdate.appendChild(iconUpdate);

                buttonUpdate.addEventListener("click", () => {
                    buttonUpdate.disabled = true;

                    browser.runtime.sendMessage({
                        "type": "updateFilter",
                        "filterId": index
                    });
                });

                buttonContainer.appendChild(buttonUpdate);
            } else {
                const buttonEdit = document.createElement("button");
                buttonEdit.setAttribute("class", "btn btn-sm btn-default");
                buttonEdit.setAttribute("data-toggle", "tooltip");
                buttonEdit.setAttribute("title", i18next.t("modal.filters.editFilter"));
                const iconEdit = document.createElement("i");
                iconEdit.setAttribute("class", "fa fa-pencil fa-fw");
                buttonEdit.appendChild(iconEdit);

                buttonEdit.addEventListener("click", () => {
                    displayFilterEdit();
                });

                buttonContainer.appendChild(buttonEdit);
            }
            
            element.appendChild(buttonContainer);
            document.getElementById("filtersList").appendChild(element);
        });

        $("[data-toggle=\"tooltip\"]").tooltip();
    });
}

function displayDetailsFilter(idFilter) {
    window.codeMirrorFilterData.getDoc().setValue("");
    $("#filters").modal("hide");

    $("#filters").on("hidden.bs.modal", () => {
        $("#filterDetails").modal("show");
        $("#filters").off("hidden.bs.modal");
    });

    browser.storage.local.get("filtersSettings").then(result => {
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        if(filters) {
            const filter = filters.filters[idFilter];

            if(filter) {
                window.codeMirrorFilterData.getDoc().setValue(filter.content);
            }
        }
    });
}

function displayInfosFilter(idFilter) {
    $("#filters").modal("hide");

    $("#filters").on("hidden.bs.modal", () => {
        $("#filterInfos").modal("show");
        $("#filters").off("hidden.bs.modal");
    });

    browser.storage.local.get("filtersSettings").then(result => {
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        if(filters) {
            const filter = filters.filters[idFilter];

            if(filter) {
                $("#detailsFilterAddress").text(filter.sourceUrl);
                $("#detailsFilterName").text(filter.filterName && filter.filterName.trim() != "" ? filter.filterName : i18next.t("modal.filters.filterDescriptionEmpty"));
                $("#detailsFilterSource").text(filter.sourceName && filter.sourceName.trim() != "" ? filter.sourceName : i18next.t("modal.filters.filterDescriptionEmpty"));
                $("#detailsFilterHome").text(filter.homepage && filter.homepage.trim() != "" ? filter.homepage : i18next.t("modal.filters.filterDescriptionEmpty"));
                $("#detailsFilterDescription").text(filter.description && filter.description.trim() != "" ? filter.description : i18next.t("modal.filters.filterDescriptionEmpty"));
                $("#detailsFilterUpdateInterval").text(i18next.t("modal.filters.filterUpdateIntervalDays", { count: filter.expiresIn ? parseInt(filter.expiresIn) : 0 }));
                $("#detailsFilterVersion").text(filter.version && filter.version.trim() != "" ? filter.version : "0");
                $("#detailsFilterLicense").text(filter.license && filter.license.trim() != "" ? filter.license : i18next.t("modal.filters.licenseEmpty"));

                browser.runtime.sendMessage({
                    "type": "getNumberOfRules",
                    "idFilter": idFilter
                });
            }
        }
    });
}

async function displayPresetInfos(nb) {
    $("#archive").modal("hide");

    $("#archive").on("hidden.bs.modal", () => {
        $("#presetInfos").modal("show");
        $("#archive").off("hidden.bs.modal");
    });

    const presetData = await getPresetData(nb);

    if(presetData) {
        const modalBody = document.querySelector("#presetInfos .modal-body");
        modalBody.textContent = "";

        for(const setting of settingsToSavePresets) {
            if(setting == "colorInvert") continue;
            const row = document.createElement("div");
            row.setAttribute("class", "row border-bottom");

            const label = document.createElement("label");
            label.setAttribute("class", "col-lg-4 col-sm-4 control-label bold");
            label.textContent = i18next.t("modal.presets." + setting);

            const divCol = document.createElement("div");
            divCol.setAttribute("class", "col-lg-8 col-sm-8");
            const span = document.createElement("span");

            const value = presetData[setting];

            if(!value) {
                span.textContent = i18next.t("modal.presets.undefined");
            } else if(value == "true" || value == "false") {
                span.textContent = value == "true" ? i18next.t("modal.presets.enabled") : i18next.t("modal.presets.disabled");
            } else if(setting == "pourcentageLum") {
                span.textContent = value + "%";
            } else if(setting == "theme" && value.startsWith("custom")) {
                const customThemeId = value.split("custom")[1];
                span.textContent = i18next.t("modal.presets.customTheme", { count: customThemeId ? customThemeId : 1 });
            } else if(setting == "theme") {
                span.textContent = i18next.t("modal.presets.themeNumber", { count: value });
            } else if(setting == "colorTemp") {
                span.textContent = colorTemperaturesAvailable[presetData[setting] - 1] + "K";
            } else {
                span.textContent = presetData[setting];
            }

            row.appendChild(label);
            divCol.appendChild(span);
            row.appendChild(divCol);
            modalBody.appendChild(row);
        }
    }
}

function displayFilterEdit() {
    $("#filters").modal("hide");

    $("#filters").on("hidden.bs.modal", () => {
        $("#editFilter").modal("show");
        $("#filters").off("hidden.bs.modal");
    });

    window.codeMirrorEditFilter.getDoc().setValue("");

    browser.storage.local.get("customFilter").then(result => {
        const filter = result.customFilter != null ? result.customFilter : "";

        if(filter) {
            window.codeMirrorEditFilter.getDoc().setValue(filter);
        }
    });
}

function saveCustomFilter(close) {
    const text = window.codeMirrorEditFilter.getDoc().getValue();

    browser.runtime.sendMessage({
        "type": close ? "updateCustomFilterAndClose" : "updateCustomFilter",
        "text": text
    });
}

function saveThemeSettings(nb) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    browser.storage.local.get("customThemes").then(result => {
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

    browser.storage.local.get(["whiteList", "sitesInterditPageShadow"]).then(result => {
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

function getSettingsToArchive() {
    return new Promise((resolve, reject) => {
        browser.storage.local.get(null).then(data => {
            try {
                data["ispageshadowarchive"] = "true";
    
                // Remove filter content
                const filters = data["filtersSettings"];
                
                filters.filters.forEach(filter => {
                    filter.content = null;
                    filter.lastUpdated = 0;
                });

                const dataStr = JSON.stringify(data);
                resolve(dataStr);
            } catch(e) {
                reject();
            }
        });
    });
}

async function archiveSettings() {
    $("#archiveError").hide();
    $("#archiveDataButton").addClass("disabled");

    try {
        const date = new Date();
        const dateString = date.getFullYear() + "-" + (parseInt(date.getMonth()) + 1).toString() + "-" + date.getDate() + "-" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
        const dataStr = await getSettingsToArchive();
        const filename = "page-shadow-backupdata-" + dateString + ".json";

        window.codeMirrorJSONArchive.getDoc().setValue(dataStr);
        $("#archiveSuggestedName").val(filename);
        $("#helpArchive").show();
        $("#archiveDataButton").removeClass("disabled");

        downloadData(dataStr, filename);
    } catch(e) {
        $("#archiveError").fadeIn(500);
        $("#archiveDataButton").removeClass("disabled");
    }
}

function restoreSettings(object) {
    return new Promise(resolve => {
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
            return resolve(false);
        }
    
        // Reset data
        browser.storage.local.clear().then(() => {
            setFirstSettings().then(() => {
                for(const key in object) {
                    if(typeof(key) === "string") {
                        if(Object.prototype.hasOwnProperty.call(object, key)) {
                            setSettingItem(key, object[key]); // invalid data are ignored by the function
                        }
                    }
                }

                $("#updateAllFilters").attr("disabled", "disabled");
                
                browser.runtime.sendMessage({
                    "type": "updateAllFilters"
                });
    
                return resolve(true);
            });
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

            restoreSettings(obj).then(result => {
                if(result) {
                    $("#restoreSuccess").fadeIn(500);
                    loadPresetSelect("loadPresetSelect", i18next);
                    loadPresetSelect("savePresetSelect", i18next);
                    loadPresetSelect("deletePresetSelect", i18next);
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

async function archiveCloudSettings() {
    if(typeof(browser.storage) != "undefined" && typeof(browser.storage.sync) != "undefined") {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudBtn").addClass("disabled");
        $("#restoreCloudBtn").addClass("disabled");

        try {
            const dataStr = await getSettingsToArchive();
            const newSetting = {};
            newSetting["pageShadowStorageBackup"] = dataStr;

            const dateSettings = {};
            dateSettings["dateLastBackup"] = Date.now().toString();

            const deviceSettings = {};
            deviceSettings["deviceBackup"] = window.navigator.platform;

            browser.storage.sync.set(newSetting);
            browser.storage.sync.set(dateSettings);
            browser.storage.sync.set(deviceSettings);

            $("#archiveCloudSuccess").fadeIn(500);
            displaySettings("sync");
        } catch(e) {
            $("#archiveCloudError").fadeIn(500);
            $("#archiveCloudBtn").removeClass("disabled");
            $("#restoreCloudBtn").removeClass("disabled");
        }
    }
}

function isArchiveCloudAvailable() {
    return new Promise(resolve => {
        if(typeof(browser.storage) == "undefined" && typeof(browser.storage.sync) == "undefined") {
            return resolve({
                "available": false,
                "date": null,
                "device": null
            });
        }
    
        browser.storage.sync.get(["dateLastBackup", "pageShadowStorageBackup", "deviceBackup"]).then(data => {
            if(data.dateLastBackup && data.pageShadowStorageBackup && data.deviceBackup) {
                return resolve({
                    "available": true,
                    "date": data.dateLastBackup,
                    "device": data.deviceBackup
                });
            } else {
                return resolve({
                    "available": false,
                    "date": null,
                    "device": null
                });
            }
        });
    });
}

function restoreCloudSettings() {
    if(typeof(browser.storage) != "undefined" && typeof(browser.storage.sync) != "undefined") {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudBtn").addClass("disabled");
        $("#restoreCloudBtn").addClass("disabled");

        browser.storage.sync.get("pageShadowStorageBackup").then(data => {
            if(data.pageShadowStorageBackup != undefined) {
                try {
                    const dataObj = JSON.parse(data.pageShadowStorageBackup);

                    $("#textareaAssomPage").val("");
                    $("#checkWhiteList").prop("checked", false);

                    restoreSettings(dataObj).then(result => {
                        if(result) {
                            $("#restoreCloudSuccess").fadeIn(500);
                            loadPresetSelect("loadPresetSelect", i18next);
                            loadPresetSelect("savePresetSelect", i18next);
                            loadPresetSelect("deletePresetSelect", i18next);
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

    savePreset(parseInt($("#savePresetSelect").val()), $("#savePresetTitle").val(), $("#savePresetWebsite").val(), $("#checkSaveNewSettingsPreset").prop("checked")).then(result => {
        if(result == "success") {
            $("#savePresetSuccess").fadeIn(500);
        } else {
            $("#savePresetError").fadeIn(500);
        }

        loadPresetSelect("loadPresetSelect", i18next);
        loadPresetSelect("savePresetSelect", i18next);
        loadPresetSelect("deletePresetSelect", i18next);
    });
}

function displayPresetSettings(id) {
    getPresetData(id).then(data => {
        $("#savePresetTitle").val("");
        $("#savePresetWebsite").val("");
        $("#checkSaveNewSettingsPreset").prop("checked", false);
        $("#checkSaveNewSettingsPreset").removeAttr("disabled");
        $("#presetInfosBtn").removeAttr("disabled");

        if(data && data != "error" && Object.keys(data).length > 0) {
            if(data.name) $("#savePresetTitle").val(data.name);
            if(data.websiteListToApply) $("#savePresetWebsite").val(data.websiteListToApply);
            $("#presetCreateEditBtn").text(i18next.t("modal.edit"));
        } else {
            $("#checkSaveNewSettingsPreset").prop("checked", true);
            $("#checkSaveNewSettingsPreset").attr("disabled", "disabled");
            $("#presetInfosBtn").attr("disabled", "disabled");
            $("#presetCreateEditBtn").text(i18next.t("modal.create"));
        }
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
        savedTimeout = setTimeout(() => {
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

    if(typeof(browser.storage.onChanged) !== "undefined") {
        browser.storage.onChanged.addListener((changes, areaName) => {
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

    window.codeMirrorFilterData = CodeMirror.fromTextArea(document.getElementById("codeMirrorFilterData"), {
        lineNumbers: true,
        theme: "material",
        autoRefresh: true,
        readOnly: true,
        lineWrapping: true
    });

    window.codeMirrorEditFilter = CodeMirror.fromTextArea(document.getElementById("codeMirrorEditFilter"), {
        lineNumbers: true,
        theme: "material",
        autoRefresh: true,
        lineWrapping: true
    });

    window.codeMirrorJSONArchive.setSize(null, 50);

    displaySettings("local");

    loadPresetSelect("loadPresetSelect", i18next);
    loadPresetSelect("savePresetSelect", i18next);
    loadPresetSelect("deletePresetSelect", i18next);

    if(getBrowser() == "Chrome") {
        $("#keyboardShortcuts").click(() => {
            browser.tabs.create({
                url: "chrome://extensions/configureCommands"
            });
        });
    } else if(getBrowser() == "Firefox") {
        $("#keyboardShortcuts").click(() => {
            browser.tabs.create({
                url: "https://support.mozilla.org/" + i18next.language + "/kb/manage-extension-shortcuts-firefox"
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
        } else if(window.location.hash == "#aboutLatestVersion") {
            $("#about").modal("show");
        }
    }

    $("#loadPresetValid").click(() => {
        $("#restorePresetSuccess").hide();
        $("#restorePresetEmpty").hide();
        $("#restorePresetError").hide();

        loadPreset(parseInt($("#loadPresetSelect").val())).then(result => {
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

        deletePreset(parseInt($("#deletePresetSelect").val())).then(result => {
            if(result == "success") {
                $("#deletePresetSuccess").fadeIn(500);
            } else {
                $("#deletePresetError").fadeIn(500);
            }

            loadPresetSelect("loadPresetSelect", i18next);
            loadPresetSelect("savePresetSelect", i18next);
            loadPresetSelect("deletePresetSelect", i18next);
        });
    });

    $("#updateAllFilters").click(() => {
        $("#updateAllFilters").attr("disabled", "disabled");
        
        browser.runtime.sendMessage({
            "type": "updateAllFilters"
        });
    });

    $("#cleanAllFilters").click(() => {
        $("#cleanAllFilters").attr("disabled", "disabled");
        
        browser.runtime.sendMessage({
            "type": "cleanAllFilters"
        });
    });

    $("#addFilterSourceBtnOpen").click(() => {
        $("#addFilterErrorFetch").hide();
        $("#addFilterErrorParsing").hide();
        $("#addFilterErrorUnknown").hide();
        $("#addFilterErrorAlreadyAdded").hide();
        $("#addFilterErrorEmpty").hide();
        $("#filterAddress").val("");
    });

    $("#addFilterBtn").click(() => {
        $("#addFilterBtn").attr("disabled", "disabled");
        $("#filterAddress").attr("disabled", "disabled");
        $("#addFilterCancelBtn").attr("disabled", "disabled");
        $("#addFilterErrorFetch").hide();
        $("#addFilterErrorParsing").hide();
        $("#addFilterErrorUnknown").hide();
        $("#addFilterErrorAlreadyAdded").hide();
        $("#addFilterErrorEmpty").hide();
        
        browser.runtime.sendMessage({
            "type": "addFilter",
            "address": $("#filterAddress").val()
        });
    });
        
    $("#addFilterSource").on("hidden.bs.modal", () => {
        $("#filters").modal("show");
    });
    
    $("#filterDetails").on("hidden.bs.modal", () => {
        $("#filters").modal("show");
    });
    
    $("#filterInfos").on("hidden.bs.modal", () => {
        $("#filters").modal("show");
    });
    
    $("#editFilter").on("hidden.bs.modal", () => {
        $("#filters").modal("show");
    });
    
    $("#presetInfos").on("hidden.bs.modal", () => {
        $("#archive").modal("show");
    });

    $("#enableFilterAutoUpdate").on("change", () => {
        $("#enableFilterAutoUpdate").attr("disabled", "disabled");

        browser.runtime.sendMessage({
            "type": "toggleAutoUpdate",
            "enabled": $("#enableFilterAutoUpdate").is(":checked")
        });
    });

    $("#resetDefaultFiltersBtn").click(() => {
        $("#resetDefaultFiltersBtn").attr("disabled", "disabled");

        browser.runtime.sendMessage({
            "type": "reinstallDefaultFilters"
        });
    });

    $("#customFilterSave").click(() => {
        $("#customFilterSave").attr("disabled", "disabled");
        saveCustomFilter();
        
    });

    $("#customFilterCancel").click(() => {
        displayFilterEdit();
    });

    $("#presetInfosBtn").click(() => {
        displayPresetInfos($("#savePresetSelect").val());
    });

    $("#customFilterGuide").click(() => {
        browser.tabs.create({
            url: customFilterGuideURL
        });
    });

    $("#closeAndSaveCustomFilter").click(() => {
        $("#closeAndSaveCustomFilter").attr("disabled", "disabled");
        saveCustomFilter(true);
    });

    $("#savePresetSelect").on("change", () => {
        displayPresetSettings($("#savePresetSelect").val());
    });

    $("#syntaxBtn").click(() => {
        $("#syntaxText").html(i18next.t("modal.syntax.content", {
            excluded: i18next.t("modal.syntax.excluded"),
            excluded2: i18next.t("modal.syntax.excluded2"),
            bloqued: i18next.t("modal.syntax.bloqued"),
        }));
        $("#syntax").modal("show");
    });

    $("#syntaxBtnPresets").click(() => {
        $("#archive").modal("hide");

        const handlerSyntaxHidden = () => {
            $("#archive").modal("show");
            $("#syntax").off("hidden.bs.modal", handlerSyntaxHidden);
        };

        const handlerArchiveHidden = () => {
            $("#archive").off("hidden.bs.modal", handlerArchiveHidden);
            $("#syntaxText").html(i18next.t("modal.syntax.content", {
                excluded: i18next.t("modal.syntax.detected"),
                excluded2: i18next.t("modal.syntax.detected2"),
                bloqued: i18next.t("modal.syntax.detected3"),
            }));

            $("#syntax").modal("show");
            $("#syntax").on("hidden.bs.modal", handlerSyntaxHidden);
        };

        $("#archive").on("hidden.bs.modal", handlerArchiveHidden);
    });
});

// Message/response handling
browser.runtime.onMessage.addListener(message => {
    if(message) {
        switch(message.type) {
        case "toggleAutoUpdateFinished": {
            if(message.result) $("#enableFilterAutoUpdate").removeAttr("disabled");
            break;
        }
        case "cleanAllFiltersFinished": {
            if(message.result) $("#cleanAllFilters").removeAttr("disabled");
            break;
        }
        case "updateAllFiltersFinished": {
            if(message.result) $("#updateAllFilters").removeAttr("disabled");
            break;
        }
        case "updateFilterFinished": {
            if(!message.result) displayFilters();
            break;
        }
        case "getNumberOfRulesResponse": {
            $("#detailsFilterRulesCount").text(message.count);
            break;
        }
        case "reinstallDefaultFiltersResponse": {
            if(message.result) $("#resetDefaultFiltersBtn").removeAttr("disabled");
            break;
        }
        case "addFilterFinished":
        case "addFilterError": {
            $("#addFilterBtn").removeAttr("disabled");
            $("#filterAddress").removeAttr("disabled");
            $("#addFilterCancelBtn").removeAttr("disabled");

            if(message.type == "addFilterError") {
                switch(message.error) {
                case "Fetch error":
                    $("#addFilterErrorFetch").show();
                    break;
                case "Parsing error":
                    $("#addFilterErrorParsing").show();
                    break;
                case "Unknown error":
                    $("#addFilterErrorUnknown").show();
                    break;
                case "Already added error":
                    $("#addFilterErrorAlreadyAdded").show();
                    break;
                case "Empty error":
                    $("#addFilterErrorEmpty").show();
                    break;
                }
            } else {
                $("#addFilterSource").modal("hide");
            }
            break;
        }
        case "updateCustomFilterFinished": {
            $("#customFilterSave").removeAttr("disabled", "disabled");

            clearTimeout(filterSavedTimeout);
            filterSavedTimeout = setTimeout(() => {
                $("#customFilterSave").attr("data-original-title", "");
                $("#customFilterSave").tooltip("hide");
                $("#customFilterSave").tooltip("disable");
            }, 3000);

            $("#customFilterSave").attr("data-original-title", i18next.t("modal.filters.saved"));
            $("#customFilterSave").tooltip("enable");
            $("#customFilterSave").tooltip("show");
            break;
        }
        case "updateCustomFilterAndCloseFinished": {
            $("#closeAndSaveCustomFilter").removeAttr("disabled", "disabled");
            $("#editFilter").modal("hide");
            break;
        }
        }
    }
});