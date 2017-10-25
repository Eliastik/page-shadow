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
    themeTranslation = i18next.t("container.theme");
    $(".container").localize();
    $("footer").localize();
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
    var brightnessChangedFromThisPage = false;
    if(typeof(themeTranslation) === "undefined") themeTranslation = "Theme";
    /* Check if the configuration variables are set, if not set some default values (the variables are set globally, so we use window[variableName]) */
    if(typeof(window["nbThemes"]) == "undefined") nbThemes = 15;
    if(typeof(window["colorTemperaturesAvailable"]) == "undefined") colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"];
    if(typeof(window["minBrightnessPercentage"]) == "undefined") minBrightnessPercentage = 0;
    if(typeof(window["maxBrightnessPercentage"]) == "undefined") maxBrightnessPercentage = 0.9;
    if(typeof(window["brightnessDefaultValue"]) == "undefined") brightnessDefaultValue = 0.15;
    
    // append the list of themes in the select
    $("#themeSelect").text("");
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

    $('i[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click'
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

    $("#linkTestExtension").click(function() {
        chrome.tabs.create({
            url: "pageTest.html"
        });
    });

    function previewTheme(theme) {
        $("#previsualisationDiv").attr("class", "");

        if(theme !== null) {
            if(theme == "1") {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack");
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
                    if(strict_in_array(domain, siteInterdits)) {
                        $("#disableWebsite-li").hide();
                        $("#enableWebsite-li").show();
                    } else {
                        $("#disableWebsite-li").show();
                        $("#enableWebsite-li").hide();
                    }

                    $("#disableWebpage-li").hide();
                    $("#enableWebpage-li").hide();

                } else {
                    if(strict_in_array(domain, siteInterdits)) {
                        $("#disableWebsite-li").show();
                        $("#enableWebsite-li").hide();
                    } else {
                        $("#disableWebsite-li").hide();
                        $("#enableWebsite-li").show();
                    }

                    if(strict_in_array(href, siteInterdits)) {
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
        function disable(url) {
            chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList'], function (result) {
                var disabledWebsites = '';
                var disabledWebsitesEmpty = false;
                var domain = url.hostname;
                var href = url.href;

                if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == 'undefined') {
                    var disabledWebsitesEmpty = true;
                    var disabledWebsitesArray = [];
                } else {
                    var disabledWebsites = result.sitesInterditPageShadow;
                    var disabledWebsitesArray = disabledWebsites.split("\n");
                    var disabledWebsitesEmpty = false;
                }

                switch (type) {
                    case "disable-website":
                        if(result.whiteList == "true") {
                            if(checked == true) {
                                var disabledWebsitesNew = removeA(disabledWebsitesArray, domain);
                                var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                            } else {
                                disabledWebsitesArray.push(domain);
                                var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                            }
                        } else {
                            if(checked == true) {
                                disabledWebsitesArray.push(domain);
                                var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                            } else {
                                var disabledWebsitesNew = removeA(disabledWebsitesArray, domain);
                                var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                                setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                            }
                        }
                        break;
                    case "disable-webpage":
                        if(checked == true) {
                            disabledWebsitesArray.push(href);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                        } else {
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, href);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                        }
                        break;
                }

                checkEnable();
            });
        }
        
        var matches = window.location.search.match(/[\?&]tabId=([^&]+)/);
        
        if(matches && matches.length === 2) {
            var tabId = parseInt(matches[1]);
            chrome.tabs.get(tabId, function(tabinfos) {
                if(!chrome.runtime.lastError) {
                    var url = new URL(tabinfos.url);
                    disable(url);
                }
            });
        } else {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if(!chrome.runtime.lastError) {
                    var url = new URL(tabs[0].url);
                    disable(url);
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
        chrome.storage.local.get(["theme", "pageShadowEnabled"], function (result) {
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
        });
    }

    $("#checkAssomPage").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("pageShadowEnabled", "true");
        }
        else {
            setSettingItem("pageShadowEnabled", "false");
        }
    });

    $("#themeSelect").change(function() {
        setSettingItem("theme", $(this).val());
    });

    function checkColorInvert() {
        chrome.storage.local.get("colorInvert", function (result) {
            if(result.colorInvert == "true" && $("#checkColorInvert").is(':checked') == false) {
                $("#checkColorInvert").prop("checked", true);
            } else if(result.colorInvert !== "true" && $("#checkColorInvert").is(':checked') == true) {
                $("#checkColorInvert").prop("checked", false);
            }
        });
    }

    $("#checkColorInvert").change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("colorInvert", "true");
        }
        else {
            setSettingItem("colorInvert", "false");
        }
    });

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
        }
        else {
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
        }
        else {
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
        }
        else {
            setSettingItem("nightModeEnabled", "false");
        }
    });

    $("#tempSelect").change(function() {
        setSettingItem("colorTemp", $(this).val());
    });

    function displaySettings() {
        chrome.storage.local.get(['theme', 'colorTemp', 'pourcentageLum'], function (result) {
            checkContrastMode();
            checkColorInvert();
            checkLiveSettings();
            checkBrightness();
            checkNightMode();
            checkEnable();

            if(typeof result.pourcentageLum !== "undefined" && typeof result.pourcentageLum !== null && result.pourcentageLum / 100 <= maxBrightnessPercentage && result.pourcentageLum / 100 >= minBrightnessPercentage && brightnessChangedFromThisPage == false) {
                sliderLuminosite.slider('setValue', result.pourcentageLum);
                brightnessChangedFromThisPage = false;
            } else if(brightnessChangedFromThisPage == false) {
                sliderLuminosite.slider('setValue', brightnessDefaultValue * 100);
                brightnessChangedFromThisPage = false;
            }
        });
    }

    displaySettings();

    if(typeof(chrome.storage.onChanged) !== 'undefined') {
        chrome.storage.onChanged.addListener(function() {
            displaySettings();
        });
    }
});
