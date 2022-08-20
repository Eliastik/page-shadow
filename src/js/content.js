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
import { pageShadowAllowed, customTheme, getSettings, getCurrentURL, hasSettingsChanged, processRules, removeClass, addClass, processRulesInvert, isRunningInIframe, isRunningInPopup, loadWebsiteSpecialFiltersConfig } from "./util.js";
import { nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, ignoredElementsContentScript } from "./constants.js";
import browser from "webextension-polyfill";
import SafeTimer from "./safeTimer.js";

(async function() {
    const style = document.createElement("style");
    const lnkCustomTheme = document.createElement("link");
    const elementBrightnessWrapper = document.createElement("div");
    const elementBrightness = document.createElement("div");
    const elementBlueLightFilter = document.createElement("div");
    const websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
    const runningInIframe = isRunningInIframe();
    const runningInPopup = isRunningInPopup();

    let backgroundDetectionAlreadyProcessedNodes = [];
    let processedShadowRoots = [];

    let backgroundDetected = false;
    let precEnabled = false;
    let started = false;
    let filtersCache = null;
    let mut_body, mut_backgrounds, mut_brightness_bluelight, mut_brightness_bluelight_wrapper;
    let typeProcess = "";
    let precUrl;
    let currentSettings = null;
    let newSettingsToApply = null;
    let safeTimerMutationBackgrounds = null;
    let mutationObserverAddedNodes = [];
    let delayedMutationObserversCalls = [];
    let safeTimerMutationDelayed = null;
    let oldBody = null;

    // Contants
    const TYPE_RESET = "reset";
    const TYPE_ALL = "all";
    const TYPE_ONLY_CONTRAST = "onlyContrast";
    const TYPE_ONLY_INVERT = "onlyInvert";
    const TYPE_ONLY_BRIGHTNESS = "onlyBrightness";
    const TYPE_ONLY_RESET = "onlyreset";
    const TYPE_ONLY_BLUELIGHT = "onlyBlueLight";
    const TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT = "onlyBrightnessAndBlueLight";
    const MUTATION_TYPE_BODY = "body";
    const MUTATION_TYPE_BACKGROUNDS = "backgrounds";
    const MUTATION_TYPE_BRIGHTNESSWRAPPER = "brightnesswrapper";
    const MUTATION_TYPE_BRIGHTNESS_BLUELIGHT = "brightnessbluelight";
    const TYPE_LOADING = "loading";
    const TYPE_START = "start";

    // Timers
    let timerApplyBrightnessPage = null;
    let timerApplyContrastPage = null;
    let timerApplyInvertColors = null;
    let timerApplyDetectBackgrounds = null;
    let timerApplyBlueLightPage = null;
    let timerObserveBodyChange = null;
    let timerApplyMutationObservers = null;

    function contrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert, attenuateImageColor) {
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

        invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert, attenuateImageColor);

        if(customElement) {
            addClass(elementToApply, "pageShadowBackgroundDetected");
        }
    }

    function customThemeApply(theme) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            customTheme(theme.replace("custom", ""), style, false, lnkCustomTheme, false);
        }
    }

    function invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert, attenuateImageColor) {
        const elementToApply = customElement ? customElement : document.body;
        removeClass(elementToApply, "pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert");

        if(!customElement) {
            removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");
        }

        document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%)");

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
        }

        attenuateColor(attenuateImageColor, customElement);
    }

    function attenuateColor(enabled, customElement) {
        const elementToApply = customElement ? customElement : document.body;
        removeClass(elementToApply, "pageShadowAttenuateImageColor");

        if(enabled == "true") {
            document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%) grayscale(50%)");
            addClass(elementToApply, "pageShadowAttenuateImageColor");
        }
    }

    function detectBackground(tagName) {
        if(!websiteSpecialFiltersConfig.performanceModeEnabled) {
            const detectBackgroundTimer = new SafeTimer(() => {
                addClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");

                detectBackgroundForElement(document.body, true);
                removeClass(document.body, "pageShadowDisableBackgroundStyling");

                const elements = Array.prototype.slice.call(document.body.getElementsByTagName(tagName));
                let i = elements.length;

                while(i--) {
                    detectBackgroundForElement(elements[i], true);
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

        const mutationBackgroundTimer = new SafeTimer(() => {
            mutationBackgroundTimer.clear();
            mutationObserve(MUTATION_TYPE_BACKGROUNDS);
        });

        mutationBackgroundTimer.start(1);
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

    function detectBackgroundForElement(element, disableDestyling) {
        if(element && element.shadowRoot != null && websiteSpecialFiltersConfig.enableShadowRootStyleOverride) {
            if(websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay > 0) {
                setTimeout(() => processShadowRoot(element), websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
            } else {
                processShadowRoot(element);
            }
        }

        if(!element || (element != document.body && (element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected"))) || backgroundDetectionAlreadyProcessedNodes.indexOf(element) !== -1 || ignoredElementsContentScript.includes(element.localName)) {
            return;
        }

        if(!disableDestyling) {
            addClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
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

        if(!disableDestyling) {
            removeClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
        }
    }

    function applyDetectBackground(type, elements) {
        if(backgroundDetected) return false;

        if(document.readyState === "complete") {
            const timerBackgrounds = new SafeTimer(() => {
                timerBackgrounds.clear();
                waitAndApplyDetectBackgrounds(elements);
            });

            timerBackgrounds.start(1);
        } else {
            if(type == TYPE_LOADING) {
                window.addEventListener("load", () => {
                    // when the page is entirely loaded
                    if(document.readyState === "complete") {
                        const timerBackgrounds = new SafeTimer(() => {
                            timerBackgrounds.clear();
                            waitAndApplyDetectBackgrounds(elements);
                        });

                        timerBackgrounds.start(250);
                    }
                });
            } else {
                applyDetectBackground(TYPE_LOADING, elements);
            }
        }
    }

    function brightnessPage(enabled, percentage) {
        elementBrightness.setAttribute("class", "");

        if(enabled == "true" && !runningInIframe) {
            elementBrightness.style.display = "block";
            elementBrightness.setAttribute("id", "pageShadowBrightness");

            if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                elementBrightness.style.opacity = brightnessDefaultValue;
            } else {
                elementBrightness.style.opacity = percentage / 100;
            }

            waitAndApplyBrightnessPage(elementBrightness, elementBrightnessWrapper);
        }
    }

    function blueLightFilterPage(enabled, percentage, colorTemp) {
        elementBlueLightFilter.setAttribute("class", "");

        if(enabled == "true" && !runningInIframe) {
            elementBlueLightFilter.style.display = "block";
            elementBlueLightFilter.setAttribute("id", "pageShadowBrightnessNightMode");
            elementBlueLightFilter.setAttribute("class", "");

            let tempColor = "2000";

            if(colorTemp != undefined) {
                const tempIndex = parseInt(colorTemp);
                tempColor = colorTemperaturesAvailable[tempIndex - 1];

                elementBlueLightFilter.setAttribute("class", "k" + tempColor);
            } else {
                elementBlueLightFilter.setAttribute("class", "k2000");
            }

            if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                elementBlueLightFilter.style.opacity = brightnessDefaultValue;
            } else {
                elementBlueLightFilter.style.opacity = percentage / 100;
            }

            waitAndApplyBlueLightPage(elementBlueLightFilter, elementBrightnessWrapper);
        }
    }

    function appendBrightnessElement(elementBrightness, elementWrapper) {
        if(document.body) {
            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBrightness)) {
                elementWrapper.removeChild(elementBrightness);
            }

            document.body.appendChild(elementWrapper);
        }

        elementWrapper.appendChild(elementBrightness);
    }

    function waitAndApplyBrightnessPage(element, wrapper) {
        if(timerApplyBrightnessPage) timerApplyBrightnessPage.clear();

        timerApplyBrightnessPage = new SafeTimer(() => {
            timerApplyBrightnessPage.clear();

            if(!document.body) {
                waitAndApplyBrightnessPage(element, wrapper);
            } else {
                appendBrightnessElement(element, wrapper);
            }
        });

        timerApplyBrightnessPage.start(1);
    }

    function appendBlueLightElement(elementBrightness, elementWrapper) {
        if(document.body) {
            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBlueLightFilter)) {
                elementWrapper.removeChild(elementBlueLightFilter);
            }

            document.body.appendChild(elementWrapper);
        }

        elementWrapper.appendChild(elementBrightness);
    }

    function waitAndApplyBlueLightPage(element, wrapper) {
        if(timerApplyBlueLightPage) timerApplyBlueLightPage.clear();

        timerApplyBlueLightPage = new SafeTimer(() => {
            timerApplyBlueLightPage.clear();

            if(!document.body) {
                waitAndApplyBlueLightPage(element, wrapper);
            } else {
                appendBlueLightElement(element, wrapper);
            }
        });

        timerApplyBlueLightPage.start(1);
    }

    function waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert, attenuateImageColor) {
        if(timerApplyContrastPage) timerApplyContrastPage.clear();

        timerApplyContrastPage = new SafeTimer(() => {
            timerApplyContrastPage.clear();

            if(!document.body) {
                waitAndApplyContrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert, attenuateImageColor);
            } else {
                contrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, customElement, selectiveInvert, attenuateImageColor);
            }
        });

        timerApplyContrastPage.start(1);
    }

    function waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert, attenuateImageColor) {
        if(timerApplyInvertColors) timerApplyInvertColors.clear();

        timerApplyInvertColors = new SafeTimer(() => {
            timerApplyInvertColors.clear();

            if(!document.body) {
                waitAndApplyInvertColors(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert, attenuateImageColor);
            } else {
                invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, customElement, selectiveInvert, attenuateImageColor);
            }
        });

        timerApplyInvertColors.start(1);
    }

    function waitAndApplyDetectBackgrounds(tagName) {
        if(timerApplyDetectBackgrounds) timerApplyDetectBackgrounds.clear();

        timerApplyDetectBackgrounds = new SafeTimer(() => {
            timerApplyDetectBackgrounds.clear();

            if(!document.body) {
                waitAndApplyDetectBackgrounds(tagName);
            } else {
                detectBackground(tagName);
            }
        });

        timerApplyDetectBackgrounds.start(1);
    }

    function waitAndApplyMutationObservers() {
        if(timerApplyMutationObservers) timerApplyMutationObservers.clear();

        if(document.body) {
            mutationObserve(MUTATION_TYPE_BODY);
            mutationObserve(MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
        } else {
            timerApplyMutationObservers = new SafeTimer(() => {
                timerApplyMutationObservers.clear();
                waitAndApplyMutationObservers();
            });

            timerApplyMutationObservers.start(1);
        }
    }

    function mutationObserve(type) {
        // Mutation Observer for the body element classList (contrast/invert/attenuate)
        if(type == MUTATION_TYPE_BODY) {
            if(typeof mut_body !== "undefined") mut_body.disconnect();

            mut_body = new MutationObserver(mutations => {
                mut_body.disconnect();

                const classList = document.body.classList;

                let reApplyContrast = false;
                let reApplyInvert = false;
                let reApplyAttenuate = false;

                if(currentSettings.pageShadowEnabled != undefined && currentSettings.pageShadowEnabled == "true") {
                    let classFound = false;

                    for(let i = 1; i <= nbThemes; i++) {
                        if(i == 1 && classList.contains("pageShadowContrastBlack")) {
                            classFound = true;
                        } else if(classList.contains("pageShadowContrastBlack" + i)) {
                            classFound = true;
                        }
                    }

                    if(classList.contains("pageShadowContrastBlackCustom")) {
                        classFound = true;
                    }

                    if(!classFound) {
                        reApplyContrast = true;
                    }
                }

                mutations.forEach(mutation => {
                    if(currentSettings.colorInvert !== null && currentSettings.colorInvert == "true") {
                        if(mutation.type == "attributes" && mutation.attributeName == "class") {
                            const classList = document.body.classList;

                            if(mutation.oldValue && ((mutation.oldValue.indexOf("pageShadowInvertImageColor") !== -1 && !classList.contains("pageShadowInvertImageColor"))
                                || (mutation.oldValue.indexOf("pageShadowInvertVideoColor") !== -1 && !classList.contains("pageShadowInvertVideoColor"))
                                || (mutation.oldValue.indexOf("pageShadowInvertBgColor") !== -1 && !classList.contains("pageShadowInvertBgColor"))
                                || (mutation.oldValue.indexOf("pageShadowEnableSelectiveInvert") !== -1 && !classList.contains("pageShadowEnableSelectiveInvert")))) {
                                reApplyInvert = true;
                            }
                        }

                        if(mutation.type == "attributes" && mutation.attributeName == "class") {
                            const classList = document.body.classList;

                            if(mutation.oldValue && mutation.oldValue.indexOf("pageShadowDisableImgBgColor") !== -1 && !classList.contains("pageShadowDisableImgBgColor")) {
                                reApplyInvert = true;
                            }
                        }
                    }

                    if(currentSettings.attenuateImageColor !== null && currentSettings.attenuateImageColor == "true") {
                        if(mutation.type == "attributes" && mutation.attributeName == "class") {
                            const classList = document.body.classList;

                            if(mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateImageColor") !== -1 && !classList.contains("pageShadowAttenuateImageColor")) {
                                reApplyAttenuate = true;
                            }
                        }
                    }
                });

                if(reApplyContrast || reApplyInvert || reApplyAttenuate) {
                    const timerReapply = new SafeTimer(() => {
                        timerReapply.clear();

                        if(!reApplyContrast && (reApplyInvert || reApplyAttenuate)) {
                            main(TYPE_ONLY_INVERT, MUTATION_TYPE_BODY);
                        } else {
                            main(TYPE_ONLY_CONTRAST, MUTATION_TYPE_BODY);
                        }
                    });

                    timerReapply.start(websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve(MUTATION_TYPE_BODY);
                    } else {
                        window.addEventListener("load", () => {
                            mutationObserve(MUTATION_TYPE_BODY);
                        });
                    }
                }
            });

            mut_body.observe(document.body, {
                "attributes": true,
                "subtree": false,
                "childList": false,
                "characterData": false,
                "attributeOldValue": true,
                "attributeFilter": ["class"]
            });
        } else if(type == MUTATION_TYPE_BRIGHTNESS_BLUELIGHT) { // Mutation Observer for the brigthness/bluelight settings
            if(typeof mut_brightness_bluelight !== "undefined") mut_brightness_bluelight.disconnect();

            mut_brightness_bluelight = new MutationObserver(mutations => {
                mut_brightness_bluelight.disconnect();

                let reApplyBrightness = false;
                let reApplyBlueLight = false;

                mutations.forEach(mutation => {
                    if(currentSettings.pageLumEnabled != undefined && currentSettings.pageLumEnabled === "true") {
                        if((!document.body.contains(elementBrightness) || !document.body.contains(elementBrightnessWrapper)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                            reApplyBrightness = true;
                        }
                    }

                    if(currentSettings.blueLightReductionEnabled != undefined && currentSettings.blueLightReductionEnabled === "true") {
                        if((!document.body.contains(elementBlueLightFilter) || !document.body.contains(elementBrightnessWrapper)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                            reApplyBlueLight = true;
                        }
                    }
                });

                if(reApplyBrightness || reApplyBlueLight) {
                    const timerApplyMutationBlueLight = new SafeTimer(() => {
                        timerApplyMutationBlueLight.clear();

                        if(reApplyBrightness && reApplyBlueLight) {
                            main(TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                        } else if(reApplyBrightness) {
                            main(TYPE_ONLY_BRIGHTNESS, MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                        } else if(reApplyBlueLight) {
                            main(TYPE_ONLY_BLUELIGHT, MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                        }
                    });

                    timerApplyMutationBlueLight.start(websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve(MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                    } else {
                        window.addEventListener("load", () => {
                            mutationObserve(MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                        });
                    }
                }
            });

            mut_brightness_bluelight.observe(elementBrightnessWrapper, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false
            });
        } else if(type == MUTATION_TYPE_BACKGROUNDS) { // Mutation Observer for analyzing whole page elements (detecting backgrounds and applying filters)
            // Clear old mutation timers
            if(safeTimerMutationBackgrounds) safeTimerMutationBackgrounds.clear();
            if(safeTimerMutationDelayed) safeTimerMutationDelayed.clear();
            if(mut_backgrounds) mut_backgrounds.disconnect();

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

        if(type === MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || type === MUTATION_TYPE_BRIGHTNESSWRAPPER) { // Mutation for the brightness/bluelight wrapper element
            if(typeof mut_brightness_bluelight_wrapper !== "undefined") mut_brightness_bluelight_wrapper.disconnect();

            mut_brightness_bluelight_wrapper = new MutationObserver(mutations => {
                let reStart = true;
                mut_brightness_bluelight_wrapper.disconnect();

                mutations.forEach(mutation => {
                    mutation.removedNodes.forEach(removedNode => {
                        if(removedNode === elementBrightnessWrapper) {
                            reStart = false;

                            const timerApplyMutationBrightnessWrapper = new SafeTimer(() => {
                                document.body.appendChild(elementBrightnessWrapper);
                                timerApplyMutationBrightnessWrapper.clear();
                                mutationObserve(MUTATION_TYPE_BRIGHTNESSWRAPPER);
                            });

                            timerApplyMutationBrightnessWrapper.start(websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                        }
                    });
                });

                if(reStart) {
                    mutationObserve(MUTATION_TYPE_BRIGHTNESSWRAPPER);
                }
            });

            mut_brightness_bluelight_wrapper.observe(document.body, {
                "attributes": false,
                "subtree": false,
                "childList": true,
                "characterData": false
            });
        }
    }

    function observeBodyChange() {
        if(websiteSpecialFiltersConfig.observeBodyChange) {
            if(timerObserveBodyChange) timerObserveBodyChange.clear();

            timerObserveBodyChange = new SafeTimer(() => {
                if(document.body) {
                    if(!oldBody) oldBody = document.body;

                    if(document.body != oldBody) {
                        main(TYPE_RESET, TYPE_ALL);
                        mutationObserve(MUTATION_TYPE_BACKGROUNDS);
                    }

                    oldBody = document.body;
                }
                timerObserveBodyChange.start(websiteSpecialFiltersConfig.observeBodyChangeTimerInterval);
            });

            timerObserveBodyChange.start(websiteSpecialFiltersConfig.observeBodyChangeTimerInterval);
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
                        treatOneMutationObserverBackgroundCall(mutationList.shift());
                        treatedCount++;

                        if(websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds && treatedCount > websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall) {
                            if(mutationObserverAddedNodes.length > 0) {
                                safeTimerMutationBackgrounds.start(mutationObserverAddedNodes.length < 100 ? 1 : undefined);
                            }

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

            if(mutationObserverAddedNodes.length > 0) {
                safeTimerMutationBackgrounds.start(mutationObserverAddedNodes.length < 100 ? 1 : undefined);
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
        } else if(mutation.type == "attributes") {
            if(!websiteSpecialFiltersConfig.performanceModeEnabled) mutationForElement(mutation.target, mutation.attributeName, mutation.oldValue);
            doProcessFilters(filtersCache, mutation.target, false);
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

        for(const node of addedNodes) {
            if(!websiteSpecialFiltersConfig.performanceModeEnabled) mutationForElement(node, null, null);
            doProcessFilters(filtersCache, node, true);
        }
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

        detectBackgroundForElement(element, false);

        // Detect element childrens
        if(!attribute && websiteSpecialFiltersConfig.enableMutationObserversForSubChilds) {
            if(element.getElementsByTagName) {
                const elementChildrens = element.getElementsByTagName("*");

                if(elementChildrens && elementChildrens.length > 0) {
                    let i = elementChildrens.length;

                    while(i--) {
                        detectBackgroundForElement(elementChildrens[i], false);
                    }
                }
            }
        }
    }

    async function updateFilters() {
        const settings = newSettingsToApply || await getSettings(getCurrentURL());

        if(filtersCache == null) {
            browser.runtime.sendMessage({
                "type": "getFiltersForThisWebsite"
            });
        } else {
            if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true" || settings.attenuateImageColor == "true") doProcessFilters(filtersCache);
        }
    }

    function doProcessFilters(filters, element, applyToChildrens) {
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

                if(element.getElementsByTagName && applyToChildrens) {
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
                                addNewStyleAttribute(element, "background-color: none !important");
                                addClass(element, "pageShadowforceDisableDefaultBackgroundColor");
                            }
                            break;
                        }
                        case "forceDisableDefaultBackground": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultBackground")) {
                                addNewStyleAttribute(element, "background: none !important");
                                addClass(element, "pageShadowforceDisableDefaultBackground");
                            }
                            break;
                        }
                        case "forceDisableDefaultFontColor": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultFontColor")) {
                                addNewStyleAttribute(element, "color: none !important");
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

    function addNewStyleAttribute(element, styleToAdd) {
        const oldStyleAttribute = element.getAttribute("style");
        let newStyleAttribute = (oldStyleAttribute ? oldStyleAttribute : "");
        if(newStyleAttribute.trim() != "" && !newStyleAttribute.trim().endsWith(";")) {
            newStyleAttribute += "; " + styleToAdd;
        } else {
            newStyleAttribute += styleToAdd;
        }
        element.setAttribute("style", newStyleAttribute);
    }

    function processSpecialRules(rules) {
        rules.forEach(rule => {
            const filterTypes = rule.type.split(",");

            filterTypes.forEach(type => {
                if(type == "enablePerformanceMode") websiteSpecialFiltersConfig.performanceModeEnabled = true;
                if(type == "disablePerformanceMode") websiteSpecialFiltersConfig.performanceModeEnabled = false;
                if(type == "enableTransparentBackgroundAutoDetect") websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = true;
                if(type == "disableTransparentBackgroundAutoDetect") websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = false;
                if(type == "enableMutationObserversForSubChilds") websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = true;
                if(type == "disableMutationObserversForSubChilds") websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = false;
                if(type == "opacityDetectedAsTransparentThreshold") websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold = rule.filter;
                if(type == "enableMutationObserverAttributes") websiteSpecialFiltersConfig.enableMutationObserverAttributes = true;
                if(type == "disableMutationObserverAttributes") websiteSpecialFiltersConfig.enableMutationObserverAttributes = false;
                if(type == "enableMutationObserverClass") websiteSpecialFiltersConfig.enableMutationObserverClass = true;
                if(type == "disableMutationObserverClass") websiteSpecialFiltersConfig.enableMutationObserverClass = false;
                if(type == "enableMutationObserverStyle") websiteSpecialFiltersConfig.enableMutationObserverStyle = true;
                if(type == "disableMutationObserverStyle") websiteSpecialFiltersConfig.enableMutationObserverStyle = false;
                if(type == "enableShadowRootStyleOverride") websiteSpecialFiltersConfig.enableShadowRootStyleOverride = true;
                if(type == "disableShadowRootStyleOverride") websiteSpecialFiltersConfig.enableShadowRootStyleOverride = false;
                if(type == "shadowRootStyleOverrideDelay") websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay = rule.filter;
                if(type == "enableThrottleMutationObserverBackgrounds") {
                    websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = true;
                    websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = false;
                }
                if(type == "disableThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = false;
                if(type == "delayMutationObserverBackgrounds") websiteSpecialFiltersConfig.delayMutationObserverBackgrounds = rule.filter;
                if(type == "autoThrottleMutationObserverBackgroundsTreshold") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold = rule.filter;
                if(type == "throttledMutationObserverTreatedByCall") websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall = rule.filter;
                if(type == "disableAutoThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = false;
                if(type == "enableAutoThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = true;
                if(type == "delayApplyMutationObserversSafeTimer") websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer = rule.filter;
                if(type == "observeBodyChange") websiteSpecialFiltersConfig.observeBodyChange = true;
                if(type == "observeBodyChangeTimerInterval") websiteSpecialFiltersConfig.observeBodyChangeTimerInterval = rule.filter;
            });
        });
    }

    function processShadowRoot(currentElement) {
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

    function processOneShadowRoot(element) {
        if(element.shadowRoot) {
            const currentCSSStyle = element.shadowRoot.querySelector(".pageShadowCSSShadowRoot");
            const currentCSSStyleInvert = element.shadowRoot.querySelector(".pageShadowCSSShadowRootInvert");

            if(currentCSSStyle) {
                element.shadowRoot.removeChild(currentCSSStyle);
            }

            if(currentCSSStyleInvert) {
                element.shadowRoot.removeChild(currentCSSStyleInvert);
            }

            if(precEnabled && ((currentSettings.pageShadowEnabled != undefined && currentSettings.pageShadowEnabled == "true") || (currentSettings.colorInvert != undefined && currentSettings.colorInvert == "true") || (currentSettings.attenuateImageColor != undefined && currentSettings.attenuateImageColor == "true"))) {
                if(currentSettings.pageShadowEnabled != undefined && currentSettings.pageShadowEnabled == "true") {
                    const currentTheme = currentSettings.theme;

                    const styleTag = document.createElement("style");
                    styleTag.classList.add("pageShadowCSSShadowRoot");
                    element.shadowRoot.appendChild(styleTag);

                    if(currentTheme.startsWith("custom")) {
                        customTheme(currentSettings.theme.replace("custom", ""), styleTag, false, null, true);
                    } else {
                        processRules(styleTag, defaultThemesBackgrounds[currentTheme - 1].replace("#", ""), defaultThemesLinkColors[currentTheme - 1].replace("#", ""), defaultThemesVisitedLinkColors[currentTheme - 1].replace("#", ""), defaultThemesTextColors[currentTheme - 1].replace("#", ""), null, true);
                    }
                }

                if(currentSettings.colorInvert != undefined && currentSettings.colorInvert == "true") {
                    const styleTagInvert = document.createElement("style");
                    styleTagInvert.classList.add("pageShadowCSSShadowRootInvert");
                    element.shadowRoot.appendChild(styleTagInvert);

                    processRulesInvert(styleTagInvert, currentSettings.colorInvert, currentSettings.invertImageColors, currentSettings.invertEntirePage, currentSettings.invertVideoColors, currentSettings.invertBgColor, currentSettings.selectiveInvert);
                }

                processedShadowRoots.push(element.shadowRoot);
            }
        }
    }

    function resetShadowRoots() {
        for(let i = 0, len = processedShadowRoots.length; i < len; i++) {
            const shadowRoot = processedShadowRoots[i];

            if(shadowRoot) {
                const currentCSSStyle = shadowRoot.querySelector(".pageShadowCSSShadowRoot");
                const currentCSSStyleInvert = shadowRoot.querySelector(".pageShadowCSSShadowRootInvert");

                if(currentCSSStyle) {
                    shadowRoot.removeChild(currentCSSStyle);
                }

                if(currentCSSStyleInvert) {
                    shadowRoot.removeChild(currentCSSStyleInvert);
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

        if(timerApplyBrightnessPage) timerApplyBrightnessPage.clear();
        if(timerApplyContrastPage) timerApplyContrastPage.clear();
        if(timerApplyDetectBackgrounds) timerApplyDetectBackgrounds.clear();
        if(timerApplyInvertColors) timerApplyInvertColors.clear();
        if(timerApplyMutationObservers) timerApplyMutationObservers.clear();

        if(typeof mut_body !== "undefined" && (mutation == MUTATION_TYPE_BODY || mutation == TYPE_ALL)) mut_body.disconnect();
        if(typeof mut_brightness_bluelight !== "undefined" && (mutation == MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == TYPE_ALL)) mut_brightness_bluelight.disconnect();
        if(typeof mut_brightness_bluelight_wrapper !== "undefined" && (mutation == MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == TYPE_ALL)) mut_brightness_bluelight_wrapper.disconnect();
        if(typeof lnkCustomTheme !== "undefined") lnkCustomTheme.setAttribute("href", "");

        if(started && (type == TYPE_RESET || type == TYPE_ONLY_RESET)) {
            removeClass(document.body, "pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowContrastBlackCustom", "pageShadowDisableImgBgColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert", "pageShadowAttenuateImageColor");
            removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground", "pageShadowBackgroundCustom");

            for(let i = 1; i <= nbThemes; i++) {
                removeClass(document.body, (i == 1 ? "pageShadowContrastBlack" : "pageShadowContrastBlack" + i));
                removeClass(document.getElementsByTagName("html")[0], (i == 1 ? "pageShadowBackgroundContrast" : "pageShadowBackgroundContrast" + i));
            }

            if(elementBrightnessWrapper && document.body && document.body.contains(elementBrightnessWrapper) && document.body.contains(elementBrightness)) {
                elementBrightnessWrapper.removeChild(elementBrightness);
            }

            if(elementBrightnessWrapper && document.body && document.body.contains(elementBrightnessWrapper) && document.body.contains(elementBlueLightFilter)) {
                elementBrightnessWrapper.removeChild(elementBlueLightFilter);
            }

            resetShadowRoots();

            if(type == TYPE_ONLY_RESET) {
                return;
            }
        }

        typeProcess = type;

        observeBodyChange();

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
                contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, null, settings.selectiveInvert, settings.attenuateImageColor);
            } else if(type == TYPE_ONLY_INVERT) {
                invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, null, settings.selectiveInvert, settings.attenuateImageColor);
            } else if(type == TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == TYPE_ONLY_BRIGHTNESS || type == TYPE_ONLY_BLUELIGHT) {
                if(type == TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == TYPE_ONLY_BRIGHTNESS) {
                    brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                }

                if(type == TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == TYPE_ONLY_BLUELIGHT) {
                    blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);
                }
            } else if(settings.pageShadowEnabled == "true") {
                waitAndApplyContrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, customElement, settings.selectiveInvert, settings.attenuateImageColor);
            } else {
                waitAndApplyInvertColors(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, customElement, settings.selectiveInvert, settings.attenuateImageColor);
            }

            if(type !== TYPE_ONLY_CONTRAST && type !== TYPE_ONLY_INVERT && type !== TYPE_ONLY_BRIGHTNESS && type !== TYPE_ONLY_BLUELIGHT && !customElement) {
                brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);

                if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true" || settings.attenuateImageColor == "true") {
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

            waitAndApplyMutationObservers();
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
                    if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true" || settings.attenuateImageColor == "true") doProcessFilters(message.filters);
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

        if(isLiveSettings && runningInPopup) {
            const allowed = await pageShadowAllowed(getCurrentURL());
            statusChanged = hasEnabledStateChanged(allowed);
        }

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