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
import { matchWebsite } from "./util.js";
import { defaultFilters, regexpDetectionPattern, availableFilterRulesType } from "./constants.js";
import browser from "webextension-polyfill";

let rules = [];
let performanceModeWebsites = [];
let performanceModeWebsitesDisabled = [];

async function openFiltersFiles() {
    const files = {};

    const result = await browser.storage.local.get(["filtersSettings", "customFilter"]);
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

    return files;
}

async function updateFilter(idFilter) {
    const result = await browser.storage.local.get("filtersSettings");
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

    return filterToUpdate;
}

async function updateAllFilters(autoUpdate) {
    const result = await browser.storage.local.get("filtersSettings");
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

    return true;
}

async function cleanAllFilters() {
    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
    const nbFilters = filters.filters.length;

    for(let i = 0; i < nbFilters; i++) {
        filters.filters[i].content = null;
        filters.filters[i].lastUpdated = 0;
    }

    setSettingItem("filtersSettings", filters);
    cacheFilters();

    return true;
}

async function updateOneFilter(idFilter) {
    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
    filters.filters[idFilter] = await updateFilter(idFilter);
    setSettingItem("filtersSettings", filters);
    cacheFilters();

    if(filters.filters[idFilter].hasError) {
        return false;
    } else {
        return true;
    }
}

async function toggleFilter(idFilter, enable) {
    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
    filters.filters[idFilter].enabled = enable;
    setSettingItem("filtersSettings", filters);
    cacheFilters();

    return true;
}

async function toggleAutoUpdate(enabled) {
    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
    filters.enableAutoUpdate = enabled;
    setSettingItem("filtersSettings", filters);
    cacheFilters();

    return true;
}

function parseLine(line) {
    if(line.length > 0) {
        const isRegexp = line.trim().match(regexpDetectionPattern);
        let website;

        if(isRegexp) {
            const lineSplitted = line.split(regexpDetectionPattern);
            const regexp = lineSplitted[1];
            website = "/" + regexp + "/";
            line = lineSplitted[3];
        }

        const parts = line.split("|");
        const lineTrimmed = line.trim();
        const isComment = lineTrimmed[0] == "#";

        if(!isRegexp) website = parts[0];
        const type = parts[1];
        const filter = parts[2];

        if(type && filter) {
            const filtersTypeRecognized = type.split(",").some(filterType => availableFilterRulesType.includes(filterType)); // Test if the filter types (rules) are recognized

            if(parts.length > 0 && !isComment && filtersTypeRecognized) {
                return { "website": website, "type": type, "filter": filter };
            }
        }
    }

    return null;
}

function parseFilter(filterContent) {
    const currentRules = [];

    if(filterContent) {
        const lines = filterContent.split("\n");

        for(const line of lines) {
            const parsed = parseLine(line);

            if(parsed) {
                currentRules.push(parsed);
            }
        }
    }

    return currentRules;
}

async function cacheFilters() {
    const newRules = [];
    const newRulesPerformanceMode = [];
    const newRulesPerformanceModeDisabled = [];
    const data = await openFiltersFiles();

    for(const key of Object.keys(data)) {
        const parsed = parseFilter(data[key]);

        for(const rule of parsed) {
            if(rule.type == "enablePerformanceMode") {
                newRulesPerformanceMode.push(rule.website);
            } else if(rule.type == "disablePerformanceMode") {
                newRulesPerformanceModeDisabled.push(rule.website);
            } else {
                newRules.push(rule);
            }
        }
    }

    rules = newRules;
    performanceModeWebsites = newRulesPerformanceMode;
    performanceModeWebsitesDisabled = newRulesPerformanceModeDisabled;
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
    if(!address || (address && address.trim() == "")) {
        throw "Empty error";
    }

    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

    if(filters && filters.filters) {
        for(let i = 0; i < filters.filters.length; i++) {
            if(filters.filters[i].sourceUrl == address) {
                throw "Already added error";
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
                    return true;
                }

                throw "Parsing error";
            }
        } catch(e) {
            throw "Fetch error";
        }
    }

    throw "Unknown error";
}

async function removeFilter(idFilter) {
    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

    if(filters && filters.filters) {
        filters.filters = filters.filters.filter((value, index) => index != idFilter);
        setSettingItem("filtersSettings", filters);
        cacheFilters();
    }

    return true;
}

async function getCustomFilter() {
    const result = await browser.storage.local.get("customFilter");
    const customFilterFilter = result.customFilter != null ? result.customFilter : "";
    return customFilterFilter;
}

async function updateCustomFilter(text) {
    const result = await browser.storage.local.get(["filtersSettings", "customFilter"]);
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

    return true;
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

    if(filterId != "customFilter") {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        filters.filters.forEach((filter, index) => {
            if(index == filterId) {
                const filterRules = parseFilter(filter.content);

                if(filterRules) {
                    ruleCount = filterRules.length;
                }
            }
        });
    } else {
        const result = await browser.storage.local.get("customFilter");
        const filterRules = parseFilter(result.customFilter);

        if(filterRules) {
            ruleCount = filterRules.length;
        }
    }

    return ruleCount;
}

async function reinstallDefaultFilters() {
    const newFilters = [];

    const result = await browser.storage.local.get("filtersSettings");
    const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

    for(const filter of defaultFilters.filters) {
        newFilters.push(filter);
    }

    for(const filter of filters.filters) {
        if(!filter.builtIn) newFilters.push(filter);
    }

    filters.filters = newFilters;

    setSettingItem("filtersSettings", filters);
    cacheFilters();

    return true;
}

function isPerformanceModeEnabledFor(url) {
    if(url && url.trim() != "") {
        const websuteUrl_tmp = new URL(url);
        const domain = websuteUrl_tmp.hostname;

        for(let i = 0, len = performanceModeWebsitesDisabled.length; i < len; i++) {
            const urlRule = performanceModeWebsitesDisabled[i];

            if(matchWebsite(domain, urlRule) || matchWebsite(url, urlRule)) {
                return false;
            }
        }

        for(let i = 0, len = performanceModeWebsites.length; i < len; i++) {
            const urlRule = performanceModeWebsites[i];

            if(matchWebsite(domain, urlRule) || matchWebsite(url, urlRule)) {
                return true;
            }
        }
    }

    return false;
}

function getNumberOfTotalRules() {
    return rules.length + performanceModeWebsites.length + performanceModeWebsitesDisabled.length;
}

async function getFiltersSize() {
    return await browser.storage.local.getBytesInUse(["filtersSettings", "customFilter"]);
}

cacheFilters();

export { openFiltersFiles, updateFilter, updateAllFilters, updateOneFilter, toggleFilter, cleanAllFilters, addFilter, removeFilter, toggleAutoUpdate, getCustomFilter, updateCustomFilter, getRules, getRulesForWebsite, getNumberOfRulesFor, reinstallDefaultFilters, isPerformanceModeEnabledFor, getNumberOfTotalRules, getFiltersSize };