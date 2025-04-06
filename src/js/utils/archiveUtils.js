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
import { quotaBytesPerItemMargin } from "../constants.js";
import browser from "webextension-polyfill";
import DebugLogger from "../classes/debugLogger.js";

/** Utils function used for the archive feature (backup of settings) of Page Shadow */

const debugLogger = new DebugLogger();

async function getSettingsToArchive() {
    const data = await browser.storage.local.get(null);

    try {
        data["ispageshadowarchive"] = "true";

        // Remove filter content
        const filters = data["filtersSettings"];

        filters.filters.forEach(filter => {
            filter.content = null;
            filter.lastUpdated = 0;
        });

        const dataStr = JSON.stringify(data);
        return dataStr;
    } catch(e) {
        debugLogger.log(e, "error");
        throw "";
    }
}

async function archiveCloud() {
    if (typeof browser.storage !== "undefined" && typeof browser.storage.sync !== "undefined") {
        try {
            const dataStr = await getSettingsToArchive();
            const dataObj = JSON.parse(dataStr);
            const currentStorage = await getCurrentArchiveCloud();

            const dateSettings = { "dateLastBackup": Date.now().toString() };
            const deviceSettings = { "deviceBackup": navigator.platform };

            const settingToSave = prepareDataForArchiveCloud(dataObj);

            try {
                await browser.storage.sync.clear();
                await browser.storage.sync.set(settingToSave);
            } catch(e) {
                // In case of error, restore the old cloud archive data
                await browser.storage.sync.clear();
                await browser.storage.sync.set(prepareDataForArchiveCloud(currentStorage));

                debugLogger.log(e, "error");

                if (e && (e.message.indexOf("QUOTA_BYTES_PER_ITEM") !== -1 || e.message.indexOf("QUOTA_BYTES") !== -1 || e.message.indexOf("QuotaExceededError") !== -1)) {
                    throw new Error("quota");
                } else {
                    throw new Error("standard");
                }
            }

            try {
                await Promise.all([
                    browser.storage.sync.set(dateSettings),
                    browser.storage.sync.set(deviceSettings),
                    browser.storage.sync.remove("pageShadowStorageBackup")
                ]);
            } catch(e) {
                debugLogger.log(e, "error");
                throw new Error("standard");
            }
        } catch(e) {
            debugLogger.log(e, "error");
            throw new Error(e.message);
        }
    } else {
        throw new Error("Browser storage is not supported");
    }
}

function getQuotaBytesPerItem() {
    return browser.storage.sync.QUOTA_BYTES_PER_ITEM || 8192;
}

function prepareDataForArchiveCloud(dataObj) {
    const settingToSave = {};

    for (const key in dataObj) {
        if (typeof key === "string" && Object.prototype.hasOwnProperty.call(dataObj, key)) {
            const value = dataObj[key];
            const valueSizeByte = lengthInUtf8Bytes(JSON.stringify(value));

            if (valueSizeByte > getQuotaBytesPerItem() - quotaBytesPerItemMargin) {
                const [type, chunks] = chunkValue(key, value);

                for (let i = 0; i < chunks.length; i++) {
                    settingToSave[`${key}_${i}_${type}`] = chunks[i];
                }
            } else {
                settingToSave[key] = value;
            }
        }
    }

    return settingToSave;
}

async function getCurrentArchiveCloud() {
    const dataSync = await browser.storage.sync.get(null);
    const restoredData = {};

    if (dataSync !== undefined) {
        Object.keys(dataSync).forEach(key => {
            if(key.includes("_")) {
                const originalKey = key.split("_")[0];
                const index = key.split("_")[1];
                const type = key.split("_")[2] || "string";

                if (!Array.isArray(restoredData[originalKey])) {
                    restoredData[originalKey] = [];
                }

                restoredData[originalKey][parseInt(index, 10)] = {
                    data: dataSync[key],
                    type
                };
            } else {
                restoredData[key] = dataSync[key];
            }
        });

        Object.keys(restoredData).forEach(key => {
            const valueChunks = restoredData[key];

            if(Array.isArray(valueChunks)) {
                const sortedIndices = Object.keys(valueChunks).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
                const { type } = restoredData[key][0];

                if(type === "string") {
                    restoredData[key] = sortedIndices.map(index => valueChunks[index].data).join("");
                } else {
                    const data = sortedIndices.map(index => valueChunks[index].data).join("");
                    restoredData[key] = JSON.parse(data);
                }
            }
        });
    }

    return restoredData;
}

function chunkString(key, str, type) {
    const chunks = [];
    const maxBytesPerItem = getQuotaBytesPerItem() - quotaBytesPerItemMargin;

    let i = 0;

    while (str.length > 0) {
        const finalKey = `${key}_${i++}_${type}`;
        const maxValueBytes = maxBytesPerItem - lengthInUtf8Bytes(finalKey);

        let counter = maxValueBytes;
        let segment = str.substr(0, counter);

        while (lengthInUtf8Bytes(JSON.stringify(segment)) > maxValueBytes) {
            segment = str.substr(0, --counter);
        }

        chunks.push(segment);
        str = str.substr(counter);
    }

    return chunks;
}

function chunkValue(key, value) {
    if(typeof value === "string") {
        return ["string", chunkString(key, value, "string")];
    }

    if(typeof value === "object") {
        const valueString = JSON.stringify(value);
        return ["object", chunkString(key, valueString, "object")];
    }

    throw new Error("Unsupported data type");
}

function lengthInUtf8Bytes(str) {
    return new TextEncoder().encode(str).length;
}

export { getSettingsToArchive, archiveCloud, prepareDataForArchiveCloud, getCurrentArchiveCloud, chunkString, chunkValue, lengthInUtf8Bytes };