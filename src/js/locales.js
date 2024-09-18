/* Page Shadow
 *
 * Copyright (C) 2015-2024 Eliastik (eliastiksofts.com)
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
import i18next from "i18next";
import i18nextBrowserLanguageDetector from "i18next-browser-languagedetector";

function init_i18next(ns) {
    return new Promise(resolve => {
        i18next.use(i18nextBrowserLanguageDetector).init({
            fallbackLng: ["en", "fr"],
            ns: ns,
            load: "languageOnly",
            defaultNS: ns,
            detection: {
                order: ["localStorage", "navigator"],
                lookupLocalStorage: "i18nextLng",
                caches: ["localStorage"],
            },
            backend: {
                loadPath: "/_locales/{{lng}}/{{ns}}.json",
            },
        }, () => {
            resolve();
        });
    });
}

export { init_i18next };