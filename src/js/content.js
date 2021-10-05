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
import { pageShadowAllowed, customTheme, nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue } from "./util.js";
import browser from "webextension-polyfill";

(function(){
    const style = document.createElement("style");
    style.type = "text/css";
    const lnkCustomTheme = document.createElement("link");
    let backgroundDetected = 0;
    let timeOutLum, timeOutAP, timeOutIC, timeOutBI;
    const elementBrightnessWrapper = document.createElement("div");
    const elementBrightness = document.createElement("div");
    let precEnabled = false;
    let started = false;
    const runningInIframe = window !== window.top;
    let filtersCache = null;
    let mut_contrast, mut_backgrounds, mut_brightness, mut_invert;
    let typeProcess = "";
    let precUrl;

    // Contants
    const TYPE_RESET = "reset";
    const TYPE_ALL = "all";
    const TYPE_ONLY_CONTRAST = "onlyContrast";
    const TYPE_ONLY_INVERT = "onlyInvert";
    const TYPE_ONLY_BRIGHTNESS = "onlyBrightness";
    const TYPE_ONLY_RESET = "onlyreset";
    const TYPE_CONTRAST = "contrast";
    const TYPE_INVERT = "invert";
    const TYPE_BRIGHTNESS = "brightness";
    const TYPE_LOADING = "loading";

    function contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) {
        if(pageShadowEnabled != undefined && pageShadowEnabled == "true") {
            if(theme != undefined) {
                if(theme == "1") {
                    document.body.classList.add("pageShadowContrastBlack");
                    document.getElementsByTagName("html")[0].classList.add("pageShadowBackgroundContrast");
                } else if(theme.startsWith("custom")) {
                    customThemeApply();
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
            mutationObserve(TYPE_CONTRAST);
        } else {
            window.addEventListener("load", () => {
                mutationObserve(TYPE_CONTRAST);
            });
        }

        if(typeof timeOutAP !== "undefined") {
            clearTimeout(timeOutAP);
        }
    }

    function customThemeApply() {
        browser.storage.local.get("theme").then(result => {
            if(result.theme != undefined && typeof(result.theme) == "string" && result.theme.startsWith("custom")) {
                customTheme(result.theme.replace("custom", ""), style, false, lnkCustomTheme);
            }
        });
    }

    function invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) {
        document.body.classList.remove("pageShadowInvertImageColor");
        document.getElementsByTagName("html")[0].classList.remove("pageShadowInvertEntirePage");
        document.body.classList.remove("pageShadowInvertVideoColor");
        document.body.classList.remove("pageShadowInvertBgColor");
        document.getElementsByTagName("html")[0].classList.remove("pageShadowBackground");

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                document.getElementsByTagName("html")[0].classList.add("pageShadowInvertEntirePage");
                document.getElementsByTagName("html")[0].classList.add("pageShadowBackground");

                if(invertImageColors !== null && invertImageColors == "true") {
                    document.body.classList.remove("pageShadowInvertImageColor");
                } else {
                    document.body.classList.add("pageShadowInvertImageColor");
                }

                if(invertBgColors !== "false") {
                    document.body.classList.remove("pageShadowInvertBgColor");
                } else {
                    document.body.classList.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors !== null && invertVideoColors == "true") {
                    document.body.classList.remove("pageShadowInvertVideoColor");
                } else {
                    document.body.classList.add("pageShadowInvertVideoColor");
                }
            } else {
                if(invertImageColors !== null && invertImageColors == "true") {
                    document.body.classList.add("pageShadowInvertImageColor");
                }

                if(invertBgColors !== "false") {
                    document.body.classList.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors !== null && invertVideoColors == "true") {
                    document.body.classList.add("pageShadowInvertVideoColor");
                }
            }

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve(TYPE_INVERT);
            } else {
                window.addEventListener("load", () => {
                    mutationObserve(TYPE_INVERT);
                });
            }
        }

        if(typeof timeOutIC !== "undefined") {
            clearTimeout(timeOutIC);
        }
    }

    function detectBackground(tagName, add, type) {
        const elements = document.body.getElementsByTagName(tagName);
        let computedStyle = null;

        if(backgroundDetected <= 0) {
            document.body.classList.add("pageShadowBackgroundDetected");
        }

        for(let i = 0; i < elements.length; i++) {
            elements[i].classList.add("pageShadowDisableStyling");
            computedStyle = window.getComputedStyle(elements[i], null);

            if(type == 1 || type == 3 || type == "image" || typeof type === "undefined") {
                const hasBackgroundImg = computedStyle.getPropertyValue("background").substr(0, 4) == "url(" || computedStyle.getPropertyValue("background-image").substr(0, 4) == "url(";
                const hasClassImg = elements[i].classList.contains("pageShadowHasBackgroundImg");
                const hasElementHidden = elements[i].contains(elements[i].querySelector("canvas")) || elements[i].contains(elements[i].querySelector("video"));

                if(hasBackgroundImg && !hasClassImg) {
                    elements[i].classList.add("pageShadowHasBackgroundImg");
                }

                if(hasElementHidden) {
                    elements[i].classList.add("pageShadowHasHiddenElement");
                }
            }

            if(type == 2 || type == 3 || type == "color") {
                const hasBackgroundColor = computedStyle.getPropertyValue("background-image").substr(0, 4) !== "url(" && computedStyle.getPropertyValue("background-color") !== "" && computedStyle.getPropertyValue("background-color").substr(0, 4) !== "none";
                const hasClass = elements[i].classList.contains("pageShadowHasBackgroundColor");

                if(hasBackgroundColor && !hasClass) {
                    elements[i].classList.add("pageShadowHasBackgroundColor");
                }
            }

            elements[i].classList.remove("pageShadowDisableStyling");
        }

        if(backgroundDetected <= 0) {
            mutationObserve("backgrounds");
        }

        if(typeof add !== "undefined") {
            backgroundDetected += add;
        }
    }

    function applyDetectBackground(type, element, add, detectType) {
        if(backgroundDetected > 2) {
            return false;
        }

        if(type == TYPE_LOADING) {
            document.onreadystatechange = function() {
                // when the DOM is ready
                if(document.readyState === "interactive") {
                    setTimeout(() => waitAndApplyDetectBackground(element, add, detectType), 1); // detect for all the elements of the page
                }
                // when the page is entirely loaded
                if(document.readyState === "complete") {
                    setTimeout(() => waitAndApplyDetectBackground(element, add, detectType), 1500); // detect for all the elements of the page after 1500 ms
                }
            };
        } else {
            if(document.readyState === "complete") {
                setTimeout(() => waitAndApplyDetectBackground(element, add, detectType), 1); // detect for all the elements of the page
            } else {
                applyDetectBackground(TYPE_LOADING, element, add, detectType);
            }
        }
    }

    function brightnessPage(enabled, pourcentage, nightmode, colorTemp) {
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

            if(pourcentage / 100 > maxBrightnessPercentage || pourcentage / 100 < minBrightnessPercentage || typeof pourcentage === "undefined" || pourcentage == null) {
                elementBrightness.style.opacity = brightnessDefaultValue;
            } else {
                elementBrightness.style.opacity = pourcentage / 100;
            }

            waitAndApplyBrightnessPage(elementBrightness, elementBrightnessWrapper);

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve(TYPE_BRIGHTNESS);
            } else {
                window.addEventListener("load", () => {
                    mutationObserve(TYPE_BRIGHTNESS);
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

        if(typeof timeOutLum !== "undefined") {
            clearTimeout(timeOutLum);
        }
    }

    function waitAndApplyBrightnessPage(element, wrapper) {
        if(document.body) return appendBrightnessElement(element, wrapper);
        timeOutLum = setTimeout(() => waitAndApplyBrightnessPage(element, wrapper), 50);
    }

    function waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) {
        if(document.body) return contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors);
        timeOutAP = setTimeout(() => waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors), 50);
    }

    function waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) {
        if(document.body) return invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
        timeOutIC = setTimeout(() => waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors), 50);
    }

    function waitAndApplyDetectBackground(tagName, add, type) {
        if(document.body) return detectBackground(tagName, add, type);
        timeOutBI = setTimeout(() => waitAndApplyDetectBackground(tagName, add, type), 50);
    }

    function mutationObserve(type) {
        if(type == TYPE_CONTRAST) {
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
                    setTimeout(() => main(TYPE_ONLY_CONTRAST, TYPE_CONTRAST), 1);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve(TYPE_CONTRAST);
                    } else {
                        window.addEventListener("load", () => {
                            mutationObserve(TYPE_CONTRAST);
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
        } else if(type == TYPE_INVERT) {
            if(typeof mut_invert !== "undefined") mut_invert.disconnect();

            mut_invert = new MutationObserver(mutations => {
                mut_invert.disconnect();

                function reMutObserveInvert() {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve(TYPE_INVERT);
                    } else {
                        window.addEventListener("load", () => {
                            mutationObserve(TYPE_INVERT);
                        });
                    }
                }

                mutations.forEach((mutation) => {
                    if(mutation.type == "attributes" && mutation.attributeName == "class") {
                        const classList = document.body.classList;

                        if(mutation.oldValue.indexOf("pageShadowInvertImageColor") !== -1 && !classList.contains("pageShadowInvertImageColor")) {
                            setTimeout(() => main(TYPE_ONLY_INVERT, TYPE_INVERT), 1);
                        } else if(mutation.oldValue.indexOf("pageShadowInvertVideoColor") !== -1 && !classList.contains("pageShadowInvertVideoColor")) {
                            setTimeout(() => main(TYPE_ONLY_INVERT, TYPE_INVERT), 1);
                        } else if(mutation.oldValue.indexOf("pageShadowInvertBgColor") !== -1 && !classList.contains("pageShadowInvertBgColor")) {
                            setTimeout(() => main(TYPE_ONLY_INVERT, TYPE_INVERT), 1);
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
        } else if(type == TYPE_BRIGHTNESS) {
            if(typeof mut_brightness !== "undefined") mut_brightness.disconnect();

            mut_brightness = new MutationObserver(mutations => {
                mut_brightness.disconnect();
                const brightness = document.getElementById("pageShadowLuminositeDiv");
                const nightmode = document.getElementById("pageShadowLuminositeDivNightMode");

                mutations.forEach(mutation => {
                    if((!document.body.contains(brightness) && !document.body.contains(nightmode)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                        setTimeout(() => main(TYPE_ONLY_BRIGHTNESS, TYPE_BRIGHTNESS), 1);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            mutationObserve(TYPE_BRIGHTNESS);
                        } else {
                            window.addEventListener("load", () => {
                                mutationObserve(TYPE_BRIGHTNESS);
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
        } else if(type == "backgrounds") {
            mut_backgrounds = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if(mutation.type == "childList") {
                        for(let i = 0; i < mutation.addedNodes.length; i++) {
                            mutationElementsBackgrounds(mutation.addedNodes[i], null, null);
                            doProcessFilters(filtersCache, mutation.addedNodes[i]);
                        }
                    } else if(mutation.type == "attributes") {
                        mutationElementsBackgrounds(mutation.target, mutation.attributeName, mutation.oldValue);
                        doProcessFilters(filtersCache, mutation.target);
                    }
                });
            });

            mut_backgrounds.observe(document.body, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false,
                "attributeFilter": ["class"]
            });
        }
    }

    function mutationElementsBackgrounds(element, attribute, attributeOldValue) {
        if(typeof(element.classList) === "undefined" || element.classList == null || attribute == "class") {
            return false;
        }

        if(element.classList.contains("pageShadowHasBackgroundImg") || element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected")) {
            return false;
        }

        if(attributeOldValue !== null && attributeOldValue.indexOf("pageShadowDisableStyling") !== -1) {
            return false;
        }

        element.classList.add("pageShadowDisableStyling");

        const computedStyle = window.getComputedStyle(element, null);
        const hasBackgroundImg = computedStyle.getPropertyValue("background").trim().substr(0, 4).toLowerCase() == "url(" || computedStyle.getPropertyValue("background-image").trim().substr(0, 4).toLowerCase() == "url(";
        const hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");
        const hasElementHidden = element.contains(element.querySelector("canvas")) || element.contains(element.querySelector("video"));

        if(hasBackgroundImg && !hasClassImg) {
            element.classList.add("pageShadowHasBackgroundImg");
        }

        if(hasElementHidden) {
            element.classList.add("pageShadowHasHiddenElement");
        }

        element.classList.remove("pageShadowDisableStyling");
    }

    function updateFilters() {
        if(filtersCache == null) {
            browser.runtime.sendMessage({
                "type": "getFiltersForThisWebsite"
            });
        } else {
            doProcessFilters(filtersCache);
        }
    }

    function doProcessFilters(filters, element) {
        if(!filters) return;
        
        filters.forEach(filter => {
            const selector = filter.filter;
            const filterTypes = filter.type.split(",");

            let elements = (element ? [element] : document.querySelectorAll(selector));

            if(element) {
                if(!filterTypes.includes("disableShadowRootsCustomStyle")) {
                    if(element.matches && !element.matches(selector)) {
                        elements = [];
                    }
                }

                if(element.getElementsByTagName) {
                    const elementChildrens = element.getElementsByTagName("*");

                    if(elementChildrens && elementChildrens.length > 0) {
                        for(const childrenElement of elementChildrens) {
                            if(childrenElement.matches && childrenElement.matches(selector)) {
                                elements.push(childrenElement);
                            }
                        }
                    }
                }
            }

            elements.forEach(element => {
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
                        case "disableLinkStylingFor":
                            if(!element.classList.contains("pageShadowDisableLinkStyling")) element.classList.add("pageShadowDisableLinkStyling");
                            break;
                        case "disableFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowDisableFontFamilyStyling")) element.classList.add("pageShadowDisableFontFamilyStyling");
                            break;
                        case "disableElementInvertFor":
                            if(!element.classList.contains("pageShadowDisableElementInvert")) element.classList.add("pageShadowDisableElementInvert");
                            break;
                        case "disableShadowRootsCustomStyle":
                            if(element.shadowRoot != null) processShadowRoot(element);
                            break;
                        }
                    });
                }
            });
        });
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
        precUrl = window.location.href;

        if(type == TYPE_RESET || type == TYPE_ONLY_RESET) {
            mutation = TYPE_ALL;
        }

        if(mutation == null) mutation = "none";

        if(typeof timeOutLum !== "undefined") clearTimeout(timeOutLum);
        if(typeof timeOutAP !== "undefined") clearTimeout(timeOutAP);
        if(typeof timeOutIC !== "undefined") clearTimeout(timeOutIC);
        if(typeof timeOutBI !== "undefined") clearTimeout(timeOutBI);
        if(typeof mut_contrast !== "undefined" && (mutation == TYPE_CONTRAST || mutation == TYPE_ALL)) mut_contrast.disconnect();
        if(typeof mut_invert !== "undefined" && (mutation == TYPE_INVERT || mutation == TYPE_ALL)) mut_invert.disconnect();
        if(typeof mut_brightness !== "undefined" && (mutation == TYPE_BRIGHTNESS || mutation == TYPE_ALL)) mut_brightness.disconnect();
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

        if(runningInIframe) {
            typeProcess = type;

            browser.runtime.sendMessage({
                "type": "isEnabledForThisPage"
            });
        } else {
            pageShadowAllowed(window.location.href).then(allowed => {
                process(allowed, type);
            });
        }
    }

    function process(allowed, type) {
        if(allowed) {
            browser.storage.local.get(["sitesInterditPageShadow", "pageShadowEnabled", "theme", "pageLumEnabled", "pourcentageLum", "nightModeEnabled", "colorInvert", "invertPageColors", "invertImageColors", "invertEntirePage", "invertEntirePage", "whiteList", "colorTemp", "globallyEnable", "invertVideoColors", "disableImgBgColor", "invertBgColor"]).then(result => {
                precEnabled = true;

                const pageShadowEnabled = result.pageShadowEnabled;
                const theme = result.theme;
                const colorTemp = result.colorTemp;
                const invertEntirePage = result.invertEntirePage;
                let invertImageColors = result.invertImageColors;
                const invertVideoColors = result.invertVideoColors;
                const invertBgColors = result.invertBgColor;
                let colorInvert;

                if(result.colorInvert == "true") {
                    colorInvert = "true";
                    invertImageColors = "true";
                } else if(result.invertPageColors == "true") {
                    colorInvert = "true";
                } else {
                    colorInvert = "false";
                }

                if(type == TYPE_ONLY_CONTRAST) {
                    contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, result.disableImgBgColor, invertBgColors);
                } else if(type == TYPE_ONLY_INVERT) {
                    invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
                } else if(type == TYPE_ONLY_BRIGHTNESS) {
                    brightnessPage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, colorTemp);
                } else if(pageShadowEnabled == "true") {
                    waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, result.disableImgBgColor, invertBgColors);
                } else {
                    waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
                }

                if(type !== TYPE_ONLY_CONTRAST && type !== TYPE_ONLY_INVERT && type !== TYPE_ONLY_BRIGHTNESS) {
                    brightnessPage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, colorTemp);
                }

                if(pageShadowEnabled == "true" || colorInvert == "true") {
                    if(type == "start") {
                        applyDetectBackground(TYPE_LOADING, "*", 1, 1);
                    } else {
                        applyDetectBackground(null, "*", 2, 1);
                    }
                }

                if(document.readyState == "complete") {
                    updateFilters();
                } else {
                    window.addEventListener("load", () => {
                        updateFilters();
                    });
                }
            });
        } else {
            precEnabled = false;
        }

        started = true;
    }

    main("start");

    // Execute Page Shadow on the page when the settings have been changed:
    browser.storage.onChanged.addListener(() => {
        browser.storage.local.get("liveSettings").then(result => {
            if(result.liveSettings !== "false") {
                main(TYPE_RESET, TYPE_ALL);
            }
        });
    });

    // Message/response handling
    browser.runtime.onMessage.addListener(message => {
        if(message) {
            switch(message.type) {
            case "getFiltersResponse": {
                if(message.filters) {
                    filtersCache = message.filters;
                    doProcessFilters(message.filters);
                }
                break;
            }
            case "isEnabledForThisPageResponse": {
                if(message.enabled) {
                    process(true, typeProcess);
                }
                break;
            }
            case "websiteUrlUpdated": { // Execute when the page URL changes in Single Page Applications
                const enabled = started && ((message.enabled && !precEnabled) || (!message.enabled && precEnabled));
                const urlUpdated = precUrl != window.location.href;

                if(urlUpdated) {
                    filtersCache = null;
                    precUrl = window.location.href;
                    if(!enabled) updateFilters();
                }

                if(enabled) {
                    main(TYPE_RESET, TYPE_ALL);
                }
                break;
            }
            }
        }
    });
}());