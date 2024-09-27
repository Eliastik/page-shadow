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
import { pageShadowAllowed, getSettings, getCurrentURL, removeClass, isRunningInIframe, isRunningInPopup, loadWebsiteSpecialFiltersConfig, sendMessageWithPromise, customTheme, applyContrastPageVariablesWithTheme, areAllCSSVariablesDefined } from "./utils/util.js";
import { colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, ignoredElementsContentScript, attenuateDefaultValue } from "./constants.js";
import SafeTimer from "./utils/safeTimer.js";
import MutationObserverWrapper from "./utils/mutationObserver.js";
import ElementClassBatcher from "./utils/elementClassBatcher.js";
import ApplyBodyAvailable from "./utils/applyBodyAvailable.js";
import PageAnalyzer from "./utils/pageAnalyzer.js";
import PageFilterProcessor from "./utils/pageFilterProcessor.js";
import MultipleElementClassBatcher from "./utils/multipleElementClassBatcher.js";
import DebugLogger from "./utils/debugLogger.js";

/**
 * Main class used by the content script
 */
export default class ContentProcessor {
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
    currentSettings = null;
    newSettingsToApply = null;
    safeTimerMutationBackgrounds = null;
    mutationObserverAddedNodes = [];
    delayedMutationObserversCalls = [];
    safeTimerMutationDelayed = null;
    oldBody = null;
    precUrl = null;
    mutationDetected = false;

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
    timerObserveDocumentElementChange = null;
    timerApplyMutationObserverClassChanges = null;
    applyWhenBodyIsAvailableTimer = null;

    // Batcher
    bodyClassBatcher;
    htmlClassBatcher;
    bodyClassBatcherRemover;
    multipleElementClassBatcherAdd;
    multipleElementClassBatcherRemove;

    // Page and Filter processors
    pageAnalyzer;
    filterProcessor;

    debugLogger;

    constructor() {
        this.setup();
    }

    async setup() {
        this.websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
    }

    setupClassBatchers() {
        this.bodyClassBatcher = new ElementClassBatcher(document.body);
        this.bodyClassBatcherRemover = new ElementClassBatcher(document.body);
        this.htmlClassBatcher = new ElementClassBatcher(document.getElementsByTagName("html")[0]);
        this.multipleElementClassBatcherAdd = new MultipleElementClassBatcher(this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall);
        this.multipleElementClassBatcherRemove = new MultipleElementClassBatcher(this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall);
        this.debugLogger = new DebugLogger();
    }

    async applyContrastPage(init, contrastPageEnabled, theme, disableImgBgColor, brightColorPreservation, customThemesSettings) {
        if (contrastPageEnabled != undefined && contrastPageEnabled == "true") {
            this.debugLogger?.log(`Applying contrast page with settings : theme = ${theme} / disableImgBgColor = ${disableImgBgColor} / brightColorPreservation = ${brightColorPreservation}`);

            if (theme != undefined) {
                if(!init) {
                    this.resetContrastPage(theme, disableImgBgColor, brightColorPreservation);
                }

                if (theme.startsWith("custom")) {
                    await this.customThemeApply(theme, customThemesSettings);
                    this.htmlClassBatcher.add("pageShadowBackgroundCustom");
                } else {
                    applyContrastPageVariablesWithTheme(theme);
                }

                this.bodyClassBatcher.add("pageShadowContrastBlack");
                this.htmlClassBatcher.add("pageShadowBackgroundContrast");
            } else {
                this.bodyClassBatcher.add("pageShadowContrastBlack");
                this.htmlClassBatcher.add("pageShadowBackgroundContrast");
                this.resetContrastPage(1, disableImgBgColor, brightColorPreservation);
            }

            if (disableImgBgColor != undefined && disableImgBgColor == "true") {
                this.bodyClassBatcher.add("pageShadowDisableImgBgColor");
            }

            if (brightColorPreservation != undefined && brightColorPreservation == "true") {
                this.bodyClassBatcher.add("pageShadowPreserveBrightColor");
            }

            this.debugLogger?.log("Applied contrast page");
        } else {
            if(!init) {
                this.resetContrastPage();
            }
        }

        if(init) {
            this.bodyClassBatcher.applyAdd();
            this.htmlClassBatcher.applyAdd();
        }
    }

