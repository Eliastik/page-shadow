/* Page Shadow
 *
 * Copyright (C) 2015-2019 Eliastik (eliastiksofts.com)
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
    fallbackLng: ["en", "fr"],
    ns: "pageTest",
    load: "languageOnly",
    defaultNS: "pageTest",
    detection: {
        order: ["localStorage", "navigator"],
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage"],
    },
    backend: {
        loadPath: "/_locales/{{lng}}/{{ns}}.json",
    },
}, function(err, t) {
    translateContent();
});
function translateContent() {
    jqueryI18next.init(i18next, $, {
        handleName: "localize",
        selectorAttr: "data-i18n"
    });
    $("nav").localize();
    $(".container").localize();
}
function changeLng(lng) {
    i18next.changeLanguage(lng);
}
i18next.on("languageChanged", () => {
    translateContent();
});
