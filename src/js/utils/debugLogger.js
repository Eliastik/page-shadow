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
import browser from "webextension-polyfill";

export default class DebugLogger {

    debugModeEnabled = false;

    constructor() {
        this.init();
    }

    async init() {
        const result = await browser.storage.local.get("advancedOptionsFiltersSettings");

        if (result.advancedOptionsFiltersSettings && result.advancedOptionsFiltersSettings.debugMode) {
            this.debugModeEnabled = true;
        }
    }

    log(message) {
        if (this.debugModeEnabled) {
            const timestamp = new Date().getTime();
            const pageURL = document.URL;

            console.debug(`[PAGE SHADOW DEBUG] - Timestamp: ${timestamp} / Page URL: ${pageURL}\nMessage: ${message}`);
        }
    }

}