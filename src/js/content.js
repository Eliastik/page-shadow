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
import { pageShadowAllowed, customTheme, getSettings, getCurrentURL, hasSettingsChanged } from "./util.js";
import { nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultWebsiteSpecialFiltersConfig } from "./constants.js";
import browser from "webextension-polyfill";

(function(){
    const style = document.createElement("style");
    style.type = "text/css";
    const lnkCustomTheme = document.createElement("link");
    const elementBrightnessWrapper = document.createElement("div");
    const elementBrightness = document.createElement("div");
    const websiteSpecialFiltersConfig = defaultWebsiteSpecialFiltersConfig;
    const runningInIframe = window !== window.top;
    let backgroundDetectionAlreadyProcessedNodes = [];

    let timeoutApplyBrightness, timeoutApplyContrast, timeoutApplyInvertColors, timeoutApplyDetectBackgrounds;
    let backgroundDetected = false;
    let precEnabled = false;
    let started = false;
    let filtersCache = null;
    let mut_contrast, mut_backgrounds, mut_brightness, mut_invert;
    let typeProcess = "";
    let precUrl;
    let currentSettings = null;
    let newSettingsToApply = null;

    // Contants
    const TYPE_RESET = "reset";
    const TYPE_ALL = "all";
    const TYPE_ONLY_CONTRAST = "onlyContrast";
    const TYPE_ONLY_INVERT = "onlyInvert";
    const TYPE_ONLY_BRIGHTNESS = "onlyBrightness";
    const TYPE_ONLY_RESET = "onlyreset";
    const MUTATION_TYPE_CONTRAST = "contrast";
    const MUTATION_TYPE_INVERT = "invert";
    const MUTATION_TYPE_BRIGHTNESS = "brightness";
    const MUTATION_TYPE_BACKGROUNDS = "backgrounds";
    const TYPE_LOADING = "loading";
    const TYPE_START = "start";

    function contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) {
        if(pageShadowEnabled != undefined && pageShadowEnabled == "true") {
            if(theme != undefined) {
                if(theme == "1") {
                    document.body.classList.add("pageShadowContrastBlack");
                    document.getElementsByTagName("html")[0].classList.add("pageShadowBackgroundContrast");
                } else if(theme.startsWith("custom")) {
                    customThemeApply(theme);
                    document.body.classList.add("pageShadowContrastBlackCustom");
                    document.getElementsByTagName("html")[0].classList.add("pageShadowBackgroundCustom");
                } else {
                    document.body.classList.add("pageShadowContrastBlack" + theme);
                    document.getElementsByTagName("html")[0].classList.add("pageShadowBackgroundContrast" + theme);
                }
            } else {
                document.body.classList.add("pageShadowContrastBlack");
                document.getElementsByTagName("html")[0].classList.add("pageShadowBackgroundContrast");
            }

            if(disableImgBgColor != undefined && disableImgBgColor == "true") {
                document.body.classList.add("pageShadowDisableImgBgColor");
            }
        }

        invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);

        if(document.readyState == "complete" || document.readyState == "interactive") {
            mutationObserve(MUTATION_TYPE_CONTRAST);
        } else {
            window.addEventListener("load", () => {
                mutationObserve(MUTATION_TYPE_CONTRAST);
            });
        }

        if(typeof timeoutApplyContrast !== "undefined") {
            clearTimeout(timeoutApplyContrast);
        }
    }

    function customThemeApply(theme) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            customTheme(theme.replace("custom", ""), style, false, lnkCustomTheme);
        }
    }

    function invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) {
        document.body.classList.remove("pageShadowInvertImageColor");
        document.body.classList.remove("pageShadowInvertVideoColor");
        document.body.classList.remove("pageShadowInvertBgColor");
        document.getElementsByTagName("html")[0].classList.remove("pageShadowInvertEntirePage");
        document.getElementsByTagName("html")[0].classList.remove("pageShadowBackground");

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                document.body.classList.add("pageShadowInvertImageColor");
                document.body.classList.add("pageShadowInvertVideoColor");
                document.body.classList.add("pageShadowInvertBgColor");
                document.getElementsByTagName("html")[0].classList.add("pageShadowInvertEntirePage");
                document.getElementsByTagName("html")[0].classList.add("pageShadowBackground");

                if(invertImageColors != null && invertImageColors == "true") {
                    document.body.classList.remove("pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors == "true") {
                    document.body.classList.remove("pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    document.body.classList.remove("pageShadowInvertVideoColor");
                }
            } else {
                if(invertImageColors != null && invertImageColors == "true") {
                    document.body.classList.add("pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors != "false") {
                    document.body.classList.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    document.body.classList.add("pageShadowInvertVideoColor");
                }
            }

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve(MUTATION_TYPE_INVERT);
            } else {
                window.addEventListener("load", () => {
                    mutationObserve(MUTATION_TYPE_INVERT);
                });
            }
        }

        if(typeof timeoutApplyInvertColors !== "undefined") {
            clearTimeout(timeoutApplyInvertColors);
        }
    }

    function detectBackground(tagName) {
        if(!websiteSpecialFiltersConfig.performanceModeEnabled) {
            const elements = Array.prototype.slice.call(document.body.getElementsByTagName(tagName));

            for(let i = 0, len = elements.length; i < len; i++) {
                detectBackgroundForElement(elements[i]);
            }
        }

        document.body.classList.add("pageShadowBackgroundDetected");
        mutationObserve(MUTATION_TYPE_BACKGROUNDS);
        backgroundDetected = true;
    }

    function elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg) {
        if(!backgroundColor) return true;

        const isRgbaColor = backgroundColor.trim().startsWith("rgba");
        const isWhiteRgbaColor = backgroundColor.trim().startsWith("rgba(0, 0, 0");
        const alpha = isRgbaColor ? parseFloat(backgroundColor.split(",")[3]) : -1;
        const hasBackgroundImageValue = backgroundImage && (backgroundImage.trim().toLowerCase() != "none" && backgroundImage.trim() != "");
        const hasNoBackgroundColorValue = backgroundColor && (backgroundColor.trim().toLowerCase().indexOf("transparent") != -1 || backgroundColor.trim().toLowerCase() == "none" || backgroundColor.trim() == "");

        return (hasNoBackgroundColorValue || isWhiteRgbaColor || (isRgbaColor && alpha < websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold)) && !hasBackgroundImg && !hasBackgroundImageValue;
    }

    function detectBackgroundForElement(element) {
        if(!element || element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected") || backgroundDetectionAlreadyProcessedNodes.indexOf(element) !== -1) {
            return;
        }

        element.classList.add("pageShadowDisableStyling");

        const computedStyle = window.getComputedStyle(element, null);
        const background = computedStyle.getPropertyValue("background");
        const backgroundColor = computedStyle.getPropertyValue("background-color");
        const backgroundImage = computedStyle.getPropertyValue("background-image");

        const hasBackgroundImg = background.trim().substr(0, 4).toLowerCase().includes("url(") || backgroundImage.trim().substr(0, 4).toLowerCase() == "url(";
        const hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");
        const hasTransparentBackgroundClass = element.classList.contains("pageShadowHasTransparentBackground");

        if(hasBackgroundImg && !hasClassImg) {
            element.classList.add("pageShadowHasBackgroundImg");
        }

        if(websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled) {
            const hasTransparentBackground = elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg);

            if(hasTransparentBackground && !hasTransparentBackgroundClass) {
                element.classList.add("pageShadowHasTransparentBackground");
            }
        }

        backgroundDetectionAlreadyProcessedNodes.push(element);
        element.classList.remove("pageShadowDisableStyling");
    }

    function applyDetectBackground(type, elements) {
        if(backgroundDetected) return false;

        if(document.readyState === "complete") {
            setTimeout(() => waitAndApplyDetectBackgrounds(elements), 1); // detect for all the elements of the page
        } else {
            if(type == TYPE_LOADING) {
                window.addEventListener("load", () => {
                    // when the page is entirely loaded
                    if(document.readyState === "complete") {
                        setTimeout(() => waitAndApplyDetectBackgrounds(elements), 250); // detect for all the elements of the page after 250 ms
                    }
                });
            } else {
                applyDetectBackground(TYPE_LOADING, elements);
            }
        }
    }

    function brightnessPage(enabled, percentage, nightmode, colorTemp) {
        elementBrightness.setAttribute("class", "");

        if(enabled == "true" && !runningInIframe) {
            elementBrightness.style.display = "block";
            if(nightmode == "true") {
                elementBrightness.setAttribute("id", "pageShadowLuminositeDivNightMode");
                elementBrightness.setAttribute("class", "");

                let tempColor = "2000";

                if(colorTemp != undefined) {
                    const tempIndex = parseInt(colorTemp);
                    tempColor = colorTemperaturesAvailable[tempIndex - 1];

                    elementBrightness.setAttribute("class", "k" + tempColor);
                } else {
                    elementBrightness.setAttribute("class", "k2000");
                }
            } else {
                elementBrightness.setAttribute("id", "pageShadowLuminositeDiv");
            }

            if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                elementBrightness.style.opacity = brightnessDefaultValue;
            } else {
                elementBrightness.style.opacity = percentage / 100;
            }

            waitAndApplyBrightnessPage(elementBrightness, elementBrightnessWrapper);

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve(MUTATION_TYPE_BRIGHTNESS);
            } else {
                window.addEventListener("load", () => {
                    mutationObserve(MUTATION_TYPE_BRIGHTNESS);
                });
            }
        }
    }

    function appendBrightnessElement(elementBrightness, elementWrapper) {
        if(document.getElementById("pageShadowLuminositeDiv") !== null && document.body.contains(elementWrapper)) {
            elementWrapper.removeChild(document.getElementById("pageShadowLuminositeDiv"));
        }

        if(document.getElementById("pageShadowLuminositeDivNightMode") !== null && document.body.contains(elementWrapper)) {
            elementWrapper.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
        }

        document.body.appendChild(elementWrapper);
        elementWrapper.appendChild(elementBrightness);

        if(typeof timeoutApplyBrightness !== "undefined") {
            clearTimeout(timeoutApplyBrightness);
        }
    }

    function waitAndApplyBrightnessPage(element, wrapper) {
        if(document.body) return appendBrightnessElement(element, wrapper);
        timeoutApplyBrightness = setTimeout(() => waitAndApplyBrightnessPage(element, wrapper), 50);
    }

    function waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) {
        if(document.body) return contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors);
        timeoutApplyContrast = setTimeout(() => waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors), 50);
    }

    function waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) {
        if(document.body) return invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
        timeoutApplyInvertColors = setTimeout(() => waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors), 50);
    }

    function waitAndApplyDetectBackgrounds(tagName) {
        if(document.body) return detectBackground(tagName);
        timeoutApplyDetectBackgrounds = setTimeout(() => waitAndApplyDetectBackgrounds(tagName), 50);
    }

    function mutationObserve(type) {
        if(type == MUTATION_TYPE_CONTRAST) {
            if(typeof mut_contrast !== "undefined") mut_contrast.disconnect();

            mut_contrast = new MutationObserver(mutations => {
                mut_contrast.disconnect();
                const classList = document.body.classList;
                let containsPageContrast = true;

                for(let i = 1; i <= nbThemes; i++) {
                    if(i == "1" && !classList.contains("pageShadowContrastBlack")) {
                        containsPageContrast = false;
                    } else if(!classList.contains("pageShadowContrastBlack" + i)) {
                        containsPageContrast = false;
                    }
                }

                mutations.forEach((mutation) => {
                    if(mutation.type == "attributes" && mutation.attributeName == "class") {
                        const classList = document.body.classList;

                        if(mutation.oldValue.indexOf("pageShadowDisableImgBgColor") !== -1 && !classList.contains("pageShadowDisableImgBgColor")) {
                            containsPageContrast = false;
                        }
                    }
                });

                if(!containsPageContrast) {
                    setTimeout(() => main(TYPE_ONLY_CONTRAST, MUTATION_TYPE_CONTRAST), 1);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve(MUTATION_TYPE_CONTRAST);
                    } else {
                        window.addEventListener("load", () => {
                            mutationObserve(MUTATION_TYPE_CONTRAST);
                        });
                    }
                }
            });

            mut_contrast.observe(document.body, {
                "attributes": true,
                "subtree": false,
                "childList": false,
                "characterData": false,
                "attributeOldValue": true,
                "attributeFilter": ["class"]
            });
        } else if(type == MUTATION_TYPE_INVERT) {
            if(typeof mut_invert !== "undefined") mut_invert.disconnect();

            mut_invert = new MutationObserver(mutations => {
                mut_invert.disconnect();

                function reMutObserveInvert() {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve(MUTATION_TYPE_INVERT);
                    } else {
                        window.addEventListener("load", () => {
                            mutationObserve(MUTATION_TYPE_INVERT);
                        });
                    }
                }

                mutations.forEach((mutation) => {
                    if(mutation.type == "attributes" && mutation.attributeName == "class") {
                        const classList = document.body.classList;

                        if(mutation.oldValue.indexOf("pageShadowInvertImageColor") !== -1 && !classList.contains("pageShadowInvertImageColor")) {
                            setTimeout(() => main(TYPE_ONLY_INVERT, MUTATION_TYPE_INVERT), 1);
                        } else if(mutation.oldValue.indexOf("pageShadowInvertVideoColor") !== -1 && !classList.contains("pageShadowInvertVideoColor")) {
                            setTimeout(() => main(TYPE_ONLY_INVERT, MUTATION_TYPE_INVERT), 1);
                        } else if(mutation.oldValue.indexOf("pageShadowInvertBgColor") !== -1 && !classList.contains("pageShadowInvertBgColor")) {
                            setTimeout(() => main(TYPE_ONLY_INVERT, MUTATION_TYPE_INVERT), 1);
                        } else {
                            reMutObserveInvert();
                        }
                    } else {
                        reMutObserveInvert();
                    }
                });
            });

            mut_invert.observe(document.body, {
                "attributes": true,
                "subtree": false,
                "childList": false,
                "characterData": false,
                "attributeOldValue": true,
                "attributeFilter": ["class"]
            });
        } else if(type == MUTATION_TYPE_BRIGHTNESS) {
            if(typeof mut_brightness !== "undefined") mut_brightness.disconnect();

            mut_brightness = new MutationObserver(mutations => {
                mut_brightness.disconnect();
                const brightness = document.getElementById("pageShadowLuminositeDiv");
                const nightmode = document.getElementById("pageShadowLuminositeDivNightMode");

                mutations.forEach(mutation => {
                    if((!document.body.contains(brightness) && !document.body.contains(nightmode)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                        setTimeout(() => main(TYPE_ONLY_BRIGHTNESS, MUTATION_TYPE_BRIGHTNESS), 1);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            mutationObserve(MUTATION_TYPE_BRIGHTNESS);
                        } else {
                            window.addEventListener("load", () => {
                                mutationObserve(MUTATION_TYPE_BRIGHTNESS);
                            });
                        }
                    }
                });
            });

            mut_brightness.observe(elementBrightnessWrapper, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false
            });
        } else if(type == MUTATION_TYPE_BACKGROUNDS) {
            mut_backgrounds = new MutationObserver(async(mutations) => {
                mutations.forEach(mutation => {
                    if(mutation.type == "childList") {
                        for(let i = 0, len = mutation.addedNodes.length; i < len; i++) {
                            if(!websiteSpecialFiltersConfig.performanceModeEnabled) mutationElementsBackgrounds(mutation.addedNodes[i], null, null);
                            doProcessFilters(filtersCache, mutation.addedNodes[i]);
                        }
                    } else if(mutation.type == "attributes") {
                        if(!websiteSpecialFiltersConfig.performanceModeEnabled) mutationElementsBackgrounds(mutation.target, mutation.attributeName, mutation.oldValue);
                        doProcessFilters(filtersCache, mutation.target);
                    }
                });
            });

            mut_backgrounds.observe(document.body, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false,
                "attributeFilter": ["class", "style"],
                "attributeOldValue": true
            });
        }
    }

    function mutationElementsBackgrounds(element, attribute, attributeOldValue) {
        if(!element || !element.classList || element == document.body) {
            return false;
        }

        if(attribute && (!websiteSpecialFiltersConfig.enableMutationObserverAttributes || (attribute.toLowerCase() == "class" && !websiteSpecialFiltersConfig.enableMutationObserverClass)
            || (attribute.toLowerCase() == "style" && !websiteSpecialFiltersConfig.enableMutationObserverStyle))) {
            return false;
        }

        if(attribute == "class" && attributeOldValue !== null) {
            if(attributeOldValue.indexOf("pageShadowDisableStyling") !== -1) {
                return false;
            }

            if((attributeOldValue.indexOf("pageShadowHasTransparentBackground") !== -1 && !element.classList.contains("pageShadowHasTransparentBackground")) ||
                (attributeOldValue.indexOf("pageShadowHasBackgroundImg") !== -1 && !element.classList.contains("pageShadowHasBackgroundImg"))) {
                backgroundDetectionAlreadyProcessedNodes = backgroundDetectionAlreadyProcessedNodes.filter(node => node != element);
            }
        }

        document.body.classList.remove("pageShadowBackgroundDetected");

        detectBackgroundForElement(element);

        // Detect element childrens
        if(!attribute && websiteSpecialFiltersConfig.enableMutationObserversForSubChilds) {
            if(element.getElementsByTagName) {
                const elementChildrens = element.getElementsByTagName("*");

                if(elementChildrens && elementChildrens.length > 0) {
                    for(let i = 0, len = elementChildrens.length; i < len; i++) {
                        detectBackgroundForElement(elementChildrens[i]);
                    }
                }
            }
        }

        document.body.classList.add("pageShadowBackgroundDetected");
    }

    async function updateFilters() {
        const settings = newSettingsToApply || await getSettings(getCurrentURL());
        if(filtersCache == null) {
            browser.runtime.sendMessage({
                "type": "getFiltersForThisWebsite"
            });
        } else {
            if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true") doProcessFilters(filtersCache);
        }
    }

    function doProcessFilters(filters, element) {
        if(!filters) return;

        for(const filter of filters) {
            const selector = filter.filter;
            const filterTypes = filter.type.split(",");
            let elements;

            try {
                elements = (element ? [element] : document.body.querySelectorAll(selector));
            } catch(e) {
                continue; // Continue to next filter if selector is not valid
            }

            if(element) {
                if(!filterTypes.includes("disableShadowRootsCustomStyle")) {
                    try {
                        if(element.matches && !element.matches(selector)) {
                            elements = [];
                        }
                    } catch(e) {
                        continue;
                    }
                }

                if(element.getElementsByTagName) {
                    const elementChildrens = element.getElementsByTagName("*");

                    if(elementChildrens && elementChildrens.length > 0) {
                        for(let i = 0, len = elementChildrens.length; i < len; i++) {
                            const childrenElement = elementChildrens[i];

                            try {
                                if(childrenElement.matches && childrenElement.matches(selector)) {
                                    elements.push(childrenElement);
                                }
                            } catch(e) {
                                break;
                            }
                        }
                    }
                }
            }

            for(let i = 0, len = elements.length; i < len; i++) {
                const element = elements[i];

                if(element && element.classList) {
                    filterTypes.forEach(filterType => {
                        switch(filterType) {
                        case "disableContrastFor":
                            if(!element.classList.contains("pageShadowElementDisabled")) element.classList.add("pageShadowElementDisabled");
                            break;
                        case "forceTransparentBackground":
                            if(!element.classList.contains("pageShadowElementForceTransparentBackground")) element.classList.add("pageShadowElementForceTransparentBackground");
                            break;
                        case "disableBackgroundStylingFor":
                            if(!element.classList.contains("pageShadowDisableBackgroundStyling")) element.classList.add("pageShadowDisableBackgroundStyling");
                            break;
                        case "disableTextColorStylingFor":
                            if(!element.classList.contains("pageShadowDisableColorStyling")) element.classList.add("pageShadowDisableColorStyling");
                            break;
                        case "disableInputBorderStylingFor":
                            if(!element.classList.contains("pageShadowDisableInputBorderStyling")) element.classList.add("pageShadowDisableInputBorderStyling");
                            break;
                        case "forceInputBorderStylingFor":
                            if(!element.classList.contains("pageShadowForceInputBorderStyling")) element.classList.add("pageShadowForceInputBorderStyling");
                            break;
                        case "disableLinkStylingFor":
                            if(!element.classList.contains("pageShadowDisableLinkStyling")) element.classList.add("pageShadowDisableLinkStyling");
                            break;
                        case "disableFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowDisableFontFamilyStyling")) element.classList.add("pageShadowDisableFontFamilyStyling");
                            break;
                        case "forceFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowForceFontFamilyStyling")) element.classList.add("pageShadowForceFontFamilyStyling");
                            break;
                        case "disableElementInvertFor":
                            if(!element.classList.contains("pageShadowDisableElementInvert")) element.classList.add("pageShadowDisableElementInvert");
                            break;
                        case "hasBackgroundImg":
                            if(!element.classList.contains("pageShadowHasBackgroundImg")) element.classList.add("pageShadowHasBackgroundImg");
                            break;
                        case "forceCustomLinkColorFor":
                            if(!element.classList.contains("pageShadowForceCustomLinkColor")) element.classList.add("pageShadowForceCustomLinkColor");
                            break;
                        case "forceCustomBackgroundColorFor":
                            if(!element.classList.contains("pageShadowForceCustomBackgroundColor")) element.classList.add("pageShadowForceCustomBackgroundColor");
                            break;
                        case "forceCustomTextColorFor":
                            if(!element.classList.contains("pageShadowForceCustomTextColor")) element.classList.add("pageShadowForceCustomTextColor");
                            break;
                        case "forceCustomVisitedLinkColor":
                            if(!element.classList.contains("pageShadowForceCustomVisitedLinkColor")) element.classList.add("pageShadowForceCustomVisitedLinkColor");
                            break;
                        case "disableCustomVisitedLinkColor":
                            if(!element.classList.contains("pageShadowDisableCustomVisitedLinkColor")) element.classList.add("pageShadowDisableCustomVisitedLinkColor");
                            break;
                        case "forceCustomLinkColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomLinkColorAsBackground")) element.classList.add("pageShadowForceCustomLinkColorAsBackground");
                            break;
                        case "forceCustomTextColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomTextColorAsBackground")) element.classList.add("pageShadowForceCustomTextColorAsBackground");
                            break;
                        case "forceCustomLinkVisitedColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomLinkVisitedColorAsBackground")) element.classList.add("pageShadowForceCustomLinkVisitedColorAsBackground");
                            break;
                        case "disableShadowRootsCustomStyle":
                            if(element.shadowRoot != null) processShadowRoot(element);
                            break;
                        }
                    });
                }
            }
        }
    }

    function processShadowRoot(element) {
        if(element.shadowRoot != null) {
            const elements = element.shadowRoot.querySelectorAll("*");

            elements.forEach(element => {
                const hasClass = element.classList.contains("pageShadowIsShadowRootElement");

                if(!hasClass) {
                    element.classList.add("pageShadowIsShadowRootElement");
                    element.style.color = "inherit";
                }

                processShadowRoot(element);
            });
        }
    }

    function main(type, mutation) {
        precUrl = getCurrentURL();

        if(type == TYPE_RESET || type == TYPE_ONLY_RESET) {
            mutation = TYPE_ALL;
        }

        if(mutation == null) mutation = "none";

        if(typeof timeoutApplyBrightness !== "undefined") clearTimeout(timeoutApplyBrightness);
        if(typeof timeoutApplyContrast !== "undefined") clearTimeout(timeoutApplyContrast);
        if(typeof timeoutApplyInvertColors !== "undefined") clearTimeout(timeoutApplyInvertColors);
        if(typeof timeoutApplyDetectBackgrounds !== "undefined") clearTimeout(timeoutApplyDetectBackgrounds);
        if(typeof mut_contrast !== "undefined" && (mutation == MUTATION_TYPE_CONTRAST || mutation == TYPE_ALL)) mut_contrast.disconnect();
        if(typeof mut_invert !== "undefined" && (mutation == MUTATION_TYPE_INVERT || mutation == TYPE_ALL)) mut_invert.disconnect();
        if(typeof mut_brightness !== "undefined" && (mutation == MUTATION_TYPE_BRIGHTNESS || mutation == TYPE_ALL)) mut_brightness.disconnect();
        if(typeof lnkCustomTheme !== "undefined") lnkCustomTheme.setAttribute("href", "");

        if(started && (type == TYPE_RESET || type == TYPE_ONLY_RESET)) {
            document.body.classList.remove("pageShadowInvertImageColor");
            document.getElementsByTagName("html")[0].classList.remove("pageShadowInvertEntirePage");
            document.body.classList.remove("pageShadowInvertVideoColor");
            document.getElementsByTagName("html")[0].classList.remove("pageShadowBackground");
            document.getElementsByTagName("html")[0].classList.remove("pageShadowBackgroundCustom");
            document.body.classList.remove("pageShadowContrastBlackCustom");
            document.body.classList.remove("pageShadowDisableImgBgColor");
            document.body.classList.remove("pageShadowInvertBgColor");

            for(let i = 1; i <= nbThemes; i++) {
                if(i == 1) {
                    document.body.classList.remove("pageShadowContrastBlack");
                    document.getElementsByTagName("html")[0].classList.remove("pageShadowBackgroundContrast");
                } else {
                    document.body.classList.remove("pageShadowContrastBlack" + i);
                    document.getElementsByTagName("html")[0].classList.remove("pageShadowBackgroundContrast" + i);
                }
            }

            if(document.getElementById("pageShadowLuminositeDiv") != null && document.body.contains(elementBrightnessWrapper)) {
                elementBrightnessWrapper.removeChild(document.getElementById("pageShadowLuminositeDiv"));
            }

            if(document.getElementById("pageShadowLuminositeDivNightMode") != null && document.body.contains(elementBrightnessWrapper)) {
                elementBrightnessWrapper.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
            }

            if(type == TYPE_ONLY_RESET) {
                return;
            }
        }

        typeProcess = type;

        browser.runtime.sendMessage({
            "type": "getSpecialRules"
        });
    }

    async function process(allowed, type) {
        if(allowed) {
            const settings = newSettingsToApply || await getSettings(getCurrentURL());
            currentSettings = settings;
            precEnabled = true;

            if(type == TYPE_ONLY_CONTRAST) {
                contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.colorTemp, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor);
            } else if(type == TYPE_ONLY_INVERT) {
                invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor);
            } else if(type == TYPE_ONLY_BRIGHTNESS) {
                brightnessPage(settings.pageLumEnabled, settings.pourcentageLum, settings.nightModeEnabled, settings.colorTemp);
            } else if(settings.pageShadowEnabled == "true") {
                waitAndApplyContrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.colorTemp, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor);
            } else {
                waitAndApplyInvertColors(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor);
            }

            if(type !== TYPE_ONLY_CONTRAST && type !== TYPE_ONLY_INVERT && type !== TYPE_ONLY_BRIGHTNESS) {
                brightnessPage(settings.pageLumEnabled, settings.pourcentageLum, settings.nightModeEnabled, settings.colorTemp);

                if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true") {
                    if(type == TYPE_START) {
                        applyDetectBackground(TYPE_LOADING, "*");
                    } else {
                        applyDetectBackground(null, "*");
                    }
                }

                if(document.readyState == "complete") {
                    updateFilters();
                } else {
                    window.addEventListener("load", () => {
                        updateFilters();
                    });
                }
            }
        } else {
            precEnabled = false;
        }

        started = true;
    }

    main(TYPE_START);

    browser.storage.onChanged.addListener(() => {
        applyIfSettingsChanged(false, true);
    });

    // Message/response handling
    browser.runtime.onMessage.addListener(async(message) => {
        if(message) {
            switch(message.type) {
            case "getFiltersResponse": {
                if(message.filters) {
                    filtersCache = message.filters;
                    const settings = newSettingsToApply || await getSettings(getCurrentURL());
                    if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true") doProcessFilters(message.filters);
                }
                break;
            }
            case "applySettingsChangedResponse": {
                const changed = hasEnabledStateChanged(message.enabled);

                if(changed || hasSettingsChanged(currentSettings, message.settings)) {
                    precEnabled = message.enabled;
                    main(TYPE_RESET, TYPE_ALL);
                }
                break;
            }
            case "isEnabledForThisPageResponse": {
                if(message.enabled) {
                    newSettingsToApply = message.settings;
                }

                process(message.enabled, typeProcess);
                break;
            }
            case "getSpecialRulesResponse": {
                const specialRules = message.filters;

                specialRules.forEach(rule => {
                    if(rule.type == "enablePerformanceMode") websiteSpecialFiltersConfig.performanceModeEnabled = true;
                    if(rule.type == "disablePerformanceMode") websiteSpecialFiltersConfig.performanceModeEnabled = false;
                    if(rule.type == "enableTransparentBackgroundAutoDetect") websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = true;
                    if(rule.type == "disableTransparentBackgroundAutoDetect") websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = false;
                    if(rule.type == "enableMutationObserversForSubChilds") websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = true;
                    if(rule.type == "disableMutationObserversForSubChilds") websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = false;
                    if(rule.type == "opacityDetectedAsTransparentThreshold") websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold = rule.filter;
                    if(rule.type == "enableMutationObserverAttributes") websiteSpecialFiltersConfig.enableMutationObserverAttributes = true;
                    if(rule.type == "disableMutationObserverAttributes") websiteSpecialFiltersConfig.enableMutationObserverAttributes = false;
                    if(rule.type == "enableMutationObserverClass") websiteSpecialFiltersConfig.enableMutationObserverClass = true;
                    if(rule.type == "disableMutationObserverClass") websiteSpecialFiltersConfig.enableMutationObserverClass = false;
                    if(rule.type == "enableMutationObserverStyle") websiteSpecialFiltersConfig.enableMutationObserverStyle = true;
                    if(rule.type == "disableMutationObserverStyle") websiteSpecialFiltersConfig.enableMutationObserverStyle = false;
                });

                if(runningInIframe) {
                    browser.runtime.sendMessage({
                        "type": "isEnabledForThisPage"
                    });
                } else {
                    const allowed = await pageShadowAllowed(getCurrentURL());
                    process(allowed, typeProcess);
                }
                break;
            }
            case "websiteUrlUpdated": { // Execute when the page URL changes in Single Page Applications
                const changed = hasEnabledStateChanged(message.enabled);
                const urlUpdated = precUrl != getCurrentURL();

                if(urlUpdated) {
                    backgroundDetected = false;
                    precUrl = getCurrentURL();
                    filtersCache = null;
                    updateFilters();
                }

                if(changed) {
                    applyIfSettingsChanged(true, message.storageChanged, message.enabled);
                }

                break;
            }
            }
        }
    });

    function hasEnabledStateChanged(isEnabled) {
        return started && ((isEnabled&& !precEnabled) || (!isEnabled && precEnabled));
    }

    async function applyIfSettingsChanged(statusChanged, storageChanged, isEnabled) {
        const result = await browser.storage.local.get("liveSettings");
        const isLiveSettings = result.liveSettings !== "false";

        if(statusChanged && ((!isLiveSettings && !storageChanged) || isLiveSettings)) {
            precEnabled = isEnabled;
            return main(TYPE_RESET, TYPE_ALL);
        }

        if(isLiveSettings && storageChanged) {
            if(runningInIframe) {
                browser.runtime.sendMessage({
                    "type": "applySettingsChanged"
                });
            } else {
                if(hasSettingsChanged(currentSettings, await getSettings(getCurrentURL()))) {
                    precEnabled = isEnabled;
                    main(TYPE_RESET, TYPE_ALL);
                }
            }
        }
    }
}());