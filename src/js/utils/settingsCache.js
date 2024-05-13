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
import { settingsToLoad, customThemesKey } from "../constants.js";
import browser from "webextension-polyfill";

/**
 * Class to keep settings in cache
 */
export default class SettingsCache {
    static instance = null;

    data = {};
    customThemes = {};
    isInit = true;

    constructor() { // Singleton
        if(!SettingsCache.instance) {
            SettingsCache.instance = this;
        } else {
            this.isInit = false;
        }

        return SettingsCache.instance;
    }

    async updateCache() {
        this.data = await browser.storage.local.get(settingsToLoad);
        this.customThemes = await browser.storage.local.get(customThemesKey);
        this.isInit = false;
    }

    resetCache() {
        this.data = {};
        this.customThemes = {};
    }
}