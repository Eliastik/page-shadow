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
import { pageShadowAllowed, getSettings, getCurrentURL, removeClass, isRunningInIframe, isRunningInPopup, loadWebsiteSpecialFiltersConfig, sendMessageWithPromise, customTheme, applyContrastPageVariablesWithTheme, areAllCSSVariablesDefinedForHTMLElement, areAllClassesDefinedForHTMLElement } from "../utils/util.js";
import { colorTemperaturesAvailable, minBrightnessPercentage, maxBrightnessPercentage, brightnessDefaultValue, attenuateDefaultValue } from "../constants.js";
import SafeTimer from "./safeTimer.js";
import MutationObserverProcessor from "./mutationObserverProcessor.js";
import ElementClassBatcher from "./elementClassBatcher.js";
import ApplyBodyAvailable from "./applyBodyAvailable.js";
import PageAnalyzer from "./pageAnalyzer.js";
import PageFilterProcessor from "./pageFilterProcessor.js";
import MultipleElementClassBatcher from "./multipleElementClassBatcher.js";
import DebugLogger from "./debugLogger.js";
import ContentProcessorConstants from "./contentProcessorConstants.js";

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
    processingFilters = false;
    processedFilters = false;
    currentSettings = null;
    newSettingsToApply = null;
    oldBody = null;
    precUrl = null;

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

    // Page, Filter and Mutation Observer processors
    pageAnalyzer;
    filterProcessor;
    mutationObserverProcessor;

    debugLogger;

    constructor() {
        this.debugLogger = new DebugLogger();
        this.setup();
    }

    async setup() {
        this.websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
    }

    async applyContrastPage(init, contrastPageEnabled, theme, disableImgBgColor, brightColorPreservation, customThemesSettings) {
        if (contrastPageEnabled == "true") {
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

            if (disableImgBgColor == "true") {
                this.bodyClassBatcher.add("pageShadowDisableImgBgColor");
            }

            if (brightColorPreservation == "true") {
                this.bodyClassBatcher.add("pageShadowPreserveBrightColor");
            }

            this.debugLogger?.log("Applied contrast page");
        } else if(!init) {
            this.resetContrastPage();
        }

        if(init) {
            this.bodyClassBatcher.apply();
            this.htmlClassBatcher.apply();
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

        const removeBatcherHTML = new ElementClassBatcher("remove", "html");

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

        removeBatcherHTML.apply();

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

        if(enabled == "true") {
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

    applyPageAnalysis(type, elements) {
        return new Promise(resolve => {
            if(this.pageAnalyzer.pageAnalysisFinished) {
                return resolve();
            }

            const timerAnalyzePageElements = new SafeTimer(async () => {
                timerAnalyzePageElements.clear();

                // Start mutation observer, only for added nodes
                this.mutationObserverProcessor.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BACKGROUNDS_ONLY_ADDED_NODES);

                // Analyze page elements
                await this.pageAnalyzer.analyzeElements(elements, type === ContentProcessorConstants.TYPE_RESET);

                // Start mutation observer, for added nodes and class changes
                this.mutationObserverProcessor.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BACKGROUNDS, true);

                resolve();
            });

            if(document.readyState === "complete") {
                this.debugLogger?.log("Page is now ready, we can start to analyze the elements");
                timerAnalyzePageElements.start();
            } else {
                this.debugLogger?.log("Page is not ready, waiting for the page to be ready to analyze the elements");

                const eventDetectBackground = document.addEventListener("readystatechange", () => {
                    if(document.readyState === "complete") {
                        document.removeEventListener("readystatechange", eventDetectBackground);
                        timerAnalyzePageElements.start();
                    }
                });
            }
        });
    }

    brightnessPage(enabled, percentage) {
        this.elementBrightness.setAttribute("class", "");

        if(enabled == "true" && !this.runningInIframe && this.elementBrightness) {
            this.debugLogger?.log("Applying brightness reduction");

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

            this.debugLogger?.log("Applied brightness reduction");
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

            this.debugLogger?.log("Appended brightness reduction element");
        }

        elementWrapper.appendChild(elementBrightness);
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

            this.debugLogger?.log("Appended blue light reduction element");
        }

        elementWrapper.appendChild(elementBlueLightFilter);
    }

    observeBodyChange() {
        if(this.websiteSpecialFiltersConfig.observeBodyChange) {
            this.debugLogger?.log("Applying body change observer");

            if(this.timerObserveBodyChange) this.timerObserveBodyChange.clear();

            this.timerObserveBodyChange = new SafeTimer(() => {
                if(document.body) {
                    if(!this.oldBody) this.oldBody = document.body;

                    if(document.body != this.oldBody) {
                        this.initBodyAndHTMLClassBatchers();
                        this.initElementClassBatchers();

                        if(this.precUrl == getCurrentURL()) {
                            this.debugLogger?.log("Body change observer - Detected body change. Re-applying settings.");

                            if(document.body != this.pageAnalyzer.pageAnalysisFinishedBody) {
                                this.debugLogger?.log("Body change observer - Will analyze the page as document.body has changed from the last page analysis");
                                this.resetPageAnalysisState();
                            }

                            this.main(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL);
                        }

                        this.mutationObserverProcessor.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BACKGROUNDS, true);
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
                const settings = this.currentSettings;

                if(this.precEnabled && (!areAllCSSVariablesDefinedForHTMLElement(settings.pageShadowEnabled, settings.colorInvert, settings.attenuateColors)
                    || !areAllClassesDefinedForHTMLElement(settings.pageShadowEnabled, settings.colorInvert, settings.invertEntirePage, settings.theme))) {
                    this.debugLogger?.log("Detected HTML or body element CSS classes or CSS variables changed/erased. Re-applying settings.");

                    await this.main(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL);
                }

                this.timerObserveDocumentElementChange.start(this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval);
            });

            this.timerObserveDocumentElementChange.start(this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval);
        }
    }

    timerApplyMutationClassChanges() {
        if(this.timerApplyMutationObserverClassChanges) this.timerApplyMutationObserverClassChanges.clear();

        this.timerApplyMutationObserverClassChanges = new SafeTimer(() => {
            this.multipleElementClassBatcherAdd.apply();
            this.multipleElementClassBatcherRemove.apply();

            this.timerApplyMutationObserverClassChanges.start(this.websiteSpecialFiltersConfig.intervalApplyClassChanges);
        });

        this.timerApplyMutationObserverClassChanges.start(this.websiteSpecialFiltersConfig.intervalApplyClassChanges);
    }

    async updateFilters() {
        if(this.filterProcessor.filtersCache == null) {
            this.debugLogger?.log("Caching page filters");

            const response = await sendMessageWithPromise({ "type": "getFiltersForThisWebsite" }, "getFiltersResponse");

            if(response.filters) {
                this.filterProcessor.filtersCache = response.filters;
            }

            if(response.specialFilters) {
                this.filterProcessor.processSpecialRules(response.specialFilters);
            }
        }
    }

    async executeFilters() {
        if(this.currentSettings && (this.currentSettings.pageShadowEnabled == "true" || this.currentSettings.colorInvert == "true" || this.currentSettings.attenuateColors == "true")) {
            if(this.processedFilters || this.processingFilters) {
                return;
            }

            this.processingFilters = true;

            try {
                this.debugLogger?.log("Applying page filters");
                await this.filterProcessor.doProcessFilters();
            } catch(e) {
                this.debugLogger?.log("ContentProcessor - executeFilters - Error executing filters", "error", e);
            } finally {
                this.processedFilters = true;
                this.processingFilters = false;
            }
        }
    }

    async main(type, mutation, disableCache) {
        this.precUrl = this.precUrl || getCurrentURL();

        if(type == ContentProcessorConstants.TYPE_RESET) {
            mutation = ContentProcessorConstants.TYPE_ALL;
        }

        this.mutationObserverProcessor?.pause(mutation);

        if(this.runningInIframe) {
            this.debugLogger?.log("Detected this page as running in an iframe");

            const responseEnabled = await sendMessageWithPromise({ "type": "isEnabledForThisPage" }, "isEnabledForThisPageResponse");

            if(responseEnabled.enabled) {
                this.newSettingsToApply = responseEnabled.settings;
            }

            await this.process(responseEnabled.enabled, type);
        } else {
            const allowed = await pageShadowAllowed(getCurrentURL());
            await this.process(allowed, type, disableCache);
        }
    }

    process(allowed, type, disableCache) {
        if(this.applyWhenBodyIsAvailableTimer) this.applyWhenBodyIsAvailableTimer.clear();

        return new Promise(resolve => {
            this.applyWhenBodyIsAvailableTimer = new ApplyBodyAvailable(async () => {
                this.initBodyAndHTMLClassBatchers();

                this.debugLogger?.log(`Starting processing page - allowed? ${allowed} / type? ${type} / disableCache? ${disableCache}`);

                if(allowed) {
                    await this.handleAllowedState(type, disableCache);
                } else {
                    this.resetPage();
                }

                this.started = true;

                resolve();
            });

            this.applyWhenBodyIsAvailableTimer.start();
        });
    }

    initBodyAndHTMLClassBatchers() {
        this.debugLogger?.log("ContentProcessor - initBodyAndHTMLClassBatchers - Initializing body and HTML class batchers");

        this.bodyClassBatcher = new ElementClassBatcher("add", "body");
        this.bodyClassBatcherRemover = new ElementClassBatcher("remove", "body");
        this.htmlClassBatcher = new ElementClassBatcher("add", "html");
    }

    initElementClassBatchers() {
        this.debugLogger?.log("ContentProcessor - initElementClassBatchers - Initializing elements class batchers");

        this.multipleElementClassBatcherAdd = this.multipleElementClassBatcherAdd || new MultipleElementClassBatcher("add", this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall,
            this.websiteSpecialFiltersConfig.delayApplyClassChanges, this.websiteSpecialFiltersConfig.applyClassChangesMaxExecutionTime,
            this.websiteSpecialFiltersConfig.enableThrottleApplyClassChanges);
        this.multipleElementClassBatcherRemove = this.multipleElementClassBatcherRemove || new MultipleElementClassBatcher("remove", this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall,
            this.websiteSpecialFiltersConfig.delayApplyClassChanges, this.websiteSpecialFiltersConfig.applyClassChangesMaxExecutionTime,
            this.websiteSpecialFiltersConfig.enableThrottleApplyClassChanges);
    }

    initProcessors() {
        this.debugLogger?.log("ContentProcessor - initProcessors - Initializing processors");

        this.pageAnalyzer = this.pageAnalyzer || new PageAnalyzer(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled, this.multipleElementClassBatcherAdd, this.multipleElementClassBatcherRemove, this.debugLogger);
        this.mutationObserverProcessor = this.mutationObserverProcessor || new MutationObserverProcessor(this.pageAnalyzer, this.filterProcessor, this.debugLogger, this.elementBrightnessWrapper, this.websiteSpecialFiltersConfig, this.elementBrightness, this.elementBlueLightFilter);
        this.initFilterProcessor();

        this.mutationObserverProcessor.reApplyCallback = (type, mutation) => this.main(type, mutation);
    }

    initFilterProcessor() {
        this.filterProcessor = this.filterProcessor || new PageFilterProcessor(this.pageAnalyzer, this.multipleElementClassBatcherAdd, this.multipleElementClassBatcherRemove, this.websiteSpecialFiltersConfig, this.debugLogger);
    }

    async initializeProcessingPipeline() {
        this.debugLogger?.log("ContentProcessor - initializeProcessingPipeline - Setup processing classes and special filters");

        const specialRules = await sendMessageWithPromise({ "type": "getSpecialRules" }, "getSpecialRulesResponse");

        this.initFilterProcessor();

        this.filterProcessor.processSpecialRules(specialRules.filters);

        this.initElementClassBatchers();
        this.initProcessors();

        await this.filterProcessor.setSettings(this.pageAnalyzer, this.multipleElementClassBatcherAdd, this.multipleElementClassBatcherRemove);
        await this.mutationObserverProcessor.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precUrl, this.precEnabled);
        await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);
    }

    applyAllBodyBatchers() {
        this.bodyClassBatcher.apply();
        this.bodyClassBatcherRemover.apply();
        this.htmlClassBatcher.apply();
    }

    removeAllBodyBatchers() {
        this.bodyClassBatcher.removeAll();
        this.bodyClassBatcherRemover.removeAll();
        this.htmlClassBatcher.removeAll();
    }

    async handleAllowedState(type, disableCache) {
        const settings = this.newSettingsToApply || await getSettings(getCurrentURL(), disableCache);
        this.currentSettings = settings;
        this.precEnabled = true;

        switch(type) {
        case ContentProcessorConstants.TYPE_ONLY_INVERT:
            this.removeAllBodyBatchers();

            this.invertColor(settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.invertBgColor, settings.selectiveInvert, settings.attenuateColors, settings.attenuateImgColors, settings.attenuateBgColors, settings.attenuateVideoColors, settings.attenuateBrightColors, settings.percentageAttenuateColors, settings.invertBrightColors);

            this.applyAllBodyBatchers();
            break;
        case ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT:
        case ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS:
        case ContentProcessorConstants.TYPE_ONLY_BLUELIGHT:
            this.mutationObserverProcessor?.pause(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);

            if ([ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS].includes(type)) {
                this.brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
            }

            if ([ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, ContentProcessorConstants.TYPE_ONLY_BLUELIGHT].includes(type)) {
                this.blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);
            }
            break;
        default:
            this.removeAllBodyBatchers();

            await this.contrastPage(settings.pageShadowEnabled, settings.theme, settings.colorInvert, settings.invertImageColors, settings.invertEntirePage, settings.invertVideoColors, settings.disableImgBgColor, settings.invertBgColor, settings.selectiveInvert, settings.brightColorPreservation, settings.attenuateColors, settings.attenuateImgColors, settings.attenuateBgColors, settings.attenuateVideoColors, settings.attenuateBrightColors, settings.percentageAttenuateColors, settings.invertBrightColors);

            this.applyAllBodyBatchers();
        }

        await this.initializeProcessingPipeline();

        if(![ContentProcessorConstants.TYPE_ONLY_CONTRAST, ContentProcessorConstants.TYPE_ONLY_INVERT, ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS, ContentProcessorConstants.TYPE_ONLY_BLUELIGHT].includes(type)) {
            this.applyBrightnessAndBlueLightFilter(settings);
            await this.applyPageAnalysisAndFilters(settings, type);
        }

        this.mutationObserverProcessor.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BODY);
        this.mutationObserverProcessor.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
        this.mutationObserverProcessor.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESSWRAPPER);

        await this.pageAnalyzer.resetShadowRoots();
    }

    applyBrightnessAndBlueLightFilter(settings) {
        this.mutationObserverProcessor?.pause(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);

        this.brightnessPage(settings.pageLumEnabled, settings.pourcentageLum);
        this.blueLightFilterPage(settings.blueLightReductionEnabled, settings.percentageBlueLightReduction, settings.colorTemp);
    }

    async applyPageAnalysisAndFilters(settings, type) {
        this.debugLogger?.log("ContentProcessor - applyPageAnalysisAndFilters - Applying page analysis and filters");

        this.observeBodyChange();
        this.observeDocumentElementChange();
        this.timerApplyMutationClassChanges();

        if(settings.pageShadowEnabled === "true" || settings.colorInvert === "true" || settings.attenuateColors === "true") {
            if(type === ContentProcessorConstants.TYPE_START || !this.pageAnalyzer.pageAnalysisFinished) {
                await this.updateFilters();

                await this.applyPageAnalysis(type, "*");

                if(document.readyState === "complete") {
                    await this.executeFilters();
                } else {
                    const readyStateChangeApplyFilters = document.addEventListener("readystatechange", () => {
                        if(document.readyState === "complete") {
                            document.removeEventListener("readystatechange", readyStateChangeApplyFilters);
                            this.executeFilters();
                        }
                    });
                }
            }
        }
    }

    resetPage() {
        this.precEnabled = false;

        if(typeof this.lnkCustomTheme !== "undefined") this.lnkCustomTheme.setAttribute("href", "");

        if(this.started) {
            this.mutationObserverProcessor?.pause(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
            this.bodyClassBatcherRemover?.removeAll();
            this.resetContrastPage();
            this.resetInvertPage();
            this.resetAttenuateColor();
            this.resetBrightnessPage();
            this.resetBlueLightPage();
            this.pageAnalyzer?.clearShadowRoots();
            this.bodyClassBatcherRemover?.apply();
        }
    }

    resetPageAnalysisState() {
        this.processingFilters = false;
        this.processedFilters = false;

        if(this.filterProcessor) {
            this.filterProcessor.filtersCache = null;
        }

        if(this.pageAnalyzer) {
            this.pageAnalyzer.pageAnalysisFinishedBody = document.body;
            this.pageAnalyzer.cancelPageAnalysis();
        }
    }

    hasEnabledStateChanged(isEnabled) {
        return this.started && ((isEnabled && !this.precEnabled) || (!isEnabled && this.precEnabled));
    }
}