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
import { pageShadowAllowed, customTheme, getSettings, getCurrentURL, hasSettingsChanged, processRules, removeClass, addClass } from "./util.js";
import { nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultWebsiteSpecialFiltersConfig, defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, ignoredElementsContentScript } from "./constants.js";
import browser from "webextension-polyfill";
import SafeTimer from "./safeTimer.js";

(function(){
    const style = document.createElement("style");
    const lnkCustomTheme = document.createElement("link");
    const elementBrightnessWrapper = document.createElement("div");
    const elementBrightness = document.createElement("div");
    const websiteSpecialFiltersConfig = defaultWebsiteSpecialFiltersConfig;
    const runningInIframe = window !== window.top;
    let backgroundDetectionAlreadyProcessedNodes = [];
    let processedShadowRoots = [];

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
    let safeTimerMutationBackgrounds = null;
    let mutationObserverAddedNodes = [];
    let delayedMutationObserversCalls = [];
    let safeTimerMutationDelayed = null;
    let pageShadowStyleShadowRootsCacheInvert = null;
    let shadowRootToTreat = null;

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

    function contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert) {
        const elementToApply = customElement ? customElement : document.body;

        if(pageShadowEnabled != undefined && pageShadowEnabled == "true") {
            if(theme != undefined) {
                if(theme == "1") {
                    addClass(elementToApply, "pageShadowContrastBlack");
                    if(!customElement) addClass(document.getElementsByTagName("html")[0], "pageShadowBackgroundContrast");
                } else if(theme.startsWith("custom")) {
                    if(!customElement) customThemeApply(theme);
                    addClass(elementToApply, "pageShadowContrastBlackCustom");
                    if(!customElement) addClass(document.getElementsByTagName("html")[0], "pageShadowBackgroundCustom");
                } else {
                    addClass(elementToApply, "pageShadowContrastBlack" + theme);
                    if(!customElement) addClass(document.getElementsByTagName("html")[0], "pageShadowBackgroundContrast" + theme);
                }
            } else {
                addClass(elementToApply, "pageShadowContrastBlack");
                if(!customElement) addClass(document.getElementsByTagName("html")[0], "pageShadowBackgroundContrast");
            }

            if(disableImgBgColor != undefined && disableImgBgColor == "true") {
                addClass(elementToApply, "pageShadowDisableImgBgColor");
            }
        }

        invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert);

        if(!customElement) {
            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve(MUTATION_TYPE_CONTRAST);
            } else {
                window.addEventListener("load", () => {
                    mutationObserve(MUTATION_TYPE_CONTRAST);
                });
            }
        }

        if(customElement) {
            addClass(elementToApply, "pageShadowBackgroundDetected");
        }

        if(!customElement && typeof timeoutApplyContrast !== "undefined") {
            clearTimeout(timeoutApplyContrast);
        }
    }

    function customThemeApply(theme) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            customTheme(theme.replace("custom", ""), style, false, lnkCustomTheme, false);
        }
    }

    function invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert) {
        const elementToApply = customElement ? customElement : document.body;
        removeClass(elementToApply, "pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert");

        if(!customElement) {
            removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");
        }

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                addClass(elementToApply, "pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert");

                if(!customElement) {
                    addClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");
                }

                if(invertImageColors != null && invertImageColors == "true") {
                    removeClass(elementToApply, "pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors == "true") {
                    removeClass(elementToApply, "pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    removeClass(elementToApply, "pageShadowInvertVideoColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    removeClass(elementToApply, "pageShadowEnableSelectiveInvert");
                }
            } else {
                if(invertImageColors != null && invertImageColors == "true") {
                    addClass(elementToApply, "pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors != "false") {
                    addClass(elementToApply, "pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    addClass(elementToApply, "pageShadowInvertVideoColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    addClass(elementToApply, "pageShadowEnableSelectiveInvert");
                }
            }

            if(!customElement) {
                if(document.readyState == "complete" || document.readyState == "interactive") {
                    mutationObserve(MUTATION_TYPE_INVERT);
                } else {
                    window.addEventListener("load", () => {
                        mutationObserve(MUTATION_TYPE_INVERT);
                    });
                }
            }
        }

        if(typeof timeoutApplyInvertColors !== "undefined") {
            clearTimeout(timeoutApplyInvertColors);
        }
    }

    function detectBackground(tagName) {
        if(!websiteSpecialFiltersConfig.performanceModeEnabled) {
            const detectBackgroundTimer = new SafeTimer(() => {
                addClass(document.body, "pageShadowDisableStyling");

                const elements = Array.prototype.slice.call(document.body.getElementsByTagName(tagName));
                let i = elements.length;

                while(i--) {
                    detectBackgroundForElement(elements[i]);
                }

                removeClass(document.body, "pageShadowDisableStyling");
                addClass(document.body, "pageShadowBackgroundDetected");

                backgroundDetected = true;
                detectBackgroundTimer.clear();
            });

            detectBackgroundTimer.start();
        } else {
            addClass(document.body, "pageShadowBackgroundDetected");
            backgroundDetected = true;
        }

        mutationObserve(MUTATION_TYPE_BACKGROUNDS);
    }

    function elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg) {
        if(!backgroundColor) return true;

        const isRgbaColor = backgroundColor.trim().startsWith("rgba");
        const isTransparentColor = backgroundColor.trim().startsWith("rgba(0, 0, 0, 0)");
        const alpha = isRgbaColor ? parseFloat(backgroundColor.split(",")[3]) : -1;
        const hasBackgroundImageValue = backgroundImage && (backgroundImage.trim().toLowerCase() != "none" && backgroundImage.trim() != "");
        const hasNoBackgroundColorValue = backgroundColor && (backgroundColor.trim().toLowerCase().indexOf("transparent") != -1 || backgroundColor.trim().toLowerCase() == "none" || backgroundColor.trim() == "");

        return (hasNoBackgroundColorValue || isTransparentColor || (isRgbaColor && alpha <= websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold)) && !hasBackgroundImg && !hasBackgroundImageValue;
    }

    function detectBackgroundForElement(element) {
        if(element && element.shadowRoot != null && websiteSpecialFiltersConfig.enableShadowRootStyleOverride) {
            if(websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay > 0) {
                setTimeout(() => processShadowRoot(element), websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
            } else {
                processShadowRoot(element);
            }
        }

        if(!element || element == document.body || element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected") || backgroundDetectionAlreadyProcessedNodes.indexOf(element) !== -1 || ignoredElementsContentScript.includes(element.localName)) {
            return;
        }

        const computedStyle = window.getComputedStyle(element, null);
        const background = computedStyle.getPropertyValue("background");
        const backgroundColor = computedStyle.getPropertyValue("background-color");
        const backgroundImage = computedStyle.getPropertyValue("background-image");

        const hasBackgroundImg = background.trim().substr(0, 4).toLowerCase().includes("url(") || backgroundImage.trim().substr(0, 4).toLowerCase() == "url(";
        const hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");
        const hasTransparentBackgroundClass = element.classList.contains("pageShadowHasTransparentBackground");

        if(hasBackgroundImg && !hasClassImg) {
            addClass(element, "pageShadowHasBackgroundImg");
        }

        if(websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled) {
            const hasTransparentBackground = elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg);

            if(hasTransparentBackground && !hasTransparentBackgroundClass) {
                addClass(element, "pageShadowHasTransparentBackground");
            }
        }

        backgroundDetectionAlreadyProcessedNodes.push(element);
    }

    function applyDetectBackground(type, elements) {
        if(backgroundDetected) return false;

        if(document.readyState === "complete") {
            const timerBackgrounds = new SafeTimer(() => {
                waitAndApplyDetectBackgrounds(elements);
                timerBackgrounds.clear();
            });

            timerBackgrounds.start();
        } else {
            if(type == TYPE_LOADING) {
                window.addEventListener("load", () => {
                    // when the page is entirely loaded
                    if(document.readyState === "complete") {
                        const timerBackgrounds = new SafeTimer(() => {
                            waitAndApplyDetectBackgrounds(elements);
                            timerBackgrounds.clear();
                        });

                        timerBackgrounds.start(250);
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
                elementBrightness.setAttribute("id", "pageShadowBrightnessNightMode");
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
                elementBrightness.setAttribute("id", "pageShadowBrightness");
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
        if(document.getElementById("pageShadowBrightness") !== null && document.body.contains(elementWrapper)) {
            elementWrapper.removeChild(document.getElementById("pageShadowBrightness"));
        }

        if(document.getElementById("pageShadowBrightnessNightMode") !== null && document.body.contains(elementWrapper)) {
            elementWrapper.removeChild(document.getElementById("pageShadowBrightnessNightMode"));
        }

        document.body.appendChild(elementWrapper);
        elementWrapper.appendChild(elementBrightness);

        if(typeof timeoutApplyBrightness !== "undefined") {
            clearTimeout(timeoutApplyBrightness);
        }
    }

    function waitAndApplyBrightnessPage(element, wrapper) {
        const timerApplyBrightnessPage = new SafeTimer(() => {
            if(!document.body) {
                waitAndApplyBrightnessPage(element, wrapper);
            } else {
                appendBrightnessElement(element, wrapper);
            }

            timerApplyBrightnessPage.clear();
        });

        timerApplyBrightnessPage.start();
    }

    function waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert) {
        const timerApplyContrastPage = new SafeTimer(() => {
            if(!document.body) {
                waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert);
            } else {
                contrastPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert);
            }

            timerApplyContrastPage.clear();
        });

        timerApplyContrastPage.start();
    }

    function waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert) {
        const timerApplyInvertColors = new SafeTimer(() => {
            if(!document.body) {
                waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert);
            } else {
                invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert);
            }

            timerApplyInvertColors.clear();
        });

        timerApplyInvertColors.start();
    }

    function waitAndApplyDetectBackgrounds(tagName) {
        const timerApplyDetectBackgrounds = new SafeTimer(() => {
            if(!document.body) {
                waitAndApplyDetectBackgrounds(tagName);
            } else {
                detectBackground(tagName);
            }

            timerApplyDetectBackgrounds.clear();
        });

        timerApplyDetectBackgrounds.start();
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
                    const timerApplyMutationContrast = new SafeTimer(() => {
                        main(TYPE_ONLY_CONTRAST, MUTATION_TYPE_CONTRAST);
                        timerApplyMutationContrast.clear();
                    });

                    timerApplyMutationContrast.start();
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

                        if((mutation.oldValue.indexOf("pageShadowInvertImageColor") !== -1 && !classList.contains("pageShadowInvertImageColor"))
                            || (mutation.oldValue.indexOf("pageShadowInvertVideoColor") !== -1 && !classList.contains("pageShadowInvertVideoColor"))
                            || (mutation.oldValue.indexOf("pageShadowInvertBgColor") !== -1 && !classList.contains("pageShadowInvertBgColor"))
                            || (mutation.oldValue.indexOf("pageShadowEnableSelectiveInvert") !== -1 && !classList.contains("pageShadowEnableSelectiveInvert"))) {
                            const timerApplyMutationInvert = new SafeTimer(() => {
                                main(TYPE_ONLY_INVERT, MUTATION_TYPE_INVERT);
                                timerApplyMutationInvert.clear();
                            });

                            timerApplyMutationInvert.start();
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
                const brightness = document.getElementById("pageShadowBrightness");
                const nightmode = document.getElementById("pageShadowBrightnessNightMode");

                mutations.forEach(mutation => {
                    if((!document.body.contains(brightness) && !document.body.contains(nightmode)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                        const timerApplyMutationBrightness = new SafeTimer(() => {
                            main(TYPE_ONLY_BRIGHTNESS, MUTATION_TYPE_BRIGHTNESS);
                            timerApplyMutationBrightness.clear();
                        });

                        timerApplyMutationBrightness.start();
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
            mut_backgrounds = new MutationObserver(mutations => {
                delayedMutationObserversCalls.push(mutations);

                if(websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds) {
                    safeTimerMutationDelayed.start(websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                } else {
                    treatMutationObserverBackgroundCalls();
                }
            });

            mut_backgrounds.observe(document.body, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false,
                "attributeFilter": ["class", "style"],
                "attributeOldValue": true,
                "characterDataOldValue": false
            });

            safeTimerMutationBackgrounds = new SafeTimer(mutationElementsBackgrounds);
            safeTimerMutationDelayed = new SafeTimer(treatMutationObserverBackgroundCalls);
        }
    }

    function treatMutationObserverBackgroundCalls() {
        if(delayedMutationObserversCalls.length > 0) {
            let i = delayedMutationObserversCalls.length;
            let treatedCount = 0;

            while(i--) {
                const mutationList = delayedMutationObserversCalls[i];

                let k = mutationList.length;

                if(k <= 0) {
                    delayedMutationObserversCalls.pop();
                } else {
                    while(k--) {
                        treatOneMutationObserverBackgroundCall(mutationList[k]);

                        mutationList.shift();
                        treatedCount++;

                        if(websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds && treatedCount > websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall) {
                            safeTimerMutationDelayed.start(websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                            return;
                        }

                        if(websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled && treatedCount > websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold) {
                            websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = true;
                        }
                    }
                }
            }

            if(websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled && treatedCount <= websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold) {
                websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = false;
            }

            delayedMutationObserversCalls = [];
        }
    }

    function treatOneMutationObserverBackgroundCall(mutation) {
        if(mutation.type == "childList") {
            const nodeList = mutation.addedNodes;

            if(nodeList.length > 0) {
                mutationObserverAddedNodes.push(nodeList);
            }

            if(mutationObserverAddedNodes.length > 0) {
                safeTimerMutationBackgrounds.start(mutationObserverAddedNodes.length < 100 ? 1 : undefined);
            }
        } else if(mutation.type == "attributes") {
            if(!websiteSpecialFiltersConfig.performanceModeEnabled) mutationForElement(mutation.target, mutation.attributeName, mutation.oldValue);
            doProcessFilters(filtersCache, mutation.target);
        }
    }

    function mutationElementsBackgrounds() {
        let i = mutationObserverAddedNodes.length;
        const addedNodes = [];

        while(i--) {
            const nodeList = mutationObserverAddedNodes[i];

            let k = nodeList.length;

            while(k--) {
                const node = nodeList[k];

                if(!node || !node.classList || node == document.body || ignoredElementsContentScript.includes(node.localName) || node.nodeType != 1 || node.shadowRoot) {
                    continue;
                }

                addedNodes.push(node);
            }
        }

        mutationObserverAddedNodes = [];

        if(addedNodes.length <= 0) {
            return;
        }

        removeClass(document.body, "pageShadowBackgroundDetected");
        addClass(document.body, "pageShadowDisableStyling");

        for(const node of addedNodes) {
            if(!websiteSpecialFiltersConfig.performanceModeEnabled) mutationForElement(node, null, null);
            doProcessFilters(filtersCache, node);
        }


        addClass(document.body, "pageShadowBackgroundDetected");
        removeClass(document.body, "pageShadowDisableStyling");
    }

    function mutationForElement(element, attribute, attributeOldValue) {
        if(!element || !element.classList || element == document.body || ignoredElementsContentScript.includes(element.localName) || element.nodeType != 1) {
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

        if(attribute) {
            removeClass(document.body, "pageShadowBackgroundDetected");
            addClass(document.body, "pageShadowDisableStyling");
        }

        detectBackgroundForElement(element);

        // Detect element childrens
        if(!attribute && websiteSpecialFiltersConfig.enableMutationObserversForSubChilds) {
            if(element.getElementsByTagName) {
                const elementChildrens = element.getElementsByTagName("*");

                if(elementChildrens && elementChildrens.length > 0) {
                    let i = elementChildrens.length;

                    while(i--) {
                        detectBackgroundForElement(elementChildrens[i]);
                    }
                }
            }
        }

        if(attribute) {
            addClass(document.body, "pageShadowBackgroundDetected");
            removeClass(document.body, "pageShadowDisableStyling");
        }
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
                            if(!element.classList.contains("pageShadowElementDisabled")) addClass(element, "pageShadowElementDisabled");
                            break;
                        case "forceTransparentBackground":
                            if(!element.classList.contains("pageShadowElementForceTransparentBackground")) addClass(element, "pageShadowElementForceTransparentBackground");
                            break;
                        case "disableBackgroundStylingFor":
                            if(!element.classList.contains("pageShadowDisableBackgroundStyling")) addClass(element, "pageShadowDisableBackgroundStyling");
                            break;
                        case "disableTextColorStylingFor":
                            if(!element.classList.contains("pageShadowDisableColorStyling")) addClass(element, "pageShadowDisableColorStyling");
                            break;
                        case "disableInputBorderStylingFor":
                            if(!element.classList.contains("pageShadowDisableInputBorderStyling")) addClass(element, "pageShadowDisableInputBorderStyling");
                            break;
                        case "forceInputBorderStylingFor":
                            if(!element.classList.contains("pageShadowForceInputBorderStyling")) addClass(element, "pageShadowForceInputBorderStyling");
                            break;
                        case "disableLinkStylingFor":
                            if(!element.classList.contains("pageShadowDisableLinkStyling")) addClass(element, "pageShadowDisableLinkStyling");
                            break;
                        case "disableFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowDisableFontFamilyStyling")) addClass(element, "pageShadowDisableFontFamilyStyling");
                            break;
                        case "forceFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowForceFontFamilyStyling")) addClass(element, "pageShadowForceFontFamilyStyling");
                            break;
                        case "disableElementInvertFor":
                            if(!element.classList.contains("pageShadowDisableElementInvert")) addClass(element, "pageShadowDisableElementInvert");
                            break;
                        case "hasBackgroundImg":
                            if(!element.classList.contains("pageShadowHasBackgroundImg")) addClass(element, "pageShadowHasBackgroundImg");
                            break;
                        case "forceCustomLinkColorFor":
                            if(!element.classList.contains("pageShadowForceCustomLinkColor")) addClass(element, "pageShadowForceCustomLinkColor");
                            break;
                        case "forceCustomBackgroundColorFor":
                            if(!element.classList.contains("pageShadowForceCustomBackgroundColor")) addClass(element, "pageShadowForceCustomBackgroundColor");
                            break;
                        case "forceCustomTextColorFor":
                            if(!element.classList.contains("pageShadowForceCustomTextColor")) addClass(element, "pageShadowForceCustomTextColor");
                            break;
                        case "forceCustomVisitedLinkColor":
                            if(!element.classList.contains("pageShadowForceCustomVisitedLinkColor")) addClass(element, "pageShadowForceCustomVisitedLinkColor");
                            break;
                        case "disableCustomVisitedLinkColor":
                            if(!element.classList.contains("pageShadowDisableCustomVisitedLinkColor")) addClass(element, "pageShadowDisableCustomVisitedLinkColor");
                            break;
                        case "forceCustomLinkColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomLinkColorAsBackground")) addClass(element, "pageShadowForceCustomLinkColorAsBackground");
                            break;
                        case "forceCustomTextColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomTextColorAsBackground")) addClass(element, "pageShadowForceCustomTextColorAsBackground");
                            break;
                        case "forceCustomLinkVisitedColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomLinkVisitedColorAsBackground")) addClass(element, "pageShadowForceCustomLinkVisitedColorAsBackground");
                            break;
                        case "enablePseudoElementsStyling":
                            if(!element.classList.contains("pageShadowEnablePseudoElementStyling")) addClass(element, "pageShadowEnablePseudoElementStyling");
                            break;
                        case "invertElementAsImage":
                            if(!element.classList.contains("pageShadowInvertElementAsImage")) addClass(element, "pageShadowInvertElementAsImage");
                            break;
                        case "invertElementAsVideo":
                            if(!element.classList.contains("pageShadowInvertElementAsVideo")) addClass(element, "pageShadowInvertElementAsVideo");
                            break;
                        case "invertElementAsBackground":
                            if(!element.classList.contains("pageShadowInvertElementAsBackground")) addClass(element, "pageShadowInvertElementAsBackground");
                            break;
                        case "enableSelectiveInvert":
                            if(!element.classList.contains("pageShadowSelectiveInvert")) addClass(element, "pageShadowSelectiveInvert");
                            break;
                        case "enablePseudoElementSelectiveInvert":
                            if(!element.classList.contains("pageShadowSelectiveInvertPseudoElement")) addClass(element, "pageShadowSelectiveInvertPseudoElement");
                            break;
                        case "invertPseudoElement":
                            if(!element.classList.contains("pageShadowInvertPseudoElement")) addClass(element, "pageShadowInvertPseudoElement");
                            break;
                        case "forceDisableDefaultBackgroundColor": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultBackgroundColor")) {
                                const oldStyleAttribute = element.getAttribute("style");
                                element.setAttribute("style", (oldStyleAttribute ? oldStyleAttribute : "") + "background-color: none !important");
                                addClass(element, "pageShadowforceDisableDefaultBackgroundColor");
                            }
                            break;
                        }
                        case "forceDisableDefaultBackground": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultBackground")) {
                                const oldStyleAttribute = element.getAttribute("style");
                                element.setAttribute("style", (oldStyleAttribute ? oldStyleAttribute : "") + "background: none !important");
                                addClass(element, "pageShadowforceDisableDefaultBackground");
                            }
                            break;
                        }
                        case "forceDisableDefaultFontColor": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultFontColor")) {
                                const oldStyleAttribute = element.getAttribute("style");
                                element.setAttribute("style", (oldStyleAttribute ? oldStyleAttribute : "") + "color: none !important");
                                addClass(element, "pageShadowforceDisableDefaultFontColor");
                            }
                            break;
                        }
                        case "disableShadowRootsCustomStyle":
                        case "overrideShadowRootsCustomStyle":
                            if(element.shadowRoot != null) processShadowRoot(element);
                            break;
                        }
                    });
                }
            }
        }
    }

    function processSpecialRules(rules) {
        rules.forEach(rule => {
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
            if(rule.type == "enableShadowRootStyleOverride") websiteSpecialFiltersConfig.enableShadowRootStyleOverride = true;
            if(rule.type == "disableShadowRootStyleOverride") websiteSpecialFiltersConfig.enableShadowRootStyleOverride = false;
            if(rule.type == "shadowRootStyleOverrideDelay") websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay = rule.filter;
            if(rule.type == "enableThrottleMutationObserverBackgrounds") {
                websiteSpecialFiltersConfig.enableThrottleMutationObserverBackgrounds = true;
                websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold = false;
            }
            if(rule.type == "disableThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.disableThrottleMutationObserverBackgrounds = false;
            if(rule.type == "delayMutationObserverBackgrounds") websiteSpecialFiltersConfig.delayMutationObserverBackgrounds = rule.filter;
            if(rule.type == "autoThrottleMutationObserverBackgroundsTreshold") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold = rule.filter;
            if(rule.type == "throttledMutationObserverTreatedByCall") websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall = rule.filter;
            if(rule.type == "disableAutoThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = false;
            if(rule.type == "enableAutoThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = true;
        });
    }

    function processShadowRoot(currentElement) {
        if(!pageShadowStyleShadowRootsCacheInvert) {
            shadowRootToTreat = currentElement;

            browser.runtime.sendMessage({
                type: "getGlobalShadowRootPageShadowStyle",
                what: "invert"
            });
        } else {
            if(currentElement) {
                if(currentElement.shadowRoot != null) {
                    processOneShadowRoot(currentElement);
                    const elementChildrens = currentElement.shadowRoot.querySelectorAll("*");

                    if(elementChildrens && elementChildrens.length > 0) {
                        for(let i = 0, len = elementChildrens.length; i < len; i++) {
                            processShadowRoot(elementChildrens[i]);
                        }
                    }
                }
            }
        }
    }

    function processOneShadowRoot(element) {
        if(element.shadowRoot) {
            shadowRootToTreat = element;

            const currentCSSStyle = element.shadowRoot.querySelector(".pageShadowCSSShadowRoot");
            const currentCSSStyleInvert = element.shadowRoot.querySelector(".pageShadowCSSShadowRootInvert");

            if(currentCSSStyle) {
                element.shadowRoot.removeChild(currentCSSStyle);
            }

            if(currentCSSStyleInvert) {
                element.shadowRoot.removeChild(currentCSSStyleInvert);
            }

            if(precEnabled && currentSettings.pageShadowEnabled != undefined && currentSettings.pageShadowEnabled == "true") {
                const currentTheme = currentSettings.theme;

                const styleTag = document.createElement("style");
                styleTag.classList.add("pageShadowCSSShadowRoot");
                element.shadowRoot.appendChild(styleTag);

                const styleTagInvert = document.createElement("style");
                styleTagInvert.classList.add("pageShadowCSSShadowRootInvert");
                styleTagInvert.innerHTML = pageShadowStyleShadowRootsCacheInvert;
                element.shadowRoot.appendChild(styleTagInvert);

                if(currentTheme.startsWith("custom")) {
                    customTheme(currentSettings.theme.replace("custom", ""), styleTag, false, null, true);
                } else {
                    processRules(styleTag, defaultThemesBackgrounds[currentTheme - 1].replace("#", ""), defaultThemesLinkColors[currentTheme - 1].replace("#", ""), defaultThemesVisitedLinkColors[currentTheme - 1].replace("#", ""), defaultThemesTextColors[currentTheme - 1].replace("#", ""), null, true);
                }

                invertColor(currentSettings.colorInvert, currentSettings.invertImageColors, currentSettings.invertEntirePage, currentSettings.invertVideoColors, currentSettings.invertBgColor, element, currentSettings.selectiveInvert);
                processedShadowRoots.push(element.shadowRoot);
            }
        }
    }

    function resetShadowRoots() {
        for(let i = 0, len = processedShadowRoots.length; i < len; i++) {
            const shadowRoot = processedShadowRoots[i];

            if(shadowRoot) {
                const currentCSSStyle = shadowRoot.querySelector(".pageShadowCSSShadowRoot");

                if(currentCSSStyle) {
                    shadowRoot.removeChild(currentCSSStyle);
                }
            }
        }

        processedShadowRoots = [];
    }

    function main(type, mutation) {
        precUrl = getCurrentURL();

        if(type == TYPE_RESET || type == TYPE_ONLY_RESET) {
            mutation = TYPE_ALL;
        }

        if(typeof timeoutApplyBrightness !== "undefined") clearTimeout(timeoutApplyBrightness);
        if(typeof timeoutApplyContrast !== "undefined") clearTimeout(timeoutApplyContrast);
        if(typeof timeoutApplyInvertColors !== "undefined") clearTimeout(timeoutApplyInvertColors);
        if(typeof timeoutApplyDetectBackgrounds !== "undefined") clearTimeout(timeoutApplyDetectBackgrounds);
        if(typeof mut_contrast !== "undefined" && (mutation == MUTATION_TYPE_CONTRAST || mutation == TYPE_ALL)) mut_contrast.disconnect();
        if(typeof mut_invert !== "undefined" && (mutation == MUTATION_TYPE_INVERT || mutation == TYPE_ALL)) mut_invert.disconnect();
        if(typeof mut_brightness !== "undefined" && (mutation == MUTATION_TYPE_BRIGHTNESS || mutation == TYPE_ALL)) mut_brightness.disconnect();
        if(typeof lnkCustomTheme !== "undefined") lnkCustomTheme.setAttribute("href", "");

        if(started && (type == TYPE_RESET || type == TYPE_ONLY_RESET)) {
            removeClass(document.body, "pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowContrastBlackCustom", "pageShadowDisableImgBgColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert");
            removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground", "pageShadowBackgroundCustom");

            for(let i = 1; i <= nbThemes; i++) {
                removeClass(document.body, (i == 1 ? "pageShadowContrastBlack" : "pageShadowContrastBlack" + i));
                removeClass(document.getElementsByTagName("html")[0], (i == 1 ? "pageShadowBackgroundContrast" : "pageShadowBackgroundContrast" + i));
            }

            if(document.getElementById("pageShadowBrightness") != null && document.body.contains(elementBrightnessWrapper)) {
                elementBrightnessWrapper.removeChild(document.getElementById("pageShadowBrightness"));
            }

            if(document.getElementById("pageShadowBrightnessNightMode") != null && document.body.contains(elementBrightnessWrapper)) {
                elementBrightnessWrapper.removeChild(document.getElementById("pageShadowBrightnessNightMode"));
            }

            resetShadowRoots();

            if(type == TYPE_ONLY_RESET) {
                return;
            }
        }

        typeProcess = type;

        browser.runtime.sendMessage({
            "type": "getSpecialRules"
        });
    }

    async function process(allowed, type, customElement) {
        if(allowed) {
            const settings = newSettingsToApply || await getSettings(getCurrentURL());
            currentSettings = settings;

            if(!customElement) precEnabled = true;

            if(type == TYPE_ONLY_CONTRAST) {
                contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.colorTemp, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, null, settings.selectiveInvert);
            } else if(type == TYPE_ONLY_INVERT) {
                invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, null, settings.selectiveInvert);
            } else if(type == TYPE_ONLY_BRIGHTNESS) {
                brightnessPage(settings.pageLumEnabled, settings.pourcentageLum, settings.nightModeEnabled, settings.colorTemp);
            } else if(settings.pageShadowEnabled == "true") {
                waitAndApplyContrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.colorTemp, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, customElement, settings.selectiveInvert);
            } else {
                waitAndApplyInvertColors(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, customElement, settings.selectiveInvert);
            }

            if(type !== TYPE_ONLY_CONTRAST && type !== TYPE_ONLY_INVERT && type !== TYPE_ONLY_BRIGHTNESS && !customElement) {
                brightnessPage(settings.pageLumEnabled, settings.pourcentageLum, settings.nightModeEnabled, settings.colorTemp);

                if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true") {
                    if(type == TYPE_START || !backgroundDetected) {
                        applyDetectBackground(TYPE_LOADING, "*");
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
            if(!customElement) precEnabled = false;
        }

        if(!customElement) started = true;
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
                    processSpecialRules(message.specialFilters);
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
                processSpecialRules(message.filters);

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
            case "getGlobalShadowRootPageShadowStyleResponse": {
                if(message.data) {
                    pageShadowStyleShadowRootsCacheInvert = message.data;
                    processShadowRoot(shadowRootToTreat);
                }
                break;
            }
            case "websiteUrlUpdated": { // Execute when the page URL changes in Single Page Applications
                let changed = hasEnabledStateChanged(message.enabled);
                const urlUpdated = precUrl != getCurrentURL();

                if(urlUpdated) {
                    backgroundDetected = false;
                    precUrl = getCurrentURL();
                    filtersCache = null;
                    if(hasSettingsChanged(currentSettings, message.settings)) changed = true;
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
        return started && ((isEnabled && !precEnabled) || (!isEnabled && precEnabled));
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