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
import Slider from "bootstrap-slider";
import { in_array_website, disableEnableToggle, customTheme, hourToPeriodFormat, checkNumber, getAutoEnableSavedData, getAutoEnableFormData, checkAutoEnableStartup, loadPresetSelect, loadPreset, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultHourEnable, defaultHourDisable, nbCustomThemesSlots } from "./util.js";
import { setSettingItem } from "./storage.js";
import { init_i18next } from "./locales.js";

window.$ = $;
window.jQuery = $;

let checkContrastMode;

init_i18next("popup", () => translateContent());

function translateContent() {
    jqueryI18next.init(i18next, $, {
        handleName: "localize",
        selectorAttr: "data-i18n"
    });
    $(".navbar").localize();
    $(".container").localize();
    $(".modal").localize();
    $("footer").localize();
    checkContrastMode();
}

i18next.on("languageChanged", () => {
    translateContent();
});

$(document).ready(() => {
    const elLumB = document.createElement("div");
    elLumB.style.display = "none";
    document.body.appendChild(elLumB);
    const style = document.createElement("style");
    style.type = "text/css";
    const lnkCustomTheme = document.createElement("link");
    let brightnessChangedFromThisPage = false;
    let selectedPreset = 1;

    // append the list of the color temperatures in the select
    $("#tempSelect").text("");

    for(let i = 0; i < colorTemperaturesAvailable.length; i++) {
        const colorTempIndex = i + 1;
        $("#tempSelect").append("<option value=\""+ colorTempIndex +"\">"+ colorTemperaturesAvailable[i] +" K</option>");
    }

    // set the min and max percentage of brightness
    $("#sliderLuminosite").attr("data-slider-min", minBrightnessPercentage * 100);
    $("#sliderLuminosite").attr("data-slider-max", maxBrightnessPercentage * 100);
    $("#sliderLuminosite").attr("data-slider-value", brightnessDefaultValue * 100);

    $("[data-toggle=\"tooltip\"]").tooltip({
        trigger: "hover",
        container: "body",
        placement: "auto top"
    });

    const sliderLuminosite = new Slider("#sliderLuminosite", {
        tooltip: "show",
        step: 1,
        tooltip_position: "top",
        formatter: value => {
            return value;
        }
    });

    $("#linkAdvSettings").click(() => {
        chrome.tabs.create({
            url: "options.html"
        });
    });

    $("#linkAdvSettings2").click(() => {
        chrome.tabs.create({
            url: "options.html#customTheme"
        });
    });

    $("#linkTestExtension").click(() => {
        chrome.tabs.create({
            url: "pageTest.html"
        });
    });

    $("#settingsPresets").click(() => {
        chrome.tabs.create({
            url: "options.html#presets"
        });
    });

    function previewTheme(theme) {
        $("#previsualisationDiv").attr("class", "");

        if(theme !== null) {
            if(theme == "1") {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack");
            } else if(theme.trim().startsWith("custom")) {
                $("#previsualisationDiv").addClass("pageShadowContrastBlackCustom");
            } else {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack" + theme);
            }
        } else {
            $("#previsualisationDiv").addClass("pageShadowContrastBlack");
        }
    }

    function previewTemp(temp) {
        $("#pageShadowLuminositeDivNightMode").attr("class", "");
        let tempColor = "2000";

        if(temp != undefined) {
            const tempIndex = parseInt(temp);
            tempColor = colorTemperaturesAvailable[tempIndex - 1];

            $("#pageShadowLuminositeDivNightMode").addClass("k" + tempColor);
        } else {
            $("#pageShadowLuminositeDivNightMode").addClass("k2000");
        }
    }

    function checkEnable() {
        function check(url) {
            chrome.storage.local.get(["sitesInterditPageShadow", "whiteList"], result => {
                let sitesInterdits;

                if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == "undefined" || result.sitesInterditPageShadow.trim() == "") {
                    sitesInterdits = "";
                } else {
                    sitesInterdits = result.sitesInterditPageShadow.split("\n");
                }

                const domain = url.hostname;
                const href = url.href;

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
            });
        }

        const matches = window.location.search.match(/[?&]tabId=([^&]+)/);

        if(matches && matches.length === 2) {
            const tabId = parseInt(matches[1]);
            chrome.tabs.get(tabId, (tabinfos) => {
                if(!chrome.runtime.lastError) {
                    const url = new URL(tabinfos.url);
                    check(url);
                }
            });
        } else {
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                if(!chrome.runtime.lastError) {
                    const url = new URL(tabs[0].url);
                    check(url);
                }
            });
        }
    }

    function disablePageShadow(type, checked) {
        const matches = window.location.search.match(/[?&]tabId=([^&]+)/);

        if(matches && matches.length === 2) {
            const tabId = parseInt(matches[1]);
            chrome.tabs.get(tabId, (tabinfos) => {
                if(!chrome.runtime.lastError) {
                    const url = new URL(tabinfos.url);
                    disableEnableToggle(type, checked, url);
                    checkEnable();
                }
            });
        } else {
            chrome.tabs.query({active: true, currentWindow: true}, tabs => {
                if(!chrome.runtime.lastError) {
                    const url = new URL(tabs[0].url);
                    disableEnableToggle(type, checked, url);
                    checkEnable();
                }
            });
        }
    }

    checkEnable();

    if(typeof(chrome.tabs.onActivated) !== "undefined") {
        chrome.tabs.onActivated.addListener(() => {
            checkEnable();
        });
    }

    if(typeof(chrome.tabs.onUpdated) !== "undefined") {
        chrome.tabs.onUpdated.addListener(() => {
            checkEnable();
        });
    }

    $("#disableWebsite").click(() => {
        disablePageShadow("disable-website", false);
    });

    $("#enableWebsite").click(() => {
        disablePageShadow("disable-website", true);
    });

    $("#disableWebpage").click(() => {
        disablePageShadow("disable-webpage", false);
    });

    $("#enableWebpage").click(() => {
        disablePageShadow("disable-webpage", true);
    });

    checkContrastMode = function() {
        chrome.storage.local.get(["theme", "pageShadowEnabled", "disableImgBgColor"], result => {
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
                $("#themeDiv").stop().fadeIn();
                if($("#checkAssomPage").is(":checked") == false) {
                    $("#checkAssomPage").prop("checked", true);
                }
            } else {
                $("#themeDiv").stop().fadeOut();
                if($("#checkAssomPage").is(":checked") == true) {
                    $("#checkAssomPage").prop("checked", false);
                }
            }

            if(result.disableImgBgColor == "true" && $("#checkDisableImgBgColor").is(":checked") == true) {
                $("#checkDisableImgBgColor").prop("checked", false);
            } else if(result.disableImgBgColor !== "true" && $("#checkDisableImgBgColor").is(":checked") == false) {
                $("#checkDisableImgBgColor").prop("checked", true);
            }
        });
    };

    $("#checkAssomPage").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("pageShadowEnabled", "true");
        } else {
            setSettingItem("pageShadowEnabled", "false");
        }
    });

    $("#checkDisableImgBgColor").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("disableImgBgColor", "false");
        } else {
            setSettingItem("disableImgBgColor", "true");
        }
    });

    $("#themeSelect").change(function() {
        setSettingItem("theme", $(this).val());

        if($(this).val().trim().startsWith("custom")) {
            chrome.storage.local.get("customThemeInfoDisable", result => {
                if(typeof result.customThemeInfoDisable == undefined || result.customThemeInfoDisable !== "true") {
                    $("#customThemeInfos").modal("show");
                }
            });
        }
    });

    $("#customThemeInfoDisable").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("customThemeInfoDisable", "true");
        } else {
            setSettingItem("customThemeInfoDisable", "false");
        }
    });

    function checkCustomTheme() {
        chrome.storage.local.get("theme", result => {
            if(result.theme != undefined && typeof(result.theme) == "string" && result.theme.startsWith("custom")) {
                customTheme(result.theme.replace("custom", ""), style, true, lnkCustomTheme);
            }
        });
    }

    function checkColorInvert() {
        chrome.storage.local.get(["colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor"], (result) => {
            if(result.colorInvert == "true") {
                // Convert old settings to new settings
                setSettingItem("colorInvert", "false");
                setSettingItem("invertPageColors", "true");
                setSettingItem("invertImageColors", "true");
                setSettingItem("invertVideoColors", "true");
                setSettingItem("invertBgColor", "true");
                checkColorInvert();
            } else if(result.invertPageColors == "true") {
                $("#invertPageColorsDiv").stop().fadeIn();

                if($("#checkColorInvert").is(":checked") == false) {
                    $("#checkColorInvert").prop("checked", true);
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
            } else {
                $("#invertPageColorsDiv").stop().fadeOut();

                if($("#checkColorInvert").is(":checked") == true) {
                    $("#checkColorInvert").prop("checked", false);
                }

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
            }

            if(result.invertEntirePage == "true" && $("#checkEntirePageInvert").is(":checked") == false) {
                $("#checkEntirePageInvert").prop("checked", true);
            } else if(result.invertEntirePage !== "true" && $("#checkEntirePageInvert").is(":checked") == true) {
                $("#checkEntirePageInvert").prop("checked", false);
            }
        });
    }

    $("#checkColorInvert").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertPageColors", "true");
        } else {
            setSettingItem("invertPageColors", "false");
        }
    });

    $("#checkEntirePageInvert").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertEntirePage", "true");
        }
        else {
            setSettingItem("invertEntirePage", "false");
        }
    });

    $("#checkImageInvert").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertImageColors", "true");
        }
        else {
            setSettingItem("invertImageColors", "false");
        }
    });

    $("#checkBgColorInvert").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertBgColor", "true");
        }
        else {
            setSettingItem("invertBgColor", "false");
        }
    });

    $("#checkVideoInvert").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("invertVideoColors", "true");
        }
        else {
            setSettingItem("invertVideoColors", "false");
        }
    });

    function checkAutoEnable() {
        chrome.storage.local.get("autoEnable", result => {
            if(result.autoEnable == "true" && $("#autoEnable").is(":checked") == false) {
                $("#autoEnable").prop("checked", true);
            } else if(result.autoEnable !== "true" && $("#autoEnable").is(":checked") == true) {
                $("#autoEnable").prop("checked", false);
            }
        });
    }

    $("#autoEnable").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("autoEnable", "true");
            $("#autoEnableSettings").modal("show");
        } else {
            setSettingItem("autoEnable", "false");
        }
    });

    function checkSettingsAutoEnable() {
        $("#hourEnableFormat").hide();
        $("#hourDisableFormat").hide();

        getAutoEnableSavedData(data => {
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
        });
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

        chrome.storage.local.set({
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

    $("#saveSettingsAutoEnable").click(() => {
        saveSettingsAutoEnable();
    });

    $("#cancelSettingsAutoEnable").click(() => {
        checkSettingsAutoEnable();
    });

    $("#autoEnableSettings").on("hidden.bs.modal", () => {
        checkSettingsAutoEnable();
    });

    $("#autoEnableHourFormat").change(() => {
        changeFormat();
    });

    $("#formAutoEnable input").on("input", () => {
        infoAutoEnable();
    });

    $("#hourEnableFormat, #hourDisableFormat").change(() => {
        infoAutoEnable();
    });

    setInterval(() => { infoAutoEnable(); }, 1000);

    function checkLiveSettings() {
        chrome.storage.local.get("liveSettings", result => {
            if(result.liveSettings == "true" && $("#liveSettings").is(":checked") == false) {
                $("#liveSettings").prop("checked", true);
            } else if(result.liveSettings !== "true" && $("#liveSettings").is(":checked") == true) {
                $("#liveSettings").prop("checked", false);
            }
        });
    }

    $("#liveSettings").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("liveSettings", "true");
        } else {
            setSettingItem("liveSettings", "false");
        }
    });

    function checkBrightness() {
        chrome.storage.local.get(["pageLumEnabled", "nightModeEnabled", "pourcentageLum"], result => {
            if(result.pageLumEnabled == "true") {
                if(result.nightModeEnabled == "true") {
                    $("#checkNighMode").attr("checked", "checked");
                    elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
                } else {
                    elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                }

                if(result.pourcentageLum / 100 > maxBrightnessPercentage || result.pourcentageLum / 100 < minBrightnessPercentage || typeof result.pourcentageLum === "undefined" || result.pourcentageLum == null) {
                    elLumB.style.opacity = brightnessDefaultValue;
                    sliderLuminosite.setValue(brightnessDefaultValue * 100);
                } else {
                    elLumB.style.opacity = result.pourcentageLum / 100;
                }

                elLumB.style.display = "block";
                $("#sliderLuminositeDiv").stop().fadeIn();

                if($("#checkLuminositePage").is(":checked") == false) {
                    $("#checkLuminositePage").prop("checked", true);
                }

                checkNightMode();
            } else {
                $("#sliderLuminositeDiv").stop().fadeOut();
                elLumB.style.display = "none";
                if($("#checkLuminositePage").is(":checked") == true) {
                    $("#checkLuminositePage").prop("checked", false);
                }
            }
        });
    }

    $("#checkLuminositePage").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("pageLumEnabled", "true");
        } else {
            setSettingItem("pageLumEnabled", "false");
        }
    });

    $("#sliderLuminosite").change(() => {
        const sliderLumValue = sliderLuminosite.getValue();
        brightnessChangedFromThisPage = true;
        setSettingItem("pourcentageLum", sliderLumValue);
    });

    function checkNightMode() {
        chrome.storage.local.get(["nightModeEnabled", "colorTemp"], result => {
            if(result.nightModeEnabled == "true") {
                if(result.colorTemp != undefined) {
                    $("#tempSelect").val(result.colorTemp);
                    previewTemp(result.colorTemp);
                } else {
                    $("#tempSelect").val("5");
                    previewTemp("5");
                }

                $("#tempSelectDiv").stop().fadeIn();
                elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
                if($("#checkNighMode").is(":checked") == false) {
                    $("#checkNighMode").prop("checked", true);
                }
            } else {
                $("#tempSelectDiv").stop().fadeOut();
                elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                if($("#checkNighMode").is(":checked") == true) {
                    $("#checkNighMode").prop("checked", false);
                }
            }
        });
    }

    $( "#checkNighMode" ).change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("nightModeEnabled", "true");
        } else {
            setSettingItem("nightModeEnabled", "false");
        }
    });

    $("#tempSelect").change(function() {
        setSettingItem("colorTemp", $(this).val());
    });

    function checkGlobalEnable() {
        chrome.storage.local.get("globallyEnable", (result) => {
            if(result.globallyEnable == "false") {
                $("#pageShadowGlobalSwitch").prop("checked", false);
            } else {
                $("#pageShadowGlobalSwitch").prop("checked", true);
            }
        });
    }

    $("#pageShadowGlobalSwitch").change(function() {
        if($(this).is(":checked") == true) {
            setSettingItem("globallyEnable", "true");
        } else {
            setSettingItem("globallyEnable", "false");
        }
    });

    $("#loadPresetValid").click(() => {
        $("#infoPreset").removeClass("show");

        loadPreset(parseInt($("#loadPresetSelect").val()), (result) => {
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
    });

    $("#loadPresetSelect").change(() => {
        selectedPreset = $("#loadPresetSelect").val();
    });

    function displaySettings() {
        chrome.storage.local.get(["theme", "colorTemp", "pourcentageLum"], result => {
            checkContrastMode();
            checkColorInvert();
            checkLiveSettings();
            checkBrightness();
            checkEnable();
            checkCustomTheme();
            checkAutoEnable();
            checkGlobalEnable();

            if(typeof result.pourcentageLum !== "undefined" && result.pourcentageLum !== null && result.pourcentageLum / 100 <= maxBrightnessPercentage && result.pourcentageLum / 100 >= minBrightnessPercentage && brightnessChangedFromThisPage == false) {
                sliderLuminosite.setValue(result.pourcentageLum);
                brightnessChangedFromThisPage = false;
            } else if(brightnessChangedFromThisPage == false) {
                sliderLuminosite.setValue(brightnessDefaultValue * 100);
                brightnessChangedFromThisPage = false;
            }

            if(($("#autoEnableSettings").data("bs.modal") || {}).isShown !== true) {
                checkSettingsAutoEnable();
            }

            loadPresetSelect("loadPresetSelect");
            $("#loadPresetSelect").val(selectedPreset).change();
        });
    }

    displaySettings();

    if(typeof(chrome.storage.onChanged) !== "undefined") {
        chrome.storage.onChanged.addListener(() => {
            displaySettings();
        });
    }
});