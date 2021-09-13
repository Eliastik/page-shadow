/* Page Shadow
 *
 * Copyright (C) 2015-2021 Eliastik (eliastiksofts.com)
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
import { setSettingItem } from "./storage.js";
import { defaultFilters } from "./util.js";

let rules = [];

function openFiltersFiles() {
    const files = {};

    return new Promise(resolve => {
        chrome.storage.local.get("filtersSettings", result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            filters.filters.forEach(filter => {
                if(filter.content != null && filter.enabled) {
                    files[filter.sourceUrl] = filter.content;
                }
            });

            resolve(files);
        });
    });
}

function updateFilter(idFilter) {
    return new Promise(resolve => {
        chrome.storage.local.get("filtersSettings", async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            const filterToUpdate = filters.filters[idFilter];
    
            if(!filterToUpdate.customFilter) {
                try {
                    const data = await fetch(filterToUpdate.sourceUrl);
    
                    if(!data.ok) {
                        filterToUpdate.hasError = true;
                    } else {
                        try {
                            const text = await data.text();
                            
                            filterToUpdate.content = text;
                            filterToUpdate.hasError = false;
                            filterToUpdate.lastUpdated = Date.now();
                        } catch(error2) {
                            filterToUpdate.hasError = true;
                        }
                    }
                } catch(error) {
                    filterToUpdate.hasError = true;
                }
            }
    
            resolve(filterToUpdate);
        });
    });
}

async function updateAllFilters() {
    return new Promise(resolve => {
        chrome.storage.local.get("filtersSettings", async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            const nbFilters = filters.filters.length;

            for(let i = 0; i < nbFilters; i++) {
                filters.filters[i] = await updateFilter(i);
            }

            filters.lastUpdated = Date.now();
            setSettingItem("filtersSettings", filters);
            resolve(true);
        });
    });
}

async function cleanAllFilters() {
    return new Promise(resolve => {
        chrome.storage.local.get("filtersSettings", async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            const nbFilters = filters.filters.length;

            for(let i = 0; i < nbFilters; i++) {
                filters.filters[i].content = null;
                filters.filters[i].lastUpdated = 0;
            }

            setSettingItem("filtersSettings", filters);
            resolve(true);
        });
    });
}

async function updateOneFilter(idFilter) {
    return new Promise(resolve => {
        chrome.storage.local.get("filtersSettings", async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            filters.filters[idFilter] = await updateFilter(idFilter);
            setSettingItem("filtersSettings", filters);
            resolve(true);
        });
    });
}

async function toggleFilter(idFilter, enable) {
    return new Promise(resolve => {
        chrome.storage.local.get("filtersSettings", result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            filters.filters[idFilter].enabled = enable;
            setSettingItem("filtersSettings", filters);
            resolve(true);
        });
    });
}

function parseLine(line) {
    if(line.length > 0) {
        const parts = line.split("|");
        const lineTrimmed = line.trim();
        const isComment = lineTrimmed[0] == "#";
    
        if(parts.length > 0 && !isComment) {
            const website = parts[0];
            const type = parts[1];
            const filter = parts[2];
    
            return { "website": website, "type": type, "filter": filter };
        }
    }

    return null;
}

async function cacheFilters() {
    rules = [];
    const data = await openFiltersFiles();
    
    for(const key of Object.keys(data)) {
        const lines = data[key].split("\n");

        for(const line of lines) {
            const parsed = parseLine(line);

            if(parsed) {
                rules.push(parsed);
            }
        }
    }
}

function extractMetadataLine(line) {
    if(line) {
        const lineTrimmed = line.trim();

        if(lineTrimmed && lineTrimmed.startsWith("#!")) {
            const data = line.split("#!")[1];
            const lineSplitted = data.split(/:(.+)/);

            if(lineSplitted && lineSplitted.length >= 2) {
                const dataObject = {};
                dataObject[lineSplitted[0].trim().toLowerCase()] = lineSplitted[1].trim();
                return dataObject;
            }
        }
    }

    return null;
}

function extractMetadata(text) {
    const lines = text.split("\n");
    const data = {};

    if(lines) {
        if(lines[0]) {
            const splitted = lines[0].split("#!");
            const isPageShadowFilter = splitted && splitted.length >= 2 && splitted[1].trim().toLowerCase().startsWith("page shadow filter");

            if(!isPageShadowFilter) {
                return null;
            }
        }

        for(const line of lines) {
            const parsed = extractMetadataLine(line);
    
            if(parsed && Object.keys(parsed).length > 0) {
                const key = Object.keys(parsed)[0];
                data[key] = parsed[key];
            }
        }
    }

    return data;
}

async function addFilter(address) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get("filtersSettings", async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            if(filters && filters.filters) {
                for(let i = 0; i < filters.filters.length; i++) {
                    if(filters.filters[i].sourceUrl == address) {
                        reject("Already added error");
                    }
                }
    
                try {
                    const data = await fetch(address);
        
                    if(data) {
                        const text = await data.text();
                        const metadata = extractMetadata(text);
    
                        if(metadata) {
                            const name = metadata["name"];
                            const sourcename = metadata["sourcename"];
                            const homepage = metadata["homepage"];
    
                            if(name != null && sourcename != null) {
                                filters.filters.push({
                                    "filterName": name,
                                    "sourceName": sourcename,
                                    "sourceUrl": address,
                                    "lastUpdated": 0,
                                    "enabled": true,
                                    "hasError": false,
                                    "local": false,
                                    "homepage": homepage,
                                    "builtIn": false,
                                    "content": null
                                });
                            }
    
                            setSettingItem("filtersSettings", filters);
                            resolve();
                        }
                        
                        reject("Parsing error");
                    }
                } catch(e) {
                    reject("Fetch error");
                }
            }
            
            reject("Unknown error");
        });
    });
}

if(typeof(chrome.runtime) !== "undefined" && typeof(chrome.runtime.onMessage) !== "undefined") {
    chrome.runtime.onMessage.addListener(async(message, sender, sendMessage) => {
        if(message && message.type == "getAllFilters") {
            await cacheFilters();
            sendMessage({ type: "getAllFiltersResponse", filters: rules });
        }

        return true;
    });
}

export { openFiltersFiles, updateFilter, updateAllFilters, updateOneFilter, toggleFilter, cleanAllFilters, addFilter };