/* translation */
i18next.use(window.i18nextBrowserLanguageDetector).use(window.i18nextXHRBackend).init({
    fallbackLng: ['en', 'fr'],
    ns: 'popup',
    load: 'languageOnly',
    defaultNS: 'popup',
        detection: {
            order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
            lookupQuerystring: 'lng',
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
        if(theme != null) {
            if(theme == "1") {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack");
            } else {
                $("#previsualisationDiv").addClass("pageShadowContrastBlack" + theme);
            }
        } else {
            $("#previsualisationDiv").addClass("pageShadowContrastBlack");
        }
    }
    
    function checkEnable() {
        chrome.storage.local.get('sitesInterditPageShadow', function (result) {
            if(result.sitesInterditPageShadow == null || typeof(result.sitesInterditPageShadow) == 'undefined' || result.sitesInterditPageShadow.trim() == '') {
                var siteInterdits = "";
            } else {
                var siteInterdits = result.sitesInterditPageShadow.split("\n");
            }

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var tabUrl = tabs[0].url;

                var url = new URL(tabUrl);
                var domain = url.hostname;

                if(strict_in_array(domain, siteInterdits)) {
                    $("#disableWebsite-li").show();
                    $("#enableWebsite-li").hide();
                } else {
                    $("#disableWebsite-li").hide();
                    $("#enableWebsite-li").show();
                }

                if(strict_in_array(tabUrl, siteInterdits)) {
                    $("#disableWebpage-li").show();
                    $("#enableWebpage-li").hide();
                } else {
                    $("#disableWebpage-li").hide();
                    $("#enableWebpage-li").show();
                }
            });
        });
    }
    
    function disablePageShadow(type, checked) {
        chrome.storage.local.get('sitesInterditPageShadow', function (result) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var disabledWebsites = '';
                var disabledWebsitesEmpty = false;
                var url = new URL(tabs[0].url);
                var domain = url.hostname;

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
                        if(checked == true) {
                            disabledWebsitesArray.push(domain);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                        } else {
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, domain);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                        }
                        break;
                    case "disable-webpage":
                        if(checked == true) {
                            disabledWebsitesArray.push(tabs[0].url);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n")

                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
                        } else {
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, tabs[0].url);
                            var disabledWebsitesNew = removeA(disabledWebsitesArray, "").join("\n");
                            setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
                        }
                        break;
                }
                
                checkEnable();
            });
        });
    }
    
    checkEnable();
    
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

    $( "#checkAssomPage" ).change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("pageShadowEnabled", "true");
            chrome.storage.local.get('theme', function (result) {
                if(typeof result.theme !== "undefined" && typeof result.theme !== null) {
                    $("#themeSelect").val(result.theme);
                    previewTheme(result.theme);
                } else {
                    $("#themeSelect").val("1");
                    previewTheme("1");
                }
                $("#themeDiv").stop().fadeIn();
            });
        }
        else {
            setSettingItem("pageShadowEnabled", "false");
            chrome.storage.local.get('theme', function (result) {
                if(typeof result.theme !== "undefined" && typeof result.theme !== null) {
                    $("#themeSelect").val(result.theme);
                    previewTheme(result.theme);
                } else {
                    $("#themeSelect").val("1");
                    previewTheme("1");
                }
                $("#themeDiv").stop().fadeOut();
            });
        }
    });

    $("#themeSelect").change(function() {
        setSettingItem("theme", $(this).val());
        previewTheme($(this).val());
    });

    $( "#checkColorInvert" ).change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("colorInvert", "true");
        }
        else {
            setSettingItem("colorInvert", "false");
        }
    });

    $( "#liveSettings" ).change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("liveSettings", "true");
        }
        else {
            setSettingItem("liveSettings", "false");
        }
    });

    $( "#checkLuminositePage" ).change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("pageLumEnabled", "true");
            chrome.storage.local.get(['nightModeEnabled', 'pourcentageLum'], function (result) {
                if(result.nightModeEnabled == "true") {
                    $("#checkNighMode").attr("checked", "checked");
                    elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
                } else {
                    elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                }
                elLumB.style.opacity = result.pourcentageLum / 100;
                elLumB.style.display = "block";
                $("#sliderLuminositeDiv").stop().fadeIn();
            });
        }
        else {
            setSettingItem("pageLumEnabled", "false");
            $("#sliderLuminositeDiv").stop().fadeOut();
            elLumB.style.display = "none";
        }
    });

    $("#sliderLuminosite").change(function() {
        var sliderLumValue = sliderLuminosite.slider('getValue');
        if(typeof elLumB !== "undefined") {
            elLumB.style.opacity = sliderLumValue / 100;
        }
        setSettingItem("pourcentageLum", sliderLumValue);
    });

    $( "#checkNighMode" ).change(function() {
        if($(this).is(':checked') == true) {
            setSettingItem("nightModeEnabled", "true");
            elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
        }
        else {
            setSettingItem("nightModeEnabled", "false");
            elLumB.setAttribute("id", "pageShadowLuminositeDiv");
        }
    });
    chrome.storage.local.get(['pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert', 'liveSettings'], function (result) {
        if(result.pageShadowEnabled == "true") {
            $("#checkAssomPage").attr("checked", "checked");
            if(typeof result.theme !== "undefined" && typeof result.theme !== null) {
                $("#themeSelect").val(result.theme);
                previewTheme(result.theme);
            } else {
                $("#themeSelect").val("1");
                previewTheme("1");
            }
            $("#themeDiv").show();
        }

        if(result.pageLumEnabled == "true") {
            $("#checkLuminositePage").attr("checked", "checked");
            $("#sliderLuminositeDiv").show();
                if(typeof result.pourcentageLum !== "undefined" && typeof result.pourcentageLum !== null) {
                    elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                    elLumB.style.opacity = result.pourcentageLum / 100;
                    elLumB.style.display = "block";
                }
        }

        if(result.nightModeEnabled == "true") {
            $("#checkNighMode").attr("checked", "checked");
            if (typeof elLumB !== "undefined") {
                elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
            }
        }

        if(result.colorInvert == "true") {
            $("#checkColorInvert").attr("checked", "checked");
        }

        if(result.liveSettings == "true" || result.liveSettings == null) {
            $("#liveSettings").attr("checked", "checked");
        }

        if(typeof result.pourcentageLum !== "undefined" && typeof result.pourcentageLum !== null) {
            sliderLuminosite.slider('setValue', result.pourcentageLum);
        }
    });
});
