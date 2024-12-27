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
import { getPresetData } from "../utils/presetUtils.js";
import { nbPresets } from "../constants.js";
import DebugLogger from "./debugLogger.js";

export default class PresetCache {
    static instance = null;

    data = [];
    isInit = true;

    constructor() { // Singleton
        if(!PresetCache.instance) {
            PresetCache.instance = this;
            this.debugLogger = new DebugLogger();
        }

        return PresetCache.instance;
    }

    async updateCache() {
        this.data = [];

        for(let i = 1; i <= nbPresets; i++) {
            const presetData = await getPresetData(i);
            this.data[i] = presetData;
        }

        this.isInit = false;
        this.debugLogger?.log("PresetCache - Updated cache");

        return true;
    }

    resetCache() {
        this.data = [];
        this.debugLogger?.log("PresetCache - Reseted cache");
    }

    getPresetData(nb) {
        return this.data[nb];
    }

    getAllPresetsData() {
        return this.data;
    }
}