extensionVersion = "2.0.2";
/* translation */
i18next.use(window.i18nextBrowserLanguageDetector).use(window.i18nextXHRBackend).init({
    fallbackLng: ['en', 'fr'],
    ns: 'options',
    load: 'languageOnly',
    defaultNS: 'options',
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
function listTranslations(languages) {
    $("#languageSelect").text("");
    $.each(languages, function(index, value) {
        $("#languageSelect").append('<option data-i18n="container.language.'+ value +'" value="'+ value +'"></option>');
    });
    $("#languageSelect").val(i18next.language.substr(0, 2));
}
function translateContent() {
    jqueryI18next.init(i18next, $, {
      handleName: 'localize',
      selectorAttr: 'data-i18n'
    });
    listTranslations(i18next.languages);
    $("nav").localize();
    $(".container").localize();
    $(".modal").localize();
}
function changeLng(lng) {
    i18next.changeLanguage(lng);
}
i18next.on('languageChanged', () => {
    translateContent();
});
function getBrowserName() {
    if((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1 ) {
        return "Opera";
    }
    else if(navigator.userAgent.indexOf("Chrome") != -1 ) {
        return "Chrome";
    }
    else if(navigator.userAgent.indexOf("Firefox") != -1 ) {
        return "Firefox";
    } else {
        return false;
    }
}
function resetSettings() {
    $('span[data-toggle="tooltip"]').tooltip("hide");
    chrome.storage.local.clear();
    changeLng("fr");
    $("#textareaAssomPage").val("");
    $('#reset').modal("show");
}
$(document).ready(function() {
    $("#validerButton").click(function() {
        setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        changeLng($("#languageSelect").val());
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('#saved').modal("show");
    });

    $("#aboutDialogBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
    });

    chrome.storage.local.get('sitesInterditPageShadow', function (result) {
        if(typeof result.sitesInterditPageShadow !== "undefined" && typeof result.sitesInterditPageShadow !== null) {
            $("#textareaAssomPage").val(result.sitesInterditPageShadow);
        }
    });
    
    /*var browserName = getBrowserName();
    if(browserName != false) {
        $("#browserName").text(browserName);
    } else {
        $("#browserName").text("???");
    }*/

    $('span[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });
    
    $("#resetConfirmBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
    });
    
    $("#confirmReset").click(function() {
        resetSettings();
    });
    
    $("#versionExtension").text(extensionVersion);
    /*$("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion +"&nav="+ browserName.toLowerCase());*/
    $("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion);
    $("#versionExtension").text(extensionVersion);
});
