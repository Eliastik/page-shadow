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
import { settingsToLoad } from "../constants.js";
import browser from "webextension-polyfill";

/**
 * Class to keep settings in cache
 */
export default class SettingsCache {
    data = {};
    static instance = null;

    constructor() { // Singleton
        if(!SettingsCache.instance) {
            SettingsCache.instance = this;
            this.updateCache();
        }

        return SettingsCache.instance;
    }

    async updateCache() {
        this.data = await browser.storage.local.get(settingsToLoad);
    }

    resetCache() {
        this.data = [];
    }
}