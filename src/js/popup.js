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
/* translation */
i18next.use(window.i18nextBrowserLanguageDetector).use(window.i18nextXHRBackend).init({
    fallbackLng: ['en', 'fr'],
    ns: 'popup',
    load: 'languageOnly',
    defaultNS: 'popup',
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
function translateContent() {
    jqueryI18next.init(i18next, $, {
      handleName: 'localize',
      selectorAttr: 'data-i18n'
    });
    $(".navbar").localize();
    $(".container").localize();
    $(".modal").localize();
    $("footer").localize();
    themeTranslation = i18next.t("container.theme");
}
function changeLng(lng) {
    i18next.changeLanguage(lng);
}
i18next.on('languageChanged', () => {
    translateContent();
});
$(document).ready(function() {
    var elLumB = document.createElement("div");
    elLumB.style.display = "none";
    document.body.appendChild(elLumB);
    var style = document.createElement('style');
    style.type = 'text/css';
    var lnkCustomTheme = document.createElement('link');
    var brightnessChangedFromThisPage = false;
    if(typeof(themeTranslation) === "undefined") themeTranslation = "Theme";
    var timeoutInfoPreset = 0;
    var selectedPreset = 1;

    /* Check if the configuration variables are set, if not set some default values (the variables are set globally, so we use window[variableName]) */
    if(typeof(window["nbThemes"]) == "undefined") nbThemes = 15;
    if(typeof(window["colorTemperaturesAvailable"]) == "undefined") colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"];
    if(typeof(window["minBrightnessPercentage"]) == "undefined") minBrightnessPercentage = 0;
    if(typeof(window["maxBrightnessPercentage"]) == "undefined") maxBrightnessPercentage = 0.9;
    if(typeof(window["brightnessDefaultValue"]) == "undefined") brightnessDefaultValue = 0.15;
    if(typeof(window["defaultBGColorCustomTheme"]) == "undefined") defaultBGColorCustomTheme = "000000";
    if(typeof(window["defaultTextsColorCustomTheme"]) == "undefined") defaultTextsColorCustomTheme = "FFFFFF";
    if(typeof(window["defaultLinksColorCustomTheme"]) == "undefined") defaultLinksColorCustomTheme = "1E90FF";
    if(typeof(window["defaultVisitedLinksColorCustomTheme"]) == "undefined") defaultVisitedLinksColorCustomTheme = "ff00ff";
    if(typeof(window["defaultFontCustomTheme"]) == "undefined") defaultFontCustomTheme = "";
    if(typeof(window["defaultAutoEnableHourFormat"]) == "undefined") defaultAutoEnableHourFormat = "24";
    if(typeof(window["defaultHourEnable"]) == "undefined") defaultHourEnable = "20";
    if(typeof(window["defaultMinuteEnable"]) == "undefined") defaultMinuteEnable = "0";
    if(typeof(window["defaultHourEnableFormat"]) == "undefined") defaultHourEnableFormat = "PM";
    if(typeof(window["defaultHourDisable"]) == "undefined") defaultHourDisable = "7";
    if(typeof(window["defaultMinuteDisable"]) == "undefined") defaultMinuteDisable = "0";
    if(typeof(window["defaultHourDisableFormat"]) == "undefined") defaultHourDisableFormat = "AM";

    // append the list of themes in the select
    for(i=1; i <= nbThemes; i++) {
        $("#themeSelect").append('<option value="'+ i +'">'+ themeTranslation +' '+ i +'</option>');
    }

    // append the list of the color temperatures in the select
    $("#tempSelect").text("");
    for(i=0; i < colorTemperaturesAvailable.length; i++) {
        var colorTempIndex = i + 1;
        $("#tempSelect").append('<option value="'+ colorTempIndex +'">'+ colorTemperaturesAvailable[i] +' K</option>');
    }

    // set the min and max percentage of brightness
    $("#sliderLuminosite").attr("data-slider-min", minBrightnessPercentage * 100);
    $("#sliderLuminosite").attr("data-slider-max", maxBrightnessPercentage * 100);
    $("#sliderLuminosite").attr("data-slider-value", brightnessDefaultValue * 100);

    $('[data-toggle="tooltip"]').tooltip({
        trigger: 'hover',
        container: 'body',
        placement: 'auto top'
    });

    var sliderLuminosite = $('#sliderLuminosite').slider({
        formatter: function(value) {
            return value;
        }
    });

    $("#linkAdvSettings").click(function() {
        chrome.tabs.create({
            url: "options.html"
        });
    });

    $("#linkAdvSettings2").click(function() {
        chrome.tabs.create({
            url: "options.html#customTheme"
        });
    });

    $("#linkTestExtension").click(function() {
        chrome.tabs.create({
            url: "pageTest.html"
        });
    });

    $("#settingsPresets").click(function() {
        chrome.tabs.create({
            url: "options.html#presets"
        });
    });

    function previewTheme(theme) {
        $("#previsualisationDiv").attr("class", "");

        if(theme !== null) {
            if(theme == "1") {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack");
            } else if(theme == "custom") {
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
        var tempColor = "2000";

        if(temp !== null) {
            var tempIndex = parseInt(temp);
            var tempColor = colorTemperaturesAvailable[tempIndex - 1];

            $("#pageShadowLuminositeDivNightMode").addClass("k" + tempColor);
        } else {
            $("#pageShadowLuminositeDivNightMode").addClass("k2000");
        }
    }

    function checkEnable() {
        function check(url) {
            chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList'], function (result) {
                if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == 'undefined' || result.sitesInterditPageShadow.trim() == '') {
                    var siteInterdits = "";
                } else {
                    var siteInterdits = result.sitesInterditPageShadow.split("\n");
                }

                var domain = url.hostname;
                var href = url.href;

                if(result.whiteList == "true") {
                    if(in_array_website(domain, siteInterdits)) {
                        $("#disableWebsite-li").hide();
                        $("#enableWebsite-li").show();
                    } else {
                        $("#disableWebsite-li").show();
                        $("#enableWebsite-li").hide();
                    }

                    $("#disableWebpage-li").hide();
                    $("#enableWebpage-li").hide();

                } else {
                    if(in_array_website(domain, siteInterdits)) {
                        $("#disableWebsite-li").show();
                        $("#enableWebsite-li").hide();
                    } else {
                        $("#disableWebsite-li").hide();
                        $("#enableWebsite-li").show();
                    }

                    if(in_array_website(href, siteInterdits)) {
                        $("#disableWebpage-li").show();
                        $("#enableWebpage-li").hide();
                    } else {
                        $("#disableWebpage-li").hide();
                        $("#enableWebpage-li").show();
                    }
                }
            });
        }

        var matches = window.location.search.match(/[\?&]tabId=([^&]+)/);

        if(matches && matches.length === 2) {
            var tabId = parseInt(matches[1]);
            chrome.tabs.get(tabId, function(tabinfos) {
                if(!chrome.runtime.lastError) {
                    var url = new URL(tabinfos.url);
                    check(url);
                }
            });
        } else {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if(!chrome.runtime.lastError) {
                    var url = new URL(tabs[0].url);
                    check(url);
                }
            });
        }
    }

    function disablePageShadow(type, checked) {
        var matches = window.location.search.match(/[\?&]tabId=([^&]+)/);

        if(matches && matches.length === 2) {
            var tabId = parseInt(matches[1]);
            chrome.tabs.get(tabId, function(tabinfos) {
                if(!chrome.runtime.lastError) {
                    var url = new URL(tabinfos.url);
                    disableEnableToggle(type, checked, url);
                    checkEnable();
                }
            });
        } else {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if(!chrome.runtime.lastError) {
                    var url = new URL(tabs[0].url);
                    disableEnableToggle(type, checked, url);
                    checkEnable();
                }
            });
        }
    }

    checkEnable();

    if(typeof(chrome.tabs.onActivated) !== 'undefined') {
        chrome.tabs.onActivated.addListener(function() {
            checkEnable();
        });
    }

    if(typeof(chrome.tabs.onUpdated) !== 'undefined') {
        chrome.tabs.onUpdated.addListener(function() {
            checkEnable();
        });
    }

    $("#disableWebsite").click(function() {
        disablePageShadow("disable-website", false);
    });

    $("#enableWebsite").click(function() {
        disablePageShadow("disable-website", true);
    });

    $("#disableWebpage").click(function() {
        disablePageShadow("disable-webpage", false);
    });

    $("#enableWebpage").click(function() {
        disablePageShadow("disable-webpage", true);
    });

    function checkContrastMode() {
        chrome.storage.local.get(["theme", "pageShadowEnabled", "disableImgBgColor"], function (result) {
            if(typeof result.theme !== "undefined" && typeof result.theme !== null) {
                $("#themeSelect").val(result.theme);
                previewTheme(result.theme);
            } else {
                $("#themeSelect").val("1");
                previewTheme("1");
            }

            if(result.pageShadowEnabled == "true") {
                $("#themeDiv").stop().fadeIn();
                if($("#checkAssomPage").is(':checked') == false) {
                    $("#checkAssomPage").prop("checked", true);
                }
            } else {
                $("#themeDiv").stop().fadeOut();
                if($("#checkAssomPage").is(':checked') == true) {
                    $("#checkAssomPage").prop("checked", false);
                }
            }

            if(result.disableImgBgColor == "true" && $("#checkDisableImgBgColor").is(':checked') == true) {
                $("#checkDisableImgBgColor").prop("checked", false);
            } else if(result.disableImgBgColor !== "true" && $("#checkDisableImgBgColor").is(':checked') == false) {
                $("#checkDisableImgBgColor").prop("checked", true);
            }
        });
    }

    $("#checkAssomPage").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("pageShadowEnabled", "true");
        } else {
            setSettingItem("pageShadowEnabled", "false");
        }
    });

    $("#checkDisableImgBgColor").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("disableImgBgColor", "false");
        } else {
            setSettingItem("disableImgBgColor", "true");
        }
    });

    $("#themeSelect").change(function() {
        setSettingItem("theme", $(this).val());

        if($(this).val() == "custom") {
            chrome.storage.local.get(['customThemeInfoDisable'], function (result) {
                if(typeof result.customThemeInfoDisable == "undefined" || typeof result.customThemeInfoDisable === null || result.customThemeInfoDisable !== "true") {
                    $('#customThemeInfos').modal('show');
                }
            });
        }
    });

    $("#customThemeInfoDisable").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("customThemeInfoDisable", "true");
        } else {
            setSettingItem("customThemeInfoDisable", "false");
        }
    });

    function checkCustomTheme() {
        customTheme(style, true, lnkCustomTheme);
    }

    function checkColorInvert() {
        chrome.storage.local.get(["colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertVideoColors", "invertBgColor"], function (result) {
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

                if($("#checkColorInvert").is(':checked') == false) {
                    $("#checkColorInvert").prop("checked", true);
                }

                if(result.invertImageColors == "true" && $("#checkImageInvert").is(':checked') == false) {
                    $("#checkImageInvert").prop("checked", true);
                } else if(result.invertImageColors == "false" && $("#checkImageInvert").is(':checked') == true) {
                    $("#checkImageInvert").prop("checked", false);
                }

                if(result.invertBgColor == "false" && $("#checkBgColorInvert").is(':checked') == true) {
                    $("#checkBgColorInvert").prop("checked", false);
                } else if(result.invertBgColor !== "false" && $("#checkBgColorInvert").is(':checked') == false) {
                    $("#checkBgColorInvert").prop("checked", true);
                }

                if(result.invertVideoColors == "true" && $("#checkVideoInvert").is(':checked') == false) {
                    $("#checkVideoInvert").prop("checked", true);
                } else if(result.invertVideoColors == "false" && $("#checkVideoInvert").is(':checked') == true) {
                    $("#checkVideoInvert").prop("checked", false);
                }
            } else {
                $("#invertPageColorsDiv").stop().fadeOut();

                if($("#checkColorInvert").is(':checked') == true) {
                    $("#checkColorInvert").prop("checked", false);
                }

                if(result.invertImageColors !== "true") {
                    if($("#checkImageInvert").is(':checked') == true) {
                        $("#checkImageInvert").prop("checked", false);
                    }
                }

                if(result.invertBgColor == "false") {
                    if($("#checkBgColorInvert").is(':checked') == true) {
                        $("#checkBgColorInvert").prop("checked", false);
                    }
                }

                if(result.invertVideoColors !== "true") {
                    if($("#checkVideoInvert").is(':checked') == true) {
                        $("#checkVideoInvert").prop("checked", false);
                    }
                }
            }

            if(result.invertEntirePage == "true" && $("#checkEntirePageInvert").is(':checked') == false) {
                $("#checkEntirePageInvert").prop("checked", true);
            } else if(result.invertEntirePage !== "true" && $("#checkEntirePageInvert").is(':checked') == true) {
                $("#checkEntirePageInvert").prop("checked", false);
            }
        });
    }

    $("#checkColorInvert").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("invertPageColors", "true");
        } else {
            setSettingItem("invertPageColors", "false");
        }
    });

    $("#checkEntirePageInvert").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("invertEntirePage", "true");
        }
        else {
            setSettingItem("invertEntirePage", "false");
        }
    });

    $("#checkImageInvert").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("invertImageColors", "true");
        }
        else {
            setSettingItem("invertImageColors", "false");
        }
    });

    $("#checkBgColorInvert").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("invertBgColor", "true");
        }
        else {
            setSettingItem("invertBgColor", "false");
        }
    });

    $("#checkVideoInvert").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("invertVideoColors", "true");
        }
        else {
            setSettingItem("invertVideoColors", "false");
        }
    });

    function checkAutoEnable() {
        chrome.storage.local.get("autoEnable", function (result) {
            if(result.autoEnable == "true" && $("#autoEnable").is(':checked') == false) {
                $("#autoEnable").prop("checked", true);
            } else if(result.autoEnable !== "true" && $("#autoEnable").is(':checked') == true) {
                $("#autoEnable").prop("checked", false);
            }
        });
    }

    $("#autoEnable").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("autoEnable", "true");
            $('#autoEnableSettings').modal('show');
        } else {
            setSettingItem("autoEnable", "false");
        }
    });

    function checkSettingsAutoEnable() {
        $("#hourEnableFormat").hide();
        $("#hourDisableFormat").hide();

        getAutoEnableSavedData(function(data) {
            var autoEnable = data[0];
            var format = data[1];
            var hourEnableFormat = data[2];
            var hourDisableFormat = data[3];
            var minuteEnable = data[4];
            var minuteDisable =  data[5];
            var hourEnable = data[6];
            var hourDisable = data[7];

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

        var data = getAutoEnableFormData();

        var type = data[0];
        var hourEnableFormat = data[3];
        var hourDisableFormat = data[6];
        var hourEnable = $("#hourEnable").val();
        var hourDisable = $("#hourDisable").val();

        if(type == "24") {
            var hourEnable = checkNumber(hourEnable, 0, 12) ? hourEnable : hourToPeriodFormat(defaultHourEnable, 12, null)[1];
            var hourEnable = hourToPeriodFormat(hourEnable, 24, hourEnableFormat);
            $("#hourEnable").val(hourEnable);
            var hourDisable = checkNumber(hourDisable, 0, 12) ? hourDisable : hourToPeriodFormat(defaultHourDisable, 12, null)[1];
            var hourDisable = hourToPeriodFormat(hourDisable, 24, hourDisableFormat);
            $("#hourDisable").val(hourDisable);
            $("#hourEnable").attr("max", 23);
            $("#hourDisable").attr("max", 23);
        } else if(type == "12") {
            $("#hourEnableFormat").show();
            $("#hourDisableFormat").show();
            var hourEnable = checkNumber(hourEnable, 0, 23) ? hourEnable : defaultHourEnable;
            var hourEnable = hourToPeriodFormat(hourEnable, 12, null);
            $("#hourEnable").val(hourEnable[1]);
            $("#hourEnableFormat").val(hourEnable[0]);
            var hourDisable = checkNumber(hourDisable, 0, 23) ? hourDisable : defaultHourDisable;
            var hourDisable = hourToPeriodFormat(hourDisable, 12, null);
            $("#hourDisable").val(hourDisable[1]);
            $("#hourDisableFormat").val(hourDisable[0]);
            $("#hourEnable").attr("max", 12);
            $("#hourDisable").attr("max", 12);
        }

        infoAutoEnable();
    }

    function saveSettingsAutoEnable() {
        var data = getAutoEnableFormData();

        chrome.storage.local.set({
            'autoEnableHourFormat': data[0],
            'hourEnable': data[1],
            'minuteEnable': data[2],
            'hourEnableFormat': data[3],
            'hourDisable': data[4],
            'minuteDisable': data[5],
            'hourDisableFormat': data[6]
        });

        checkSettingsAutoEnable();
        checkAutoEnableStartup();
        $('#saved').modal("show");
    }

    function infoAutoEnable() {
        $("#infoTimeEnabled").hide();
        $("#infoTimeDisabled").hide();

        var data = getAutoEnableFormData();

        if(checkAutoEnableStartup(data[1], data[2], data[4], data[5])) {
            $("#infoTimeEnabled").show();
        } else {
            $("#infoTimeDisabled").show();
        }
    }

    $("#saveSettingsAutoEnable").click(function() {
        saveSettingsAutoEnable();
    });

    $("#cancelSettingsAutoEnable").click(function() {
        checkSettingsAutoEnable();
    });

    $('#autoEnableSettings').on('hidden.bs.modal', function () {
        checkSettingsAutoEnable();
    });

    $("#autoEnableHourFormat").change(function() {
        changeFormat();
    });

    $("#formAutoEnable input").on("input", function() {
        infoAutoEnable();
    });

    $("#hourEnableFormat, #hourDisableFormat").change(function() {
        infoAutoEnable();
    });

    var intervalCheckAutoEnable = setInterval(function() { infoAutoEnable(); }, 1000);

    function checkLiveSettings() {
        chrome.storage.local.get("liveSettings", function (result) {
            if(result.liveSettings == "true" && $("#liveSettings").is(':checked') == false) {
                $("#liveSettings").prop("checked", true);
            } else if(result.liveSettings !== "true" && $("#liveSettings").is(':checked') == true) {
                $("#liveSettings").prop("checked", false);
            }
        });
    }

    $("#liveSettings").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("liveSettings", "true");
        } else {
            setSettingItem("liveSettings", "false");
        }
    });

    function checkBrightness() {
        chrome.storage.local.get(['pageLumEnabled', 'nightModeEnabled', 'pourcentageLum'], function (result) {
            if(result.pageLumEnabled == "true") {
                if(result.nightModeEnabled == "true") {
                    $("#checkNighMode").attr("checked", "checked");
                    elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
                } else {
                    elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                }

                if(result.pourcentageLum / 100 > maxBrightnessPercentage || result.pourcentageLum / 100 < minBrightnessPercentage || typeof result.pourcentageLum === "undefined" || typeof result.pourcentageLum == null) {
                    elLumB.style.opacity = brightnessDefaultValue;
                    sliderLuminosite.slider('setValue', brightnessDefaultValue * 100);
                } else {
                    elLumB.style.opacity = result.pourcentageLum / 100;
                }

                elLumB.style.display = "block";
                $("#sliderLuminositeDiv").stop().fadeIn();
                if($("#checkLuminositePage").is(':checked') == false) {
                    $("#checkLuminositePage").prop("checked", true);
                }
            } else {
                $("#sliderLuminositeDiv").stop().fadeOut();
                elLumB.style.display = "none";
                if($("#checkLuminositePage").is(':checked') == true) {
                    $("#checkLuminositePage").prop("checked", false);
                }
            }
        });
    }

    $("#checkLuminositePage").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("pageLumEnabled", "true");
        } else {
            setSettingItem("pageLumEnabled", "false");
        }
    });

    $("#sliderLuminosite").change(function() {
        var sliderLumValue = sliderLuminosite.slider('getValue');
        brightnessChangedFromThisPage = true;
        setSettingItem("pourcentageLum", sliderLumValue);
    });

    function checkNightMode() {
        chrome.storage.local.get(['nightModeEnabled', 'colorTemp'], function (result) {
            if(result.nightModeEnabled == "true") {
                if(typeof result.colorTemp !== "undefined" && typeof result.colorTemp !== null) {
                    $("#tempSelect").val(result.colorTemp);
                    previewTemp(result.colorTemp);
                } else {
                    $("#tempSelect").val("5");
                    previewTemp("5");
                }

                $("#tempSelectDiv").stop().fadeIn();
                elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
                if($("#checkNighMode").is(':checked') == false) {
                    $("#checkNighMode").prop("checked", true);
                }
            } else {
                $("#tempSelectDiv").stop().fadeOut();
                elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                if($("#checkNighMode").is(':checked') == true) {
                    $("#checkNighMode").prop("checked", false);
                }
            }
        });
    }

    $( "#checkNighMode" ).change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("nightModeEnabled", "true");
        } else {
            setSettingItem("nightModeEnabled", "false");
        }
    });

    $("#tempSelect").change(function() {
        setSettingItem("colorTemp", $(this).val());
    });

    function checkGlobalEnable() {
        chrome.storage.local.get("globallyEnable", function (result) {
            if(result.globallyEnable == "false") {
                $("#pageShadowGlobalSwitch").prop("checked", false);
            } else {
                $("#pageShadowGlobalSwitch").prop("checked", true);
            }
        });
    }

    $("#pageShadowGlobalSwitch").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("globallyEnable", "true");
        } else {
            setSettingItem("globallyEnable", "false");
        }
    });

    $("#loadPresetValid").click(function() {
        clearTimeout(timeoutInfoPreset);
        $("#infoPreset").removeClass("show");

        loadPreset(parseInt($("#loadPresetSelect").val()), function(result) {
            if(result == "success") {
                $("#infoPreset").text(i18next.t("modal.archive.restorePresetSuccess"));
            } else if(result == "empty") {
                $("#infoPreset").text(i18next.t("modal.archive.restorePresetEmpty"));
            } else {
                $("#infoPreset").text(i18next.t("modal.archive.restorePresetError"));
            }

            $("#infoPreset").addClass("show");
            timeoutInfoPreset = setTimeout(function(){ $("#infoPreset").removeClass("show"); }, 3000);
        });
    });

    $("#loadPresetSelect").change(function() {
      selectedPreset = $("#loadPresetSelect").val();
    });

    function displaySettings() {
        chrome.storage.local.get(['theme', 'colorTemp', 'pourcentageLum'], function (result) {
            checkContrastMode();
            checkColorInvert();
            checkLiveSettings();
            checkBrightness();
            checkNightMode();
            checkEnable();
            checkCustomTheme();
            checkAutoEnable();
            checkGlobalEnable();

            if(typeof result.pourcentageLum !== "undefined" && typeof result.pourcentageLum !== null && result.pourcentageLum / 100 <= maxBrightnessPercentage && result.pourcentageLum / 100 >= minBrightnessPercentage && brightnessChangedFromThisPage == false) {
                sliderLuminosite.slider('setValue', result.pourcentageLum);
                brightnessChangedFromThisPage = false;
            } else if(brightnessChangedFromThisPage == false) {
                sliderLuminosite.slider('setValue', brightnessDefaultValue * 100);
                brightnessChangedFromThisPage = false;
            }

            if(($("#autoEnableSettings").data('bs.modal') || {}).isShown !== true) {
                checkSettingsAutoEnable();
            }

            loadPresetSelect("loadPresetSelect");
            $("#loadPresetSelect").val(selectedPreset).change();
        });
    }

    displaySettings();

    if(typeof(chrome.storage.onChanged) !== 'undefined') {
        chrome.storage.onChanged.addListener(function() {
            displaySettings();
        });
    }
});
