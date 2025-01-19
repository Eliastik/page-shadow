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
import { isRunningInIframe, isRunningInPopup, sendMessageWithPromise } from "../utils/browserUtils.js";
import { getCurrentURL } from "../utils/urlUtils.js";
import { areAllClassesDefinedForHTMLElement } from "../utils/cssClassUtils.js";
import { loadWebsiteSpecialFiltersConfig } from "../utils/storageUtils.js";
import { areAllCSSVariablesDefinedForHTMLElement } from "../utils/cssVariableUtils.js";
import { getSettings } from "../utils/settingsUtils.js";
import { pageShadowAllowed } from "../utils/enableDisableUtils.js";
import IncreasePageContrast from "./features/increasePageContrast.js";
import InvertColor from "./features/invertColor.js";
import AttenuateColor from "./features/attenuateColor.js";
import BrightnessReduction from "./features/brightnessReduction.js";
import BluelightReduction from "./features/bluelightReduction.js";
import ElementClassBatcher from "./elementClassBatcher.js";
import SafeTimer from "./safeTimer.js";
import MutationObserverProcessor from "./mutationObserverProcessor.js";
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

    // Features
    increasePageContrast;
    invertColor;
    attenuateColor;
    brightnessReduction;
    bluelightReduction;

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

    initFeatures(settings) {
        this.increasePageContrast = this.increasePageContrast || new IncreasePageContrast(this.debugLogger);
        this.invertColor = this.invertColor || new InvertColor(this.debugLogger);
        this.attenuateColor = this.attenuateColor || new AttenuateColor(this.debugLogger);
        this.brightnessReduction = this.brightnessReduction || new BrightnessReduction(this.debugLogger);
        this.bluelightReduction = this.bluelightReduction || new BluelightReduction(this.debugLogger);

        this.increasePageContrast.setSettings(settings || this.currentSettings, this.bodyClassBatcher, this.htmlClassBatcher, this.bodyClassBatcherRemover, this.lnkCustomTheme);
        this.invertColor.setSettings(settings || this.currentSettings, this.bodyClassBatcher, this.htmlClassBatcher, this.bodyClassBatcherRemover, this.websiteSpecialFiltersConfig);
        this.attenuateColor.setSettings(settings || this.currentSettings, this.bodyClassBatcher, this.htmlClassBatcher, this.bodyClassBatcherRemover, this.websiteSpecialFiltersConfig);
        this.brightnessReduction.setSettings(settings || this.currentSettings, this.elementBrightness, this.elementBrightnessWrapper, this.runningInIframe);
        this.bluelightReduction.setSettings(settings || this.currentSettings, this.elementBlueLightFilter, this.elementBrightnessWrapper, this.runningInIframe);
    }

    initProcessors() {
        this.debugLogger?.log("ContentProcessor - initProcessors - Initializing processors");

        this.pageAnalyzer = this.pageAnalyzer || new PageAnalyzer(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled, this.multipleElementClassBatcherAdd, this.multipleElementClassBatcherRemove, this.debugLogger);
        this.mutationObserverProcessor = this.mutationObserverProcessor || new MutationObserverProcessor(this.pageAnalyzer, this.filterProcessor, this.debugLogger, this.elementBrightnessWrapper, this.websiteSpecialFiltersConfig, this.elementBrightness, this.elementBlueLightFilter);
        this.initFilterProcessor();

        this.mutationObserverProcessor.reApplyCallback = (type, mutation) => this.start(type, mutation);
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

    async start(type, mutation, disableCache) {
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
        if(this.applyWhenBodyIsAvailableTimer) {
            this.applyWhenBodyIsAvailableTimer.clear();
        }

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

    fastPreApply(settings, customThemes) {
        this.initBodyAndHTMLClassBatchers();
        this.initFeatures(settings);

        // Pre-apply contrast, brightness, blue light filter and invert entire page
        if(settings.pageShadowEnabled == "true") {
            this.increasePageContrast.apply(true, customThemes);
        }

        if(settings.pageLumEnabled == "true") {
            this.brightnessReduction.apply();
        }

        if(settings.blueLightReductionEnabled == "true") {
            this.bluelightReduction.apply();
        }

        if(settings.colorInvert == "true" && settings.invertEntirePage == "true") {
            this.invertColor.apply();

            this.bodyClassBatcher.apply();
            this.bodyClassBatcherRemover.apply();
            this.htmlClassBatcher.apply();
        }

        this.started = true;
    }

    async handleAllowedState(type, disableCache) {
        this.precEnabled = true;

        const settings = this.newSettingsToApply || await getSettings(getCurrentURL(), disableCache);
        this.currentSettings = settings;

        this.initFeatures();

        switch(type) {
        case ContentProcessorConstants.TYPE_ONLY_INVERT:
            this.removeAllBodyBatchers();

            this.invertColor.apply();
            this.attenuateColor.apply();

            this.applyAllBodyBatchers();
            break;
        case ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT:
        case ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS:
        case ContentProcessorConstants.TYPE_ONLY_BLUELIGHT:
            this.mutationObserverProcessor?.pause(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);

            if ([ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS].includes(type)) {
                this.brightnessReduction.apply();
            }

            if ([ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, ContentProcessorConstants.TYPE_ONLY_BLUELIGHT].includes(type)) {
                this.bluelightReduction.apply();
            }
            break;
        default:
            this.removeAllBodyBatchers();

            await this.increasePageContrast.apply(false);
            this.invertColor.apply();
            this.attenuateColor.apply();

            this.applyAllBodyBatchers();
        }

        await this.initializeProcessingPipeline();

        if(![ContentProcessorConstants.TYPE_ONLY_CONTRAST, ContentProcessorConstants.TYPE_ONLY_INVERT, ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS, ContentProcessorConstants.TYPE_ONLY_BLUELIGHT].includes(type)) {
            this.applyBrightnessAndBlueLightFilter(settings);
            await this.applyPageAnalysisAndFilters(settings, type);
        }

        this.mutationObserverProcessor?.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BODY);
        this.mutationObserverProcessor?.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
        this.mutationObserverProcessor?.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESSWRAPPER);

        await this.pageAnalyzer.resetShadowRoots();
    }

    applyBrightnessAndBlueLightFilter() {
        this.mutationObserverProcessor?.pause(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);

        this.brightnessReduction.apply();
        this.bluelightReduction.apply();
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

                await this.pageAnalyzer.executePostActions();
            }
        }
    }

    resetPage() {
        this.precEnabled = false;

        if(typeof this.lnkCustomTheme !== "undefined") {
            this.lnkCustomTheme.setAttribute("href", "");
        }

        if(this.started) {
            this.initFeatures();

            this.mutationObserverProcessor?.pause(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);

            this.bodyClassBatcherRemover?.removeAll();

            this.increasePageContrast.resetContrastPage();
            this.invertColor.resetInvertPage();
            this.attenuateColor.resetAttenuateColor();
            this.brightnessReduction.resetBrightnessPage();
            this.bluelightReduction.resetBlueLightPage();

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

    applyPageAnalysis(type, elements) {
        if(this.pageAnalyzer.pageAnalysisFinished) {
            return;
        }

        return new Promise(resolve => {
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

    observeBodyChange() {
        if(this.websiteSpecialFiltersConfig.observeBodyChange) {
            this.debugLogger?.log("Applying body change observer");

            if(this.timerObserveBodyChange) {
                this.timerObserveBodyChange.clear();
            }

            this.timerObserveBodyChange = new SafeTimer(() => {
                if(document.body) {
                    if(!this.oldBody) {
                        this.oldBody = document.body;
                    }

                    if(document.body != this.oldBody) {
                        this.initBodyAndHTMLClassBatchers();
                        this.initElementClassBatchers();

                        if(this.precUrl == getCurrentURL()) {
                            this.debugLogger?.log("Body change observer - Detected body change. Re-applying settings.");

                            if(document.body != this.pageAnalyzer.pageAnalysisFinishedBody) {
                                this.debugLogger?.log("Body change observer - Will analyze the page as document.body has changed from the last page analysis");
                                this.resetPageAnalysisState();
                            }

                            this.start(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL);
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

            if(this.timerObserveDocumentElementChange) {
                this.timerObserveDocumentElementChange.clear();
            }

            this.timerObserveDocumentElementChange = new SafeTimer(async () => {
                const settings = this.currentSettings;

                if(this.precEnabled && (!areAllCSSVariablesDefinedForHTMLElement(settings.pageShadowEnabled, settings.colorInvert, settings.attenuateColors)
                    || !areAllClassesDefinedForHTMLElement(settings.pageShadowEnabled, settings.colorInvert, settings.invertEntirePage, settings.theme))) {
                    this.debugLogger?.log("Detected HTML or body element CSS classes or CSS variables changed/erased. Re-applying settings.");

                    await this.start(ContentProcessorConstants.TYPE_RESET, ContentProcessorConstants.TYPE_ALL);
                }

                this.timerObserveDocumentElementChange.start(this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval);
            });

            this.timerObserveDocumentElementChange.start(this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval);
        }
    }

    timerApplyMutationClassChanges() {
        if(this.timerApplyMutationObserverClassChanges) {
            this.timerApplyMutationObserverClassChanges.clear();
        }

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
}