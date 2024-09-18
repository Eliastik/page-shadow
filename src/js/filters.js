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
import { setSettingItem } from "./storage.js";
import { matchWebsite, getSizeObject } from "./utils/util.js";
import { defaultFilters, regexpDetectionPattern, availableFilterRulesType, filterSyntaxErrorTypes, specialFilterRules, ruleCategory } from "./constants.js";
import browser from "webextension-polyfill";
import { parseHTML } from "linkedom";

export default class FilterProcessor {
    static instance = null;

    rules = [];
    specialRules = []; // Special rules contains rules for adjusting Page Shadow internal processing (performance mode, etc.)
    isInit = true;

    constructor() { // Filter class is a Singleton
        if(!FilterProcessor.instance) {
            FilterProcessor.instance = this;
        } else {
            this.isInit = false;
        }

        return FilterProcessor.instance;
    }

    async openFiltersFiles() {
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

    async checkFilterNeedUpdate(idFilter, checkOnlyOnline) {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        const filter = filters.filters[idFilter];

        const expires = filter.expiresIn;
        const expiresMs = expires * 24 * 60 * 60 * 1000;
        const lastUpdate = filter.lastUpdated;
        const currentDate = Date.now();

        if(!filter.customFilter) {
            if(checkOnlyOnline || (!expires || (lastUpdate <= 0 || (currentDate - lastUpdate) >= expiresMs))) {
                try {
                    const data = await fetch(filter.sourceUrl, { method: "HEAD" });
                    const lastMod = data.headers.get("Last-Modified");
                    const lastModDate = new Date(lastMod).getTime();

                    if (lastUpdate >= lastModDate) {
                        return false;
                    }

                    return true;
                } catch(e) {
                    return false;
                }
            }
        }

        return false;
    }

    async checkAllFiltersNeedUpdate() {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        const filtersToUpdate = filters.filters;

        if (filtersToUpdate) {
            for (let i = 0; i < filtersToUpdate.length; i++) {
                if (!filtersToUpdate[i].needUpdate) {
                    filtersToUpdate[i].needUpdate = false;

                    if (await this.checkFilterNeedUpdate(i, true)) {
                        filtersToUpdate[i].needUpdate = true;
                    }
                }
            }

            await setSettingItem("filtersSettings", filters);
        }
    }

    async updateFilter(idFilter) {
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
                        const metadata = this.extractMetadata(text);

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
                            filterToUpdate.needUpdate = false;
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

    async updateAllFilters(autoUpdate, updateOnlyFailed) {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        const nbFilters = filters.filters.length;
        let updateHadErrors = false;

        for(let i = 0; i < nbFilters; i++) {
            const needUpdate = await this.checkFilterNeedUpdate(i);

            if(!autoUpdate || (autoUpdate && needUpdate) || (updateOnlyFailed && filters.filters[i].hasError)) {
                filters.filters[i] = await this.updateFilter(i);
                if(filters.filters[i].hasError) updateHadErrors = true;
            }
        }

        filters.lastUpdated = Date.now();

        if(updateHadErrors) {
            filters.lastFailedUpdate = Date.now();
        } else {
            filters.lastFailedUpdate = -1;
        }

        await setSettingItem("filtersSettings", filters);
        this.cacheFilters();

        return !updateHadErrors;
    }

    async cleanAllFilters() {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        const nbFilters = filters.filters.length;

        for(let i = 0; i < nbFilters; i++) {
            filters.filters[i].content = null;
            filters.filters[i].lastUpdated = 0;
            filters.filters[i].needUpdate = false;
        }

        await setSettingItem("filtersSettings", filters);
        this.cacheFilters();

        return true;
    }

    async updateOneFilter(idFilter) {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        filters.filters[idFilter] = await this.updateFilter(idFilter);
        await setSettingItem("filtersSettings", filters);
        this.cacheFilters();

        if(filters.filters[idFilter].hasError) {
            return false;
        } else {
            return true;
        }
    }

    async toggleFilter(idFilter, enable) {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        filters.filters[idFilter].enabled = enable;
        await setSettingItem("filtersSettings", filters);
        this.cacheFilters();

        return true;
    }

    async toggleAutoUpdate(enabled) {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;
        filters.enableAutoUpdate = enabled;
        await setSettingItem("filtersSettings", filters);
        this.cacheFilters();

        return true;
    }

    testRegexp(regexp) {
        try {
            "test".match(regexp);
        } catch(e) {
            return {
                "error": true,
                "cause": e.message
            };
        }

        return {
            "error": false
        };
    }

    testSelector(selector) {
        const { document } = parseHTML(`
            <!doctype html>
            <html lang="en">
              <head>
                <title>Test Selector</title>
              </head>
              <body>
                <div></div>
              </body>
            </html>`);

        try {
            document.querySelector(selector);
        } catch(e) {
            return {
                "error": true,
                "cause": e.message
            };
        }

        return {
            "error": false
        };
    }

    isSpecialRule(ruleType) {
        return !ruleType.split(",").some(filterType => availableFilterRulesType.includes(filterType) && !specialFilterRules.includes(filterType));
    }

    parseLine(line) {
        let errorType = filterSyntaxErrorTypes.EMPTY;
        let errorPart = "";
        let errorCode = "EMPTY";

        if(line.length > 0) {
            const isRegexp = line.trim().match(regexpDetectionPattern);
            let website;

            if(isRegexp) {
                const lineSplitted = line.split(regexpDetectionPattern);
                const regexp = lineSplitted[1];
                website = regexp;
                line = lineSplitted[3] + "" + lineSplitted[4];
                const regexpTest = this.testRegexp(regexp);

                if(regexpTest.error) {
                    return {
                        "error": true,
                        "type": filterSyntaxErrorTypes.INCORRECT_REGEXP,
                        "message": regexpTest.cause,
                        "linePart": website,
                        "errorCode": "INCORRECT_REGEXP"
                    };
                }
            }

            if(!line) return { "error": true, "type": filterSyntaxErrorTypes.UNKNOWN, "message": "", "errorCode": "UNKNOWN" };
            const parts = line.split("|");
            const lineTrimmed = line.trim();
            const isComment = lineTrimmed[0] == "#";

            if(isComment) {
                return null;
            }

            if(!isRegexp) website = parts[0];
            let type = parts[1];
            const filter = parts[2];

            if(type) {
                type = type.trim();
                const filtersTypeRecognized = type.split(",").some(filterType => availableFilterRulesType.includes(filterType)); // Test if the filter types (rules) are recognized
                const isFilterListWithoutCSSSelector = this.isSpecialRule(type);

                if(!isFilterListWithoutCSSSelector) {
                    if(filter) {
                        const isSelectorCorrect = this.testSelector(filter);

                        if(isSelectorCorrect && isSelectorCorrect.error) {
                            return {
                                "error": true,
                                "type": filterSyntaxErrorTypes.WRONG_CSS_SELECTOR,
                                "linePart": filter,
                                "errorCode": "WRONG_CSS_SELECTOR"
                            };
                        }
                    } else {
                        return {
                            "error": true,
                            "type": filterSyntaxErrorTypes.NO_FILTER,
                            "linePart": website + "|" + type + "|???",
                            "errorCode": "NO_FILTER"
                        };
                    }
                }

                if(parts.length > 0 && !isComment && filtersTypeRecognized) {
                    return { "website": website, "type": type, "filter": filter };
                } else {
                    if(!filtersTypeRecognized) {
                        errorType = filterSyntaxErrorTypes.UNKNOWN_TYPE;
                        errorPart = type;
                        errorCode = "UNKNOWN_TYPE";
                    } else if(parts.length <= 0) {
                        errorType = filterSyntaxErrorTypes.NO_TYPE;
                        errorPart = website + "|???";
                        errorCode = "NO_TYPE";
                    }
                }
            } else {
                errorType = filterSyntaxErrorTypes.NO_TYPE;
                errorPart = website + "|???";
                errorCode = "NO_TYPE";
            }
        }

        return { "error": true, "type": errorType, "message": "", "linePart": errorPart, "errorCode": errorCode };
    }

    parseFilter(filterContent) {
        const currentRules = [];
        const errorRules = [];

        if(filterContent) {
            const lines = filterContent.split("\n");
            let lineIndex = 1;

            for(const line of lines) {
                const parsed = this.parseLine(line);

                if(parsed) {
                    if(!parsed.error) {
                        currentRules.push(parsed);
                    } else {
                        if(!(parsed.type == filterSyntaxErrorTypes.EMPTY && lineIndex >= lines.length)) {
                            parsed.line = lineIndex;
                            errorRules.push(parsed);
                        }
                    }
                }

                lineIndex++;
            }
        }

        return {
            "rules": currentRules,
            "rulesWithError": errorRules
        };
    }

    async cacheFilters() {
        const newRules = [];
        const newSpecialRules = [];
        const data = await this.openFiltersFiles();

        for(const key of Object.keys(data)) {
            const parsed = this.parseFilter(data[key]).rules;

            for(const rule of parsed) {
                if(this.isSpecialRule(rule.type)) {
                    newSpecialRules.push(rule);
                } else {
                    newRules.push(rule);
                }
            }
        }

        this.rules = newRules;
        this.specialRules = newSpecialRules;
        this.isInit = false;
    }

    extractMetadataLine(line) {
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

    extractMetadata(text) {
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
                const parsed = this.extractMetadataLine(line);

                if(parsed && Object.keys(parsed).length > 0) {
                    const key = Object.keys(parsed)[0];
                    data[key] = parsed[key];
                }
            }
        }

        return data;
    }

    async addFilter(address) {
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
                    const metadata = this.extractMetadata(text);

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
                                "license": license,
                                "needUpdate": false
                            });
                        }

                        await setSettingItem("filtersSettings", filters);
                        return true;
                    }

                    throw "Parsing error";
                }
            } catch(e) {
                if(e === "Parsing error") throw e;
                throw "Fetch error";
            }
        }

        throw "Unknown error";
    }

    async removeFilter(idFilter) {
        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        if(filters && filters.filters) {
            filters.filters = filters.filters.filter((value, index) => index != idFilter);
            await setSettingItem("filtersSettings", filters);
            this.cacheFilters();
        }

        return true;
    }

    async getCustomFilter() {
        const result = await browser.storage.local.get("customFilter");
        const customFilterFilter = result.customFilter != null ? result.customFilter : "";
        return customFilterFilter;
    }

    async updateCustomFilter(text) {
        const result = await browser.storage.local.get(["filtersSettings", "customFilter"]);
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        if(filters && filters.filters) {
            filters.filters.forEach(filter => {
                if(filter.customFilter) {
                    filter.lastUpdated = Date.now();
                }
            });
        }

        await setSettingItem("customFilter", text);
        await setSettingItem("filtersSettings", filters);
        this.cacheFilters();

        return true;
    }

    getRules() {
        return this.rules;
    }

    getRulesForWebsite(url, type) {
        const rulesForWebsite = [];
        const rulesToCheck = type == ruleCategory.SPECIAL_RULES ? this.specialRules : this.rules;

        if(url && url.trim() != "") {
            let websuteUrl_tmp;

            try {
                websuteUrl_tmp = new URL(url);
            } catch(e) {
                return;
            }

            const domain = websuteUrl_tmp.hostname;

            for(let i = 0, len = rulesToCheck.length; i < len; i++) {
                const rule = rulesToCheck[i];

                if(matchWebsite(domain, rule.website) || matchWebsite(url, rule.website)) {
                    rulesForWebsite.push(rule);
                }
            }
        }

        return rulesForWebsite;
    }

    async getNumberOfRulesFor(filterId) {
        let ruleCount = 0;

        if(filterId != "customFilter") {
            const result = await browser.storage.local.get("filtersSettings");
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            filters.filters.forEach((filter, index) => {
                if(index == filterId) {
                    const filterRules = this.parseFilter(filter.content).rules;

                    if(filterRules) {
                        ruleCount = filterRules.length;
                    }
                }
            });
        } else {
            const result = await browser.storage.local.get("customFilter");
            const filterRules = this.parseFilter(result.customFilter).rules;

            if(filterRules) {
                ruleCount = filterRules.length;
            }
        }

        return ruleCount;
    }

    async getRulesErrors(filterId) {
        let filterErrors = [];

        if(filterId != "customFilter") {
            const result = await browser.storage.local.get("filtersSettings");
            const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

            filters.filters.forEach((filter, index) => {
                if(index == filterId) {
                    const filterRules = this.parseFilter(filter.content);

                    if(filterRules) {
                        filterErrors = filterRules.rulesWithError;
                    }
                }
            });
        } else {
            const result = await browser.storage.local.get("customFilter");
            const filterRules = this.parseFilter(result.customFilter);

            if(filterRules) {
                filterErrors = filterRules.rulesWithError;
            }
        }

        return filterErrors;
    }

    async reinstallDefaultFilters() {
        return this.updateDefaultFilters(true);
    }

    async updateDefaultFilters(updateAllFilters) {
        const newFilters = [];
        let filterUpdated = false;

        const result = await browser.storage.local.get("filtersSettings");
        const filters = result.filtersSettings != null ? result.filtersSettings : defaultFilters;

        for(const defaultFilter of defaultFilters.filters) {
            if(defaultFilter.builtIn) {
                let defaultFilterFound = false;

                for(const filter of filters.filters) {
                    if(defaultFilter.sourceUrl == filter.sourceUrl  && filter.builtIn && !updateAllFilters) {
                        newFilters.push(filter);
                        defaultFilterFound = true;
                        break;
                    }
                }

                if(!defaultFilterFound || updateAllFilters) {
                    newFilters.push(defaultFilter);
                    filterUpdated = true;
                }
            }
        }

        if(filters) {
            for(const customFilter of filters.filters) {
                if(!customFilter.builtIn) newFilters.push(customFilter);
            }
        }

        filters.filters = newFilters;

        await setSettingItem("filtersSettings", filters);

        if(filterUpdated) {
            this.updateAllFilters(false);
        }

        return true;
    }

    getNumberOfTotalRules() {
        return this.rules.length + this.specialRules.length;
    }

    async getFiltersSize() {
        if(browser.storage.local.getBytesInUse != undefined) {
            return await browser.storage.local.getBytesInUse(["filtersSettings", "customFilter"]);
        } else {
            return getSizeObject(await browser.storage.local.get(["filtersSettings", "customFilter"]));
        }
    }
}