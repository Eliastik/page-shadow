/* Page Shadow
 *
 * Copyright (C) 2015-2022 Eliastik (eliastiksofts.com)
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
import $ from "jquery";
import i18next from "i18next";
import jqueryI18next from "jquery-i18next";
import { init_i18next } from "./locales.js";
import { toggleTheme } from "./util.js";

window.$ = $;
window.jQuery = $;

init_i18next("pageTest").then(() => translateContent());
toggleTheme(); // Toggle dark/light theme

function translateContent() {
    jqueryI18next.init(i18next, $, {
        handleName: "localize",
        selectorAttr: "data-i18n"
    });
    $("nav").localize();
    $(".container").localize();
}

i18next.on("languageChanged", () => {
    translateContent();
});

$(() => {
    $("#testOpenPopup").on("click", () => {
        window.open("about:blank", "test", "menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes");
    });
});