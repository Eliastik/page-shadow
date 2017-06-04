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

    $( "#checkAssomPage" ).change(function() {
        if($(this).is(':checked') == true) {
            localStorage.setItem("pageShadowEnabled", "true");
        }
        else {
            localStorage.setItem("pageShadowEnabled", "false");
        }
    });

    $( "#checkLuminositePage" ).change(function() {
        if($(this).is(':checked') == true) {
            localStorage.setItem("pageLumEnabled", "true");
            $("#sliderLuminositeDiv").show();
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

    if(localStorage.getItem("pourcentageLum") != null) {
        sliderLuminosite.slider('setValue', localStorage.getItem("pourcentageLum"))
    }
});
