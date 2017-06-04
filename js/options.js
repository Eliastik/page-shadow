/* translation */
i18next.use(window.i18nextBrowserLanguageDetector).use(window.i18nextXHRBackend).init({
    fallbackLng: 'en',
    ns: 'options',
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
function translateContent() {
    jqueryI18next.init(i18next, $, {
      handleName: 'localize',
      selectorAttr: 'data-i18n'
    });
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
$(document).ready(function() {
    $("#validerButton").click(function() {
        localStorage.setItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        $('span[data-toggle="tooltip"]').tooltip("hide");
        $('#saved').modal("show");
    });
    
    $("#aboutDialogBtn").click(function() {
        $('span[data-toggle="tooltip"]').tooltip("hide");
    });

    if(localStorage.getItem("sitesInterditPageShadow") != null) {
        $("#textareaAssomPage").val(localStorage.getItem("sitesInterditPageShadow"));
    }
    
    $('span[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });
});
