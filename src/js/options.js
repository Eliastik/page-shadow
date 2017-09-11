var extensionVersion = "2.1";
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
            loadPath: '/_locales/{{lng}}/{{ns}}.json',
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
function resetSettings() {
    $('span[data-toggle="tooltip"]').tooltip("hide");
    $('i[data-toggle="tooltip"]').tooltip("hide");
    chrome.storage.local.clear();
    changeLng("fr");
    $("#textareaAssomPage").val("");
    $("#checkWhiteList").prop("checked", false);
    $('#reset').modal("show");
}
function displaySettings() {
    chrome.storage.local.get(['sitesInterditPageShadow', 'whiteList'], function (result) {
        if(typeof result.sitesInterditPageShadow !== "undefined" && typeof result.sitesInterditPageShadow !== null) {
            $("#textareaAssomPage").val(result.sitesInterditPageShadow);
        }
        
        if(result.whiteList == "true") {
            $("#checkWhiteList").prop("checked", true);
        } else {
            $("#checkWhiteList").prop("checked", false);
        }
    });
}
$(document).ready(function() {
    $("#validerButton").click(function() {
        setSettingItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        chrome.storage.local.get('whiteList', function (result) {
            if($("#checkWhiteList").prop("checked") == true) {
                if(result.whiteList !== "true") {
                    setSettingItem("sitesInterditPageShadow", "");
                }
                
                setSettingItem("whiteList", "true");
            } else {
                if(result.whiteList == "true") {
                    setSettingItem("sitesInterditPageShadow", "");
                }
                
                setSettingItem("whiteList", "false");
            }
        });
        changeLng($("#languageSelect").val());
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('i[data-toggle="tooltip"]').tooltip("hide");
        $('#saved').modal("show");
        displaySettings();
    });

    $("#aboutDialogBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('i[data-toggle="tooltip"]').tooltip("hide");
    });

    $("#resetConfirmBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('i[data-toggle="tooltip"]').tooltip("hide");
    });

    $('span[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });
    
    $('i[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });

    $("#confirmReset").click(function() {
        resetSettings();
    });

    $("#versionExtension").text(extensionVersion);
    $("#updateBtn").attr("href", "http://www.eliastiksofts.com/page-shadow/update.php?v="+ extensionVersion);

    displaySettings();

    chrome.storage.onChanged.addListener(function() {
        displaySettings();
    });
});
