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
import { defaultFilters, matchWebsite } from "./util.js";
import browser from "webextension-polyfill";

let rules = [];

function openFiltersFiles() {
    const files = {};

    return new Promise(resolve => {
        browser.storage.local.get(["filtersSettings", "customFilter"]).then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            const customFilter = result.customFilter != null ? result.customFilter : "";

            filters.filters.forEach(filter => {
                if(filter.enabled) {
                    if(filter.customFilter) {
                        files["customFilter"] = customFilter;
                    } else if(filter.content != null) {
                        files[filter.sourceUrl] = filter.content;
                    }
                }
            });

            resolve(files);
        });
    });
}

function updateFilter(idFilter) {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(async(result) => {
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
                            const metadata = extractMetadata(text);

                            if(metadata) {
                                const name = metadata["name"];
                                const sourcename = metadata["sourcename"];
                                const homepage = metadata["homepage"];
                                const expires = metadata["expires"];
                                const description = metadata["description"];
                                const version = metadata["version"];
                                const license = metadata["license"];
                                
                                if(name != null) filterToUpdate.filterName = name;
                                if(sourcename != null) filterToUpdate.sourceName = sourcename;
                                if(homepage != null) filterToUpdate.homepage = homepage;
                                if(expires != null) filterToUpdate.expiresIn = expires;
                                if(description != null) filterToUpdate.description = description;
                                if(version != null) filterToUpdate.version = version;
                                if(license != null) filterToUpdate.license = license;
                                
                                filterToUpdate.content = text;
                                filterToUpdate.hasError = false;
                                filterToUpdate.lastUpdated = Date.now();
                            } else {
                                filterToUpdate.hasError = true;
                            }
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

async function updateAllFilters(autoUpdate) {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            const nbFilters = filters.filters.length;

            for(let i = 0; i < nbFilters; i++) {
                const filter = filters.filters[i];
                const expires = filter.expiresIn;
                const expiresMs = expires * 24 * 60 * 60 * 1000;
                const lastUpdate = filter.lastUpdated;
                const currentDate = Date.now();

                if(!autoUpdate || (autoUpdate && (!expires || (lastUpdate <= 0 || (currentDate - lastUpdate) >= expiresMs)))) {
                    filters.filters[i] = await updateFilter(i);
                }
            }

            filters.lastUpdated = Date.now();
            setSettingItem("filtersSettings", filters);
            cacheFilters();
            resolve(true);
        });
    });
}

async function cleanAllFilters() {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            const nbFilters = filters.filters.length;

            for(let i = 0; i < nbFilters; i++) {
                filters.filters[i].content = null;
                filters.filters[i].lastUpdated = 0;
            }

            setSettingItem("filtersSettings", filters);
            cacheFilters();
            resolve(true);
        });
    });
}

async function updateOneFilter(idFilter) {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            filters.filters[idFilter] = await updateFilter(idFilter);
            setSettingItem("filtersSettings", filters);
            cacheFilters();
            if(filters.filters[idFilter].hasError) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function toggleFilter(idFilter, enable) {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            filters.filters[idFilter].enabled = enable;
            setSettingItem("filtersSettings", filters);
            cacheFilters();
            resolve(true);
        });
    });
}

async function toggleAutoUpdate(enabled) {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
            filters.enableAutoUpdate = enabled;
            setSettingItem("filtersSettings", filters);
            cacheFilters();
            resolve(true);
        });
    });
}

function parseLine(line) {
    if(line.length > 0) {
        const isRegexp = line.trim().startsWith("/");
        let website;

        if(isRegexp) {
            const lineSplitted = line.split("/");
            const regexp = lineSplitted[1];
            website = "/" + regexp + "/";
            line = lineSplitted[2];
        }
        
        const parts = line.split("|");
        const lineTrimmed = line.trim();
        const isComment = lineTrimmed[0] == "#";

        if(!isRegexp) website = parts[0];
        const type = parts[1];
        const filter = parts[2];
    
        if(parts.length > 0 && !isComment) {
            return { "website": website, "type": type, "filter": filter };
        }
    }

    return null;
}

