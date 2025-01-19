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
import { removeElementsFromArray } from "./commonUtils.js";
import { setSettingItem } from "./storageUtils.js";
import browser from "webextension-polyfill";
import DebugLogger from "../classes/debugLogger.js";

/** Utils function used for the enable/disable feature of Page Shadow */

const debugLogger = new DebugLogger();

function matchWebsite(needle, rule) {
    if(!rule.trim().startsWith("#")) {
        if(!rule.trim().startsWith("/") && !rule.trim().endsWith("/") && rule.indexOf("*") != -1) {
            rule = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&"); // Escape string for regex
            rule = rule.replaceAll(/(?<!\\)\*/g, "(.*)");
            rule = rule.replace(/\\\\\*/g, "\\*");
            rule = "/" + rule + "/";
        }

        if(rule.trim().startsWith("/") && rule.trim().endsWith("/")) {
            try {
                const regex = new RegExp(rule.substring(1, rule.length - 1), "gi");

                if(regex.test(needle)) {
                    return true;
                }
            } catch(e) {
                debugLogger.log(e, "error");
                return false;
            }
        } else if(needle == rule) {
            return true;
        }
    }

    return false;
}

function inArrayWebsite(needle, haystack) {
    for(const key in haystack) {
        if(matchWebsite(needle, haystack[key])) {
            return true;
        }
    }

    return false;
}

async function disableEnableToggle(type, checked, url) {
    const result = await browser.storage.local.get(["sitesInterditPageShadow", "whiteList"]);

    const { hostname, href } = url;

    let disabledWebsites = "";
    let match = hostname;
    let disabledWebsitesArray;

    if(result.sitesInterditPageShadow == undefined && result.sitesInterditPageShadow !== "") {
        disabledWebsitesArray = [];
    } else {
        disabledWebsites = result.sitesInterditPageShadow;
        disabledWebsitesArray = disabledWebsites.split("\n");
    }

    switch(type) {
    case "disable-website":
        match = hostname;
        break;
    case "disable-webpage":
        match = href;
        break;
    case "disable-globally":
        if(checked) {
            await setSettingItem("globallyEnable", "false");
        } else {
            await setSettingItem("globallyEnable", "true");
        }
        break;
    }

    if(type == "disable-website" || type == "disable-webpage") {
        let disabledWebsitesNew;

        if((checked && result.whiteList == "true") || (!checked && result.whiteList != "true")) {
            disabledWebsitesNew = removeElementsFromArray(disabledWebsitesArray, match);
            disabledWebsitesNew = commentMatched(disabledWebsitesNew, match);
            disabledWebsitesNew = removeElementsFromArray(disabledWebsitesNew, "").join("\n");

            await setSettingItem("sitesInterditPageShadow", disabledWebsitesNew.trim());
        } else if((!checked && result.whiteList == "true") || (checked && result.whiteList != "true")) {
            disabledWebsitesArray.push(match);
            disabledWebsitesNew = removeElementsFromArray(disabledWebsitesArray, "").join("\n");

            await setSettingItem("sitesInterditPageShadow", disabledWebsitesNew);
        }
    }

    return true;
}

function commentMatched(arr, website) {
    const res = [];

    for(const key in arr) {
        if(matchWebsite(website, arr[key])) {
            res.push("#" + arr[key]);
        } else {
            res.push(arr[key]);
        }
    }

    return res;
}

/** Function to know if the execution of Page Shadow is allowed for a page - return true if allowed, false if not */
async function pageShadowAllowed(url, settingsCache) {
    const result = settingsCache || await browser.storage.local.get(["sitesInterditPageShadow", "whiteList", "globallyEnable"]);

    if(result.globallyEnable !== "false") {
        let forbiddenWebsites = [];

        if(result.sitesInterditPageShadow !== undefined && result.sitesInterditPageShadow !== "") {
            forbiddenWebsites = result.sitesInterditPageShadow.trim().split("\n");
        }

        let websiteUrlTmp;

        try {
            websiteUrlTmp = new URL(url);
        } catch(e) {
            debugLogger.log(e, "error");
            return;
        }

        const domain = websiteUrlTmp.hostname;

        if((result.whiteList == "true" && (inArrayWebsite(domain, forbiddenWebsites) || inArrayWebsite(url, forbiddenWebsites))) || (result.whiteList !== "true" && !inArrayWebsite(domain, forbiddenWebsites) && !inArrayWebsite(url, forbiddenWebsites))) {
            return true;
        }
    }

    return false;
}

export { commentMatched, disableEnableToggle, inArrayWebsite, matchWebsite, pageShadowAllowed };