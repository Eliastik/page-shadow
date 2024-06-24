/* Page Shadow
 *
 * Copyright (C) 2015-2022 Eliastik (eliastiksofts.com)
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
import "codemirror/addon/mode/simple.js";
import "codemirror/addon/selection/active-line.js";
import "codemirror/addon/edit/matchbrackets.js";
import "codemirror/addon/scroll/simplescrollbars.js";
import "codemirror/addon/scroll/simplescrollbars.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/css-hint.js";
import "jquery-colpick";
import "jquery-colpick/css/colpick.css";
import { commentAllLines, getBrowser, downloadData, loadPresetSelect, loadPreset, savePreset, deletePreset, getPresetData, convertBytes, getSizeObject, toggleTheme, isInterfaceDarkTheme, loadWebsiteSpecialFiltersConfig, getSettingsToArchive, archiveCloud, sendMessageWithPromise, getCurrentArchiveCloud } from "./utils/util.js";
import { extensionVersion, colorTemperaturesAvailable, defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomCSSCode, settingsToSavePresets, nbCustomThemesSlots, defaultCustomThemes, defaultFilters, customFilterGuideURL, defaultWebsiteSpecialFiltersConfig, settingNames } from "./constants.js";
import { setSettingItem, setFirstSettings, migrateSettings } from "./storage.js";
import { init_i18next } from "./locales.js";
import registerCodemirrorFilterMode from "./filter.codemirror.mode";
import browser from "webextension-polyfill";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@fortawesome/fontawesome-free/css/v4-shims.min.css";
import "@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-v4compatibility.woff2";
import optionsEN from "../_locales/en/options.json";
import optionsFR from "../_locales/fr/options.json";

window.$ = $;
window.jQuery = $;

window.codeMirrorUserCss = null;
window.codeMirrorJSONArchive = null;
window.codeMirrorFilterData = null;
window.codeMirrorEditFilter = null;

let filterSavedTimeout;
let currentSelectedTheme = 1;
let currentSelectedPresetEdit = 1;
let changingLanguage = false;
let alreadyCheckedForUpdateFilters = false;
let savedAdvancedOptionsTimeout;
let disableStorageSizeCalculation = false;
let hasGlobalChange = false;
let filterEditDisplay = false;

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
    $("nav").localize();
    $(".container").localize();
    $(".modal").localize();

    $("#themeSelect").text("");

    for(let i = 1; i <= nbCustomThemesSlots; i++) {
        $("#themeSelect").append("<option value=\"" + i + "\">" + i18next.t("container.customTheme", { count: i }) + "</option>");
    }

    if(getBrowser() != "Chrome" && getBrowser() != "Firefox" && getBrowser() != "Edge" && getBrowser() != "Opera") {
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

    displaySettings(null, changingLanguage, null, changingLanguage);
    loadAdvancedOptionsUI(false, changingLanguage);
}

function initI18next() {
    init_i18next("options").then(() => {
        i18next.addResourceBundle("en", "options", optionsEN);
        i18next.addResourceBundle("fr", "options", optionsFR);
        translateContent();
    });
}

initI18next();
toggleTheme(); // Toggle dark/light theme

async function changeLng(lng) {
    i18next.changeLanguage(lng);
}

i18next.on("languageChanged", () => {
    translateContent();
});

async function resetSettings() {
    $("span[data-toggle=\"tooltip\"]").tooltip("hide");
    $("i[data-toggle=\"tooltip\"]").tooltip("hide");

    await browser.storage.local.clear();
    await setFirstSettings();

    $("#textareaAssomPage").val("");
    $("#checkWhiteList").prop("checked", false);

    initI18next();

    $("#reset").modal("show");
    await loadPresetSelect("loadPresetSelect", i18next);
    await loadPresetSelect("savePresetSelect", i18next);
    await loadPresetSelect("deletePresetSelect", i18next);
    displayPresetSettings(currentSelectedPresetEdit);
    localStorage.clear();
}

async function displaySettings(areaName, dontDisplayThemeAndPresets, changes = null, changingLanguage) {
    if(typeof(browser.storage) == "undefined" || typeof(browser.storage.sync) == "undefined") {
        $("#archiveCloudBtn").addClass("disabled");
        $("#archiveCloudNotCompatible").show();
        $("#infosCloudStorage").text("???");
    }

    if(!areaName || areaName == "sync") {
        const cloudData = await isArchiveCloudAvailable();

        if(cloudData.available) {
            $("#restoreCloudBtn").removeClass("disabled");
            $("#infoCloudLastArchive").show();
            $("#dateCloudArchive").text(i18next.t("modal.archive.dateCloudLastArchive", { device: cloudData.device, date: new Intl.DateTimeFormat(i18next.language).format(cloudData.date), hour: new Intl.DateTimeFormat(i18next.language, { hour: "numeric", minute: "numeric", second: "numeric", timeZoneName: "short" }).format(cloudData.date), interpolation: { escapeValue: false } }));
        } else {
            $("#restoreCloudBtn").addClass("disabled");
            $("#infoCloudLastArchive").hide();
        }

        if(!disableStorageSizeCalculation) {
            try {
                const sizeCloud = browser.storage.sync.getBytesInUse ? await browser.storage.sync.getBytesInUse(null) : getSizeObject(await browser.storage.sync.get(null));
                const convertedCloud = convertBytes(sizeCloud);
                const convertedCloudMax = convertBytes(browser.storage.sync.QUOTA_BYTES);
                $("#infosCloudStorage").text(i18next.t("modal.filters.filtersStorageSize", { count: convertedCloud.size, unit: i18next.t("unit." + convertedCloud.unit) }) + (browser.storage.sync.QUOTA_BYTES ? " / " + i18next.t("modal.filters.filtersStorageMaxSize", { count: convertedCloudMax.size, unit: i18next.t("unit." + convertedCloudMax.unit) }) : ""));
            } catch(e) {
                $("#infosCloudStorage").text("???");
            }
        }
    }

    if(!areaName || areaName == "local") {
        const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "autoBackupCloudInterval", "lastAutoBackupFailed", "disableRightClickMenu"]);

        if(!disableStorageSizeCalculation) {
            const size = browser.storage.local.getBytesInUse ? await browser.storage.local.getBytesInUse(null) : getSizeObject(await browser.storage.local.get(null));
            const converted = convertBytes(size);
            $("#infosLocalStorage").text(i18next.t("modal.filters.filtersStorageSize", { count: converted.size, unit: i18next.t("unit." + converted.unit) }));
        }

        if(!changingLanguage) {
            if(result.sitesInterditPageShadow != undefined && (!changes || changes.includes("sitesInterditPageShadow"))) {
                $("#textareaAssomPage").val(result.sitesInterditPageShadow);
            }

            if(!changes || changes.includes("whiteList")) {
                if(result.whiteList == "true" && $("#checkWhiteList").is(":checked") == false) {
                    $("#checkWhiteList").prop("checked", true);
                } else if(result.whiteList !== "true" && $("#checkWhiteList").is(":checked") == true) {
                    $("#checkWhiteList").prop("checked", false);
                }
            }

            if((!changes || changes.includes("customThemes")) && (!dontDisplayThemeAndPresets)) {
                $("#themeSelect").val(currentSelectedTheme);
                displayTheme($("#themeSelect").val(), null);
            }

            if((!changes || changes.includes("filtersSettings") || changes.includes("customFilter")) && (!dontDisplayThemeAndPresets)) {
                displayFilters();
            }

            if(!changes || changes.includes("presets")) {
                await loadPresetSelect("loadPresetSelect", i18next);
                await loadPresetSelect("savePresetSelect", i18next);
                await loadPresetSelect("deletePresetSelect", i18next);
                if(!dontDisplayThemeAndPresets) displayPresetSettings(currentSelectedPresetEdit);

                $("#savePresetSelect").val(currentSelectedPresetEdit);
            }

            if(!changes || changes.includes("interfaceDarkTheme")) {
                const currentTheme = await browser.storage.local.get(["interfaceDarkTheme"]);

                if (currentTheme.interfaceDarkTheme) {
                    $("#darkThemeSelect").val(currentTheme.interfaceDarkTheme);
                }

                toggleTheme(); // Toggle dark/light theme
            }

            if(!changes || changes.includes("popupTheme")) {
                const currentPopupTheme = await browser.storage.local.get(["popupTheme"]);

                if (currentPopupTheme.popupTheme) {
                    $("#popupThemeSelect").val(currentPopupTheme.popupTheme);
                }
            }

            if(!changes || changes.includes("autoBackupCloudInterval")) {
                if(result && result.autoBackupCloudInterval) {
                    $("#autoBackupCloudSelect").val(result.autoBackupCloudInterval);
                } else {
                    $("#autoBackupCloudSelect").val("0");
                }
            }

            if(!changes || changes.includes("disableRightClickMenu")) {
                if(result && result.disableRightClickMenu == "true") {
                    $("#enableRightClickMenu").prop("checked", false);
                } else {
                    $("#enableRightClickMenu").prop("checked", true);
                }
            }

            if(!changes || changes.includes("advancedOptionsFiltersSettings")) {
                checkAdvancedOptions();
                loadAdvancedOptionsUI();
            }
        } else {
            await loadPresetSelect("loadPresetSelect", i18next);
            await loadPresetSelect("savePresetSelect", i18next);
            await loadPresetSelect("deletePresetSelect", i18next);

            displayPresetSettings(currentSelectedPresetEdit, changingLanguage);
            displayFilters();
        }

        if(await notifyChangedThemeNotSaved($("#themeSelect").val())) {
            $("#not-saved-lists").show();
        } else {
            $("#not-saved-lists").hide();
        }

        if(await notifyChangedListNotSaved()) {
            $("#not-saved-lists").show();
        } else {
            $("#not-saved-lists").hide();
        }

        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            $("#not-saved-presets").show();
        } else {
            $("#not-saved-presets").hide();
        }

        if(await notifyChangedAdvancedOptionsNotSaved()) {
            $("#not-saved-advanced").show();
        } else {
            $("#not-saved-advanced").hide();
        }

        if(result && result.lastAutoBackupFailed == "true") {
            $("#autoBackupError").show();
        }
    }
}

async function displayTheme(nb, defaultSettings) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;
    defaultSettings = defaultSettings == undefined ? false : defaultSettings;
    let customThemes, fontTheme, fontName, customCSS, backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme;

    const result = await browser.storage.local.get("customThemes");

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

    if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
        $("#not-saved-customThemes").show();
    } else {
        $("#not-saved-customThemes").hide();
    }
}

async function displayFilters() {
    const result = await browser.storage.local.get("filtersSettings");
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

        checkbox.addEventListener("click", async() => {
            checkbox.disabled = true;
            let messageType = "enableFilter";

            if(!checkbox.checked) messageType = "disableFilter";

            sendMessageWithPromise({ "type": messageType, "filterId": index });
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
                hasError.classList.add("red");
                texts.appendChild(hasError);
            }

            if (filter.needUpdate) {
                const hasUpdate = document.createElement("div");
                hasUpdate.textContent = i18next.t("modal.filters.hasUpdate");
                hasUpdate.style.color = "orange";
                texts.appendChild(hasUpdate);

                if (filters.enableAutoUpdate) {
                    const hasAutoUpdate = document.createElement("div");
                    hasAutoUpdate.textContent = i18next.t("modal.filters.hasUpdateAuto");
                    hasAutoUpdate.style.color = "orange";
                    texts.appendChild(hasAutoUpdate);
                }
            }
        }

        if(filter.customFilter) {
            const customFilterCount = document.createElement("div");
            customFilterCount.setAttribute("id", "customFilterCount");
            texts.appendChild(customFilterCount);

            const divErrorFilterCount = document.createElement("div");
            const errorFilterCount = document.createElement("span");
            errorFilterCount.setAttribute("id", "errorFilterCountCustom");
            errorFilterCount.classList.add("red");

            const buttonSeeErrors = document.createElement("button");
            buttonSeeErrors.setAttribute("class", "btn btn-sm btn-link ml-2");
            buttonSeeErrors.setAttribute("id", "buttonSeeErrorsCustomFilter");
            buttonSeeErrors.setAttribute("data-toggle", "tooltip");
            buttonSeeErrors.setAttribute("title", i18next.t("modal.filters.seeErrorDetails"));

            buttonSeeErrors.addEventListener("click", async() => {
                buttonSeeErrors.setAttribute("disabled", "disabled");

                const message = await sendMessageWithPromise({ "type": "getRulesErrors", "idFilter": "customFilter" }, "getRulesErrorsResponse");

                if(message.typeFilter == "custom") {
                    $("#buttonSeeErrorsCustomFilter").removeAttr("disabled");
                } else {
                    $("#buttonSeeErrorsFilter").removeAttr("disabled");
                }

                displayFilterErrors(message.data, message.typeFilter);
            });

            const iconSeeErrors = document.createElement("i");
            iconSeeErrors.setAttribute("class", "fa fa-search");
            buttonSeeErrors.appendChild(iconSeeErrors);

            divErrorFilterCount.appendChild(errorFilterCount);
            divErrorFilterCount.appendChild(buttonSeeErrors);
            texts.appendChild(divErrorFilterCount);
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
                    sendMessageWithPromise({ type: "openTab", url: filter.homepage, part: "" });
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
                    sendMessageWithPromise({ "type": "removeFilter", "filterId": index });
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

            buttonUpdate.addEventListener("click", async() => {
                buttonUpdate.disabled = true;

                const message = await sendMessageWithPromise({ "type": "updateFilter", "filterId": index }, "updateFilterFinished");
                if(!message.result) displayFilters();
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

    const rulesCount = await sendMessageWithPromise({ "type": "getNumberOfTotalRules" }, "getNumberOfTotalRulesResponse");
    $("#filtersCount").text(i18next.t("modal.filters.filtersCount", { count: rulesCount.count }));

    const filtersSize = await sendMessageWithPromise({ "type": "getFiltersSize" }, "getFiltersSizeResponse");
    const converted = convertBytes(filtersSize.size);
    $("#filtersStorageSize").text(i18next.t("modal.filters.filtersStorageSize", { count: converted.size, unit: i18next.t("unit." + converted.unit) }));

    const customRulesCount = await sendMessageWithPromise({ "type": "getNumberOfCustomFilterRules" }, "getNumberOfCustomFilterRulesResponse");
    $("#customFilterCount").text(i18next.t("modal.filters.filtersCount", { count: customRulesCount.count }));

    const errorCustomRules = await sendMessageWithPromise({ "type": "getRulesErrorCustomFilter" }, "getRulesErrorCustomFilterResponse");
    $("#errorFilterCountCustom").text("");
    $("#buttonSeeErrorsCustomFilter").hide();

    if(errorCustomRules.data && errorCustomRules.data.length > 0) {
        $("#errorFilterCountCustom").text(i18next.t("modal.filters.filtersWithErrorCount", { count: errorCustomRules.data.length }));
        $("#buttonSeeErrorsCustomFilter").show();
    }
}

async function loadAdvancedOptionsUI(reset, changingLanguage) {
    let websiteFiltersConfig = JSON.parse(JSON.stringify(defaultWebsiteSpecialFiltersConfig));

    if (!reset) {
        websiteFiltersConfig = await loadWebsiteSpecialFiltersConfig();
    }

    if(changingLanguage) {
        websiteFiltersConfig = getUpdatedAdvancedOptions();
    }

    document.querySelector("#advancedOptionsFiltersWebsiteSettings").textContent = "";

    Object.keys(websiteFiltersConfig).forEach(key => {
        const value = websiteFiltersConfig[key];

        const formGroup = document.createElement("div");
        formGroup.classList.add("form-group");

        const label = document.createElement("label");
        label.classList.add("col-lg-4", "control-label", "option-label");
        label.textContent = i18next.t("advancedOptions.filtersConfig." + key);
        label.setAttribute("for", key);
        formGroup.appendChild(label);

        const div = document.createElement("div");
        div.classList.add("col-lg-8");
        formGroup.appendChild(div);

        if(typeof value !== "boolean") {
            const input = document.createElement("input");
            input.id = key;
            input.name = key;
            input.value = value;
            input.classList.add("form-control", "input-font");
            input.oninput = async() => {
                if(await notifyChangedAdvancedOptionsNotSaved()) {
                    $("#not-saved-advanced").show();
                } else {
                    $("#not-saved-advanced").hide();
                }
            };
            div.appendChild(input);
        } else {
            const divCheckboxSwitch = document.createElement("div");
            divCheckboxSwitch.classList.add("checkbox-switch", "checkbox-switch-sm");

            const inputCheckbox = document.createElement("input");
            inputCheckbox.id = key;
            inputCheckbox.name = key;
            inputCheckbox.type = "checkbox";
            inputCheckbox.onchange = async() => {
                if(await notifyChangedAdvancedOptionsNotSaved()) {
                    $("#not-saved-advanced").show();
                } else {
                    $("#not-saved-advanced").hide();
                }
            };

            if(value) {
                inputCheckbox.setAttribute("checked", "checked");
            }

            const labelCheckbox = document.createElement("label");
            labelCheckbox.setAttribute("for", key);
            labelCheckbox.classList.add("label-blue");

            divCheckboxSwitch.appendChild(inputCheckbox);
            divCheckboxSwitch.appendChild(labelCheckbox);
            div.appendChild(divCheckboxSwitch);
        }

        const help = document.createElement("i");
        help.classList.add("fa", "fa-question-circle", "helpIcon");
        help.setAttribute("data-toggle", "tooltip");
        help.setAttribute("title", i18next.t("advancedOptions.filtersConfig.help." + key));
        div.appendChild(help);

        document.querySelector("#advancedOptionsFiltersWebsiteSettings").appendChild(formGroup);
    });

    $("[data-toggle=\"tooltip\"]").tooltip();
}

function getUpdatedAdvancedOptions() {
    const websiteFiltersConfig = JSON.parse(JSON.stringify(defaultWebsiteSpecialFiltersConfig));

    Object.keys(websiteFiltersConfig).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(websiteFiltersConfig, key)) {
            if(typeof websiteFiltersConfig[key] === "boolean") {
                const checkbox = document.querySelector("input#" + key);

                if(checkbox) {
                    if(checkbox.checked) {
                        websiteFiltersConfig[key] = true;
                    } else {
                        websiteFiltersConfig[key] = false;
                    }
                }
            } else {
                const input = document.querySelector("input#" + key);

                if(input) {
                    const value = input.value == "true" ? true : (input.value === "false" ? false : input.value);
                    websiteFiltersConfig[key] = value;
                }
            }
        }
    });

    return websiteFiltersConfig;
}

async function saveAdvancedOptions() {
    await setSettingItem("advancedOptionsFiltersSettings", getUpdatedAdvancedOptions());
    loadAdvancedOptionsUI();

    clearTimeout(savedAdvancedOptionsTimeout);
    savedAdvancedOptionsTimeout = setTimeout(() => {
        $("#saveAdvancedOptions").attr("data-original-title", "");
        $("#saveAdvancedOptions").tooltip("hide");
        $("#saveAdvancedOptions").tooltip("disable");
    }, 3000);

    $("#saveAdvancedOptions").attr("data-original-title", i18next.t("advancedOptions.saved"));
    $("#saveAdvancedOptions").tooltip("enable");
    $("#saveAdvancedOptions").tooltip("show");
}

async function notifyChangedAdvancedOptionsNotSaved() {
    const result = await browser.storage.local.get("advancedOptionsFiltersSettings");
    const resultConfig = result.advancedOptionsFiltersSettings;
    const currentConfigs = resultConfig && Object.keys(resultConfig).length > 0 ? resultConfig : defaultWebsiteSpecialFiltersConfig;
    const websiteFiltersConfig = getUpdatedAdvancedOptions();

    for(const key of Object.keys(websiteFiltersConfig)) {
        const currentConfigHasKey = Object.prototype.hasOwnProperty.call(currentConfigs, key);
        const currentConfig = currentConfigHasKey ? currentConfigs[key] : defaultWebsiteSpecialFiltersConfig[key];

        if(currentConfig != websiteFiltersConfig[key]) {
            return true;
        }
    }

    return false;
}

async function displayDetailsFilter(idFilter) {
    $("#filterDetails").on("shown.bs.modal", () => {
        window.codeMirrorFilterData.refresh();
    });

    $("#filterDetails").modal("show");

    window.codeMirrorFilterData.getDoc().setValue("");

    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

    if(filters) {
        const filter = filters.filters[idFilter];

        if(filter) {
            window.codeMirrorFilterData.getDoc().setValue(filter.content);
        }
    }
}

async function displayInfosFilter(idFilter) {
    $("#filterInfos").modal("show");

    const result = await browser.storage.local.get("filtersSettings");
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


            const resultCount = await sendMessageWithPromise({ "type": "getNumberOfRules", "idFilter": idFilter }, "getNumberOfRulesResponse");
            $("#detailsFilterRulesCount").text(resultCount.count);

            const resultErrorsNumber = await sendMessageWithPromise({ "type": "getFilterRuleNumberErrors", "idFilter": idFilter }, "getFilterRuleNumberErrorsResponse");

            if(resultErrorsNumber) {
                if(resultErrorsNumber.data) {
                    $("#errorFilterCount").text(i18next.t("modal.filters.filtersWithErrorCount", { count: resultErrorsNumber.data.length }));
                    $("#buttonSeeErrorsFilter").attr("disabled", "disabled");

                    if(resultErrorsNumber.data && resultErrorsNumber.data.length > 0) {
                        $("#buttonSeeErrorsFilter").removeAttr("disabled");
                    }
                }
            }

            $("#buttonSeeErrorsFilter").off("click").on("click", async() => {
                const resultErrors = await sendMessageWithPromise({ "type": "getRulesErrors", "idFilter": idFilter }, "getRulesErrorsResponse");

                if(resultErrors) {
                    if(resultErrors.typeFilter == "custom") {
                        $("#buttonSeeErrorsCustomFilter").removeAttr("disabled");
                    } else {
                        $("#buttonSeeErrorsFilter").removeAttr("disabled");
                    }
                }

                displayFilterErrors(resultErrors.data, resultErrors.typeFilter);
            });
        }
    }
}

async function displayPresetInfos(nb) {
    $("#presetInfos").modal("show");

    const presetData = await getPresetData(nb);

    if(presetData) {
        const modalBody = document.querySelector("#presetInfos .modal-body");
        modalBody.textContent = "";

        for(const setting of settingsToSavePresets) {
            if(setting == "colorInvert") continue;
            if(setting == "attenuateImageColor") continue;
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
                span.innerHTML = value == "true" ? "<i class=\"fa-solid fa-check fa-fw\"></i>" : "<i class=\"fa-solid fa-xmark fa-fw\"></i>";
            } else if(setting == "pourcentageLum" || setting == "percentageBlueLightReduction" || setting == "percentageAttenuateColors") {
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

async function displayFilterErrors(data, filterType) {
    if(filterType == "custom") {
        $("#filterErrors").modal("show");
    } else {
        $("#filterInfos").off("hidden.bs.modal");
        $("#filterInfos").modal("hide");

        $("#filterInfos").on("hidden.bs.modal", () => {
            $("#filterErrors").modal("show");
            $("#filterInfos").off("hidden.bs.modal");
        });

        $("#filterErrors").on("hidden.bs.modal", () => {
            $("#filterInfos").modal("show");
            $("#filterErrors").off("hidden.bs.modal");
        });
    }

    if(data) {
        displayFilterErrorsOnElement(data, document.querySelector("#filterErrors .modal-body"));
    }
}

function displayFilterErrorsOnElement(data, domElement) {
    if(domElement) {
        domElement.textContent = "";

        for(const element of data) {
            const row = document.createElement("div");
            row.setAttribute("class", "border-bottom");

            const label = document.createElement("label");
            label.setAttribute("class", "control-label bold");
            label.textContent = i18next.t("modal.filters.errorType." + element.type.toLowerCase());
            row.appendChild(label);

            const labelLine = document.createElement("div");
            labelLine.textContent = i18next.t("modal.filters.errorLine", { count: element.line });
            row.appendChild(labelLine);

            if(element.linePart) {
                const divPart = document.createElement("div");
                const spanPart = document.createElement("span");
                spanPart.textContent = i18next.t("modal.filters.errorLineDetails");
                const spanPartDetails = document.createElement("span");
                spanPartDetails.setAttribute("class", "filterErrorDetail");
                spanPartDetails.textContent = element.linePart;

                divPart.appendChild(spanPart);
                divPart.appendChild(spanPartDetails);
                row.appendChild(divPart);
            }

            if(element.message) {
                const divMessage = document.createElement("div");
                const spanMessage = document.createElement("span");
                spanMessage.textContent = i18next.t("modal.filters.errorLineMessage");
                const spanMessageDetails = document.createElement("span");
                spanMessageDetails.setAttribute("class", "filterErrorDetail");
                spanMessageDetails.textContent = element.message;

                divMessage.appendChild(spanMessage);
                divMessage.appendChild(spanMessageDetails);
                row.appendChild(divMessage);
            }

            if(element.errorCode) {
                const divCode = document.createElement("div");
                const spanCode = document.createElement("span");
                spanCode.textContent = i18next.t("modal.filters.errorCode");
                const spanCodeDetails = document.createElement("span");
                spanCodeDetails.setAttribute("class", "filterErrorDetail");
                spanCodeDetails.textContent = element.errorCode;

                divCode.appendChild(spanCode);
                divCode.appendChild(spanCodeDetails);
                row.appendChild(divCode);
            }

            domElement.appendChild(row);
        }
    }
}

async function displayFilterEdit() {
    filterEditDisplay = true;
    $("#editFilter").modal("show");

    $("#editFilter").on("shown.bs.modal", () => {
        window.codeMirrorEditFilter.refresh();
    });

    $("#editFilter").on("hidden.bs.modal", () => {
        filterEditDisplay = false;
    });

    window.codeMirrorEditFilter.getDoc().setValue("");

    const result = await browser.storage.local.get("customFilter");
    const filter = result.customFilter != null ? result.customFilter : "";

    if(filter) {
        window.codeMirrorEditFilter.getDoc().setValue(filter);

        const result = await sendMessageWithPromise({ "type": "getRulesErrorsForCustomEdit", "idFilter": "customFilter" }, "getRulesErrorsForCustomEditResponse");

        displayFilterErrorsOnElement(result.data, document.querySelector("#customFilterEditErrorDetails"));

        if(Object.keys(result.data).length > 0) {
            $("#customFilterEditErrorDetected").show();
        } else {
            $("#customFilterEditErrorDetected").hide();
            $("#customFilterEditErrorDetails").hide();
        }
    }
}

async function saveCustomFilter(close) {
    const text = window.codeMirrorEditFilter.getDoc().getValue();

    const result = await sendMessageWithPromise({ "type": close ? "updateCustomFilterAndClose" : "updateCustomFilter", "text": text }, "updateCustomFilterFinished", "updateCustomFilterAndCloseFinished");

    if(result) {
        if(close) {
            $("#closeAndSaveCustomFilter").removeAttr("disabled", "disabled");
            $("#editFilter").modal("hide");
        } else {
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
        }

        const resultErrors = await sendMessageWithPromise({ "type": "getRulesErrorsForCustomEdit", "idFilter": "customFilter" }, "getRulesErrorsForCustomEditResponse");
        displayFilterErrorsOnElement(resultErrors.data, document.querySelector("#customFilterEditErrorDetails"));

        if(Object.keys(resultErrors.data).length > 0) {
            $("#customFilterEditErrorDetected").show();
        } else {
            $("#customFilterEditErrorDetected").hide();
            $("#customFilterEditErrorDetails").hide();
        }
    }
}

async function saveThemeSettings(nb) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    const result = await browser.storage.local.get("customThemes");
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

    await setSettingItem("customThemes", customThemes);
}

async function notifyChangedThemeNotSaved(nb) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    const result = await browser.storage.local.get("customThemes");
    let customThemes = JSON.parse(JSON.stringify(defaultCustomThemes));

    if(result.customThemes != undefined) {
        customThemes = result.customThemes;
    }

    window.codeMirrorUserCss.save();

    if(customThemes[nb]["customThemeBg"] == null || customThemes[nb]["customThemeBg"].trim() == "") customThemes[nb]["customThemeBg"] = defaultBGColorCustomTheme;
    if(customThemes[nb]["customThemeTexts"] == null || customThemes[nb]["customThemeTexts"].trim() == "") customThemes[nb]["customThemeTexts"] = defaultTextsColorCustomTheme;
    if(customThemes[nb]["customThemeLinks"] == null || customThemes[nb]["customThemeLinks"].trim() == "") customThemes[nb]["customThemeLinks"] = defaultLinksColorCustomTheme;
    if(customThemes[nb]["customThemeLinksVisited"] == null || customThemes[nb]["customThemeLinksVisited"].trim() == "") customThemes[nb]["customThemeLinksVisited"] = defaultVisitedLinksColorCustomTheme;
    if(customThemes[nb]["customThemeFont"] == null || customThemes[nb]["customThemeFont"].trim() == "") customThemes[nb]["customThemeFont"] = defaultFontCustomTheme;
    if(customThemes[nb]["customCSSCode"] == null || customThemes[nb]["customCSSCode"].trim() == "") customThemes[nb]["customCSSCode"] = defaultCustomCSSCode;

    return customThemes[nb]["customThemeBg"].toLowerCase() != $("#colorpicker1").attr("value").toLowerCase() ||
        customThemes[nb]["customThemeTexts"].toLowerCase() != $("#colorpicker2").attr("value").toLowerCase() ||
        customThemes[nb]["customThemeLinks"].toLowerCase() != $("#colorpicker3").attr("value").toLowerCase() ||
        customThemes[nb]["customThemeLinksVisited"].toLowerCase() != $("#colorpicker4").attr("value").toLowerCase() ||
        customThemes[nb]["customThemeFont"].trim().toLowerCase() != $("#customThemeFont").val().trim().toLowerCase() ||
        customThemes[nb]["customCSSCode"] != $("#codeMirrorUserCSSTextarea").val();
}

async function notifyChangedListNotSaved() {
    const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]);
    const list = result.sitesInterditPageShadow || "";
    const whiteListSetting = result.whiteList != null ? result.whiteList : "false";
    const whiteListChecked = $("#checkWhiteList").is(":checked") ? "true" : "false";

    return list.toLowerCase() != $("#textareaAssomPage").val().toLowerCase() ||
        whiteListSetting.toLowerCase() != whiteListChecked.toLowerCase();
}

async function saveList() {
    await setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());

    const result = await browser.storage.local.get(["whiteList", "sitesInterditPageShadow"]);

    if($("#checkWhiteList").prop("checked") == true) {
        if(result.whiteList !== "true") {
            await setSettingItem("sitesInterditPageShadow", commentAllLines(result.sitesInterditPageShadow));
        }

        await setSettingItem("whiteList", "true");
    } else {
        if(result.whiteList == "true") {
            await setSettingItem("sitesInterditPageShadow", commentAllLines(result.sitesInterditPageShadow));
        }

        await setSettingItem("whiteList", "false");
    }

    $("#saved").modal("show");
}

async function changeLanguage() {
    changingLanguage = true;

    changeLng($("#languageSelect").val());
    $("span[data-toggle=\"tooltip\"]").tooltip("hide");
    $("i[data-toggle=\"tooltip\"]").tooltip("hide");

    changingLanguage = false;
}

async function changeTheme() {
    await setSettingItem("interfaceDarkTheme", $("#darkThemeSelect").val());
    await toggleTheme();
}

async function archiveSettings() {
    $("#archiveError").hide();
    $("#archiveDataButton").attr("disabled", "disabled");

    try {
        const date = new Date();
        const dateString = date.getFullYear() + "-" + (parseInt(date.getMonth()) + 1).toString() + "-" + date.getDate() + "-" + date.getHours() + "_" + date.getMinutes() + "_" + date.getSeconds();
        const dataStr = await getSettingsToArchive();
        const filename = "page-shadow-backupdata-" + dateString + ".json";

        window.codeMirrorJSONArchive.getDoc().setValue(dataStr);
        setTimeout(() => window.codeMirrorJSONArchive.refresh(), 50);
        $("#archiveSuggestedName").val(filename);
        $("#helpArchive").show();
        $("#archiveDataButton").removeAttr("disabled");

        downloadData(dataStr, filename);
    } catch(e) {
        $("#archiveError").fadeIn(500);
        $("#archiveDataButton").removeAttr("disabled");
    }
}

async function restoreSettings(object) {
    disableStorageSizeCalculation = true;

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
        return false;
    }

    // Reset data
    await browser.storage.local.clear();
    await setFirstSettings();

    const finalRestoreObject = {};

    for(const key in object) {
        if(typeof(key) === "string") {
            if(Object.prototype.hasOwnProperty.call(object, key)) {
                if(key && settingNames.indexOf(key) !== -1) {
                    finalRestoreObject[key] = object[key];
                }
            }
        }
    }

    await browser.storage.local.set(finalRestoreObject);
    await migrateSettings();
    sendMessageWithPromise({ "type": "updatePresetCache" });

    $("#updateAllFilters").attr("disabled", "disabled");

    const message = await sendMessageWithPromise({ "type": "updateAllFilters" }, "updateAllFiltersFinished");
    if(message.result) $("#updateAllFilters").removeAttr("disabled");

    disableStorageSizeCalculation = false;
    return true;
}

function restoreSettingsFile(event) {
    $("#restoreError").hide();
    $("#restoreSuccess").hide();
    $("#restoreErrorFilesize").hide();
    $("#restoreErrorExtension").hide();
    $("#restoreErrorArchive").hide();

    const oldTextareadValue = $("#textareaAssomPage").val();

    if (typeof FileReader !== "undefined") {
        const reader = new FileReader();
        reader.onload = async(event) => {
            let obj;

            try {
                obj = JSON.parse(event.target.result);
            } catch(e) {
                $("#restoreError").fadeIn(500);
                return false;
            }

            $("#textareaAssomPage").val("");
            $("#checkWhiteList").prop("checked", false);
            $("#restoreDataButton").attr("disabled", "disabled");
            $("#archiveCloudBtn").attr("disabled", "disabled");
            $("#restoreCloudBtn").attr("disabled", "disabled");
            $("#restoring").show();

            const result = await restoreSettings(obj);

            $("#restoreDataButton").removeAttr("disabled");
            $("#archiveCloudBtn").removeAttr("disabled");
            $("#restoreCloudBtn").removeAttr("disabled");
            $("#restoring").hide();

            if(result) {
                $("#restoreSuccess").fadeIn(500);
            } else {
                $("#restoreErrorArchive").fadeIn(500);
                $("#textareaAssomPage").val(oldTextareadValue);
            }
        };

        reader.onerror = function() {
            $("#restoreError").fadeIn(500);
            $("#textareaAssomPage").val(oldTextareadValue);
        };

        const fileExtension = event.target.files[0].name.split(".").pop().toLowerCase();

        if(fileExtension == "json") {
            const filesize = event.target.files[0].size;

            if(filesize <= 5000000) { // max size of 5 MB
                reader.readAsText(event.target.files[0]);
            } else {
                $("#restoreErrorFilesize").fadeIn(500);
                $("#textareaAssomPage").val(oldTextareadValue);
                return false;
            }
        } else {
            $("#restoreErrorExtension").fadeIn(500);
            $("#textareaAssomPage").val(oldTextareadValue);
            return false;
        }
    } else {
        $("#restoreError").hide();
    }
}

async function archiveCloudSettings() {
    $("#archiveCloudError").hide();
    $("#restoreCloudError").hide();
    $("#archiveCloudSuccess").hide();
    $("#restoreCloudSuccess").hide();
    $("#archiveCloudErrorQuota").hide();
    $("#archiveCloudBtn").attr("disabled", "disabled");
    $("#restoreCloudBtn").attr("disabled", "disabled");
    $("#restoreDataButton").attr("disabled", "disabled");
    $("#archivingCloud").show();

    try {
        await archiveCloud();

        $("#archiveCloudSuccess").fadeIn(500);
        $("#archiveCloudBtn").removeAttr("disabled");
        $("#restoreCloudBtn").removeAttr("disabled");
        $("#restoreDataButton").removeAttr("disabled");
        $("#archivingCloud").hide();
    } catch(e) {
        if(e.message === "quota") {
            $("#archiveCloudErrorQuota").fadeIn(500);
        } else {
            $("#archiveCloudError").fadeIn(500);
        }

        $("#archiveCloudBtn").removeAttr("disabled");
        $("#restoreCloudBtn").removeAttr("disabled");
        $("#restoreDataButton").removeAttr("disabled");
        $("#archivingCloud").hide();
    }
}

async function isArchiveCloudAvailable() {
    if(typeof(browser.storage) == "undefined" && typeof(browser.storage.sync) == "undefined") {
        return {
            "available": false,
            "date": null,
            "device": null
        };
    }

    try {
        const data = await browser.storage.sync.get(["dateLastBackup", "pageShadowStorageBackup", "deviceBackup"]);
        if(data.dateLastBackup && data.deviceBackup) {
            return {
                "available": true,
                "date": data.dateLastBackup,
                "device": data.deviceBackup
            };
        } else {
            return {
                "available": false,
                "date": null,
                "device": null
            };
        }
    } catch(e) {
        return {
            "available": false,
            "date": null,
            "device": null
        };
    }
}

async function restoreCloudSettings() {
    if(typeof(browser.storage) != "undefined" && typeof(browser.storage.sync) != "undefined") {
        $("#archiveCloudError").hide();
        $("#restoreCloudError").hide();
        $("#archiveCloudSuccess").hide();
        $("#restoreCloudSuccess").hide();
        $("#archiveCloudErrorQuota").hide();

        const oldTextareadValue = $("#textareaAssomPage").val();

        try {
            const dataSync = await getCurrentArchiveCloud();

            if(dataSync != undefined) {
                let dataObj = dataSync;

                if(dataSync.pageShadowStorageBackup) {
                    dataObj = JSON.parse(dataSync.pageShadowStorageBackup);
                }

                $("#textareaAssomPage").val("");
                $("#checkWhiteList").prop("checked", false);
                $("#restoreCloudBtn").attr("disabled", "disabled");
                $("#restoreDataButton").attr("disabled", "disabled");
                $("#archiveCloudBtn").attr("disabled", "disabled");
                $("#restoringCloud").show();

                const result = await restoreSettings(dataObj);

                $("#archiveCloudBtn").removeAttr("disabled");
                $("#restoreCloudBtn").removeAttr("disabled");
                $("#restoreDataButton").removeAttr("disabled");
                $("#restoringCloud").hide();

                if(result) {
                    $("#restoreCloudSuccess").fadeIn(500);
                } else {
                    $("#restoreCloudError").fadeIn(500);
                    $("#textareaAssomPage").val(oldTextareadValue);
                }
            } else {
                $("#restoreCloudError").fadeIn(500);
                $("#textareaAssomPage").val(oldTextareadValue);
            }
        } catch(e) {
            $("#restoreCloudError").fadeIn(500);
            $("#textareaAssomPage").val(oldTextareadValue);
            $("#archiveCloudBtn").removeAttr("disabled");
            $("#restoreCloudBtn").removeAttr("disabled");
            $("#restoreDataButton").removeAttr("disabled");
        }
    }
}

async function createPreset() {
    $("#savePresetError").hide();
    $("#savePresetSuccess").hide();

    const result = await savePreset(parseInt($("#savePresetSelect").val()), $("#savePresetTitle").val(), $("#savePresetWebsite").val(), $("#checkSaveNewSettingsPreset").prop("checked"));

    if(result == "success") {
        $("#savePresetSuccess").fadeIn(500);
    } else {
        $("#savePresetError").fadeIn(500);
    }
}

async function notifyChangedPresetNotSaved(nb) {
    const data = await getPresetData(nb);

    if(data && Object.keys(data).length > 0) {
        const name = typeof(data["name"]) === "undefined" ? "" : data["name"];
        const websiteListToApply = typeof(data["websiteListToApply"]) === "undefined" ? "" : data["websiteListToApply"];

        return name != $("#savePresetTitle").val() || websiteListToApply != $("#savePresetWebsite").val();
    }

    return $("#savePresetTitle").val().trim() != "" || $("#savePresetWebsite").val().trim() != "";
}

async function displayPresetSettings(id, changingLanguage) {
    const data = await getPresetData(id);

    if(!changingLanguage) {
        $("#savePresetTitle").val("");
        $("#savePresetWebsite").val("");
        $("#checkSaveNewSettingsPreset").prop("checked", false);
    }

    $("#checkSaveNewSettingsPreset").removeAttr("disabled");
    $("#presetInfosBtn").removeAttr("disabled");

    if(data && data != "error" && Object.keys(data).length > 0) {
        if(!changingLanguage) {
            if(data.name) $("#savePresetTitle").val(data.name);
            if(data.websiteListToApply) $("#savePresetWebsite").val(data.websiteListToApply);
        }

        $("#presetCreateEditBtn").text(i18next.t("modal.edit"));
    } else {
        $("#checkSaveNewSettingsPreset").prop("checked", true);
        $("#checkSaveNewSettingsPreset").attr("disabled", "disabled");
        $("#presetInfosBtn").attr("disabled", "disabled");
        $("#presetCreateEditBtn").text(i18next.t("modal.create"));
    }
}

async function addFilter() {
    $("#addFilterBtn").attr("disabled", "disabled");
    $("#filterAddress").attr("disabled", "disabled");
    $("#addFilterCancelBtn").attr("disabled", "disabled");
    $("#addFilterErrorFetch").hide();
    $("#addFilterErrorParsing").hide();
    $("#addFilterErrorUnknown").hide();
    $("#addFilterErrorAlreadyAdded").hide();
    $("#addFilterErrorEmpty").hide();

    const response = await sendMessageWithPromise({ "type": "addFilter", "address": $("#filterAddress").val() }, "addFilterFinished", "addFilterError");

    $("#addFilterBtn").removeAttr("disabled");
    $("#filterAddress").removeAttr("disabled");
    $("#addFilterCancelBtn").removeAttr("disabled");

    if(response.type == "addFilterError") {
        switch(response.error) {
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
}

async function initColpick() {
    $("#colorpicker1").colpick({
        layout: "full",
        submit: false,
        color: "000000",
        colorScheme: await isInterfaceDarkTheme() ? "dark" : "light",
        onChange: async(hsb, hex) => {
            $("#colorpicker1").css("background-color", "#"+hex);
            $("#previsualisationDiv").css("background-color", "#"+hex);
            $("#colorpicker1").attr("value", hex);

            if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
                $("#not-saved-customThemes").show();
            } else {
                $("#not-saved-customThemes").hide();
            }
        }
    });

    $("#colorpicker2").colpick({
        layout: "full",
        submit: false,
        color: "FFFFFF",
        colorScheme: await isInterfaceDarkTheme() ? "dark" : "light",
        onChange: async(hsb, hex) => {
            $("#colorpicker2").css("background-color", "#"+hex);
            $("#textPreview").css("color", "#"+hex);
            $("#colorpicker2").attr("value", hex);

            if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
                $("#not-saved-customThemes").show();
            } else {
                $("#not-saved-customThemes").hide();
            }
        }
    });

    $("#colorpicker3").colpick({
        layout: "full",
        submit: false,
        color: "1E90FF",
        colorScheme: await isInterfaceDarkTheme() ? "dark" : "light",
        onChange: async(hsb, hex) => {
            $("#colorpicker3").css("background-color", "#"+hex);
            $("#linkPreview").css("color", "#"+hex);
            $("#colorpicker3").attr("value", hex);

            if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
                $("#not-saved-customThemes").show();
            } else {
                $("#not-saved-customThemes").hide();
            }
        }
    });

    $("#colorpicker4").colpick({
        layout: "full",
        submit: false,
        color: "800080",
        colorScheme: await isInterfaceDarkTheme() ? "dark" : "light",
        onChange: async(hsb, hex) => {
            $("#colorpicker4").css("background-color", "#"+hex);
            $("#linkVisitedPreview").css("color", "#"+hex);
            $("#colorpicker4").attr("value", hex);

            if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
                $("#not-saved-customThemes").show();
            } else {
                $("#not-saved-customThemes").hide();
            }
        }
    });
}

function checkAdvancedOptions() {
    if($("#checkboxAdvancedOptions").is(":checked")) {
        $("#advancedOptionsFull").show();
        $("#advancedOptionsFullWarning").hide();
    } else {
        $("#advancedOptionsFull").hide();
        $("#advancedOptionsFullWarning").show();
    }
}

function openTabByHash() {
    // Hash
    if(window.location.hash) {
        if(window.location.hash == "#customTheme") {
            $("#customThemeTabLink a").tab("show");
        } else if(window.location.hash == "#presets") {
            $("#presetsTabLink a").tab("show");
        } else if(window.location.hash == "#aboutLatestVersion") {
            $("#aboutTabLink a").tab("show");
            $("#changelogTabLink a").tab("show");
        } else if(window.location.hash == "#archive") {
            $("#archiveRestoreTabLink a").tab("show");
        }
    }
}

$(document).ready(() => {
    let savedTimeout;

    $("#saveListButton").on("click", () => {
        saveList();
    });

    $("#languageSelect").on("change", () => {
        changeLanguage();
    });

    $("#darkThemeSelect").on("change", () => {
        changeTheme();
    });

    $("#enableRightClickMenu").on("change", async() => {
        await setSettingItem("disableRightClickMenu", $("#enableRightClickMenu").is(":checked") ? "false" : "true");
    });

    $("#autoBackupCloudSelect").on("change", async() => {
        await setSettingItem("autoBackupCloudInterval", $("#autoBackupCloudSelect").val());
    });

    $("#popupThemeSelect").on("change", async() => {
        await setSettingItem("popupTheme", $("#popupThemeSelect").val());
    });

    $("#themeSelect").on("change", async() => {
        if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
            if(!confirm(i18next.t("modal.customTheme.notifyThemeChangedNotSaved"))) {
                $("#themeSelect").val(currentSelectedTheme);
                return;
            }
        }

        $("#not-saved-customThemes").hide();
        currentSelectedTheme = $("#themeSelect").val();
        displayTheme($("#themeSelect").val());
    });

    $("#customThemeSave").on("click", () => {
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
        $("#not-saved-customThemes").hide();
    });

    $("#customThemeCancel").on("click", () => {
        displayTheme($("#themeSelect").val());
    });

    $("#customThemeReset").on("click", () => {
        displayTheme($("#themeSelect").val(), true);
    });

    $("#aboutDialogBtn").on("click", () => {
        $("span[data-toggle=\"tooltip\"]").tooltip("hide");
        $("i[data-toggle=\"tooltip\"]").tooltip("hide");
    });

    $("#resetConfirmBtn").on("click", () => {
        $("span[data-toggle=\"tooltip\"]").tooltip("hide");
        $("i[data-toggle=\"tooltip\"]").tooltip("hide");
    });

    $("#archiveCloudBtn").on("click", () => {
        archiveCloudSettings();
    });

    $("#restoreCloudBtn").on("click", () => {
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

    $("#confirmReset").on("click", () => {
        resetSettings();
    });

    $("#versionExtension").text(extensionVersion);
    $("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion);

    if(typeof(browser.storage.onChanged) !== "undefined") {
        browser.storage.onChanged.addListener((changes, areaName) => {
            if(changes) {
                displaySettings(areaName, changingLanguage, Object.keys(changes));
            }
        });
    }

    initColpick();

    $("#archiveDataButton").on("click", () => {
        archiveSettings();
    });

    $("#restoreDataButton").on("click", () => {
        $("#inputFileJSON").trigger("click");
    });

    $("#inputFileJSON").on("change", function(event) {
        restoreSettingsFile(event);
        $(this).val("");
    });

    $("#customThemeFont").on("input", async() => {
        if($("#customThemeFont").val().trim() !== "") {
            $("#previsualisationDiv").css("font-family", "\"" + $("#customThemeFont").val() + "\"");
        } else {
            $("#previsualisationDiv").css("font-family", "");
        }

        if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
            $("#not-saved-customThemes").show();
        } else {
            $("#not-saved-customThemes").hide();
        }
    });

    $("#archiveSuggestedName").on("click", function() {
        this.focus();
        this.select();
    });

    registerCodemirrorFilterMode(CodeMirror);

    window.codeMirrorUserCss = CodeMirror.fromTextArea(document.getElementById("codeMirrorUserCSSTextarea"), {
        lineNumbers: true,
        mode: "css",
        theme: "material",
        styleActiveLine: true,
        matchBrackets: true,
        scrollbarStyle: "overlay",
        extraKeys: {"Ctrl-Space": "autocomplete"}
    });

    window.codeMirrorUserCss.on("change", async() => {
        if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
            $("#not-saved-customThemes").show();
        } else {
            $("#not-saved-customThemes").hide();
        }
    });

    window.codeMirrorJSONArchive = CodeMirror.fromTextArea(document.getElementById("codeMirrorJSONArchiveTextarea"), {
        lineNumbers: true,
        theme: "material",
        readOnly: true,
        scrollbarStyle: "overlay"
    });

    window.codeMirrorFilterData = CodeMirror.fromTextArea(document.getElementById("codeMirrorFilterData"), {
        lineNumbers: true,
        theme: "material",
        mode: "filtermode",
        styleActiveLine: true,
        readOnly: true,
        lineWrapping: true,
        scrollbarStyle: "overlay"
    });

    window.codeMirrorEditFilter = CodeMirror.fromTextArea(document.getElementById("codeMirrorEditFilter"), {
        lineNumbers: true,
        theme: "material",
        mode: "filtermode",
        styleActiveLine: true,
        lineWrapping: true,
        scrollbarStyle: "overlay",
        extraKeys: {"Ctrl-Space": "autocomplete"}
    });


    window.codeMirrorEditFilter.on("keyup", (cm, event) => {
        if(!cm.state.completionActive && event.key != "Enter") {
            CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
        }
    });

    window.codeMirrorJSONArchive.setSize(null, 50);

    displaySettings();

    if(getBrowser() == "Chrome" || getBrowser() == "Opera") {
        $("#keyboardShortcuts").on("click", () => {
            sendMessageWithPromise({
                type: "openTab",
                url: "chrome://extensions/configureCommands",
                part: ""
            });
        });
    } else if(getBrowser() == "Edge") {
        $("#keyboardShortcuts").on("click", () => {
            sendMessageWithPromise({
                type: "openTab",
                url: "edge://extensions/shortcuts",
                part: ""
            });
        });
    } else if(getBrowser() == "Firefox") {
        $("#keyboardShortcuts").on("click", () => {
            sendMessageWithPromise({
                type: "openTab",
                url: "https://support.mozilla.org/" + i18next.language + "/kb/manage-extension-shortcuts-firefox",
                part: ""
            });
        });
    }

    $("#loadPresetValid").on("click", async() => {
        $("#restorePresetSuccess").hide();
        $("#restorePresetEmpty").hide();
        $("#restorePresetError").hide();

        const result = await loadPreset(parseInt($("#loadPresetSelect").val()));

        if(result == "success") {
            $("#restorePresetSuccess").fadeIn(500);
        } else if(result == "empty") {
            $("#restorePresetEmpty").fadeIn(500);
        } else {
            $("#restorePresetError").fadeIn(500);
        }
    });

    $("#savePresetValid").on("click", () => {
        createPreset();
    });

    $("#savePresetTitle").on("keyup", (e) => {
        if(e.key === "Enter") {
            createPreset();
        }
    });

    $("#deletePresetValid").on("click", async() => {
        $("#deletePresetError").hide();
        $("#deletePresetSuccess").hide();

        const result = await deletePreset(parseInt($("#deletePresetSelect").val()));

        if(result == "success") {
            $("#deletePresetSuccess").fadeIn(500);
        } else {
            $("#deletePresetError").fadeIn(500);
        }
    });

    $("#updateAllFilters").on("click", async() => {
        $("#updateAllFilters").attr("disabled", "disabled");

        const message = await sendMessageWithPromise({ "type": "updateAllFilters" }, "updateAllFiltersFinished");
        if(message.result) $("#updateAllFilters").removeAttr("disabled");
    });

    $("#cleanAllFilters").on("click", async() => {
        $("#cleanAllFilters").attr("disabled", "disabled");

        const message = await sendMessageWithPromise({ "type": "cleanAllFilters" }, "cleanAllFiltersFinished");
        if(message.result) $("#cleanAllFilters").removeAttr("disabled");
    });

    $("#addFilterSourceBtnOpen").on("click", () => {
        $("#addFilterErrorFetch").hide();
        $("#addFilterErrorParsing").hide();
        $("#addFilterErrorUnknown").hide();
        $("#addFilterErrorAlreadyAdded").hide();
        $("#addFilterErrorEmpty").hide();
        $("#filterAddress").val("");
    });

    $("#addFilterBtn").on("click", () => {
        addFilter();
    });

    $("#filterAddress").on("keyup", (e) => {
        if(e.key === "Enter") {
            addFilter();
        }
    });

    $("#customThemeTabLink a").on("shown.bs.tab", () => {
        window.codeMirrorUserCss.refresh();
    });

    $("#customThemeTabLink a").on("hidden.bs.tab", async() => {
        if(await notifyChangedThemeNotSaved(currentSelectedTheme)) {
            alert(i18next.t("modal.customTheme.notifyThemeChangedNotSavedInfo"));
        }
    });

    $("#presetsTabLink a").on("hidden.bs.tab", async() => {
        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            alert(i18next.t("modal.presets.notifyPresetChangedNotSavedInfo"));
        }
    });

    $("#savePresetTabLink a").on("hidden.bs.tab", async() => {
        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            alert(i18next.t("modal.presets.notifyPresetChangedNotSavedInfo"));
        }
    });

    $("#enableFilterAutoUpdate").on("change", async() => {
        $("#enableFilterAutoUpdate").attr("disabled", "disabled");

        const message = await sendMessageWithPromise({ "type": "toggleAutoUpdate", "enabled": $("#enableFilterAutoUpdate").is(":checked") }, "toggleAutoUpdateFinished");
        if(message.result) $("#enableFilterAutoUpdate").removeAttr("disabled");
    });

    $("#resetDefaultFiltersBtn").on("click", async() => {
        $("#resetDefaultFiltersBtn").attr("disabled", "disabled");

        const message = await sendMessageWithPromise({ "type": "reinstallDefaultFilters" }, "reinstallDefaultFiltersResponse");
        if(message.result) $("#resetDefaultFiltersBtn").removeAttr("disabled");
    });

    $("#customFilterSave").on("click", () => {
        $("#customFilterSave").attr("disabled", "disabled");
        saveCustomFilter();

    });

    $("#customFilterCancel").on("click", () => {
        displayFilterEdit();
    });

    $("#presetInfosBtn").on("click", () => {
        displayPresetInfos($("#savePresetSelect").val());
    });

    $("#customFilterGuide").on("click", () => {
        browser.tabs.create({
            url: customFilterGuideURL
        });
    });

    $("#closeAndSaveCustomFilter").on("click", () => {
        $("#closeAndSaveCustomFilter").attr("disabled", "disabled");
        saveCustomFilter(true);
    });

    $("#savePresetSelect").on("change", async() => {
        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            if(!confirm(i18next.t("modal.presets.notifyPresetChangedNotSaved"))) {
                $("#savePresetSelect").val(currentSelectedPresetEdit);
                return;
            }
        }

        $("#not-saved-presets").hide();
        currentSelectedPresetEdit = $("#savePresetSelect").val();
        displayPresetSettings($("#savePresetSelect").val());
    });

    $("#savePresetTitle").on("input", async() => {
        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            $("#not-saved-presets").show();
        } else {
            $("#not-saved-presets").hide();
        }
    });

    $("#savePresetWebsite").on("input", async() => {
        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            $("#not-saved-presets").show();
        } else {
            $("#not-saved-presets").hide();
        }
    });

    $("#checkSaveNewSettingsPreset").on("change", async() => {
        if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
            $("#not-saved-presets").show();
        } else {
            $("#not-saved-presets").hide();
        }
    });

    $("#syntaxBtn").on("click", () => {
        $("#syntaxText").html(i18next.t("modal.syntax.content", {
            excluded: i18next.t("modal.syntax.excluded"),
            excluded2: i18next.t("modal.syntax.excluded2"),
            bloqued: i18next.t("modal.syntax.bloqued"),
        }));
        $("#syntax").modal("show");
    });

    $("#syntaxBtnPresets").on("click", () => {
        $("#syntax").modal("show");
        $("#syntaxText").html(i18next.t("modal.syntax.content", {
            excluded: i18next.t("modal.syntax.detected"),
            excluded2: i18next.t("modal.syntax.detected2"),
            bloqued: i18next.t("modal.syntax.detected3"),
        }));
    });

    $("#buttonSeeErrorsCustomFilterEdit").on("click", () => {
        $("#customFilterEditErrorDetails").toggle();
    });

    // Auto check for filters update
    $("#filtersTabLink a").on("shown.bs.tab", async() => {
        if (!alreadyCheckedForUpdateFilters) {
            await sendMessageWithPromise({ "type": "checkUpdateNeededForFilters" }, "getUpdateNeededForFilterFinished");
            alreadyCheckedForUpdateFilters = true;
            displayFilters();
        }
    });

    $("#checkboxAdvancedOptions").on("click", () => {
        checkAdvancedOptions();
    });

    $("#resetAdvancedOptions").on("click", async() => {
        loadAdvancedOptionsUI(true);

        if(await notifyChangedAdvancedOptionsNotSaved()) {
            $("#not-saved-advanced").show();
        } else {
            $("#not-saved-advanced").hide();
        }
    });

    $("#saveAdvancedOptions").on("click", () => {
        saveAdvancedOptions();
    });

    $("#checkWhiteList").on("change", async() => {
        if(await notifyChangedListNotSaved()) {
            $("#not-saved-lists").show();
        } else {
            $("#not-saved-lists").hide();
        }
    });

    $("#textareaAssomPage").on("input", async() => {
        if(await notifyChangedListNotSaved()) {
            $("#not-saved-lists").show();
        } else {
            $("#not-saved-lists").hide();
        }
    });

    openTabByHash();

    if(getBrowser() == "Firefox") {
        $("iframe").addClass("disableFilter");
    }
});

window.onbeforeunload = () => {
    return hasGlobalChange || filterEditDisplay ? true : null;
};

browser.runtime.onMessage.addListener(message => {
    if(message && message.type == "hashUpdated") {
        openTabByHash();
    }
});

setInterval(async() => {
    hasGlobalChange = false;

    if(await notifyChangedThemeNotSaved($("#themeSelect").val())) {
        hasGlobalChange = true;
    }

    if(await notifyChangedListNotSaved()) {
        hasGlobalChange = true;
    }

    if(await notifyChangedPresetNotSaved(currentSelectedPresetEdit)) {
        hasGlobalChange = true;
    }

    if(await notifyChangedAdvancedOptionsNotSaved()) {
        hasGlobalChange = true;
    }
}, 1000);