function parseFilter(filterContent) {
    const currentRules = [];
    const lines = filterContent.split("\n");

    for(const line of lines) {
        const parsed = parseLine(line);

        if(parsed) {
            currentRules.push(parsed);
        }
    }

    return currentRules;
}

async function cacheFilters() {
    const newRules = [];
    const data = await openFiltersFiles();
    
    for(const key of Object.keys(data)) {
        newRules.push(...parseFilter(data[key]));
    }

    rules = newRules;
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
        if(!address || (address && address.trim() == "")) {
            return reject("Empty error");
        }

        browser.storage.local.get("filtersSettings").then(async(result) => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            if(filters && filters.filters) {
                for(let i = 0; i < filters.filters.length; i++) {
                    if(filters.filters[i].sourceUrl == address) {
                        return reject("Already added error");
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
                            const expires = metadata["expires"];
                            const description = metadata["description"];
                            const version = metadata["version"];
                            const license = metadata["license"];
    
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
                                    "content": null,
                                    "description": description,
                                    "expiresIn": expires,
                                    "version": version,
                                    "license": license
                                });
                            }
    
                            setSettingItem("filtersSettings", filters);
                            return resolve();
                        }
                        
                        return reject("Parsing error");
                    }
                } catch(e) {
                    return reject("Fetch error");
                }
            }
            
            return reject("Unknown error");
        });
    });
}

async function removeFilter(idFilter) {
    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            if(filters && filters.filters) {
                filters.filters = filters.filters.filter((value, index) => index != idFilter);
                setSettingItem("filtersSettings", filters);
                cacheFilters();
            }

            resolve();
        });
    });
}

async function getCustomFilter() {
    return new Promise(resolve => {
        browser.storage.local.get("customFilter").then(result => {
            const customFilterFilter = result.customFilter != null ? result.customFilter : "";
            resolve(customFilterFilter);
        });
    });
}

async function updateCustomFilter(text) {
    return new Promise(resolve => {
        browser.storage.local.get(["filtersSettings", "customFilter"]).then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            if(filters && filters.filters) {
                filters.filters.forEach(filter => {
                    if(filter.customFilter) {
                        filter.lastUpdated = Date.now();
                    }
                });
            }

            setSettingItem("customFilter", text);
            setSettingItem("filtersSettings", filters);
            cacheFilters();
            resolve();
        });
    });
}

function getRules() {
    return rules;
}

function getRulesForWebsite(url) {
    const rulesForWebsite = [];

    if(url && url.trim() != "") {
        const websuteUrl_tmp = new URL(url);
        const domain = websuteUrl_tmp.hostname;
    
        for(let i = 0, len = rules.length; i < len; i++) {
            const rule = rules[i];
    
            if(matchWebsite(domain, rule.website) || matchWebsite(url, rule.website)) {
                rulesForWebsite.push(rule);
            }
        }
    }

    return rulesForWebsite;
}

async function getNumberOfRulesFor(filterId) {
    let ruleCount = 0;

    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            filters.filters.forEach((filter, index) => {
                if(index == filterId) {
                    const filterRules = parseFilter(filter.content);

                    if(filterRules) {
                        ruleCount = filterRules.length;
                    }
                }
            });

            resolve(ruleCount);
        });
    });
}

async function reinstallDefaultFilters() {
    const newFilters = [];

    return new Promise(resolve => {
        browser.storage.local.get("filtersSettings").then(result => {
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            for(const filter of defaultFilters.filters) {
                newFilters.push(filter);
            }

            for(const filter of filters.filters) {
                if(!filter.builtIn) newFilters.push(filter);
            }
            
            filters.filters = newFilters;
            setSettingItem("filtersSettings", filters);
            resolve(true);
        });
    });
}

cacheFilters();

export { openFiltersFiles, updateFilter, updateAllFilters, updateOneFilter, toggleFilter, cleanAllFilters, addFilter, removeFilter, toggleAutoUpdate, getCustomFilter, updateCustomFilter, getRules, getRulesForWebsite, getNumberOfRulesFor, reinstallDefaultFilters };