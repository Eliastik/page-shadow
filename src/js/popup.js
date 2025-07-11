/* Page Shadow
 *
 * Copyright (C) 2015-2024 Eliastik (eliastiksofts.com)
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
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@fortawesome/fontawesome-free/css/v4-shims.min.css";
import "@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-v4compatibility.woff2";
import popupEN from "../_locales/en/popup.json";
import popupFR from "../_locales/fr/popup.json";
import { getBrowser, sendMessageWithPromise, checkPermissions } from "./utils/browserUtils.js";
import { toggleTheme } from "./utils/uiUtils.js";
import { normalizeURL } from "./utils/urlUtils.js";
import { applyContrastPageVariablesWithTheme } from "./utils/cssVariableUtils.js";
import { inArrayWebsite, disableEnableToggle } from "./utils/enableDisableUtils.js";
import { hourToPeriodFormat, checkNumber, getAutoEnableSavedData, checkAutoEnableStartup, getAutoEnableFormData } from "./utils/autoEnableUtils.js";
import { getPresetData, getPriorityPresetEnabledForWebsite, loadPreset, loadPresetSelect, presetsEnabledForWebsite, savePreset, disableEnablePreset } from "./utils/presetUtils.js";
import { customTheme } from "./utils/customThemeUtils.js";
import { getSettings } from "./utils/settingsUtils.js";
import { extensionVersion, versionDate, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultHourEnable, defaultHourDisable, nbCustomThemesSlots, percentageBlueLightDefaultValue, archiveInfoShowInterval, permissionOrigin, attenuateDefaultValue, enableReportWebsiteProblem, reportWebsiteProblemBackendURL, brightnessReductionElementId, blueLightReductionElementId } from "./constants.js";
import { setSettingItem } from "./utils/storageUtils.js";
import { initI18next } from "./locales.js";
import browser from "webextension-polyfill";
import DebugLogger from "./classes/debugLogger.js";

window.$ = $;
window.jQuery = $;

let checkContrastMode;
let checkPresetAutoEnabled;
let i18nextLoaded = false;
let selectedPreset = 1;
let updateNotificationShowed = false;
let archiveInfoShowed = false;
let currentTheme = "checkbox";
let permissionInfoShowed = false;
let autoBackupFailedShowed = false;

const debugLogger = new DebugLogger();

async function translateContent() {
    jqueryI18next.init(i18next, $, {
        handleName: "localize",
        selectorAttr: "data-i18n"
    });
    $(".navbar").localize();
    $(".container").localize();
    $(".modal").localize();
    $("footer").localize();
    await checkCurrentPopupTheme();

    if(checkContrastMode) {
        checkContrastMode(false);
    }

    await loadPresetSelect("loadPresetSelect", i18next);
    await checkPresetAutoEnabled(await getCurrentURL());
    $("#loadPresetSelect").val(selectedPreset).trigger("change");
    $("#modalUpdatedMessage").text(i18next.t("modalUpdated.message", { version: extensionVersion, date: new Intl.DateTimeFormat(i18next.language).format(versionDate), interpolation: { escapeValue: false } }));
    i18nextLoaded = true;
}

function initLocales() {
    initI18next("popup").then(() => {
        i18next.addResourceBundle("en", "popup", popupEN);
        i18next.addResourceBundle("fr", "popup", popupFR);
        translateContent();
    });
}

i18next.on("languageChanged", () => {
    translateContent();
});

initLocales();
toggleTheme(); // Toggle dark/light theme

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", toggleTheme);

window.addEventListener("storage", e => {
    if(e && e.key === "i18nextLng") {
        initLocales();
    }
}, false);

async function getCurrentURL() {
    const matches = window.location.search.match(/[?&]tabId=([^&]+)/);

    if(matches && matches.length === 2) {
        const tabId = parseInt(matches[1], 10);
        const tabInfos = await browser.tabs.get(tabId);

        if(!browser.runtime.lastError) {
            return normalizeURL(tabInfos.url);
        }

        debugLogger.log("Popup getCurrentURL - Error getting current URL", "error", browser.runtime.lastError);
    } else {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });

        if(!browser.runtime.lastError) {
            return normalizeURL(tabs[0].url);
        }

        debugLogger.log("Popup getCurrentURL - Error getting current URL", "error", browser.runtime.lastError);
    }
}

async function checkCurrentPopupTheme() {
    const result = await browser.storage.local.get("popupTheme");

    // Switch popup theme
    if(result && result.popupTheme && result.popupTheme == "checkbox") {
        $(".popup-option-container").hide();
        $(".popup-option-container-classic").show();
        $(".popup-option-container-modern").hide();
        $("#popup-options").removeClass("popup-options-modern");
        $("#popup-options").removeClass("popup-options-compact-modern");
        currentTheme = "checkbox";
    } else if(result && result.popupTheme && result.popupTheme == "switch") {
        $(".popup-option-container").show();
        $(".popup-option-container-classic").hide();
        $(".popup-option-container-modern").hide();
        $("#popup-options").removeClass("popup-options-modern");
        $("#popup-options").removeClass("popup-options-compact-modern");
        currentTheme = "switch";
    } else {
        const isCompactModern = result.popupTheme == "compactModern";

        $(".popup-option-container:not(#liveSettingsSwitch)").hide();
        $(".popup-option-container-classic").hide();
        $(".popup-option-container-modern").show();
        $("#popup-options").addClass("popup-options-modern");

        // Use switch mode for setting "Apply the settings in real time"
        $("#liveSettingsModern").hide();
        $("#liveSettingsSwitch").show();

        if(isCompactModern) {
            $("#popup-options").addClass("popup-options-compact-modern");
        } else {
            $("#popup-options").removeClass("popup-options-compact-modern");
        }

        if(currentTheme != "modern" && currentTheme != "compactModern") {
            $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        }

        currentTheme = isCompactModern ? "compactModern" : "modern";
    }
}

async function reportWebsiteProblem() {
    const currentURL = await getCurrentURL();
    const settings = await getSettings(currentURL, true);

    const dataToSend = {
        currentURL,
        settings
    };

    const base64dataToSend = btoa(JSON.stringify(dataToSend))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    sendMessageWithPromise({
        type: "openTab",
        url: reportWebsiteProblemBackendURL + encodeURIComponent(base64dataToSend),
        part: ""
    });

    window.close();
}

async function showInformationPopup(result) {
    const updateNotification = result.updateNotification || {};

    if (updateNotification[extensionVersion] != true && result.defaultLoad == "0") {
        let updateFromVersionBefore210 = true;

        for(const version of Object.keys(updateNotification)) {
            if(version.startsWith("2.10")) {
                updateFromVersionBefore210 = false;
            }
        }

        if(updateFromVersionBefore210) {
            $("#modalUIUpdatedMessage").show();
        } else {
            $("#modalUIUpdatedMessage").hide();
        }

        updateNotification[extensionVersion] = true;
        $("#updated").modal("show");
        await setSettingItem("updateNotification", updateNotification);
        updateNotificationShowed = true;
        return true;
    }

    if (!updateNotificationShowed) {
        if (!archiveInfoShowed) {
            const archiveInfoLastShowed = !result.archiveInfoLastShowed ? 0 : result.archiveInfoLastShowed;

            if (archiveInfoLastShowed > 0 && archiveInfoLastShowed + (archiveInfoShowInterval * 60 * 60 * 24 * 1000) <= Date.now() && result.archiveInfoDisable !== "true") {
                $("#archiveInfo").modal("show");
                await setSettingItem("archiveInfoLastShowed", Date.now());
                archiveInfoShowed = true;

                return true;
            }

            if (archiveInfoLastShowed <= 0) {
                await setSettingItem("archiveInfoLastShowed", Date.now());
            }
        }

        if (!autoBackupFailedShowed) {
            const lastAutoBackupFailedLastShowed = result.lastAutoBackupFailedLastShowed === "true";
            const hasErrorLastAutoBackup = result.lastAutoBackupFailed === "true";

            if (hasErrorLastAutoBackup && !lastAutoBackupFailedLastShowed) {
                $("#autoBackupCloudLastFailed").modal("show");
                await setSettingItem("lastAutoBackupFailedLastShowed", "true");
                autoBackupFailedShowed = true;

                return true;
            }
        }

        if(!archiveInfoShowed && !permissionInfoShowed && !autoBackupFailedShowed && !(await checkPermissions()) && result.permissionsInfoDisable != "true") {
            $("#permissions").modal("show");
            permissionInfoShowed = true;
        }
    }

    return false;
}

$(() => {
    const elLumB = document.createElement("div");
    elLumB.style.display = "none";
    document.body.appendChild(elLumB);

    const elBlueLightReduction = document.createElement("div");
    elBlueLightReduction.style.display = "none";
    document.body.appendChild(elBlueLightReduction);

    const lnkCustomTheme = document.createElement("link");
    let brightnessChangedFromThisPage = false;
    let percentageBlueLightChangedFromThisPage = false;

    // append the list of the color temperatures in the select
    $("#tempSelect").text("");

    for(let i = 0; i < colorTemperaturesAvailable.length; i++) {
        const colorTempIndex = i + 1;
        $("#tempSelect").append("<option value=\""+ colorTempIndex +"\">"+ colorTemperaturesAvailable[i] +" K</option>");
    }

    // set the min and max percentage of brightness
    $("#sliderBrightness").attr("data-slider-min", minBrightnessPercentage * 100);
    $("#sliderBrightness").attr("data-slider-max", maxBrightnessPercentage * 100);
    $("#sliderBrightness").attr("data-slider-value", brightnessDefaultValue * 100);

    $("#sliderBlueLightReduction").attr("data-slider-min", minBrightnessPercentage * 100);
    $("#sliderBlueLightReduction").attr("data-slider-max", maxBrightnessPercentage * 100);
    $("#sliderBlueLightReduction").attr("data-slider-value", brightnessDefaultValue * 100);

    $("#sliderAttenuateColorPercent").attr("data-slider-min", 0);
    $("#sliderAttenuateColorPercent").attr("data-slider-max", 100);
    $("#sliderAttenuateColorPercent").attr("data-slider-value", attenuateDefaultValue * 100);

    $("[data-toggle=\"tooltip\"]").tooltip({
        trigger: "hover",
        container: "body",
        placement: "auto top"
    });

    const sliderBrightness = new Slider("#sliderBrightness", {
        tooltip: "show",
        step: 1,
        // eslint-disable-next-line camelcase
        tooltip_position: "top",
        formatter: value => value
    });

    const sliderBlueLightReduction = new Slider("#sliderBlueLightReduction", {
        tooltip: "show",
        step: 1,
        // eslint-disable-next-line camelcase
        tooltip_position: "top",
        formatter: value => value
    });

    const sliderAttenuateColorPercent = new Slider("#sliderAttenuateColorPercent", {
        tooltip: "show",
        step: 1,
        // eslint-disable-next-line camelcase
        tooltip_position: "top",
        formatter: value => value
    });

    $("#linkAdvSettings").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: ""
        });

        window.close();
    });

    $("#linkAdvSettings2").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "customTheme"
        });

        window.close();
    });

    $("#linkAdvSettings3").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "archive"
        });

        window.close();
    });

    $("#linkAdvSettings4").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "archive"
        });

        window.close();
    });

    $("#linkTestExtension").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("pageTest.html"),
            part: ""
        });

        window.close();
    });

    $("#settingsPresets").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "presets"
        });

        window.close();
    });

    function previewTheme(theme) {
        $("#previsualisationDiv").removeClass("class", "pageShadowContrastBlack");

        if(theme !== null) {
            if(!theme.trim().startsWith("custom")) {
                applyContrastPageVariablesWithTheme(theme);
            }

            $("#previsualisationDiv").addClass("pageShadowContrastBlack");
        }
    }

    function previewTemp(temp) {
        $("#pageShadowBrightnessNightMode").attr("class", "");
        let tempColor = "2000";

        if(temp != undefined) {
            const tempIndex = parseInt(temp, 10);
            tempColor = colorTemperaturesAvailable[tempIndex - 1];

            $("#pageShadowBrightnessNightMode").addClass("k" + tempColor);
        } else {
            $("#pageShadowBrightnessNightMode").addClass("k2000");
        }
    }

    checkPresetAutoEnabled = async function(url) {
        const presetsEnabled = await presetsEnabledForWebsite(url, true);

        if(presetsEnabled && presetsEnabled.length > 0) {
            const presetEnabled = getPriorityPresetEnabledForWebsite(presetsEnabled);

            if(presetEnabled && presetEnabled.presetNb > 0) {
                selectedPreset = presetEnabled.presetNb;
                $("#loadPresetSelect").val(presetEnabled.presetNb);
                checkAutoEnablePreset(presetEnabled.presetNb);
            }
        }
    };

    async function checkEnable() {
        const urlStr = await getCurrentURL();
        let url;

        try {
            url = new URL(urlStr);
        } catch(e) {
            debugLogger.log(e, "error");
            return;
        }

        const isFileURL = urlStr.startsWith("file:///") || urlStr.startsWith("about:");

        const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]);
        let sitesInterdits;

        if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == "undefined" || result.sitesInterditPageShadow.trim() == "") {
            sitesInterdits = "";
        } else {
            sitesInterdits = result.sitesInterditPageShadow.split("\n");
        }

        const domain = url.hostname;
        const { href } = url;

        $("#disableWebsite-li").removeAttr("disabled");
        $("#enableWebsite-li").removeAttr("disabled");

        if(result.whiteList == "true") {
            if(inArrayWebsite(domain, sitesInterdits) || inArrayWebsite(href, sitesInterdits)) {
                $("#disableWebsite-li").hide();
                $("#enableWebsite-li").show();
            } else {
                $("#disableWebsite-li").show();
                $("#enableWebsite-li").hide();
            }

            if(inArrayWebsite(href, sitesInterdits) || inArrayWebsite(domain, sitesInterdits)) {
                $("#disableWebpage-li").hide();
                $("#enableWebpage-li").show();

                if(inArrayWebsite(domain, sitesInterdits)) {
                    $("#disableWebpage-li").hide();
                    $("#enableWebpage-li").hide();
                } else if(inArrayWebsite(href, sitesInterdits)) {
                    $("#disableWebsite-li").hide();
                    $("#enableWebsite-li").hide();
                }
            } else {
                $("#disableWebpage-li").show();
                $("#enableWebpage-li").hide();
            }
        } else {
            if(inArrayWebsite(domain, sitesInterdits)) {
                $("#disableWebsite-li").show();
                $("#enableWebsite-li").hide();
            } else {
                $("#disableWebsite-li").hide();
                $("#enableWebsite-li").show();
            }

            if(inArrayWebsite(href, sitesInterdits)) {
                $("#disableWebpage-li").show();
                $("#enableWebpage-li").hide();
            } else {
                $("#disableWebpage-li").hide();
                $("#enableWebpage-li").show();
            }
        }

        if(isFileURL) {
            $("#disableWebsite-li").attr("disabled", "disabled");
            $("#enableWebsite-li").attr("disabled", "disabled");
        }
    }

    async function checkAutoEnablePreset(nb) {
        const url = await getCurrentURL();
        const isFileURL = url.startsWith("file:///") || url.startsWith("about:");
        const presetsAutoEnabled = await presetsEnabledForWebsite(url, true);
        const currentPreset = await getPresetData(nb);

        $("#enableWebsitePreset-li").hide();
        $("#disableWebsitePreset-li").show();
        $("#enableWebpagePreset-li").hide();
        $("#disableWebpagePreset-li").show();

        $("#enableWebsitePreset-li").removeAttr("disabled");
        $("#disableWebsitePreset-li").removeAttr("disabled");

        if(!currentPreset || currentPreset === "error" || Object.keys(currentPreset).length <= 0) {
            $("#enableWebsitePreset-li").attr("disabled", "disabled");
            $("#disableWebsitePreset-li").attr("disabled", "disabled");
            $("#enableWebpagePreset-li").attr("disabled", "disabled");
            $("#disableWebpagePreset-li").attr("disabled", "disabled");
            $("#updatePresetSettings").attr("disabled", "disabled");
            $("#updatePresetSettings").hide();
            $("#createPreset").removeAttr("disabled");
            $("#createPreset").show();
            $("#loadPresetValid").attr("disabled", "disabled");
        } else {
            $("#enableWebsitePreset-li").removeAttr("disabled");
            $("#disableWebsitePreset-li").removeAttr("disabled");
            $("#enableWebpagePreset-li").removeAttr("disabled");
            $("#disableWebpagePreset-li").removeAttr("disabled");
            $("#updatePresetSettings").removeAttr("disabled");
            $("#updatePresetSettings").show();
            $("#createPreset").attr("disabled", "disabled");
            $("#createPreset").hide();
            $("#loadPresetValid").removeAttr("disabled");
        }

        if(presetsAutoEnabled && presetsAutoEnabled.length > 0) {
            for(const presetEnabled of presetsAutoEnabled) {
                if(presetEnabled && presetEnabled.presetNb > 0 && presetEnabled.presetNb == nb) {
                    if(presetEnabled.autoEnabledWebsite) {
                        $("#enableWebsitePreset-li").show();
                        $("#disableWebsitePreset-li").hide();
                    } else {
                        $("#enableWebsitePreset-li").hide();
                        $("#disableWebsitePreset-li").show();
                    }

                    if(presetEnabled.autoEnabledPage) {
                        $("#enableWebpagePreset-li").show();
                        $("#disableWebpagePreset-li").hide();
                    } else {
                        $("#enableWebpagePreset-li").hide();
                        $("#disableWebpagePreset-li").show();
                    }
                }
            }
        }

        if(isFileURL) {
            $("#enableWebsitePreset-li").attr("disabled", "disabled");
            $("#disableWebsitePreset-li").attr("disabled", "disabled");
        }
    }

    async function disablePageShadow(type, checked) {
        let url;

        try {
            url = new URL(await getCurrentURL());
        } catch(e) {
            debugLogger.log(e, "error");
            return;
        }

        disableEnableToggle(type, checked, url);
        checkEnable();
    }

    async function togglePreset(type, id, checked) {
        let url;

        try {
            url = new URL(await getCurrentURL());
        } catch(e) {
            debugLogger.log(e, "error");
            return;
        }

        await disableEnablePreset(type, id, checked, url);
        checkAutoEnablePreset(id);
    }

    checkEnable();

    if(typeof(browser.tabs.onActivated) !== "undefined") {
        browser.tabs.onActivated.addListener(() => {
            checkEnable();
        });
    }

    if(typeof(browser.tabs.onUpdated) !== "undefined") {
        browser.tabs.onUpdated.addListener(() => {
            checkEnable();
        });
    }

    $("#disableWebsite").on("click", () => {
        disablePageShadow("disable-website", false);
    });

    $("#enableWebsite").on("click", () => {
        disablePageShadow("disable-website", true);
    });

    $("#disableWebpage").on("click", () => {
        disablePageShadow("disable-webpage", false);
    });

    $("#enableWebpage").on("click", () => {
        disablePageShadow("disable-webpage", true);
    });

    $("#disableWebsitePreset").on("click", async() => {
        await togglePreset("toggle-website", selectedPreset, true);
    });

    $("#enableWebsitePreset").on("click", async() => {
        await togglePreset("toggle-website", selectedPreset, false);
        checkPresetAutoEnabled(await getCurrentURL());
    });

    $("#disableWebpagePreset").on("click", async() => {
        await togglePreset("toggle-webpage", selectedPreset, true);
    });

    $("#enableWebpagePreset").on("click", async() => {
        await togglePreset("toggle-webpage", selectedPreset, false);
        checkPresetAutoEnabled(await getCurrentURL());
    });

    checkContrastMode = async function(showAdvice) {
        const result = await browser.storage.local.get(["theme", "pageShadowEnabled", "disableImgBgColor", "brightColorPreservation", "invertPageColors", "selectiveInvert", "increaseContrastInformationShowed"]);

        // append the list of themes in the select
        $("#themeSelect").text("");

        for(let i = 1; i <= nbCustomThemesSlots; i++) {
            $("#themeSelect").append("<option value=\"custom" + i + "\">" + i18next.t("container.customTheme", { count: i }) + "</option>");
        }

        for(let i = 1; i <= nbThemes; i++) {
            $("#themeSelect").append("<option value=\"" + i + "\">" + i18next.t("container.theme", { count: i }) + "</option>");
        }

        if(result.theme != undefined) {
            if(result.theme == "custom") {
                $("#themeSelect").val("custom1");
                previewTheme("custom1");
            } else {
                $("#themeSelect").val(result.theme);
                previewTheme(result.theme);
            }
        } else {
            $("#themeSelect").val("1");
            previewTheme("1");
        }

        if(result.pageShadowEnabled == "true") {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#themeDiv").stop().fadeIn();
            }

            if($("#checkAssomPage").is(":checked") == false) {
                $("#checkAssomPage").prop("checked", true);
            }

            if($("#checkAssomPageCheckbox").is(":checked") == false) {
                $("#checkAssomPageCheckbox").prop("checked", true);
            }

            $("#checkAssomPageModern").addClass("active");

            if(result && result.increaseContrastInformationShowed != "true"
                && ((result.invertPageColors == "true" && result.selectiveInvert != "true")
                    || (result.invertPageColors != "true"))
                && showAdvice && i18nextLoaded) {
                $("#informations").removeClass("show");
                $("#informations").text(i18next.t("container.increaseContrastInformation"));
                $("#informations").addClass("show");

                await setSettingItem("increaseContrastInformationShowed", "true");

                $("#informations").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", e => {
                    if(e.originalEvent.animationName === "fadeout") {
                        $("#informations").removeClass("show");
                    }
                });
            }
        } else {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#themeDiv").stop().fadeOut();
            }

            if($("#checkAssomPage").is(":checked") == true) {
                $("#checkAssomPage").prop("checked", false);
            }

            if($("#checkAssomPageCheckbox").is(":checked") == true) {
                $("#checkAssomPageCheckbox").prop("checked", false);
            }

            $("#checkAssomPageModern").removeClass("active");
        }

        if(result.disableImgBgColor == "true" && $("#checkDisableImgBgColor").is(":checked") == true) {
            $("#checkDisableImgBgColor").prop("checked", false);
        } else if(result.disableImgBgColor !== "true" && $("#checkDisableImgBgColor").is(":checked") == false) {
            $("#checkDisableImgBgColor").prop("checked", true);
        }

        if(result.brightColorPreservation == "true" && $("#checkEnableBrightColorPreservation").is(":checked") == false) {
            $("#checkEnableBrightColorPreservation").prop("checked", true);
        } else if(result.brightColorPreservation !== "true" && $("#checkEnableBrightColorPreservation").is(":checked") == true) {
            $("#checkEnableBrightColorPreservation").prop("checked", false);
        }
    };

    $("#checkAssomPage").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("pageShadowEnabled", "true");
        } else {
            setSettingItem("pageShadowEnabled", "false");
        }
    });

    $("#checkAssomPageCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("pageShadowEnabled", "true");
        } else {
            setSettingItem("pageShadowEnabled", "false");
        }
    });

    $("#checkAssomPageModern .popup-option-modern").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();

        if(!$("#checkAssomPageModern").hasClass("active") == true) {
            setSettingItem("pageShadowEnabled", "true");
            $("#themeDiv").stop().fadeIn();
        } else {
            setSettingItem("pageShadowEnabled", "false");
        }

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkAssomPageModern .popup-option-modern-complement").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        $("#themeDiv").stop().fadeToggle();

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkDisableImgBgColor").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("disableImgBgColor", "false");
        } else {
            setSettingItem("disableImgBgColor", "true");
        }
    });

    $("#checkEnableBrightColorPreservation").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("brightColorPreservation", "true");
        } else {
            setSettingItem("brightColorPreservation", "false");
        }
    });

    $("#themeSelect").on("change", async function() {
        await setSettingItem("theme", $(this).val());

        if($(this).val().trim().startsWith("custom")) {
            const result = await browser.storage.local.get("customThemeInfoDisable");

            if(typeof result.customThemeInfoDisable == "undefined" || result.customThemeInfoDisable !== "true") {
                $("#customThemeInfos").modal("show");
            }
        }
    });

    $("#customThemeInfoDisable").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("customThemeInfoDisable", "true");
        } else {
            setSettingItem("customThemeInfoDisable", "false");
        }
    });

    $("#archiveInfoDisable").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("archiveInfoDisable", "true");
        } else {
            setSettingItem("archiveInfoDisable", "false");
        }
    });

    $("#permissionsInfoDisable").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("permissionsInfoDisable", "true");
        } else {
            setSettingItem("permissionsInfoDisable", "false");
        }
    });

    async function checkCustomTheme() {
        const result = await browser.storage.local.get("theme");

        if(result.theme != undefined && typeof(result.theme) == "string" && result.theme.startsWith("custom")) {
            const applyCustomFontFamily = await customTheme(result.theme.replace("custom", ""), true, lnkCustomTheme);

            if(applyCustomFontFamily) {
                $("#previsualisationDiv").addClass("pageShadowCustomFontFamily");
            } else {
                $("#previsualisationDiv").removeClass("pageShadowCustomFontFamily");
            }
        }
    }

    async function checkColorInvert() {
        const result = await browser.storage.local.get(["colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "selectiveInvert", "invertBrightColors"]);

        if(result.colorInvert == "true") {
            // Convert old settings to new settings
            await setSettingItem("colorInvert", "false");
            await setSettingItem("invertPageColors", "true");
            await setSettingItem("invertImageColors", "true");
            await setSettingItem("invertVideoColors", "true");
            await setSettingItem("invertBgColor", "true");
            checkColorInvert();
        } else if(result.invertPageColors == "true") {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#invertPageColorsDiv").stop().fadeIn();
            }

            if($("#checkColorInvert").is(":checked") == false) {
                $("#checkColorInvert").prop("checked", true);
            }

            if($("#checkColorInvertCheckbox").is(":checked") == false) {
                $("#checkColorInvertCheckbox").prop("checked", true);
            }

            $("#checkColorInvertModern").addClass("active");
        } else {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#invertPageColorsDiv").stop().fadeOut();
            }

            if($("#checkColorInvert").is(":checked") == true) {
                $("#checkColorInvert").prop("checked", false);
            }

            if($("#checkColorInvertCheckbox").is(":checked") == true) {
                $("#checkColorInvertCheckbox").prop("checked", false);
            }

            $("#checkColorInvertModern").removeClass("active");
        }

        if(result.invertImageColors == "true" && $("#checkImageInvert").is(":checked") == false) {
            $("#checkImageInvert").prop("checked", true);
        } else if(result.invertImageColors == "false" && $("#checkImageInvert").is(":checked") == true) {
            $("#checkImageInvert").prop("checked", false);
        }

        if(result.invertBgColor == "false" && $("#checkBgColorInvert").is(":checked") == true) {
            $("#checkBgColorInvert").prop("checked", false);
        } else if(result.invertBgColor !== "false" && $("#checkBgColorInvert").is(":checked") == false) {
            $("#checkBgColorInvert").prop("checked", true);
        }

        if(result.invertVideoColors == "true" && $("#checkVideoInvert").is(":checked") == false) {
            $("#checkVideoInvert").prop("checked", true);
        } else if(result.invertVideoColors == "false" && $("#checkVideoInvert").is(":checked") == true) {
            $("#checkVideoInvert").prop("checked", false);
        }

        if(result.selectiveInvert == "true" && $("#checkSelectiveInvert").is(":checked") == false) {
            $("#checkSelectiveInvert").prop("checked", true);
        } else if(result.selectiveInvert == "false" && $("#checkSelectiveInvert").is(":checked") == true) {
            $("#checkSelectiveInvert").prop("checked", false);
        }

        if(result.invertEntirePage == "true" && $("#checkEntirePageInvert").is(":checked") == false) {
            $("#checkEntirePageInvert").prop("checked", true);
        } else if(result.invertEntirePage !== "true" && $("#checkEntirePageInvert").is(":checked") == true) {
            $("#checkEntirePageInvert").prop("checked", false);
        }

        if(result.invertBrightColors == "true" && $("#checkInvertBrightColors").is(":checked") == false) {
            $("#checkInvertBrightColors").prop("checked", true);
        } else if(result.invertBrightColors == "false" && $("#checkInvertBrightColors").is(":checked") == true) {
            $("#checkInvertBrightColors").prop("checked", false);
        }
    }

    $("#checkColorInvert").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertPageColors", "true");
        } else {
            setSettingItem("invertPageColors", "false");
        }
    });

    $("#checkColorInvertCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertPageColors", "true");
        } else {
            setSettingItem("invertPageColors", "false");
        }
    });

    $("#checkColorInvertModern .popup-option-modern").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();

        if(!$("#checkColorInvertModern").hasClass("active") == true) {
            setSettingItem("invertPageColors", "true");
            $("#invertPageColorsDiv").stop().fadeIn();
        } else {
            setSettingItem("invertPageColors", "false");
        }

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkColorInvertModern .popup-option-modern-complement").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        $("#invertPageColorsDiv").stop().fadeToggle();

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkEntirePageInvert").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertEntirePage", "true");
        } else {
            setSettingItem("invertEntirePage", "false");
        }
    });

    $("#checkImageInvert").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertImageColors", "true");
        } else {
            setSettingItem("invertImageColors", "false");
        }
    });

    $("#checkBgColorInvert").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertBgColor", "true");
        } else {
            setSettingItem("invertBgColor", "false");
        }
    });

    $("#checkVideoInvert").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertVideoColors", "true");
        } else {
            setSettingItem("invertVideoColors", "false");
        }
    });

    $("#checkSelectiveInvert").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("selectiveInvert", "true");
        } else {
            setSettingItem("selectiveInvert", "false");
        }
    });

    $("#checkInvertBrightColors").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertBrightColors", "true");
        } else {
            setSettingItem("invertBrightColors", "false");
        }
    });

    async function checkAttenuateColor() {
        const result = await browser.storage.local.get(["attenuateColors", "attenuateImgColors", "attenuateBgColors", "attenuateVideoColors", "attenuateBrightColors", "percentageAttenuateColors"]);

        if(result.percentageAttenuateColors / 100 > 100 || result.percentageAttenuateColors / 100 < 0 || typeof result.percentageAttenuateColors === "undefined" || result.percentageAttenuateColors == null) {
            sliderAttenuateColorPercent.setValue(attenuateDefaultValue * 100);
        } else {
            sliderAttenuateColorPercent.setValue(result.percentageAttenuateColors);
        }

        if(result.attenuateColors == "true") {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#attenuateColorsDiv").stop().fadeIn();
            }

            if($("#checkAttenuateColor").is(":checked") == false) {
                $("#checkAttenuateColor").prop("checked", true);
            }

            if($("#checkAttenuateColorCheckbox").is(":checked") == false) {
                $("#checkAttenuateColorCheckbox").prop("checked", true);
            }

            $("#checkAttenuateColorModern").addClass("active");
        } else {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#attenuateColorsDiv").stop().fadeOut();
            }

            if($("#checkAttenuateColor").is(":checked") == true) {
                $("#checkAttenuateColor").prop("checked", false);
            }

            if($("#checkAttenuateColorCheckbox").is(":checked") == true) {
                $("#checkAttenuateColorCheckbox").prop("checked", false);
            }

            $("#checkAttenuateColorModern").removeClass("active");
        }

        if(result.attenuateImgColors == "true" && $("#checkAttenuateImageColors").is(":checked") == false) {
            $("#checkAttenuateImageColors").prop("checked", true);
        } else if(result.attenuateImgColors == "false" && $("#checkAttenuateImageColors").is(":checked") == true) {
            $("#checkAttenuateImageColors").prop("checked", false);
        }

        if(result.attenuateBgColors == "false" && $("#checkAttenuateBgColors").is(":checked") == true) {
            $("#checkAttenuateBgColors").prop("checked", false);
        } else if(result.attenuateBgColors !== "false" && $("#checkAttenuateBgColors").is(":checked") == false) {
            $("#checkAttenuateBgColors").prop("checked", true);
        }

        if(result.attenuateVideoColors == "true" && $("#checkAttenuateVideoColors").is(":checked") == false) {
            $("#checkAttenuateVideoColors").prop("checked", true);
        } else if(result.attenuateVideoColors == "false" && $("#checkAttenuateVideoColors").is(":checked") == true) {
            $("#checkAttenuateVideoColors").prop("checked", false);
        }

        if(result.attenuateBrightColors == "true" && $("#checkAttenuateBrightColors").is(":checked") == false) {
            $("#checkAttenuateBrightColors").prop("checked", true);
        } else if(result.attenuateBrightColors == "false" && $("#checkAttenuateBrightColors").is(":checked") == true) {
            $("#checkAttenuateBrightColors").prop("checked", false);
        }
    }

    $("#checkAttenuateColor").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateColors", "true");
        } else {
            setSettingItem("attenuateColors", "false");
        }
    });

    $("#checkAttenuateColorCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateColors", "true");
        } else {
            setSettingItem("attenuateColors", "false");
        }
    });

    $("#checkAttenuateColorModern .popup-option-modern").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();

        if(!$("#checkAttenuateColorModern").hasClass("active") == true) {
            setSettingItem("attenuateColors", "true");
            $("#attenuateColorsDiv").stop().fadeIn();
        } else {
            setSettingItem("attenuateColors", "false");
        }

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkAttenuateColorModern .popup-option-modern-complement").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        $("#attenuateColorsDiv").stop().fadeToggle();
        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkAttenuateImageColors").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateImgColors", "true");
        } else {
            setSettingItem("attenuateImgColors", "false");
        }
    });

    $("#checkAttenuateBgColors").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateBgColors", "true");
        } else {
            setSettingItem("attenuateBgColors", "false");
        }
    });

    $("#checkAttenuateVideoColors").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateVideoColors", "true");
        } else {
            setSettingItem("attenuateVideoColors", "false");
        }
    });

    $("#checkAttenuateBrightColors").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateBrightColors", "true");
        } else {
            setSettingItem("attenuateBrightColors", "false");
        }
    });

    async function checkAutoEnable() {
        const result = await browser.storage.local.get("autoEnable");

        if(result.autoEnable == "true") {
            if($("#autoEnable").is(":checked") == false) {
                $("#autoEnable").prop("checked", true);
            }

            if($("#autoEnableCheckbox").is(":checked") == false) {
                $("#autoEnableCheckbox").prop("checked", true);
            }

            $("#autoEnableModern").addClass("active");
        } else {
            if($("#autoEnable").is(":checked") == true) {
                $("#autoEnable").prop("checked", false);
            }

            if($("#autoEnableCheckbox").is(":checked") == true) {
                $("#autoEnableCheckbox").prop("checked", false);
            }

            $("#autoEnableModern").removeClass("active");
        }
    }

    $("#autoEnable").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("autoEnable", "true");
            $("#autoEnableSettings").modal("show");
        } else {
            setSettingItem("autoEnable", "false");
        }
    });

    $("#autoEnableCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("autoEnable", "true");
            $("#autoEnableSettings").modal("show");
        } else {
            setSettingItem("autoEnable", "false");
        }
    });

    $("#autoEnableModern .popup-option-modern").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();

        if(!$("#autoEnableModern").hasClass("active") == true) {
            setSettingItem("autoEnable", "true");
            $("#autoEnableSettings").modal("show");
        } else {
            setSettingItem("autoEnable", "false");
        }

        e.preventDefault();
        e.stopPropagation();
    });

    $("#autoEnableModern .popup-option-modern-complement").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        $("#autoEnableSettings").modal("show");

        e.preventDefault();
        e.stopPropagation();
    });

    async function checkSettingsAutoEnable() {
        $("#hourEnableFormat").hide();
        $("#hourDisableFormat").hide();

        const data = await getAutoEnableSavedData();
        const format = data[1];
        const hourEnableFormat = data[2];
        const hourDisableFormat = data[3];
        const minuteEnable = data[4];
        const minuteDisable =  data[5];
        const hourEnable = data[6];
        const hourDisable = data[7];

        if(format == "12") {
            $("#autoEnableHourFormat").val("12");
            $("#hourEnableFormat").show();
            $("#hourDisableFormat").show();
            $("#hourEnable").val(hourToPeriodFormat(hourEnable, 12, null)[1]);
            $("#hourEnable").attr("max", 12);
            $("#minuteEnable").val(minuteEnable);
            $("#hourDisable").val(hourToPeriodFormat(hourDisable, 12, null)[1]);
            $("#hourDisable").attr("max", 12);
            $("#minuteDisable").val(minuteDisable);
        } else if(format == "24") {
            $("#autoEnableHourFormat").val("24");
            $("#hourEnable").val(hourEnable);
            $("#hourEnable").attr("max", 23);
            $("#minuteEnable").val(minuteEnable);
            $("#hourDisable").val(hourDisable);
            $("#hourDisable").attr("max", 23);
            $("#minuteDisable").val(minuteDisable);
        }

        $("#hourEnableFormat").val(hourEnableFormat);
        $("#hourDisableFormat").val(hourDisableFormat);

        infoAutoEnable();
    }

    function changeFormat() {
        $("#hourEnableFormat").hide();
        $("#hourDisableFormat").hide();

        const data = getAutoEnableFormData();

        const type = data[0];
        const hourEnableFormat = data[3];
        const hourDisableFormat = data[6];
        let hourEnable = $("#hourEnable").val();
        let hourDisable = $("#hourDisable").val();

        if(type == "24") {
            hourEnable = checkNumber(hourEnable, 0, 12) ? hourEnable : hourToPeriodFormat(defaultHourEnable, 12, null)[1];
            hourEnable = hourToPeriodFormat(hourEnable, 24, hourEnableFormat);
            $("#hourEnable").val(hourEnable);
            hourDisable = checkNumber(hourDisable, 0, 12) ? hourDisable : hourToPeriodFormat(defaultHourDisable, 12, null)[1];
            hourDisable = hourToPeriodFormat(hourDisable, 24, hourDisableFormat);
            $("#hourDisable").val(hourDisable);
            $("#hourEnable").attr("max", 23);
            $("#hourDisable").attr("max", 23);
        } else if(type == "12") {
            $("#hourEnableFormat").show();
            $("#hourDisableFormat").show();
            hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
            hourEnable = hourToPeriodFormat(hourEnable, 12, null);
            $("#hourEnable").val(hourEnable[1]);
            $("#hourEnableFormat").val(hourEnable[0]);
            hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;
            hourDisable = hourToPeriodFormat(hourDisable, 12, null);
            $("#hourDisable").val(hourDisable[1]);
            $("#hourDisableFormat").val(hourDisable[0]);
            $("#hourEnable").attr("max", 12);
            $("#hourDisable").attr("max", 12);
        }

        infoAutoEnable();
    }

    function saveSettingsAutoEnable() {
        const data = getAutoEnableFormData();

        browser.storage.local.set({
            "autoEnableHourFormat": data[0],
            "hourEnable": data[1],
            "minuteEnable": data[2],
            "hourEnableFormat": data[3],
            "hourDisable": data[4],
            "minuteDisable": data[5],
            "hourDisableFormat": data[6]
        });

        checkSettingsAutoEnable();
        checkAutoEnableStartup();
        $("#saved").modal("show");
    }

    function infoAutoEnable() {
        $("#infoTimeEnabled").hide();
        $("#infoTimeDisabled").hide();

        const data = getAutoEnableFormData();

        if(checkAutoEnableStartup(data[1], data[2], data[4], data[5])) {
            $("#infoTimeEnabled").show();
        } else {
            $("#infoTimeDisabled").show();
        }
    }

    $("#saveSettingsAutoEnable").on("click", () => {
        saveSettingsAutoEnable();
    });

    $("#cancelSettingsAutoEnable").on("click", () => {
        checkSettingsAutoEnable();
    });

    $("#autoEnableSettings").on("hidden.bs.modal", () => {
        checkSettingsAutoEnable();
    });

    $("#autoEnableHourFormat").on("change", () => {
        changeFormat();
    });

    $("#formAutoEnable input").on("input", () => {
        infoAutoEnable();
    });

    $("#hourEnableFormat, #hourDisableFormat").on("change", () => {
        infoAutoEnable();
    });

    setInterval(() => {
        infoAutoEnable();
    }, 1000);

    async function checkLiveSettings() {
        const result = await browser.storage.local.get("liveSettings");

        if(result.liveSettings == "true") {
            if($("#liveSettings").is(":checked") == false) {
                $("#liveSettings").prop("checked", true);
            }

            if($("#liveSettingsCheckbox").is(":checked") == false) {
                $("#liveSettingsCheckbox").prop("checked", true);
            }

            $("#liveSettingsModern").addClass("active");
        } else {
            if($("#liveSettings").is(":checked") == true) {
                $("#liveSettings").prop("checked", false);
            }

            if($("#liveSettingsCheckbox").is(":checked") == true) {
                $("#liveSettingsCheckbox").prop("checked", false);
            }

            $("#liveSettingsModern").removeClass("active");
        }
    }

    $("#liveSettings").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("liveSettings", "true");
        } else {
            setSettingItem("liveSettings", "false");
        }
    });

    $("#liveSettingsCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("liveSettings", "true");
        } else {
            setSettingItem("liveSettings", "false");
        }
    });

    $("#liveSettingsModern .popup-option-modern").on("click", () => {
        if(!$("#liveSettingsModern").hasClass("active")) {
            setSettingItem("liveSettings", "true");
        } else {
            setSettingItem("liveSettings", "false");
        }
    });

    async function checkBrightness() {
        const result = await browser.storage.local.get(["pageLumEnabled", "nightModeEnabled", "pourcentageLum"]);

        if(result.pageLumEnabled == "true") {
            elLumB.setAttribute("id", brightnessReductionElementId);

            if(result.pourcentageLum / 100 > maxBrightnessPercentage || result.pourcentageLum / 100 < minBrightnessPercentage || typeof result.pourcentageLum === "undefined" || result.pourcentageLum == null) {
                elLumB.style.opacity = brightnessDefaultValue;
                sliderBrightness.setValue(brightnessDefaultValue * 100);
            } else {
                elLumB.style.opacity = result.pourcentageLum / 100;
            }

            elLumB.style.display = "block";

            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#brightnessSettings").stop().fadeIn();
            }

            if($("#checkBrightnessPage").is(":checked") == false) {
                $("#checkBrightnessPage").prop("checked", true);
            }

            if($("#checkBrightnessPageCheckbox").is(":checked") == false) {
                $("#checkBrightnessPageCheckbox").prop("checked", true);
            }

            $("#checkBrightnessPageModern").addClass("active");
        } else {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#brightnessSettings").stop().fadeOut();
            }

            elLumB.style.display = "none";

            if($("#checkBrightnessPage").is(":checked") == true) {
                $("#checkBrightnessPage").prop("checked", false);
            }

            if($("#checkBrightnessPageCheckbox").is(":checked") == true) {
                $("#checkBrightnessPageCheckbox").prop("checked", false);
            }

            $("#checkBrightnessPageModern").removeClass("active");
        }
    }

    async function checkBlueLightReduction() {
        const result = await browser.storage.local.get(["blueLightReductionEnabled", "colorTemp", "percentageBlueLightReduction"]);

        if(result.blueLightReductionEnabled == "true") {
            elBlueLightReduction.setAttribute("id", blueLightReductionElementId);

            if(result.percentageBlueLightReduction / 100 > maxBrightnessPercentage || result.percentageBlueLightReduction / 100 < minBrightnessPercentage || typeof result.percentageBlueLightReduction === "undefined" || result.percentageBlueLightReduction == null) {
                elBlueLightReduction.style.opacity = percentageBlueLightDefaultValue;
                sliderBlueLightReduction.setValue(percentageBlueLightDefaultValue * 100);
            } else {
                elBlueLightReduction.style.opacity = result.percentageBlueLightReduction / 100;
            }

            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#blueLightReductionFilterSettings").stop().fadeIn();
            }

            elBlueLightReduction.style.display = "block";

            if($("#checkBlueLightReductionFilter").is(":checked") == false) {
                $("#checkBlueLightReductionFilter").prop("checked", true);
            }

            if($("#checkBlueLightReductionFilterCheckbox").is(":checked") == false) {
                $("#checkBlueLightReductionFilterCheckbox").prop("checked", true);
            }

            $("#checkBlueLightReductionFilterModern").addClass("active");
        } else {
            if(currentTheme != "modern" &&  currentTheme != "compactModern") {
                $("#blueLightReductionFilterSettings").stop().fadeOut();
            }

            if($("#checkBlueLightReductionFilter").is(":checked") == true) {
                $("#checkBlueLightReductionFilter").prop("checked", false);
            }

            if($("#checkBlueLightReductionFilterCheckbox").is(":checked") == true) {
                $("#checkBlueLightReductionFilterCheckbox").prop("checked", false);
            }

            $("#checkBlueLightReductionFilterModern").removeClass("active");

            elBlueLightReduction.style.display = "none";
        }

        if(result.colorTemp != undefined) {
            $("#tempSelect").val(result.colorTemp);
            previewTemp(result.colorTemp);
        } else {
            $("#tempSelect").val("5");
            previewTemp("5");
        }
    }

    $("#checkBrightnessPage").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("pageLumEnabled", "true");
        } else {
            setSettingItem("pageLumEnabled", "false");
        }
    });

    $("#checkBrightnessPageCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("pageLumEnabled", "true");
        } else {
            setSettingItem("pageLumEnabled", "false");
        }
    });

    $("#checkBrightnessPageModern .popup-option-modern").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();

        if(!$("#checkBrightnessPageModern").hasClass("active") == true) {
            setSettingItem("pageLumEnabled", "true");
            $("#brightnessSettings").stop().fadeIn();
        } else {
            setSettingItem("pageLumEnabled", "false");
        }

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkBrightnessPageModern .popup-option-modern-complement").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        $("#brightnessSettings").stop().fadeToggle();
        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkBlueLightReductionFilter").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("blueLightReductionEnabled", "true");
        } else {
            setSettingItem("blueLightReductionEnabled", "false");
        }
    });

    $("#checkBlueLightReductionFilterCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("blueLightReductionEnabled", "true");
        } else {
            setSettingItem("blueLightReductionEnabled", "false");
        }
    });

    $("#checkBlueLightReductionFilterModern .popup-option-modern").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();

        if(!$("#checkBlueLightReductionFilterModern").hasClass("active") == true) {
            setSettingItem("blueLightReductionEnabled", "true");
            $("#blueLightReductionFilterSettings").stop().fadeIn();
        } else {
            setSettingItem("blueLightReductionEnabled", "false");
        }

        e.preventDefault();
        e.stopPropagation();
    });

    $("#checkBlueLightReductionFilterModern .popup-option-modern-complement").on("click", e => {
        $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
        $("#blueLightReductionFilterSettings").stop().fadeToggle();
        e.preventDefault();
        e.stopPropagation();
    });

    $("#sliderBrightness").on("change", () => {
        const sliderLumValue = sliderBrightness.getValue();
        elLumB.style.opacity = sliderLumValue / 100;
    });

    $("#sliderBrightness").on("slideStop", () => {
        const sliderLumValue = sliderBrightness.getValue();
        brightnessChangedFromThisPage = true;
        elLumB.style.opacity = sliderLumValue / 100;
        setSettingItem("pourcentageLum", sliderLumValue);
    });

    $("#sliderBlueLightReduction").on("change", () => {
        const sliderLumValue = sliderBlueLightReduction.getValue();
        elBlueLightReduction.style.opacity = sliderLumValue / 100;
    });

    $("#sliderBlueLightReduction").on("slideStop", () => {
        const sliderBlueLightReductionValue = sliderBlueLightReduction.getValue();
        percentageBlueLightChangedFromThisPage = true;
        elBlueLightReduction.style.opacity = sliderBlueLightReductionValue / 100;
        setSettingItem("percentageBlueLightReduction", sliderBlueLightReductionValue);
    });

    $("#sliderAttenuateColorPercent").on("slideStop", () => {
        const sliderAttenuateColorPercentValue = sliderAttenuateColorPercent.getValue();
        setSettingItem("percentageAttenuateColors", sliderAttenuateColorPercentValue);
    });

    $( "#checkNighMode" ).on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("nightModeEnabled", "true");
        } else {
            setSettingItem("nightModeEnabled", "false");
        }
    });

    $("#tempSelect").on("change", function() {
        setSettingItem("colorTemp", $(this).val());
    });

    async function checkGlobalEnable() {
        const result = await browser.storage.local.get("globallyEnable");

        if(result.globallyEnable == "false") {
            $("#pageShadowGlobalSwitch").prop("checked", false);
        } else {
            $("#pageShadowGlobalSwitch").prop("checked", true);
        }
    }

    $("#pageShadowGlobalSwitch").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("globallyEnable", "true");
        } else {
            setSettingItem("globallyEnable", "false");
        }
    });

    $("#loadPresetValid").on("click", async() => {
        $("#infoPreset").removeClass("show");

        const result = await loadPreset(parseInt($("#loadPresetSelect").val(), 10));

        if(result == "success") {
            $("#infoPreset").text(i18next.t("modal.archive.restorePresetSuccess"));
        } else if(result == "empty") {
            $("#infoPreset").text(i18next.t("modal.archive.restorePresetEmpty"));
        } else {
            $("#infoPreset").text(i18next.t("modal.archive.restorePresetError"));
        }

        $("#infoPreset").addClass("show");

        $("#infoPreset").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", e => {
            if(e.originalEvent.animationName === "fadeout") {
                $("#infoPreset").removeClass("show");
            }
        });
    });

    $("#updatePresetSettings").on("click", async() => {
        $("#infoPreset").removeClass("show");
        const presetId = parseInt($("#loadPresetSelect").val(), 10);
        const presetData = await getPresetData(presetId);

        if(presetData && presetData !== "error") {
            const result = await savePreset(presetId, presetData.name, presetData.websiteListToApply, true);

            if(result == "success") {
                $("#infoPreset").text(i18next.t("modal.archive.updatePresetSuccess"));
            } else {
                $("#infoPreset").text(i18next.t("modal.archive.updatePresetError"));
            }

            $("#infoPreset").addClass("show");

            $("#infoPreset").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", e => {
                if(e.originalEvent.animationName === "fadeout") {
                    $("#infoPreset").removeClass("show");
                }
            });
        }
    });

    $("#loadPresetSelect").on("change", () => {
        selectedPreset = $("#loadPresetSelect").val();
        checkAutoEnablePreset(selectedPreset);
    });

    $("#whatsNew").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "aboutLatestVersion"
        });

        window.close();
    });

    $("#createPreset").on("click", () => {
        $("#createPresetModalTitle").val("");
        $("#createPresetModal").modal("show");

        $("#createPresetModal").on("shown.bs.modal", () => {
            $("#createPresetModalTitle").trigger("focus");
        });
    });

    $("#createPresetModalAdvancedLink").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "presets"
        });

        window.close();
    });

    $("#openAdvancedSettingsLink").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html")
        });

        window.close();
    });

    async function createPreset() {
        $("#infoPreset").removeClass("show");
        const presetId = parseInt($("#loadPresetSelect").val(), 10);
        const presetTitle  = $("#createPresetModalTitle").val();

        const result = await savePreset(presetId, presetTitle, "", true);

        if(result == "success") {
            $("#infoPreset").text(i18next.t("modal.archive.createPresetSuccess"));
        } else {
            $("#infoPreset").text(i18next.t("modal.archive.createPresetError"));
        }

        $("#createPresetModal").modal("hide");
        $("#infoPreset").addClass("show");

        $("#infoPreset").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", e => {
            if(e.originalEvent.animationName === "fadeout") {
                $("#infoPreset").removeClass("show");
            }
        });
    }

    $("#createPresetModalValidate").on("click", async() => {
        await createPreset();
    });

    $("#createPresetModalTitle").on("keyup", e => {
        if(e.key === "Enter") {
            createPreset();
        }
    });

    async function displaySettings(changes) {
        const result = await browser.storage.local.get(["theme", "colorTemp", "pourcentageLum", "updateNotification", "defaultLoad", "percentageBlueLightReduction", "archiveInfoLastShowed", "archiveInfoDisable", "permissionsInfoDisable", "lastAutoBackupFailedLastShowed", "lastAutoBackupFailed"]);

        const informationShowed = await showInformationPopup(result);

        checkCurrentPopupTheme();
        toggleTheme(); // Toggle dark/light theme
        checkContrastMode(!updateNotificationShowed && !archiveInfoShowed && !informationShowed);
        checkColorInvert();
        checkAttenuateColor();
        checkLiveSettings();
        checkBrightness();
        checkBlueLightReduction();
        checkEnable();
        checkCustomTheme();
        checkAutoEnable();
        checkGlobalEnable();

        if(changes && changes.presets) {
            checkPresetAutoEnabled(await getCurrentURL());
        }

        if(typeof result.pourcentageLum !== "undefined" && result.pourcentageLum !== null && result.pourcentageLum / 100 <= maxBrightnessPercentage && result.pourcentageLum / 100 >= minBrightnessPercentage && brightnessChangedFromThisPage == false) {
            sliderBrightness.setValue(result.pourcentageLum);
            brightnessChangedFromThisPage = false;
        } else if(brightnessChangedFromThisPage == false) {
            sliderBrightness.setValue(brightnessDefaultValue * 100);
            brightnessChangedFromThisPage = false;
        }

        if(typeof result.percentageBlueLightReduction !== "undefined" && result.percentageBlueLightReduction !== null && result.percentageBlueLightReduction / 100 <= maxBrightnessPercentage && result.percentageBlueLightReduction / 100 >= minBrightnessPercentage && percentageBlueLightChangedFromThisPage == false) {
            sliderBlueLightReduction.setValue(result.percentageBlueLightReduction);
            percentageBlueLightChangedFromThisPage = false;
        } else if(percentageBlueLightChangedFromThisPage == false) {
            sliderBlueLightReduction.setValue(percentageBlueLightDefaultValue * 100);
            percentageBlueLightChangedFromThisPage = false;
        }

        if(($("#autoEnableSettings").data("bs.modal") || {}).isShown !== true) {
            checkSettingsAutoEnable();
        }

        if(i18nextLoaded) {
            await loadPresetSelect("loadPresetSelect", i18next);
            $("#loadPresetSelect").val(selectedPreset).trigger("change");
        }

        if(!(await checkPermissions())) {
            $("#permissionLink").show();
        }
    }

    displaySettings();

    if(typeof(browser.storage.onChanged) !== "undefined") {
        browser.storage.onChanged.addListener((changes, areaName) => {
            if(areaName == "local") {
                displaySettings(changes);
            }
        });
    }

    $("body").on("click", e => {
        if(currentTheme == "modern" || currentTheme == "compactModern") {
            let found = false;

            $(".popup-advanced-option").each(function() {
                if($(this).is(":visible") && !$(this).is(e.target) && $(this).has(e.target).length === 0) {
                    found = true;
                }
            });

            if(found) {
                $(".popup-advanced-option-wrapper").find("> div").stop().fadeOut();
            }
        }
    });

    $("#enablePermission").on("click", () => {
        browser.permissions.request({
            origins: permissionOrigin
        });
    });

    $("#permissionLink").on("click", () => {
        browser.permissions.request({
            origins: permissionOrigin
        });
    });

    browser.permissions.onAdded.addListener(async() => {
        if(await checkPermissions()) {
            $("#permissions").modal("hide");
            $("#permissionLink").hide();
        }
    });

    if(getBrowser() == "Firefox") {
        const resolHeight = window.screen.height;

        if(resolHeight <= 650) {
            document.body.classList.add("force-scroll");
            document.getElementById("popup-wrapper").style.maxHeight = (resolHeight - 120) + "px";
        }
    }

    $("#reportProblemLink").on("click", () => {
        $("#reportProblemModal").modal("show");
    });

    $("#reportProblemButton").on("click", async () => {
        await reportWebsiteProblem();
        $("#reportProblemModal").modal("hide");
    });

    if(enableReportWebsiteProblem) {
        $("#reportProblemLink").show();
    }
});