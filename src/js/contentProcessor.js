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
import { pageShadowAllowed, getSettings, getCurrentURL, removeClass, isRunningInIframe, isRunningInPopup, loadWebsiteSpecialFiltersConfig, sendMessageWithPromise } from "./utils/util.js";
import { nbThemes, colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, ignoredElementsContentScript } from "./constants.js";
import SafeTimer from "./utils/safeTimer.js";
import MutationObserverWrapper from "./utils/mutationObserver.js";
import ClassBatcher from "./utils/classBatcher.js";
import ApplyBodyAvailable from "./utils/applyBodyAvailable.js";
import PageAnalyzer from "./utils/pageAnalyzer.js";
import FilterProcessor from "./utils/filterProcessor.js";

/**
 * Main class used by the content script
 */
export default class ContentProcessor {
    style = document.createElement("style");
    lnkCustomTheme = document.createElement("link");
    elementBrightnessWrapper = document.createElement("div");
    elementBrightness = document.createElement("div");
    elementBlueLightFilter = document.createElement("div");
    websiteSpecialFiltersConfig = {};
    runningInIframe = isRunningInIframe();
    runningInPopup = isRunningInPopup();

    precEnabled = false;
    started = false;
    filtersCache = null;
    mut_body;
    mut_backgrounds;
    mut_brightness_bluelight;
    mut_brightness_bluelight_wrapper;
    precUrl = null;
    currentSettings = null;
    newSettingsToApply = null;
    safeTimerMutationBackgrounds = null;
    mutationObserverAddedNodes = [];
    delayedMutationObserversCalls = [];
    safeTimerMutationDelayed = null;
    oldBody = null;

    // Contants
    TYPE_RESET = "reset";
    TYPE_ALL = "all";
    TYPE_ONLY_CONTRAST = "onlyContrast";
    TYPE_ONLY_INVERT = "onlyInvert";
    TYPE_ONLY_BRIGHTNESS = "onlyBrightness";
    TYPE_ONLY_BLUELIGHT = "onlyBlueLight";
    TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT = "onlyBrightnessAndBlueLight";
    MUTATION_TYPE_BODY = "body";
    MUTATION_TYPE_BACKGROUNDS = "backgrounds";
    MUTATION_TYPE_BRIGHTNESSWRAPPER = "brightnesswrapper";
    MUTATION_TYPE_BRIGHTNESS_BLUELIGHT = "brightnessbluelight";
    TYPE_LOADING = "loading";
    TYPE_START = "start";

    // Timers
    timerObserveBodyChange = null;
    applyWhenBodyIsAvailableTimer = null;

    // Batcher
    bodyClassBatcher;
    htmlClassBatcher;
    bodyClassBatcherRemover;

    // Page and Filter processors
    pageAnalyzer;
    filterProcessor;

    constructor() {
        this.setup();
    }

    async setup() {
        this.websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
    }

    contrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, selectiveInvert, attenuateImageColor) {
        if(pageShadowEnabled != undefined && pageShadowEnabled == "true") {
            if(theme != undefined) {
                if(theme == "1") {
                    this.bodyClassBatcher.add("pageShadowContrastBlack");
                    this.htmlClassBatcher.add("pageShadowBackgroundContrast");
                } else if(theme.startsWith("custom")) {
                    this.customThemeApply(theme);
                    this.bodyClassBatcher.add("pageShadowContrastBlackCustom");
                    this.htmlClassBatcher.add("pageShadowBackgroundCustom");
                } else {
                    this.bodyClassBatcher.add("pageShadowContrastBlack" + theme);
                    this.htmlClassBatcher.add("pageShadowBackgroundContrast" + theme);
                }

                this.resetContrastPage(theme, disableImgBgColor);
            } else {
                this.bodyClassBatcher.add("pageShadowContrastBlack");
                this.htmlClassBatcher.add("pageShadowBackgroundContrast");
                this.resetContrastPage(1, disableImgBgColor);
            }

            if(disableImgBgColor != undefined && disableImgBgColor == "true") {
                this.bodyClassBatcher.add("pageShadowDisableImgBgColor");
            }
        } else {
            this.resetContrastPage();
        }

        this.invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert, attenuateImageColor);
    }

    resetContrastPage(themeException, disableImgBgColor) {
        const removeBatcherHTML = new ClassBatcher(document.getElementsByTagName("html")[0]);

        if(!themeException || !themeException.startsWith("custom")) {
            if(typeof this.lnkCustomTheme !== "undefined") this.lnkCustomTheme.setAttribute("href", "");
            removeBatcherHTML.add("pageShadowBackgroundCustom");
            this.bodyClassBatcherRemover.add("pageShadowContrastBlackCustom");
        }

        for(let i = 1; i <= nbThemes; i++) {
            if(!themeException || themeException != i) {
                this.bodyClassBatcherRemover.add((i == 1 ? "pageShadowContrastBlack" : "pageShadowContrastBlack" + i));
                removeBatcherHTML.add((i == 1 ? "pageShadowBackgroundContrast" : "pageShadowBackgroundContrast" + i));
            }
        }

        if(disableImgBgColor != "true") {
            this.bodyClassBatcherRemover.add("pageShadowDisableImgBgColor");
        }

        removeBatcherHTML.applyRemove();
    }

    customThemeApply(theme) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            this.customTheme(theme.replace("custom", ""), this.style, false, this.lnkCustomTheme, false);
        }
    }

    invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert, attenuateImageColor) {
        document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%)");

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                this.htmlClassBatcher.add("pageShadowInvertEntirePage", "pageShadowBackground");

                if(invertImageColors != null && invertImageColors == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertImageColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBgColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertVideoColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertBgColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                } else {
                    this.bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                }
            } else {
                removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");

                if(invertImageColors != null && invertImageColors == "true") {
                    this.bodyClassBatcher.add("pageShadowInvertImageColor");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertImageColor");
                }

                if(invertBgColors != null && invertBgColors != "false") {
                    this.bodyClassBatcher.add("pageShadowInvertBgColor");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    this.bodyClassBatcher.add("pageShadowInvertVideoColor");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    this.bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                }
            }
        } else {
            this.resetInvertPage();
        }

        this.attenuateColor(attenuateImageColor);
    }

    resetInvertPage() {
        this.bodyClassBatcherRemover.add("pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert");
        removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");
    }

    attenuateColor(enabled) {
        if(enabled == "true") {
            document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%) grayscale(50%)");
            this.bodyClassBatcher.add("pageShadowAttenuateImageColor");
        } else {
            this.resetAttenuateColor();
        }
    }

    resetAttenuateColor() {
        this.bodyClassBatcherRemover.add("pageShadowAttenuateImageColor");
    }

    async applyDetectBackground(type, elements) {
        if(this.pageAnalyzer.backgroundDetected) return false;
        await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);

        if(document.readyState === "complete") {
            const timerBackgrounds = new SafeTimer(async() => {
                timerBackgrounds.clear();
                await this.pageAnalyzer.detectBackground(elements);
                this.mutationObserve(this.MUTATION_TYPE_BACKGROUNDS);
            });

            timerBackgrounds.start(1);
        } else {
            if(type == this.TYPE_LOADING) {
                window.addEventListener("load", () => {
                    // when the page is entirely loaded
                    if(document.readyState === "complete") {
                        const timerBackgrounds = new SafeTimer(async() => {
                            timerBackgrounds.clear();
                            await this.pageAnalyzer.detectBackground(elements);
                            this.mutationObserve(this.MUTATION_TYPE_BACKGROUNDS);
                        });

                        timerBackgrounds.start(250);
                    }
                });
            } else {
                this.applyDetectBackground(this.TYPE_LOADING, elements);
            }
        }
    }

    brightnessPage(enabled, percentage) {
        this.elementBrightness.setAttribute("class", "");

        if(enabled == "true" && !this.runningInIframe) {
            this.elementBrightness.style.display = "block";
            this.elementBrightness.setAttribute("id", "pageShadowBrightness");

            if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                this.elementBrightness.style.opacity = brightnessDefaultValue;
            } else {
                this.elementBrightness.style.opacity = percentage / 100;
            }

            this.appendBrightnessElement(this.elementBrightness, this.elementBrightnessWrapper);
        } else {
            this.resetBrightnessPage();
        }
    }

    resetBrightnessPage() {
        if(this.elementBrightnessWrapper && document.body && document.body.contains(this.elementBrightnessWrapper) && document.body.contains(this.elementBrightness)) {
            this.elementBrightnessWrapper.removeChild(this.elementBrightness);
        }
    }

    blueLightFilterPage(enabled, percentage, colorTemp) {
        this.elementBlueLightFilter.setAttribute("class", "");

        if(enabled == "true" && !this.runningInIframe) {
            this.elementBlueLightFilter.style.display = "block";
            this.elementBlueLightFilter.setAttribute("id", "pageShadowBrightnessNightMode");
            this.elementBlueLightFilter.setAttribute("class", "");

            let tempColor = "2000";

            if(colorTemp != undefined) {
                const tempIndex = parseInt(colorTemp);
                tempColor = colorTemperaturesAvailable[tempIndex - 1];

                this.elementBlueLightFilter.setAttribute("class", "k" + tempColor);
            } else {
                this.elementBlueLightFilter.setAttribute("class", "k2000");
            }

            if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                this.elementBlueLightFilter.style.opacity = brightnessDefaultValue;
            } else {
                this.elementBlueLightFilter.style.opacity = percentage / 100;
            }

            this.appendBlueLightElement(this.elementBlueLightFilter, this.elementBrightnessWrapper);
        } else {
            this.resetBlueLightPage();
        }
    }

    resetBlueLightPage() {
        if(this.elementBrightnessWrapper && document.body && document.body.contains(this.elementBrightnessWrapper) && document.body.contains(this.elementBlueLightFilter)) {
            this.elementBrightnessWrapper.removeChild(this.elementBlueLightFilter);
        }
    }

    appendBrightnessElement(elementBrightness, elementWrapper) {
        if(document.body) {
            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBrightness)) {
                elementWrapper.removeChild(elementBrightness);
            }

            document.body.appendChild(elementWrapper);
        }

        elementWrapper.appendChild(elementBrightness);
    }

    appendBlueLightElement(elementBlueLightFilter, elementWrapper) {
        if(document.body) {
            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBlueLightFilter)) {
                elementWrapper.removeChild(elementBlueLightFilter);
            }

            document.body.appendChild(elementWrapper);
        }

        elementWrapper.appendChild(elementBlueLightFilter);
    }

    mutationObserve(type, forceReset) {
        // Mutation Observer for the body element classList (contrast/invert/attenuate)
        if(type == this.MUTATION_TYPE_BODY) {
            if(this.mut_body != null && !forceReset) {
                this.mut_body.start();
            } else {
                if(typeof this.mut_body !== "undefined") this.mut_body.disconnect();

                this.mut_body = new MutationObserverWrapper(mutations => {
                    const classList = document.body.classList;

                    let reApplyContrast = false;
                    let reApplyInvert = false;
                    let reApplyAttenuate = false;

                    if(this.currentSettings && this.currentSettings.pageShadowEnabled != undefined && this.currentSettings.pageShadowEnabled == "true") {
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
                        if(this.currentSettings && this.currentSettings.colorInvert !== null && this.currentSettings.colorInvert == "true") {
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

                        if(this.currentSettings && this.currentSettings.attenuateImageColor !== null && this.currentSettings.attenuateImageColor == "true") {
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
                                this.main(this.TYPE_ONLY_INVERT, this.MUTATION_TYPE_BODY);
                            } else {
                                this.main(this.TYPE_ONLY_CONTRAST, this.MUTATION_TYPE_BODY);
                            }
                        });

                        timerReapply.start(this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            this.mutationObserve(this.MUTATION_TYPE_BODY);
                        } else {
                            window.addEventListener("load", () => {
                                this.mutationObserve(this.MUTATION_TYPE_BODY);
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

                this.mut_body.start();
            }
        } else if(type == this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT) { // Mutation Observer for the brigthness/bluelight settings
            if(this.mut_brightness_bluelight != null && !forceReset) {
                this.mut_brightness_bluelight.start();
            } else {
                if(typeof this.mut_brightness_bluelight !== "undefined") this.mut_brightness_bluelight.disconnect();

                this.mut_brightness_bluelight = new MutationObserverWrapper(mutations => {
                    let reApplyBrightness = false;
                    let reApplyBlueLight = false;

                    mutations.forEach(mutation => {
                        if(this.currentSettings && this.currentSettings.pageLumEnabled != undefined && this.currentSettings.pageLumEnabled === "true") {
                            if((!document.body.contains(this.elementBrightness) || !document.body.contains(this.elementBrightnessWrapper)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                                reApplyBrightness = true;
                            }
                        }

                        if(this.currentSettings && this.currentSettings.blueLightReductionEnabled != undefined && this.currentSettings.blueLightReductionEnabled === "true") {
                            if((!document.body.contains(this.elementBlueLightFilter) || !document.body.contains(this.elementBrightnessWrapper)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                                reApplyBlueLight = true;
                            }
                        }
                    });

                    if(reApplyBrightness || reApplyBlueLight) {
                        const timerApplyMutationBlueLight = new SafeTimer(() => {
                            timerApplyMutationBlueLight.clear();

                            if(reApplyBrightness && reApplyBlueLight) {
                                this.main(this.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            } else if(reApplyBrightness) {
                                this.main(this.TYPE_ONLY_BRIGHTNESS, this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            } else if(reApplyBlueLight) {
                                this.main(this.TYPE_ONLY_BLUELIGHT, this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            }
                        });

                        timerApplyMutationBlueLight.start(this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                        } else {
                            window.addEventListener("load", () => {
                                this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            });
                        }
                    }
                }, {
                    "attributes": true,
                    "subtree": true,
                    "childList": true,
                    "characterData": false
                }, this.elementBrightnessWrapper, false);

                this.mut_brightness_bluelight.start();
            }
        } else if(type == this.MUTATION_TYPE_BACKGROUNDS) { // Mutation Observer for analyzing whole page elements (detecting backgrounds and applying filters)
            if(this.mut_backgrounds != null && !forceReset) {
                this.mut_backgrounds.start();
            } else {
                // Clear old mutation timers
                if(this.safeTimerMutationBackgrounds) this.safeTimerMutationBackgrounds.clear();
                if(this.safeTimerMutationDelayed) this.safeTimerMutationDelayed.clear();
                if(this.mut_backgrounds) this.mut_backgrounds.disconnect();

                this.mut_backgrounds = new MutationObserverWrapper(mutations => {
                    this.delayedMutationObserversCalls.push(mutations);

                    if(this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds) {
                        this.safeTimerMutationDelayed.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                    } else {
                        this.treatMutationObserverBackgroundCalls();
                    }

                    this.mut_backgrounds.start();
                }, {
                    "attributes": true,
                    "subtree": true,
                    "childList": true,
                    "characterData": false,
                    "attributeFilter": ["class", "style"],
                    "attributeOldValue": true,
                    "characterDataOldValue": false
                }, null, true);

                this.safeTimerMutationBackgrounds = new SafeTimer(() => this.mutationElementsBackgrounds());
                this.safeTimerMutationDelayed = new SafeTimer(() => this.treatMutationObserverBackgroundCalls());

                this.mut_backgrounds.start();
            }
        }

        // Mutation for the brigthness wrapper element
        if(type === this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || type === this.MUTATION_TYPE_BRIGHTNESSWRAPPER) { // Mutation for the brightness/bluelight wrapper element
            if(this.mut_brightness_bluelight_wrapper != null && !forceReset) {
                this.mut_brightness_bluelight_wrapper.start();
            } else {
                if(typeof this.mut_brightness_bluelight_wrapper !== "undefined") this.mut_brightness_bluelight_wrapper.disconnect();

                this.mut_brightness_bluelight_wrapper = new MutationObserverWrapper(mutations => {
                    let reStart = true;
                    this.mut_brightness_bluelight_wrapper.pause();

                    mutations.forEach(mutation => {
                        mutation.removedNodes.forEach(removedNode => {
                            if(removedNode === this.elementBrightnessWrapper) {
                                reStart = false;

                                const timerApplyMutationBrightnessWrapper = new SafeTimer(() => {
                                    document.body.appendChild(this.elementBrightnessWrapper);
                                    timerApplyMutationBrightnessWrapper.clear();
                                    this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                                });

                                timerApplyMutationBrightnessWrapper.start();
                            }
                        });
                    });

                    if(reStart) {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                        } else {
                            window.addEventListener("load", () => {
                                this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                            });
                        }
                    }
                }, {
                    "attributes": false,
                    "subtree": false,
                    "childList": true,
                    "characterData": false
                }, null, false);

                this.mut_brightness_bluelight_wrapper.start();
            }
        }
    }

    observeBodyChange() {
        if(this.websiteSpecialFiltersConfig.observeBodyChange) {
            if(this.timerObserveBodyChange) this.timerObserveBodyChange.clear();

            this.timerObserveBodyChange = new SafeTimer(() => {
                if(document.body) {
                    if(!this.oldBody) this.oldBody = document.body;

                    if(document.body != this.oldBody) {
                        this.bodyClassBatcher = new ClassBatcher(document.body);
                        this.bodyClassBatcherRemover = new ClassBatcher(document.body);
                        this.htmlClassBatcher = new ClassBatcher(document.getElementsByTagName("html")[0]);

                        this.main(this.TYPE_RESET, this.TYPE_ALL);
                        this.mutationObserve(this.MUTATION_TYPE_BACKGROUNDS);
                    }

                    this.oldBody = document.body;
                }
                this.timerObserveBodyChange.start(this.websiteSpecialFiltersConfig.observeBodyChangeTimerInterval);
            });

            this.timerObserveBodyChange.start(this.websiteSpecialFiltersConfig.observeBodyChangeTimerInterval);
        }
    }

    async treatMutationObserverBackgroundCalls() {
        if(this.delayedMutationObserversCalls.length > 0) {
            let i = this.delayedMutationObserversCalls.length;
            let treatedCount = 0;
            await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);

            while(i--) {
                const mutationList = this.delayedMutationObserversCalls[i];

                let k = mutationList.length;

                if(k <= 0) {
                    this.delayedMutationObserversCalls.pop();
                } else {
                    while(k--) {
                        this.treatOneMutationObserverBackgroundCall(mutationList.shift());
                        treatedCount++;

                        if(this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds && treatedCount > this.websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall) {
                            if(this.mutationObserverAddedNodes.length > 0) {
                                this.safeTimerMutationBackgrounds.start(this.mutationObserverAddedNodes.length < 100 ? 1 : undefined);
                            }

                            this.safeTimerMutationDelayed.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                            return;
                        }

                        if(this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled && treatedCount > this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold) {
                            this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = true;
                        }
                    }
                }
            }

            if(this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled && treatedCount <= this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold) {
                this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = false;
            }

            if(this.mutationObserverAddedNodes.length > 0) {
                this.safeTimerMutationBackgrounds.start(this.mutationObserverAddedNodes.length < 100 ? 1 : undefined);
            }

            this.delayedMutationObserversCalls = [];
        }
    }

    treatOneMutationObserverBackgroundCall(mutation) {
        if(mutation.type == "childList") {
            const nodeList = mutation.addedNodes;

            if(nodeList.length > 0) {
                this.mutationObserverAddedNodes.push(nodeList);
            }
        } else if(mutation.type == "attributes") {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) this.pageAnalyzer.mutationForElement(mutation.target, mutation.attributeName, mutation.oldValue);
            this.filterProcessor.doProcessFilters(this.filtersCache, mutation.target, false);
        }
    }

    mutationElementsBackgrounds() {
        let i = this.mutationObserverAddedNodes.length;
        const addedNodes = [];

        while(i--) {
            const nodeList = this.mutationObserverAddedNodes[i];

            let k = nodeList.length;

            while(k--) {
                const node = nodeList[k];

                if(!node || !node.classList || node == document.body || ignoredElementsContentScript.includes(node.localName) || node.nodeType != 1 || node.shadowRoot) {
                    continue;
                }

                addedNodes.push(node);
            }
        }

        this.mutationObserverAddedNodes = [];

        if(addedNodes.length <= 0) {
            return;
        }

        for(const node of addedNodes) {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) this.pageAnalyzer.mutationForElement(node, null, null);
            this.filterProcessor.doProcessFilters(this.filtersCache, node, true);
        }
    }

    async updateFilters() {
        if(this.filtersCache == null) {
            const response = await sendMessageWithPromise({ "type": "getFiltersForThisWebsite" }, "getFiltersResponse");

            if(response.filters) {
                this.filtersCache = response.filters;
                this.filterProcessor.processSpecialRules(response.specialFilters, this.websiteSpecialFiltersConfig);
            }
        }

        if(this.currentSettings && (this.currentSettings.pageShadowEnabled == "true" || this.currentSettings.colorInvert == "true" || this.currentSettings.attenuateImageColor == "true")) {
            await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);
            this.filterProcessor.doProcessFilters(this.filtersCache);
        }
    }

    async main(type, mutation, disableCache) {
        this.precUrl = getCurrentURL();
        this.oldBody = document.body;

        if(type == this.TYPE_RESET) {
            mutation = this.TYPE_ALL;
        }

        if(typeof this.mut_body !== "undefined" && (mutation == this.MUTATION_TYPE_BODY || mutation == this.TYPE_ALL)) this.mut_body.pause();
        if(typeof this.mut_brightness_bluelight !== "undefined" && (mutation == this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == this.TYPE_ALL)) this.mut_brightness_bluelight.pause();
        if(typeof this.mut_brightness_bluelight_wrapper !== "undefined" && (mutation == this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == this.TYPE_ALL)) this.mut_brightness_bluelight_wrapper.pause();

        if(this.runningInIframe) {
            const responseEnabled = await sendMessageWithPromise({ "type": "isEnabledForThisPage" }, "isEnabledForThisPageResponse");

            if(responseEnabled.enabled) {
                this.newSettingsToApply = responseEnabled.settings;
            }

            this.process(responseEnabled.enabled, type);
        } else {
            const allowed = await pageShadowAllowed(getCurrentURL());
            this.process(allowed, type, disableCache);
        }
    }

    async process(allowed, type, disableCache) {
        if(this.applyWhenBodyIsAvailableTimer) this.applyWhenBodyIsAvailableTimer.clear();

        this.applyWhenBodyIsAvailableTimer = new ApplyBodyAvailable(async() => {
            this.pageAnalyzer = this.pageAnalyzer || new PageAnalyzer(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);
            this.filterProcessor = this.filterProcessor || new FilterProcessor(this.pageAnalyzer);

            this.bodyClassBatcher = this.bodyClassBatcher || new ClassBatcher(document.body);
            this.bodyClassBatcherRemover = this.bodyClassBatcherRemover || new ClassBatcher(document.body);
            this.htmlClassBatcher = this.htmlClassBatcher || new ClassBatcher(document.getElementsByTagName("html")[0]);

            if(allowed) {
                const settings = this.newSettingsToApply || await getSettings(getCurrentURL(), disableCache);

                this.currentSettings = settings;
                this.precEnabled = true;

                if(type == this.TYPE_ONLY_INVERT) {
                    this.bodyClassBatcher.removeAll();
                    this.bodyClassBatcherRemover.removeAll();
                    this.htmlClassBatcher.removeAll();

                    this.invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, settings.selectiveInvert, settings.attenuateImageColor);

                    this.bodyClassBatcher.applyAdd();
                    this.bodyClassBatcherRemover.applyRemove();
                    this.htmlClassBatcher.applyAdd();
                } else if(type == this.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == this.TYPE_ONLY_BRIGHTNESS || type == this.TYPE_ONLY_BLUELIGHT) {
                    if(type == this.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == this.TYPE_ONLY_BRIGHTNESS) {
                        this.brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                    }

                    if(type == this.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT || type == this.TYPE_ONLY_BLUELIGHT) {
                        this.blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);
                    }
                } else {
                    this.bodyClassBatcher.removeAll();
                    this.bodyClassBatcherRemover.removeAll();
                    this.htmlClassBatcher.removeAll();

                    this.contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, settings.selectiveInvert, settings.attenuateImageColor);

                    this.bodyClassBatcher.applyAdd();
                    this.bodyClassBatcherRemover.applyRemove();
                    this.htmlClassBatcher.applyAdd();
                }

                if(type !== this.TYPE_ONLY_CONTRAST && type !== this.TYPE_ONLY_INVERT && type !== this.TYPE_ONLY_BRIGHTNESS && type !== this.TYPE_ONLY_BLUELIGHT) {
                    this.brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                    this.blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);

                    const specialRules = await sendMessageWithPromise({ "type": "getSpecialRules" }, "getSpecialRulesResponse");
                    this.filterProcessor.processSpecialRules(specialRules.filters, this.websiteSpecialFiltersConfig);

                    this.observeBodyChange();

                    if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true" || settings.attenuateImageColor == "true") {
                        if(type == this.TYPE_START || !this.pageAnalyzer.backgroundDetected) {
                            this.applyDetectBackground(this.TYPE_LOADING, "*");
                        }
                    }

                    if(document.readyState == "complete") {
                        this.updateFilters();
                    } else {
                        window.addEventListener("load", () => {
                            this.updateFilters();
                        });
                    }
                }

                this.mutationObserve(this.MUTATION_TYPE_BODY);
                this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
            } else {
                this.precEnabled = false;
                if(typeof this.lnkCustomTheme !== "undefined") this.lnkCustomTheme.setAttribute("href", "");

                if(this.started) {
                    this.bodyClassBatcherRemover.removeAll();

                    this.resetContrastPage();
                    this.resetInvertPage();
                    this.resetAttenuateColor();
                    this.resetBrightnessPage();
                    this.resetBlueLightPage();

                    this.pageAnalyzer.resetShadowRoots();
                    this.bodyClassBatcherRemover.applyRemove();
                }
            }

            this.started = true;
        });

        this.applyWhenBodyIsAvailableTimer.start(1);
    }

    hasEnabledStateChanged(isEnabled) {
        return this.started && ((isEnabled && !this.precEnabled) || (!isEnabled && this.precEnabled));
    }
}