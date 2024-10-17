/* eslint-disable no-console */
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

    log(message, type = "debug") {
        if (this.debugModeEnabled) {
            const timestamp = new Date().getTime();
            const pageURL = document.URL;

            const stack = new Error().stack.split("\n");
            const link = this.getStackLink(stack, 3);
            const link2 = this.getStackLink(stack, 2);

            const log = `[PAGE SHADOW ${type.toUpperCase()}] - Timestamp: ${timestamp} / Page URL: ${pageURL}\nMessage: ${message}\nCaller: ${link} > ${link2}`;

            switch(type) {
            case "debug":
                console.debug(log);
                break;
            case "error":
                console.error(log);
                break;
            case "warn":
                console.warn(log);
                break;
            }
        }
    }

    getStackLink(stack, index) {
        const stackLine = stack[index].trim();

        const match = stackLine.match(/\((.*):(\d+):(\d+)\)/);
        let link = "";

        if (match) {
            const file = match[1];
            const line = match[2];
            const column = match[3];
            link = `${file}:${line}:${column}`;
        }

        return link;
    }
}