    async contrastPage(pageShadowEnabled, theme, colorInvert, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors, selectiveInvert, brightColorPreservation,
        attenuateColors, attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors, percentageAttenuateColors, invertBrightColors) {
        await this.applyContrastPage(false, pageShadowEnabled, theme, disableImgBgColor, brightColorPreservation);

        this.invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert,
            attenuateColors, attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors, percentageAttenuateColors, invertBrightColors);
    }

    resetContrastPage(themeException, disableImgBgColor, brightColorPreservation) {
        this.debugLogger?.log("Resetting contrast page");

        const removeBatcherHTML = new ElementClassBatcher(document.getElementsByTagName("html")[0]);

        if(!themeException || !themeException.startsWith("custom")) {
            if(typeof this.lnkCustomTheme !== "undefined") this.lnkCustomTheme.setAttribute("href", "");
            removeBatcherHTML.add("pageShadowBackgroundCustom");
            this.bodyClassBatcherRemover.add("pageShadowCustomFontFamily");
        }

        if(!themeException) {
            removeBatcherHTML.add("pageShadowBackgroundContrast");
            this.bodyClassBatcherRemover.add("pageShadowContrastBlack");
        }

        if(disableImgBgColor != "true") {
            this.bodyClassBatcherRemover.add("pageShadowDisableImgBgColor");
        }

        if(brightColorPreservation != "true") {
            this.bodyClassBatcherRemover.add("pageShadowPreserveBrightColor");
        }

        removeBatcherHTML.applyRemove();

        this.debugLogger?.log("Contrast page reseted");
    }

    async customThemeApply(theme, customThemesSettings) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            const applyCustomFontFamily = await customTheme(theme.replace("custom", ""), false, this.lnkCustomTheme, customThemesSettings);

            if(applyCustomFontFamily) {
                this.bodyClassBatcher.add("pageShadowCustomFontFamily");
            } else {
                this.bodyClassBatcherRemover.add("pageShadowCustomFontFamily");
            }
        }
    }

    invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors, selectiveInvert,
        attenuateColors, attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors, percentageAttenuateColors, invertBrightColors) {

        document.documentElement.style.setProperty("--page-shadow-invert-filter", "invert(100%)");
        document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%)");
        document.documentElement.style.setProperty("--page-shadow-invert-filter-bg-backgrounds", "invert(100%)");
        document.documentElement.style.setProperty("--page-shadow-invert-filter-video-backgrounds", "invert(100%)");
        document.documentElement.style.setProperty("--page-shadow-invert-filter-bright-color-backgrounds", "invert(100%)");

        if(enabled !== null && enabled == "true") {
            this.debugLogger?.log(`Applying invert color with settings : invertImageColors = ${invertImageColors} / invertEntirePage = ${invertEntirePage} / invertVideoColors = ${invertVideoColors} / invertBgColors = ${invertBgColors} / selectiveInvert = ${selectiveInvert} / attenuateColors = ${attenuateColors} / attenuateImgColors = ${attenuateImgColors} / attenuateBgColors = ${attenuateBgColors} / attenuateVideoColors = ${attenuateVideoColors} / attenuateBrightColors = ${attenuateBrightColors} / percentageAttenuateColors = ${percentageAttenuateColors} / invertBrightColors = ${invertBrightColors}`);

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
                    this.bodyClassBatcher.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors != null && invertVideoColors == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertVideoColor");
                }

                if(selectiveInvert != null && selectiveInvert == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                } else {
                    this.bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                }

                if(invertBrightColors != null && invertBrightColors == "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBrightColors");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertBrightColors");
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

                if(invertBrightColors != null && invertBrightColors == "true") {
                    this.bodyClassBatcher.add("pageShadowInvertBrightColors");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBrightColors");
                }
            }

            this.debugLogger?.log("Applied invert color");
        } else {
            this.resetInvertPage();
        }

        this.attenuateColor(attenuateColors, attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors, percentageAttenuateColors);
    }

    resetInvertPage() {
        this.debugLogger?.log("Resetting invert color");

        this.bodyClassBatcherRemover.add("pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert", "pageShadowInvertBrightColors");
        removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");

        this.debugLogger?.log("Reseted invert color");
    }

    attenuateColor(attenuateColors, attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors, percentageAttenuateColors) {
        if(percentageAttenuateColors / 100 > 1 || percentageAttenuateColors / 100 < 0 || typeof percentageAttenuateColors === "undefined" || percentageAttenuateColors == null) {
            percentageAttenuateColors = attenuateDefaultValue;
        }

        if(attenuateColors == "true") {
            this.debugLogger?.log(`Applying invert color with settings : attenuateColors = ${attenuateColors} / attenuateImgColors = ${attenuateImgColors} / attenuateBgColors = ${attenuateBgColors} / attenuateVideoColors = ${attenuateVideoColors} / attenuateBrightColors = ${attenuateBrightColors} / percentageAttenuateColors = ${percentageAttenuateColors}`);

            document.documentElement.style.setProperty("--page-shadow-attenuate-filter", "grayscale(" + percentageAttenuateColors + "%)");

            if(attenuateImgColors == "true") {
                document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", "invert(100%) grayscale(" + percentageAttenuateColors + "%)");
                this.bodyClassBatcher.add("pageShadowAttenuateImageColor");
            } else {
                this.bodyClassBatcherRemover.add("pageShadowAttenuateImageColor");
            }

            if(attenuateBgColors == "true") {
                document.documentElement.style.setProperty("--page-shadow-invert-filter-bg-backgrounds", "invert(100%) grayscale(" + percentageAttenuateColors + "%)");
                this.bodyClassBatcher.add("pageShadowAttenuateBgColor");
            } else {
                this.bodyClassBatcherRemover.add("pageShadowAttenuateBgColor");
            }

            if(attenuateVideoColors == "true") {
                document.documentElement.style.setProperty("--page-shadow-invert-filter-video-backgrounds", "invert(100%) grayscale(" + percentageAttenuateColors + "%)");
                this.bodyClassBatcher.add("pageShadowAttenuateVideoColor");
            } else {
                this.bodyClassBatcherRemover.add("pageShadowAttenuateVideoColor");
            }

            if(attenuateBrightColors == "true") {
                document.documentElement.style.setProperty("--page-shadow-invert-filter-bright-color-backgrounds", "invert(100%) grayscale(" + percentageAttenuateColors + "%)");
                this.bodyClassBatcher.add("pageShadowAttenuateBrightColor");
            } else {
                this.bodyClassBatcherRemover.add("pageShadowAttenuateBrightColor");
            }

            this.debugLogger?.log("Applied attenuate color");
        } else {
            this.resetAttenuateColor();
        }
    }

    resetAttenuateColor() {
        this.debugLogger?.log("Resetting attenuate color");

        this.bodyClassBatcherRemover.add("pageShadowAttenuateImageColor");
        this.bodyClassBatcherRemover.add("pageShadowAttenuateBgColor");
        this.bodyClassBatcherRemover.add("pageShadowAttenuateVideoColor");
        this.bodyClassBatcherRemover.add("pageShadowAttenuateBrightColor");

        this.debugLogger?.log("Reseted attenuate color");
    }

    async applyDetectBackground(type, elements) {
        await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);

        return new Promise(resolve => {
            if(this.pageAnalyzer.backgroundDetected) resolve();

            if(document.readyState === "complete") {
                this.debugLogger?.log("Page is now ready, we can start to analyze the elements");

                const timerBackgrounds = new SafeTimer(async() => {
                    timerBackgrounds.clear();

                    this.pageAnalyzer.detectBackground(elements);

                    this.mutationObserve(this.MUTATION_TYPE_BACKGROUNDS);

                    resolve();
                });

                timerBackgrounds.start(1);
            } else {
                if(type == this.TYPE_LOADING) {
                    this.debugLogger?.log("Page is not ready, waiting for the page to be ready to analyze the elements");

                    const eventDetectBackground = document.addEventListener("readystatechange", () => {
                        if(document.readyState === "complete") {
                            document.removeEventListener("readystatechange", eventDetectBackground);
                            
                            this.applyDetectBackground(this.TYPE_LOADING, elements);
                            resolve();
                        }
                    });
                } else {
                    this.applyDetectBackground(this.TYPE_LOADING, elements);
                    resolve();
                }
            }
        });
    }

    brightnessPage(enabled, percentage) {
        this.elementBrightness.setAttribute("class", "");

        if(enabled == "true" && !this.runningInIframe && this.elementBrightness) {
            this.debugLogger?.log("Applying bright reduction");

            if(this.elementBrightness.style) {
                this.elementBrightness.style.display = "block";
                this.elementBrightness.setAttribute("id", "pageShadowBrightness");

                if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                    this.elementBrightness.style.opacity = brightnessDefaultValue;
                } else {
                    this.elementBrightness.style.opacity = percentage / 100;
                }
            }

            this.appendBrightnessElement(this.elementBrightness, this.elementBrightnessWrapper);

            this.debugLogger?.log("Applied bright reduction");
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

        if(enabled == "true" && !this.runningInIframe && this.elementBlueLightFilter) {
            this.debugLogger?.log("Applying blue light reduction");

            if(this.elementBlueLightFilter.style) {
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
            }

            this.appendBlueLightElement(this.elementBlueLightFilter, this.elementBrightnessWrapper);

            this.debugLogger?.log("Applied blue light reduction");
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
            this.debugLogger?.log("Appending brightness reduction element");

            const brightnessPageElement = document.getElementById("pageShadowBrightness");

            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBrightness)) {
                elementWrapper.removeChild(elementBrightness);
            }

            document.body.appendChild(elementWrapper);

            // Remove old decrease brightness if found
            if(brightnessPageElement) {
                brightnessPageElement.remove();
            }
        }

        elementWrapper.appendChild(elementBrightness);

        this.debugLogger?.log("Appended brightness reduction element");
    }

    appendBlueLightElement(elementBlueLightFilter, elementWrapper) {
        if(document.body) {
            this.debugLogger?.log("Appending blue light reduction element");

            const blueLightPageElement = document.getElementById("pageShadowBrightnessNightMode");

            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBlueLightFilter)) {
                elementWrapper.removeChild(elementBlueLightFilter);
            }

            document.body.appendChild(elementWrapper);

            // Remove old blue light page filters if found
            if(blueLightPageElement) {
                blueLightPageElement.remove();
            }
        }

        elementWrapper.appendChild(elementBlueLightFilter);

        this.debugLogger?.log("Appended blue light reduction element");
    }

    mutationObserve(type, forceReset) {
        // Mutation Observer for the body element classList (contrast/invert/attenuate)
        this.debugLogger?.log(`Applying mutation observer for type = ${type} / forceReset ? ${forceReset}`);

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

                        if(classList.contains("pageShadowContrastBlack")) {
                            classFound = true;
                        }

                        if(classList.contains("pageShadowCustomFontFamily")) {
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

                                if((mutation.oldValue && mutation.oldValue.indexOf("pageShadowDisableImgBgColor") !== -1 && !classList.contains("pageShadowDisableImgBgColor"))
                                    || (mutation.oldValue && mutation.oldValue.indexOf("pageShadowPreserveBrightColor") !== -1 && !classList.contains("pageShadowPreserveBrightColor"))) {
                                    reApplyContrast = true;
                                }
                            }
                        }

                        if(this.currentSettings && this.currentSettings.attenuateColors !== null && this.currentSettings.attenuateColors == "true") {
                            if(mutation.type == "attributes" && mutation.attributeName == "class") {
                                const classList = document.body.classList;

                                if(this.currentSettings && this.currentSettings.attenuateImgColors !== null && this.currentSettings.attenuateImgColors == "true") {
                                    if(mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateImageColor") !== -1 && !classList.contains("pageShadowAttenuateImageColor")) {
                                        reApplyAttenuate = true;
                                    }
                                }

                                if(this.currentSettings && this.currentSettings.attenuateBgColors !== null && this.currentSettings.attenuateBgColors == "true") {
                                    if(mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateBgColor") !== -1 && !classList.contains("pageShadowAttenuateBgColor")) {
                                        reApplyAttenuate = true;
                                    }
                                }

                                if(this.currentSettings && this.currentSettings.attenuateVideoColors !== null && this.currentSettings.attenuateVideoColors == "true") {
                                    if(mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateVideoColor") !== -1 && !classList.contains("pageShadowAttenuateVideoColor")) {
                                        reApplyAttenuate = true;
                                    }
                                }

                                if(this.currentSettings && this.currentSettings.attenuateBrightColors !== null && this.currentSettings.attenuateBrightColors == "true") {
                                    if(mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateBrightColor") !== -1 && !classList.contains("pageShadowAttenuateBrightColor")) {
                                        reApplyAttenuate = true;
                                    }
                                }
                            }
                        }
                    });

                    if(reApplyContrast || reApplyInvert || reApplyAttenuate) {
                        const timerReapply = new SafeTimer(() => {
                            timerReapply.clear();

                            if(this.precUrl == getCurrentURL()) {
                                if(!reApplyContrast && (reApplyInvert || reApplyAttenuate)) {
                                    this.main(this.TYPE_ONLY_INVERT, this.MUTATION_TYPE_BODY);
                                } else {
                                    this.main(this.TYPE_ONLY_CONTRAST, this.MUTATION_TYPE_BODY);
                                }
                            } else {
                                this.mutationDetected = true;
                            }
                        });

                        timerReapply.start(this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            this.mutationObserve(this.MUTATION_TYPE_BODY);
                        } else {
                            const eventReadyStateMutationObserverBody = document.addEventListener("readystatechange", () => {
                                if (document.readyState === "interactive" ||  document.readyState == "complete") {
                                    document.removeEventListener("readystatechange", eventReadyStateMutationObserverBody);
                                    this.mutationObserve(this.MUTATION_TYPE_BODY);
                                }
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

                            if(this.precUrl == getCurrentURL()) {
                                if(reApplyBrightness && reApplyBlueLight) {
                                    this.main(this.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                                } else if(reApplyBrightness) {
                                    this.main(this.TYPE_ONLY_BRIGHTNESS, this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                                } else if(reApplyBlueLight) {
                                    this.main(this.TYPE_ONLY_BLUELIGHT, this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                                }
                            } else {
                                this.mutationDetected = true;
                            }
                        });

                        timerApplyMutationBlueLight.start(this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                        } else {
                            const eventReadyStateMutationObserverBrightnessBluelight = document.addEventListener("readystatechange", () => {
                                if (document.readyState === "interactive" ||  document.readyState == "complete") {
                                    document.removeEventListener("readystatechange", eventReadyStateMutationObserverBrightnessBluelight);
                                    this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                                }
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
                            const eventReadyStateMutationObserverBrightnessWrapper = document.addEventListener("readystatechange", () => {
                                if (document.readyState === "interactive" ||  document.readyState == "complete") {
                                    document.removeEventListener("readystatechange", eventReadyStateMutationObserverBrightnessWrapper);
                                    this.mutationObserve(this.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                                }
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
            this.debugLogger?.log("Applying body change observer");

            if(this.timerObserveBodyChange) this.timerObserveBodyChange.clear();

            this.timerObserveBodyChange = new SafeTimer(() => {
                if(document.body) {
                    if(!this.oldBody) this.oldBody = document.body;

                    if(document.body != this.oldBody) {
                        this.setupClassBatchers();

                        if(this.precUrl == getCurrentURL()) {
                            this.main(this.TYPE_RESET, this.TYPE_ALL);
                        } else {
                            this.mutationDetected = true;
                        }

                        this.mutationObserve(this.MUTATION_TYPE_BACKGROUNDS);
                    }

                    this.oldBody = document.body;
                }

                this.timerObserveBodyChange.start(this.websiteSpecialFiltersConfig.observeBodyChangeTimerInterval);
            });

            this.timerObserveBodyChange.start(this.websiteSpecialFiltersConfig.observeBodyChangeTimerInterval);
        }
    }

    observeDocumentElementChange() {
        if(this.websiteSpecialFiltersConfig.observeDocumentChange) {
            this.debugLogger?.log("Applying document element change observer");

            if(this.timerObserveDocumentElementChange) this.timerObserveDocumentElementChange.clear();

            this.timerObserveDocumentElementChange = new SafeTimer(async () => {
                const settings = await getSettings(getCurrentURL());

                if(!areAllCSSVariablesDefined(settings.pageShadowEnabled, settings.colorInvert)) {
                    this.main(this.TYPE_RESET, this.TYPE_ALL);
                }

                this.timerObserveDocumentElementChange.start(this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval);
            });

            this.timerObserveDocumentElementChange.start(this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval);
        }
    }

    timerApplyMutationClassChanges() {
        if(this.timerApplyMutationObserverClassChanges) this.timerApplyMutationObserverClassChanges.clear();

        this.timerApplyMutationObserverClassChanges = new SafeTimer(async () => {
            this.multipleElementClassBatcherAdd.applyAdd();
            this.multipleElementClassBatcherRemove.applyRemove();

            this.timerApplyMutationObserverClassChanges.start(this.websiteSpecialFiltersConfig.intervalApplyClassChanges);
        });

        this.timerApplyMutationObserverClassChanges.start(this.websiteSpecialFiltersConfig.intervalApplyClassChanges);
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
                                this.safeTimerMutationBackgrounds.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
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
                this.safeTimerMutationBackgrounds.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
            }

            this.delayedMutationObserversCalls = [];
        }
    }

    treatOneMutationObserverBackgroundCall(mutation) {
        if(mutation.type == "childList") {
            const nodeList = mutation.addedNodes;

            if(nodeList.length > 0) {
                this.mutationObserverAddedNodes.push(...Array.prototype.slice.call(nodeList));
            }
        } else if(mutation.type == "attributes") {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
                this.pageAnalyzer.mutationForElement(mutation.target, mutation.attributeName, mutation.oldValue);
            }

            this.filterProcessor.doProcessFilters(this.filtersCache, mutation.target, false);
        }
    }

    mutationElementsBackgrounds() {
        let i = this.mutationObserverAddedNodes.length;
        let treatedCount = 0;

        while(i--) {
            this.treatOneMutationObserverAddedNode(this.mutationObserverAddedNodes.shift());
            treatedCount++;
            
            if(this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds && treatedCount > this.websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall) {
                if(this.mutationObserverAddedNodes.length > 0) {
                    this.safeTimerMutationBackgrounds.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                }

                return;
            }

            if(this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled && treatedCount > this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold) {
                this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = true;
            }
        }

        if(this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled && treatedCount <= this.websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold) {
            this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = false;
        }

        this.mutationObserverAddedNodes = [];
    }

    treatOneMutationObserverAddedNode(node) {
        if(!node || !node.classList || node == document.body || ignoredElementsContentScript.includes(node.localName) || node.nodeType != 1 || node.shadowRoot) {
            return;
        }

        if (!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
            this.pageAnalyzer.mutationForElement(node, null, null);
        }

        this.filterProcessor.doProcessFilters(this.filtersCache, node, true);
    }

    async updateFilters() {
        if(this.filtersCache == null) {
            this.debugLogger?.log("Caching page filters");

            const response = await sendMessageWithPromise({ "type": "getFiltersForThisWebsite" }, "getFiltersResponse");

            if(response.filters) {
                this.filtersCache = response.filters;
                this.filterProcessor.processSpecialRules(response.specialFilters);
            }
        }

        if(this.currentSettings && (this.currentSettings.pageShadowEnabled == "true" || this.currentSettings.colorInvert == "true" || this.currentSettings.attenuateColors == "true")) {
            this.debugLogger?.log("Applying page filters");

            await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);
            this.filterProcessor.doProcessFilters(this.filtersCache);
        }
    }

    async main(type, mutation, disableCache) {
        this.precUrl = this.precUrl || getCurrentURL();
        this.mutationDetected = false;

        if(type == this.TYPE_RESET) {
            mutation = this.TYPE_ALL;
        }

        if(typeof this.mut_body !== "undefined" && (mutation == this.MUTATION_TYPE_BODY || mutation == this.TYPE_ALL)) this.mut_body.pause();
        if(typeof this.mut_brightness_bluelight !== "undefined" && (mutation == this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == this.TYPE_ALL)) this.mut_brightness_bluelight.pause();
        if(typeof this.mut_brightness_bluelight_wrapper !== "undefined" && (mutation == this.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutation == this.TYPE_ALL)) this.mut_brightness_bluelight_wrapper.pause();

        if(this.runningInIframe) {
            this.debugLogger?.log("Detected this page as running in an iframe");

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
            this.bodyClassBatcher = this.bodyClassBatcher || new ElementClassBatcher(document.body);
            this.bodyClassBatcherRemover = this.bodyClassBatcherRemover || new ElementClassBatcher(document.body);
            this.htmlClassBatcher = this.htmlClassBatcher || new ElementClassBatcher(document.getElementsByTagName("html")[0]);
            this.multipleElementClassBatcherAdd = this.multipleElementClassBatcherAdd || new MultipleElementClassBatcher(this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall);
            this.multipleElementClassBatcherRemove = this.multipleElementClassBatcherRemove || new MultipleElementClassBatcher(this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall);

            this.pageAnalyzer = this.pageAnalyzer || new PageAnalyzer(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled, this.multipleElementClassBatcherAdd, this.multipleElementClassBatcherRemove, this.debugLogger);
            this.filterProcessor = this.filterProcessor || new PageFilterProcessor(this.pageAnalyzer, this.multipleElementClassBatcherAdd, this.multipleElementClassBatcherRemove, this.websiteSpecialFiltersConfig);

            this.debugLogger?.log(`Starting processing page - allowed ? ${allowed} / type ? ${type} / disableCache ? ${disableCache}`);

            if(allowed) {
                const settings = this.newSettingsToApply || await getSettings(getCurrentURL(), disableCache);

                this.currentSettings = settings;
                this.precEnabled = true;

                if(type == this.TYPE_ONLY_INVERT) {
                    this.bodyClassBatcher.removeAll();
                    this.bodyClassBatcherRemover.removeAll();
                    this.htmlClassBatcher.removeAll();

                    this.invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, settings.selectiveInvert, settings.attenuateColors, settings.attenuateImgColors, settings.attenuateBgColors, settings.attenuateVideoColors, settings.attenuateBrightColors, settings.percentageAttenuateColors, settings.invertBrightColors);

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

                    await this.contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, settings.selectiveInvert, settings.brightColorPreservation, settings.attenuateColors, settings.attenuateImgColors, settings.attenuateBgColors, settings.attenuateVideoColors, settings.attenuateBrightColors, settings.percentageAttenuateColors, settings.invertBrightColors);

                    this.bodyClassBatcher.applyAdd();
                    this.bodyClassBatcherRemover.applyRemove();
                    this.htmlClassBatcher.applyAdd();
                }

                if(type !== this.TYPE_ONLY_CONTRAST && type !== this.TYPE_ONLY_INVERT && type !== this.TYPE_ONLY_BRIGHTNESS && type !== this.TYPE_ONLY_BLUELIGHT) {
                    this.brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
                    this.blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);

                    const specialRules = await sendMessageWithPromise({ "type": "getSpecialRules" }, "getSpecialRulesResponse");
                    this.filterProcessor.processSpecialRules(specialRules.filters);

                    this.observeBodyChange();
                    this.observeDocumentElementChange();
                    this.timerApplyMutationClassChanges();

                    if(settings.pageShadowEnabled == "true" || settings.colorInvert == "true" || settings.attenuateColors == "true") {
                        if(type == this.TYPE_START || !this.pageAnalyzer.backgroundDetected) {
                            this.applyDetectBackground(this.TYPE_LOADING, "*").then(() => {
                                if(document.readyState === "complete") {
                                    this.updateFilters();
                                } else {
                                    const eventReadyStateFilters = document.addEventListener("readystatechange", () => {
                                        if (document.readyState === "complete") {
                                            document.removeEventListener("readystatechange", eventReadyStateFilters);
                                            this.updateFilters();
                                        }
                                    });
                                }
                            });
                        }
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

        this.applyWhenBodyIsAvailableTimer.start();
    }

    hasEnabledStateChanged(isEnabled) {
        return this.started && ((isEnabled && !this.precEnabled) || (!isEnabled && this.precEnabled));
    }
}