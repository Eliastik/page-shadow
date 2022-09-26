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
import { getPresetData } from "./util.js";
import { nbPresets } from "../constants.js";

export default class PresetCache {
    static instance = null;

    data = [];
    isInit = true;

    constructor() { // Singleton
        if(!PresetCache.instance) {
            PresetCache.instance = this;
        } else {
            this.isInit = false;
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

        return true;
    }

    resetCache() {
        this.data = [];
    }

    getPresetData(nb) {
        return this.data[nb];
    }

    getAllPresetsData() {
        return this.data;
    }
}