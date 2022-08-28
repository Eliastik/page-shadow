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
import Slider from "bootstrap-slider";
import "bootstrap-slider/dist/css/bootstrap-slider.min.css";
import { in_array_website, disableEnableToggle, customTheme, hourToPeriodFormat, checkNumber, getAutoEnableSavedData, getAutoEnableFormData, checkAutoEnableStartup, loadPresetSelect, loadPreset, presetsEnabledForWebsite, disableEnablePreset, getPresetData, savePreset, normalizeURL, getPriorityPresetEnabledForWebsite, toggleTheme, sendMessageWithPromise, applyContrastPageVariables } from "./utils/util.js";
import { extensionVersion, versionDate, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultHourEnable, defaultHourDisable, nbCustomThemesSlots, percentageBlueLightDefaultValue, archiveInfoShowInterval } from "./constants.js";
import { setSettingItem } from "./storage.js";
import { init_i18next } from "./locales.js";
import browser from "webextension-polyfill";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "@fortawesome/fontawesome-free/css/v4-shims.min.css";
import "@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2";
import "@fortawesome/fontawesome-free/webfonts/fa-v4compatibility.woff2";

window.$ = $;
window.jQuery = $;

let checkContrastMode;
let checkPresetAutoEnabled;
let i18nextLoaded = false;
let selectedPreset = 1;
let updateNotificationShowed = false;
let archiveInfoShowed = false;
let currentTheme = "checkbox";

init_i18next("popup").then(() => translateContent());
toggleTheme(); // Toggle dark/light theme

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
    if(checkContrastMode) checkContrastMode();
    await loadPresetSelect("loadPresetSelect", i18next);
    checkPresetAutoEnabled(await getCurrentURL());
    $("#loadPresetSelect").val(selectedPreset).trigger("change");
    $("#modalUpdatedMessage").text(i18next.t("modalUpdated.message", { version: extensionVersion, date: new Intl.DateTimeFormat(i18next.language).format(versionDate), interpolation: { escapeValue: false } }));
    i18nextLoaded = true;
}

i18next.on("languageChanged", () => {
    translateContent();
});

async function getCurrentURL() {
    const matches = window.location.search.match(/[?&]tabId=([^&]+)/);

    if(matches && matches.length === 2) {
        const tabId = parseInt(matches[1]);
        const tabInfos = await browser.tabs.get(tabId);

        if(!browser.runtime.lastError) {
            return normalizeURL(tabInfos.url);
        }
    } else {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});

        if(!browser.runtime.lastError) {
            return normalizeURL(tabs[0].url);
        }
    }
}

async function checkCurrentPopupTheme() {
    const result = await browser.storage.local.get("popupTheme");

    // Switch popup theme
    if (result && result.popupTheme && result.popupTheme == "checkbox") {
        $(".popup-option-container").hide();
        $(".popup-option-container-classic").show();
        $(".popup-option-container-modern").hide();
        $("#popup-options").removeClass("popup-options-modern");
        currentTheme = "checkbox";
    } else if (result && result.popupTheme && result.popupTheme == "modern") {
        $(".popup-option-container").hide();
        $(".popup-option-container-classic").hide();
        $(".popup-option-container-modern").show();
        $("#popup-options").addClass("popup-options-modern");
        currentTheme = "modern";
    } else {
        $(".popup-option-container").show();
        $(".popup-option-container-classic").hide();
        $(".popup-option-container-modern").hide();
        $("#popup-options").removeClass("popup-options-modern");
        currentTheme = "switch";
    }
}

