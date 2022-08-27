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
import { pageShadowAllowed, customTheme, getSettings, getCurrentURL, hasSettingsChanged, removeClass, isRunningInIframe, isRunningInPopup, loadWebsiteSpecialFiltersConfig, sendMessageWithPromise } from "./utils/util.js";
import { nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, ignoredElementsContentScript } from "./constants.js";
import browser from "webextension-polyfill";
import SafeTimer from "./utils/safeTimer.js";
import MutationObserverWrapper from "./utils/mutationObserver.js";
import ClassBatcher from "./utils/classBatcher.js";
import ApplyBodyAvailable from "./utils/applyBodyAvailable.js";
import PageAnalyzer from "./utils/pageAnalyzer.js";
import FilterProcessor from "./utils/filterProcessor.js";

(async function() {
    const style = document.createElement("style");
    const lnkCustomTheme = document.createElement("link");
    const elementBrightnessWrapper = document.createElement("div");
    const elementBrightness = document.createElement("div");
    const elementBlueLightFilter = document.createElement("div");
    const websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
    const runningInIframe = isRunningInIframe();
    const runningInPopup = isRunningInPopup();

    let precEnabled = false;
    let started = false;
    let filtersCache = null;
    let mut_body, mut_backgrounds, mut_brightness_bluelight, mut_brightness_bluelight_wrapper;
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
    const TYPE_ONLY_BLUELIGHT = "onlyBlueLight";
    const TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT = "onlyBrightnessAndBlueLight";
    const MUTATION_TYPE_BODY = "body";
    const MUTATION_TYPE_BACKGROUNDS = "backgrounds";
    const MUTATION_TYPE_BRIGHTNESSWRAPPER = "brightnesswrapper";
    const MUTATION_TYPE_BRIGHTNESS_BLUELIGHT = "brightnessbluelight";
    const TYPE_LOADING = "loading";
    const TYPE_START = "start";

    // Timers
    let timerObserveBodyChange = null;
    let applyWhenBodyIsAvailableTimer = null;

    // Batcher
    let bodyClassBatcher;
    let htmlClassBatcher;
    let bodyClassBatcherRemover;

    // Page and Filter processors
    let pageAnalyzer;
    let filterProcessor;

    function contrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, selectiveInvert, attenuateImageColor) {
        if(pageShadowEnabled != undefined && pageShadowEnabled == "true") {
            if(theme != undefined) {
                if(theme == "1") {
                    bodyClassBatcher.add("pageShadowContrastBlack");
                    htmlClassBatcher.add("pageShadowBackgroundContrast");
                } else if(theme.startsWith("custom")) {
                    customThemeApply(theme);
                    bodyClassBatcher.add("pageShadowContrastBlackCustom");
                    htmlClassBatcher.add("pageShadowBackgroundCustom");
                } else {
                    bodyClassBatcher.add("pageShadowContrastBlack" + theme);
                    htmlClassBatcher.add("pageShadowBackgroundContrast" + theme);
                }

                resetContrastPage(theme);
            } else {
                bodyClassBatcher.add("pageShadowContrastBlack");
                htmlClassBatcher.add("pageShadowBackgroundContrast");
                resetContrastPage(1);
            }

            if(disableImgBgColor != undefined && disableImgBgColor == "true") {
                bodyClassBatcher.add("pageShadowDisableImgBgColor");
            }
        } else {
            resetContrastPage();
        }

        invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert, attenuateImageColor);
    }

    function resetContrastPage(themeException) {
        const removeBatcher = new ClassBatcher(document.body);
        const removeBatcherHTML = new ClassBatcher(document.getElementsByTagName("html")[0]);

        if(!themeException || !themeException.startsWith("custom")) {
            if(typeof lnkCustomTheme !== "undefined") lnkCustomTheme.setAttribute("href", "");
            removeBatcherHTML.add("pageShadowBackgroundCustom");
            removeBatcher.add("pageShadowContrastBlackCustom");
        }

        for(let i = 1; i <= nbThemes; i++) {
            if(!themeException || themeException != i) {
                removeBatcher.add((i == 1 ? "pageShadowContrastBlack" : "pageShadowContrastBlack" + i));
                removeBatcherHTML.add((i == 1 ? "pageShadowBackgroundContrast" : "pageShadowBackgroundContrast" + i));
            }
        }

        removeBatcher.add("pageShadowDisableImgBgColor");

        removeBatcher.applyRemove();
        removeBatcherHTML.applyRemove();
    }

    function customThemeApply(theme) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            customTheme(theme.replace("custom", ""), style, false, lnkCustomTheme, false);
        }
    }

    function invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert, attenuateImageColor) {
        document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%)");

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                htmlClassBatcher.add("pageShadowInvertEntirePage", "pageShadowBackground");

                if(invertImageColors != null && invertImageColors == "true") {
                    bodyClassBatcherRemover.add("pageShadowInvertImageColor");
                } else {
                    bodyClassBatcher.add("pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors == "true") {
                    bodyClassBatcherRemover.add("pageShadowInvertBgColor");
                } else {
                    bodyClassBatcher.add("pageShadowInvertVideoColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                } else {
                    bodyClassBatcher.add("pageShadowInvertBgColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                } else {
                    bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                }
            } else {
                removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");

                if(invertImageColors != null && invertImageColors == "true") {
                    bodyClassBatcher.add("pageShadowInvertImageColor");
                } else {
                    bodyClassBatcherRemover.add("pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors != "false") {
                    bodyClassBatcher.add("pageShadowInvertBgColor");
                } else {
                    bodyClassBatcherRemover.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    bodyClassBatcher.add("pageShadowInvertVideoColor");
                } else {
                    bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                } else {
                    bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                }
            }
        } else {
            resetInvertPage();
        }

        attenuateColor(attenuateImageColor);
    }

    function resetInvertPage() {
        bodyClassBatcherRemover.add("pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert");
        removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");
    }

    function attenuateColor(enabled) {
        if(enabled == "true") {
            document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%) grayscale(50%)");
            bodyClassBatcher.add("pageShadowAttenuateImageColor");
        } else {
            resetAttenuateColor();
        }
    }

    function resetAttenuateColor() {
        bodyClassBatcherRemover.add("pageShadowAttenuateImageColor");
    }

    async function applyDetectBackground(type, elements) {
        if(pageAnalyzer.backgroundDetected) return false;
        await pageAnalyzer.setSettings(websiteSpecialFiltersConfig, currentSettings, precEnabled);

        if(document.readyState === "complete") {
            const timerBackgrounds = new SafeTimer(async() => {
                timerBackgrounds.clear();
                await pageAnalyzer.detectBackground(elements);
                mutationObserve(MUTATION_TYPE_BACKGROUNDS);
            });

            timerBackgrounds.start(1);
        } else {
            if(type == TYPE_LOADING) {
                window.addEventListener("load", () => {
                    // when the page is entirely loaded
                    if(document.readyState === "complete") {
                        const timerBackgrounds = new SafeTimer(async() => {
                            timerBackgrounds.clear();
                            await pageAnalyzer.detectBackground(elements);
                            mutationObserve(MUTATION_TYPE_BACKGROUNDS);
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

            appendBrightnessElement(elementBrightness, elementBrightnessWrapper);
        } else {
            resetBrightnessPage();
        }
    }

    function resetBrightnessPage() {
        if(elementBrightnessWrapper && document.body && document.body.contains(elementBrightnessWrapper) && document.body.contains(elementBrightness)) {
            elementBrightnessWrapper.removeChild(elementBrightness);
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

            appendBlueLightElement(elementBlueLightFilter, elementBrightnessWrapper);
        } else {
            resetBlueLightPage();
        }
    }

    function resetBlueLightPage() {
        if(elementBrightnessWrapper && document.body && document.body.contains(elementBrightnessWrapper) && document.body.contains(elementBlueLightFilter)) {
            elementBrightnessWrapper.removeChild(elementBlueLightFilter);
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

    function appendBlueLightElement(elementBrightness, elementWrapper) {
        if(document.body) {
            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBlueLightFilter)) {
                elementWrapper.removeChild(elementBlueLightFilter);
            }

            document.body.appendChild(elementWrapper);
        }

        elementWrapper.appendChild(elementBrightness);
    }

    function mutationObserve(type, forceReset) {
        // Mutation Observer for the body element classList (contrast/invert/attenuate)
        if(type == MUTATION_TYPE_BODY) {
            if(mut_body != null && !forceReset) {
                mut_body.start();
            } else {
                if(typeof mut_body !== "undefined") mut_body.disconnect();

                mut_body = new MutationObserverWrapper(mutations => {
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
                }, {
                    "attributes": true,
                    "subtree": false,
                    "childList": false,
                    "characterData": false,
                    "attributeOldValue": true,
                    "attributeFilter": ["class"]
                }, null, false);

                mut_body.start();
            }
        } else if(type == MUTATION_TYPE_BRIGHTNESS_BLUELIGHT) { // Mutation Observer for the brigthness/bluelight settings
            if(mut_brightness_bluelight != null && !forceReset) {
                mut_brightness_bluelight.start();
            } else {
                if(typeof mut_brightness_bluelight !== "undefined") mut_brightness_bluelight.disconnect();

                mut_brightness_bluelight = new MutationObserverWrapper(mutations => {
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
                }, {
                    "attributes": true,
                    "subtree": true,
                    "childList": true,
                    "characterData": false
                }, elementBrightnessWrapper, false);

                mut_brightness_bluelight.start();
            }
        } else if(type == MUTATION_TYPE_BACKGROUNDS) { // Mutation Observer for analyzing whole page elements (detecting backgrounds and applying filters)
            if(mut_backgrounds != null && !forceReset) {
                mut_backgrounds.start();
            } else {
                // Clear old mutation timers
                if(safeTimerMutationBackgrounds) safeTimerMutationBackgrounds.clear();
                if(safeTimerMutationDelayed) safeTimerMutationDelayed.clear();
                if(mut_backgrounds) mut_backgrounds.disconnect();

                mut_backgrounds = new MutationObserverWrapper(mutations => {
                    delayedMutationObserversCalls.push(mutations);

                    if(websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds) {
                        safeTimerMutationDelayed.start(websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                    } else {
                        treatMutationObserverBackgroundCalls();
                    }

                    mut_backgrounds.start();
                }, {
                    "attributes": true,
                    "subtree": true,
                    "childList": true,
                    "characterData": false,
                    "attributeFilter": ["class", "style"],
                    "attributeOldValue": true,
                    "characterDataOldValue": false
                }, null, true);

                safeTimerMutationBackgrounds = new SafeTimer(mutationElementsBackgrounds);
                safeTimerMutationDelayed = new SafeTimer(treatMutationObserverBackgroundCalls);

                mut_backgrounds.start();
            }
        }

        // Mutation for the brigthness wrapper element
        if(type === MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || type === MUTATION_TYPE_BRIGHTNESSWRAPPER) { // Mutation for the brightness/bluelight wrapper element
            if(mut_brightness_bluelight_wrapper != null && !forceReset) {
                mut_brightness_bluelight_wrapper.start();
            } else {
                if(typeof mut_brightness_bluelight_wrapper !== "undefined") mut_brightness_bluelight_wrapper.disconnect();

                mut_brightness_bluelight_wrapper = new MutationObserverWrapper(mutations => {
                    let reStart = true;
                    mut_brightness_bluelight_wrapper.pause();

                    mutations.forEach(mutation => {
                        mutation.removedNodes.forEach(removedNode => {
                            if(removedNode === elementBrightnessWrapper) {
                                reStart = false;

                                const timerApplyMutationBrightnessWrapper = new SafeTimer(() => {
                                    document.body.appendChild(elementBrightnessWrapper);
                                    timerApplyMutationBrightnessWrapper.clear();
                                    mutationObserve(MUTATION_TYPE_BRIGHTNESSWRAPPER);
                                });

                                timerApplyMutationBrightnessWrapper.start();
                            }
                        });
                    });

                    if(reStart) {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            mutationObserve(MUTATION_TYPE_BRIGHTNESSWRAPPER);
                        } else {
                            window.addEventListener("load", () => {
                                mutationObserve(MUTATION_TYPE_BRIGHTNESSWRAPPER);
                            });
                        }
                    }
                }, {
                    "attributes": false,
                    "subtree": false,
                    "childList": true,
                    "characterData": false
                }, null, false);

                mut_brightness_bluelight_wrapper.start();
            }
        }
    }

    function observeBodyChange() {
        if(websiteSpecialFiltersConfig.observeBodyChange) {
            if(timerObserveBodyChange) timerObserveBodyChange.clear();

            timerObserveBodyChange = new SafeTimer(() => {
                if(document.body) {
                    if(!oldBody) oldBody = document.body;

                    if(document.body != oldBody) {
                        bodyClassBatcher = new ClassBatcher(document.body);
                        bodyClassBatcherRemover = new ClassBatcher(document.body);
                        htmlClassBatcher = new ClassBatcher(document.getElementsByTagName("html")[0]);

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

    async function treatMutationObserverBackgroundCalls() {
        if(delayedMutationObserversCalls.length > 0) {
            let i = delayedMutationObserversCalls.length;
            let treatedCount = 0;
            await pageAnalyzer.setSettings(websiteSpecialFiltersConfig, currentSettings, precEnabled);

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
            if(!websiteSpecialFiltersConfig.performanceModeEnabled) pageAnalyzer.mutationForElement(mutation.target, mutation.attributeName, mutation.oldValue);
            filterProcessor.doProcessFilters(filtersCache, mutation.target, false);
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
            if(!websiteSpecialFiltersConfig.performanceModeEnabled) pageAnalyzer.mutationForElement(node, null, null);
            filterProcessor.doProcessFilters(filtersCache, node, true);
        }
    }

    async function updateFilters() {
        if(filtersCache == null) {
            const response = await sendMessageWithPromise({ "type": "getFiltersForThisWebsite" }, "getFiltersResponse");

            if(response.filters) {
                filtersCache = response.filters;
                filterProcessor.processSpecialRules(response.specialFilters, websiteSpecialFiltersConfig);
            }
        }

        await pageAnalyzer.setSettings(websiteSpecialFiltersConfig, currentSettings, precEnabled);
        if(currentSettings.pageShadowEnabled == "true" || currentSettings.colorInvert == "true" || currentSettings.attenuateImageColor == "true") filterProcessor.doProcessFilters(filtersCache);
    }

    async function main(type, mutation, disableCache) {
        precUrl = getCurrentURL();
        oldBody = document.body;

        if(type == TYPE_RESET) {
            mutation = TYPE_ALL;
        }

        if(typeof mut_body !== "undefined" && (mutation == MUTATION_TYPE_BODY || mutation == TYPE_ALL)) mut_body.pause();
        if(typeof mut_brightness_bluelight !== "undefined" && (mutation == MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == TYPE_ALL)) mut_brightness_bluelight.pause();
        if(typeof mut_brightness_bluelight_wrapper !== "undefined" && (mutation == MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == TYPE_ALL)) mut_brightness_bluelight_wrapper.pause();

        if(runningInIframe) {
            const responseEnabled = await sendMessageWithPromise({ "type": "isEnabledForThisPage" }, "isEnabledForThisPageResponse");

            if(responseEnabled.enabled) {
                newSettingsToApply = responseEnabled.settings;
            }

            process(responseEnabled.enabled, type);
        } else {
            const allowed = await pageShadowAllowed(getCurrentURL());
            process(allowed, type, disableCache);
        }
    }

    async function process(allowed, type, disableCache) {
        if(applyWhenBodyIsAvailableTimer) applyWhenBodyIsAvailableTimer.clear();

        applyWhenBodyIsAvailableTimer = new ApplyBodyAvailable(async() => {
            pageAnalyzer = pageAnalyzer || new PageAnalyzer(websiteSpecialFiltersConfig, currentSettings, precEnabled);
            filterProcessor = filterProcessor || new FilterProcessor(pageAnalyzer);

            if(allowed) {
                const settings = newSettingsToApply || await getSettings(getCurrentURL(), disableCache);

                currentSettings = settings;
                precEnabled = true;
                bodyClassBatcher = bodyClassBatcher || new ClassBatcher(document.body);
                bodyClassBatcherRemover = bodyClassBatcherRemover || new ClassBatcher(document.body);
                htmlClassBatcher = htmlClassBatcher || new ClassBatcher(document.getElementsByTagName("html")[0]);

                if(type == TYPE_ONLY_INVERT) {
                    bodyClassBatcher.removeAll();
                    bodyClassBatcherRemover.removeAll();
                    htmlClassBatcher.removeAll();

                    invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, settings.selectiveInvert, settings.attenuateImageColor);

                    bodyClassBatcher.applyAdd();
                    bodyClassBatcherRemover.applyRemove();
                    htmlClassBatcher.applyAdd();
                } else if(type == TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == TYPE_ONLY_BRIGHTNESS || type == TYPE_ONLY_BLUELIGHT) {
                    if(type == TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == TYPE_ONLY_BRIGHTNESS) {
                        brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                    }

                    if(type == TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == TYPE_ONLY_BLUELIGHT) {
                        blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);
                    }
                } else {
                    bodyClassBatcher.removeAll();
                    bodyClassBatcherRemover.removeAll();
                    htmlClassBatcher.removeAll();

                    contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, settings.selectiveInvert, settings.attenuateImageColor);

                    bodyClassBatcher.applyAdd();
                    bodyClassBatcherRemover.applyRemove();
                    htmlClassBatcher.applyAdd();
                }

                if(type !== TYPE_ONLY_CONTRAST && type !== TYPE_ONLY_INVERT && type !== TYPE_ONLY_BRIGHTNESS && type !== TYPE_ONLY_BLUELIGHT) {
                    brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                    blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);

                    const specialRules = await sendMessageWithPromise({ "type": "getSpecialRules" }, "getSpecialRulesResponse");
                    filterProcessor.processSpecialRules(specialRules.filters, websiteSpecialFiltersConfig);

                    observeBodyChange();

                    if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true" || settings.attenuateImageColor == "true") {
                        if(type == TYPE_START || !pageAnalyzer.backgroundDetected) {
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

                mutationObserve(MUTATION_TYPE_BODY);
                mutationObserve(MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
            } else {
                precEnabled = false;
                if(typeof lnkCustomTheme !== "undefined") lnkCustomTheme.setAttribute("href", "");

                if(started) {
                    resetContrastPage();
                    resetInvertPage();
                    resetAttenuateColor();
                    resetBrightnessPage();
                    resetBlueLightPage();
                    pageAnalyzer.resetShadowRoots();
                }
            }

            started = true;
        });

        applyWhenBodyIsAvailableTimer.start(1);
    }

    // Start the processing of the page
    main(TYPE_START);

    // If storage/settings have changed
    browser.storage.onChanged.addListener(() => {
        applyIfSettingsChanged(false, true);
    });

    // Message/response handling
    browser.runtime.onMessage.addListener(async(message) => {
        if(message && message.type == "websiteUrlUpdated") { // Execute when the page URL changes in Single Page Applications
            let changed = hasEnabledStateChanged(message.enabled);
            const urlUpdated = precUrl != getCurrentURL();

            if(urlUpdated) {
                pageAnalyzer.backgroundDetected = false;
                precUrl = getCurrentURL();
                filtersCache = null;
                if(hasSettingsChanged(currentSettings, message.settings)) changed = true;
                updateFilters();
            }

            if(changed) {
                applyIfSettingsChanged(true, message.storageChanged, message.enabled);
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
                const response = await sendMessageWithPromise({ "type": "applySettingsChanged" }, "applySettingsChangedResponse");
                const changed = hasEnabledStateChanged(response.enabled);

                if(changed || hasSettingsChanged(currentSettings, response.settings)) {
                    precEnabled = response.enabled;
                    main(TYPE_RESET, TYPE_ALL, true);
                }
            } else {
                if(hasSettingsChanged(currentSettings, await getSettings(getCurrentURL(), true))) {
                    precEnabled = isEnabled;
                    main(TYPE_RESET, TYPE_ALL, true);
                }
            }
        }
    }
}());