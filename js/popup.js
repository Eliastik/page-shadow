/* translation */
i18next.use(window.i18nextBrowserLanguageDetector).use(window.i18nextXHRBackend).init({
    fallbackLng: ['en', 'fr'],
    ns: 'popup',
    defaultNS: 'popup',
        detection: {
            order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
            lookupQuerystring: 'lng',
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
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
    if(localStorage.getItem("pageShadowEnabled") == null) {
        localStorage.setItem("pageShadowEnabled", "false");
    }
    
    if(localStorage.getItem("theme") == null) {
        localStorage.setItem("theme", "1");
    }
    
    if(localStorage.getItem("colorInvert") == null) {
        localStorage.setItem("theme", "false");
    }

    if(localStorage.getItem("pageLumEnabled") == null) {
        localStorage.setItem("pageLumEnabled", "false");
    }

    if(localStorage.getItem("pourcentageLum") == null) {
        localStorage.setItem("pourcentageLum", "15");
    }

    if(localStorage.getItem("nightModeEnabled") == null) {
        localStorage.setItem("nightModeEnabled", "false");
    }

    if(localStorage.getItem("sitesInterditPageShadow") == null) {
        localStorage.setItem("sitesInterditPageShadow", "");
    }

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

    $( "#checkAssomPage" ).change(function() {
        if($(this).is(':checked') == true) {
            localStorage.setItem("pageShadowEnabled", "true");
            if(localStorage.getItem("theme") != null) {
                $("#themeSelect").val(localStorage.getItem("theme"));
                previewTheme(localStorage.getItem("theme"));
            } else {
                $("#themeSelect").val("1");
                previewTheme("1");
            }
            $("#themeDiv").fadeIn();
        }
        else {
            localStorage.setItem("pageShadowEnabled", "false");
            if(localStorage.getItem("theme") != null) {
                $("#themeSelect").val(localStorage.getItem("theme"));
                previewTheme(localStorage.getItem("theme"));
            } else {
                $("#themeSelect").val("1");
                previewTheme("1");
            }
            $("#themeDiv").fadeOut();
        }
    });
    
    $("#themeSelect").change(function() {
        localStorage.setItem("theme", $(this).val());
        previewTheme($(this).val());
    });
    
    $( "#checkColorInvert" ).change(function() {
        if($(this).is(':checked') == true) {
            localStorage.setItem("colorInvert", "true");
        }
        else {
            localStorage.setItem("colorInvert", "false");
        }
    });

    $( "#checkLuminositePage" ).change(function() {
        if($(this).is(':checked') == true) {
            localStorage.setItem("pageLumEnabled", "true");
            elLumB = document.createElement("div");
            if(localStorage.getItem("nightModeEnabled") == "true") {
                $("#checkNighMode").attr("checked", "checked");
                elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
            } else {
                elLumB.setAttribute("id", "pageShadowLuminositeDiv");
            }
            elLumB.style.opacity = localStorage.getItem("pourcentageLum") / 100;
            document.body.appendChild(elLumB);
            $("#sliderLuminositeDiv").fadeIn();
        }
        else {
            localStorage.setItem("pageLumEnabled", "false");
            $("#sliderLuminositeDiv").fadeOut();
            elLumB.style.display = "none";
        }
    });

    $("#sliderLuminosite").change(function() {
        var sliderLumValue = sliderLuminosite.slider('getValue');
        if(typeof elLumB !== "undefined") {
            elLumB.style.opacity = sliderLumValue / 100;
        }
        localStorage.setItem("pourcentageLum", sliderLumValue);
    });

    $( "#checkNighMode" ).change(function() {
        if($(this).is(':checked') == true) {
            localStorage.setItem("nightModeEnabled", "true");
            elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
        }
        else {
            localStorage.setItem("nightModeEnabled", "false");
            elLumB.setAttribute("id", "pageShadowLuminositeDiv");
        }
    });

    if(localStorage.getItem("pageShadowEnabled") == "true") {
        $("#checkAssomPage").attr("checked", "checked");
        if(localStorage.getItem("theme") != null) {
            $("#themeSelect").val(localStorage.getItem("theme"));
            previewTheme(localStorage.getItem("theme"));
        } else {
            $("#themeSelect").val("1");
            previewTheme("1");
        }
        $("#themeDiv").show();
    }

    if(localStorage.getItem("pageLumEnabled") == "true") {
        $("#checkLuminositePage").attr("checked", "checked");
        $("#sliderLuminositeDiv").show();
            if(localStorage.getItem("pourcentageLum") != null) {
                elLumB = document.createElement("div");
                elLumB.setAttribute("id", "pageShadowLuminositeDiv");
                elLumB.style.opacity = localStorage.getItem("pourcentageLum") / 100;
                document.body.appendChild(elLumB);
            }
    }

    if(localStorage.getItem("nightModeEnabled") == "true") {
        $("#checkNighMode").attr("checked", "checked");
        if (typeof elLumB !== "undefined") {
            elLumB.setAttribute("id", "pageShadowLuminositeDivNightMode");
        }
    }
    
    if(localStorage.getItem("colorInvert") == "true") {
        $("#checkColorInvert").attr("checked", "checked");
    }

    if(localStorage.getItem("pourcentageLum") != null) {
        sliderLuminosite.slider('setValue', localStorage.getItem("pourcentageLum"))
    }
});