$(document).ready(() => {
    const elLumB = document.createElement("div");
    elLumB.style.display = "none";
    document.body.appendChild(elLumB);

    const elBlueLightReduction = document.createElement("div");
    elBlueLightReduction.style.display = "none";
    document.body.appendChild(elBlueLightReduction);

    const style = document.createElement("style");
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

    $("[data-toggle=\"tooltip\"]").tooltip({
        trigger: "hover",
        container: "body",
        placement: "auto top"
    });

    const sliderBrightness = new Slider("#sliderBrightness", {
        tooltip: "show",
        step: 1,
        tooltip_position: "top",
        formatter: value => {
            return value;
        }
    });

    const sliderBlueLightReduction = new Slider("#sliderBlueLightReduction", {
        tooltip: "show",
        step: 1,
        tooltip_position: "top",
        formatter: value => {
            return value;
        }
    });

    $("#linkAdvSettings").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: ""
        });
    });

    $("#linkAdvSettings2").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "customTheme"
        });
    });

    $("#linkAdvSettings3").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "archive"
        });
    });

    $("#linkTestExtension").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("pageTest.html"),
            part: ""
        });
    });

    $("#settingsPresets").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "presets"
        });
    });

    function previewTheme(theme) {
        $("#previsualisationDiv").attr("class", "");

        if(theme !== null) {
            if(theme.trim().startsWith("custom")) {
                $("#previsualisationDiv").addClass("pageShadowContrastBlackCustom");
            } else {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack");
                applyContrastPageVariables(theme);
            }
        } else {
            $("#previsualisationDiv").addClass("pageShadowContrastBlack");
        }
    }

    function previewTemp(temp) {
        $("#pageShadowBrightnessNightMode").attr("class", "");
        let tempColor = "2000";

        if(temp != undefined) {
            const tempIndex = parseInt(temp);
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
        const url_str = await getCurrentURL();
        const url = new URL(url_str);
        const isFileURL = url_str.startsWith("file:///") || url_str.startsWith("about:");

        const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]);
        let sitesInterdits;

        if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == "undefined" || result.sitesInterditPageShadow.trim() == "") {
            sitesInterdits = "";
        } else {
            sitesInterdits = result.sitesInterditPageShadow.split("\n");
        }

        const domain = url.hostname;
        const href = url.href;

        $("#disableWebsite-li").removeAttr("disabled");
        $("#enableWebsite-li").removeAttr("disabled");

        if(result.whiteList == "true") {
            if(in_array_website(domain, sitesInterdits) || in_array_website(href, sitesInterdits)) {
                $("#disableWebsite-li").hide();
                $("#enableWebsite-li").show();
            } else {
                $("#disableWebsite-li").show();
                $("#enableWebsite-li").hide();
            }

            if(in_array_website(href, sitesInterdits) || in_array_website(domain, sitesInterdits)) {
                $("#disableWebpage-li").hide();
                $("#enableWebpage-li").show();

                if(in_array_website(domain, sitesInterdits)) {
                    $("#disableWebpage-li").hide();
                    $("#enableWebpage-li").hide();
                } else if(in_array_website(href, sitesInterdits)) {
                    $("#disableWebsite-li").hide();
                    $("#enableWebsite-li").hide();
                }
            } else {
                $("#disableWebpage-li").show();
                $("#enableWebpage-li").hide();
            }
        } else {
            if(in_array_website(domain, sitesInterdits)) {
                $("#disableWebsite-li").show();
                $("#enableWebsite-li").hide();
            } else {
                $("#disableWebsite-li").hide();
                $("#enableWebsite-li").show();
            }

            if(in_array_website(href, sitesInterdits)) {
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

        if(!currentPreset || Object.keys(currentPreset).length <= 0) {
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
        const url = new URL(await getCurrentURL());
        disableEnableToggle(type, checked, url);
        checkEnable();
    }

    async function togglePreset(type, id, checked) {
        const url = new URL(await getCurrentURL());
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
        togglePreset("toggle-website", selectedPreset, true);
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

    checkContrastMode = async function() {
        const result = await browser.storage.local.get(["theme", "pageShadowEnabled", "disableImgBgColor"]);
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
            if(currentTheme != "modern") {
                $("#themeDiv").stop().fadeIn();
            }

            if($("#checkAssomPage").is(":checked") == false) {
                $("#checkAssomPage").prop("checked", true);
            }

            if($("#checkAssomPageCheckbox").is(":checked") == false) {
                $("#checkAssomPageCheckbox").prop("checked", true);
            }

            $("#checkAssomPageModern").addClass("active");
        } else {
            $("#themeDiv").stop().fadeOut();

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

    $("#checkAssomPageModern .popup-option-modern").on("click", () => {
        if(!$("#checkAssomPageModern").hasClass("active") == true) {
            setSettingItem("pageShadowEnabled", "true");
            $("#themeDiv").stop().fadeIn();
        } else {
            setSettingItem("pageShadowEnabled", "false");
        }
    });

    $("#checkAssomPageModern .popup-option-modern-complement").on("click", () => {
        $("#themeDiv").stop().fadeToggle();
    });

    $("#checkAssomPageModern .popup-option-modern").on("mouseover", () => {
        if($("#checkAssomPageModern").hasClass("active") == true) {
            $("#themeDiv").stop().fadeIn();
        }
    });

    $("#checkAssomPageModern .popup-option-modern").on("mouseout", () => {
        $("#themeDiv").stop().fadeOut();
    });

    $("#checkDisableImgBgColor").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("disableImgBgColor", "false");
        } else {
            setSettingItem("disableImgBgColor", "true");
        }
    });

    $("#themeSelect").on("change", async function() {
        setSettingItem("theme", $(this).val());

        if($(this).val().trim().startsWith("custom")) {
            const result = await browser.storage.local.get("customThemeInfoDisable");

            if(typeof result.customThemeInfoDisable == undefined || result.customThemeInfoDisable !== "true") {
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

    async function checkCustomTheme() {
        const result = await browser.storage.local.get("theme");

        if(result.theme != undefined && typeof(result.theme) == "string" && result.theme.startsWith("custom")) {
            customTheme(result.theme.replace("custom", ""), style, true, lnkCustomTheme);
        }
    }

    async function checkColorInvert() {
        const result = await browser.storage.local.get(["colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor", "selectiveInvert"]);

        if(result.colorInvert == "true") {
            // Convert old settings to new settings
            setSettingItem("colorInvert", "false");
            setSettingItem("invertPageColors", "true");
            setSettingItem("invertImageColors", "true");
            setSettingItem("invertVideoColors", "true");
            setSettingItem("invertBgColor", "true");
            checkColorInvert();
        } else if(result.invertPageColors == "true") {
            if(currentTheme != "modern") {
                $("#invertPageColorsDiv").stop().fadeIn();
            }

            if($("#checkColorInvert").is(":checked") == false) {
                $("#checkColorInvert").prop("checked", true);
            }

            if($("#checkColorInvertCheckbox").is(":checked") == false) {
                $("#checkColorInvertCheckbox").prop("checked", true);
            }

            $("#checkColorInvertModern").addClass("active");

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
        } else {
            $("#invertPageColorsDiv").stop().fadeOut();

            if($("#checkColorInvert").is(":checked") == true) {
                $("#checkColorInvert").prop("checked", false);
            }

            if($("#checkColorInvertCheckbox").is(":checked") == true) {
                $("#checkColorInvertCheckbox").prop("checked", false);
            }

            $("#checkColorInvertModern").removeClass("active");

            if(result.invertImageColors !== "true") {
                if($("#checkImageInvert").is(":checked") == true) {
                    $("#checkImageInvert").prop("checked", false);
                }
            }

            if(result.invertBgColor == "false") {
                if($("#checkBgColorInvert").is(":checked") == true) {
                    $("#checkBgColorInvert").prop("checked", false);
                }
            }

            if(result.invertVideoColors !== "true") {
                if($("#checkVideoInvert").is(":checked") == true) {
                    $("#checkVideoInvert").prop("checked", false);
                }
            }

            if(result.selectiveInvert !== "true") {
                if($("#checkSelectiveInvert").is(":checked") == true) {
                    $("#checkSelectiveInvert").prop("checked", false);
                }
            }
        }

        if(result.invertEntirePage == "true" && $("#checkEntirePageInvert").is(":checked") == false) {
            $("#checkEntirePageInvert").prop("checked", true);
        } else if(result.invertEntirePage !== "true" && $("#checkEntirePageInvert").is(":checked") == true) {
            $("#checkEntirePageInvert").prop("checked", false);
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

    $("#checkColorInvertModern .popup-option-modern").on("click", () => {
        if(!$("#checkColorInvertModern").hasClass("active") == true) {
            setSettingItem("invertPageColors", "true");
            $("#invertPageColorsDiv").stop().fadeIn();
        } else {
            setSettingItem("invertPageColors", "false");
        }
    });

    $("#checkColorInvertModern .popup-option-modern-complement").on("click", () => {
        $("#invertPageColorsDiv").stop().fadeToggle();
    });

    $("#checkColorInvertModern .popup-option-modern").on("mouseover", () => {
        if($("#checkColorInvertModern").hasClass("active") == true) {
            $("#invertPageColorsDiv").stop().fadeIn();
        }
    });

    $("#checkColorInvertModern .popup-option-modern").on("mouseout", () => {
        $("#invertPageColorsDiv").stop().fadeOut();
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

    async function checkAttenuateImageColor() {
        const result = await browser.storage.local.get("attenuateImageColor");

        if(result.attenuateImageColor == "true") {
            if($("#checkAttenuateImageColor").is(":checked") == false) {
                $("#checkAttenuateImageColor").prop("checked", true);
            }

            if($("#checkAttenuateImageColorCheckbox").is(":checked") == false) {
                $("#checkAttenuateImageColorCheckbox").prop("checked", true);
            }

            $("#checkAttenuateImageColorModern").addClass("active");
        } else {
            if($("#checkAttenuateImageColor").is(":checked") == true) {
                $("#checkAttenuateImageColor").prop("checked", false);
            }

            if($("#checkAttenuateImageColorCheckbox").is(":checked") == true) {
                $("#checkAttenuateImageColorCheckbox").prop("checked", false);
            }

            $("#checkAttenuateImageColorModern").removeClass("active");
        }
    }

    $("#checkAttenuateImageColor").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateImageColor", "true");
        } else {
            setSettingItem("attenuateImageColor", "false");
        }
    });

    $("#checkAttenuateImageColorCheckbox").on("change", function() {
        if($(this).is(":checked") == true) {
            setSettingItem("attenuateImageColor", "true");
        } else {
            setSettingItem("attenuateImageColor", "false");
        }
    });

    $("#checkAttenuateImageColorModern .popup-option-modern").on("click", () => {
        if(!$("#checkAttenuateImageColorModern").hasClass("active") == true) {
            setSettingItem("attenuateImageColor", "true");
        } else {
            setSettingItem("attenuateImageColor", "false");
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

    $("#autoEnableModern .popup-option-modern").on("click", () => {
        if(!$("#autoEnableModern").hasClass("active") == true) {
            setSettingItem("autoEnable", "true");
            $("#autoEnableSettings").modal("show");
        } else {
            setSettingItem("autoEnable", "false");
        }
    });

    $("#autoEnableModern .popup-option-modern-complement").on("click", () => {
        $("#autoEnableSettings").modal("show");
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
            elLumB.setAttribute("id", "pageShadowBrightness");

            if(result.pourcentageLum / 100 > maxBrightnessPercentage || result.pourcentageLum / 100 < minBrightnessPercentage || typeof result.pourcentageLum === "undefined" || result.pourcentageLum == null) {
                elLumB.style.opacity = brightnessDefaultValue;
                sliderBrightness.setValue(brightnessDefaultValue * 100);
            } else {
                elLumB.style.opacity = result.pourcentageLum / 100;
            }

            elLumB.style.display = "block";

            if(currentTheme != "modern") {
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
            $("#brightnessSettings").stop().fadeOut();
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
            elBlueLightReduction.setAttribute("id", "pageShadowBrightnessNightMode");

            if(result.colorTemp != undefined) {
                $("#tempSelect").val(result.colorTemp);
                previewTemp(result.colorTemp);
            } else {
                $("#tempSelect").val("5");
                previewTemp("5");
            }

            if(result.percentageBlueLightReduction / 100 > maxBrightnessPercentage || result.percentageBlueLightReduction / 100 < minBrightnessPercentage || typeof result.percentageBlueLightReduction === "undefined" || result.percentageBlueLightReduction == null) {
                elBlueLightReduction.style.opacity = percentageBlueLightDefaultValue;
                sliderBlueLightReduction.setValue(percentageBlueLightDefaultValue * 100);
            } else {
                elBlueLightReduction.style.opacity = result.percentageBlueLightReduction / 100;
            }

            if(currentTheme != "modern") {
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
            $("#blueLightReductionFilterSettings").stop().fadeOut();
            elBlueLightReduction.setAttribute("id", "pageShadowBrightnessNightMode");
            elBlueLightReduction.style.display = "none";

            if($("#checkBlueLightReductionFilter").is(":checked") == true) {
                $("#checkBlueLightReductionFilter").prop("checked", false);
            }

            if($("#checkBlueLightReductionFilterCheckbox").is(":checked") == true) {
                $("#checkBlueLightReductionFilterCheckbox").prop("checked", false);
            }

            $("#checkBlueLightReductionFilterModern").removeClass("active");
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

    $("#checkBrightnessPageModern .popup-option-modern").on("click", () => {
        if(!$("#checkBrightnessPageModern").hasClass("active") == true) {
            setSettingItem("pageLumEnabled", "true");
            $("#brightnessSettings").stop().fadeIn();
        } else {
            setSettingItem("pageLumEnabled", "false");
        }
    });

    $("#checkBrightnessPageModern .popup-option-modern-complement").on("click", () => {
        $("#brightnessSettings").stop().fadeToggle();
    });

    $("#checkBrightnessPageModern .popup-option-modern").on("mouseover", () => {
        if($("#checkBrightnessPageModern").hasClass("active") == true) {
            $("#brightnessSettings").stop().fadeIn();
        }
    });

    $("#checkBrightnessPageModern .popup-option-modern").on("mouseout", () => {
        $("#brightnessSettings").stop().fadeOut();
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

    $("#checkBlueLightReductionFilterModern .popup-option-modern").on("click", () => {
        if(!$("#checkBlueLightReductionFilterModern").hasClass("active") == true) {
            setSettingItem("blueLightReductionEnabled", "true");
            $("#blueLightReductionFilterSettings").stop().fadeIn();
        } else {
            setSettingItem("blueLightReductionEnabled", "false");
        }
    });

    $("#checkBlueLightReductionFilterModern .popup-option-modern-complement").on("click", () => {
        $("#blueLightReductionFilterSettings").stop().fadeToggle();
    });

    $("#checkBlueLightReductionFilterModern .popup-option-modern").on("mouseover", () => {
        if($("#checkBlueLightReductionFilterModern").hasClass("active") == true) {
            $("#blueLightReductionFilterSettings").stop().fadeIn();
        }
    });

    $("#checkBlueLightReductionFilterModern .popup-option-modern").on("mouseout", () => {
        $("#blueLightReductionFilterSettings").stop().fadeOut();
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

        const result = await loadPreset(parseInt($("#loadPresetSelect").val()));

        if(result == "success") {
            $("#infoPreset").text(i18next.t("modal.archive.restorePresetSuccess"));
        } else if(result == "empty") {
            $("#infoPreset").text(i18next.t("modal.archive.restorePresetEmpty"));
        } else {
            $("#infoPreset").text(i18next.t("modal.archive.restorePresetError"));
        }

        $("#infoPreset").addClass("show");

        $("#infoPreset").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", (e) => {
            if(e.originalEvent.animationName === "fadeout") {
                $("#infoPreset").removeClass("show");
            }
        });
    });

    $("#updatePresetSettings").on("click", async() => {
        $("#infoPreset").removeClass("show");
        const presetId = parseInt($("#loadPresetSelect").val());
        const presetData = await getPresetData(presetId);

        if(presetData && presetData != "error") {
            const result = await savePreset(presetId, presetData.name, presetData.websiteListToApply, true);

            if(result == "success") {
                $("#infoPreset").text(i18next.t("modal.archive.updatePresetSuccess"));
            } else {
                $("#infoPreset").text(i18next.t("modal.archive.updatePresetError"));
            }

            $("#infoPreset").addClass("show");

            $("#infoPreset").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", (e) => {
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
    });

    $("#createPreset").on("click", () => {
        $("#createPresetModalTitle").val("");
        $("#createPresetModal").modal("show");
    });

    $("#createPresetModalAdvancedLink").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html"),
            part: "presets"
        });
    });

    $("#openAdvancedSettingsLink").on("click", () => {
        sendMessageWithPromise({
            type: "openTab",
            url: browser.runtime.getURL("options.html")
        });
    });

    async function createPreset() {
        $("#infoPreset").removeClass("show");
        const presetId = parseInt($("#loadPresetSelect").val());
        const presetTitle  = $("#createPresetModalTitle").val();

        const result = await savePreset(presetId, presetTitle, "", true);

        if(result == "success") {
            $("#infoPreset").text(i18next.t("modal.archive.createPresetSuccess"));
        } else {
            $("#infoPreset").text(i18next.t("modal.archive.createPresetError"));
        }

        $("#createPresetModal").modal("hide");
        $("#infoPreset").addClass("show");

        $("#infoPreset").on("animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd msAnimationEnd", (e) => {
            if(e.originalEvent.animationName === "fadeout") {
                $("#infoPreset").removeClass("show");
            }
        });
    }

    $("#createPresetModalValidate").on("click", async() => {
        createPreset();
    });

    $("#createPresetModalTitle").on("keyup", (e) => {
        if(e.key === "Enter") {
            createPreset();
        }
    });

    async function displaySettings() {
        const result = await browser.storage.local.get(["theme", "colorTemp", "pourcentageLum", "updateNotification", "defaultLoad", "percentageBlueLightReduction", "archiveInfoLastShowed", "archiveInfoDisable"]);

        checkCurrentPopupTheme();
        toggleTheme(); // Toggle dark/light theme
        checkContrastMode();
        checkColorInvert();
        checkAttenuateImageColor();
        checkLiveSettings();
        checkBrightness();
        checkBlueLightReduction();
        checkEnable();
        checkCustomTheme();
        checkAutoEnable();
        checkGlobalEnable();

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

        const updateNotification = result.updateNotification || {};

        if(updateNotification[extensionVersion] != true && result.defaultLoad == "0") {
            if (updateNotification["2.10"] != true) {
                $("#modalUIUpdatedMessage").show();
            } else {
                $("#modalUIUpdatedMessage").hide();
            }

            updateNotification[extensionVersion] = true;
            $("#updated").modal("show");
            $("#modalUpdatedMessage").text(i18next.t("modalUpdated.message", { version: extensionVersion, date: new Intl.DateTimeFormat(i18next.language).format(versionDate), interpolation: { escapeValue: false } }));
            setSettingItem("updateNotification", updateNotification);
            updateNotificationShowed = true;
        } else if(!updateNotificationShowed && !archiveInfoShowed) {
            const archiveInfoLastShowed = !result.archiveInfoLastShowed ? 0 : result.archiveInfoLastShowed;

            if(archiveInfoLastShowed > 0 && archiveInfoLastShowed + (archiveInfoShowInterval * 60 * 60 * 24 * 1000) <= Date.now() && result.archiveInfoDisable !== "true") {
                $("#archiveInfo").modal("show");
                setSettingItem("archiveInfoLastShowed", Date.now());
            } else if(archiveInfoLastShowed <= 0) {
                setSettingItem("archiveInfoLastShowed", Date.now());
            }

            archiveInfoShowed = true;
        }
    }

    displaySettings();

    if(typeof(browser.storage.onChanged) !== "undefined") {
        browser.storage.onChanged.addListener(() => {
            displaySettings();
        });
    }

    $(".popup-advanced-option-wrapper").on("mouseover", function() {
        if(currentTheme == "modern") {
            $(this).find("> div").stop().fadeIn();
        }
    });

    $(".popup-advanced-option-wrapper").on("mouseout", function() {
        if(currentTheme == "modern") {
            $(this).find("> div").stop().fadeOut();
        }
    });
});