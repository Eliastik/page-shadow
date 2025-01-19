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
import { removeClass, addClass, getPageAnalyzerCSSClass } from "../utils/cssClassUtils.js";
import { loadWebsiteSpecialFiltersConfig } from "../utils/storageUtils.js";
import { getCustomThemeConfig } from "../utils/customThemeUtils.js";
import { elementIsImage, extractSvgUseHref } from "../utils/imageUtils.js";
import { rgbTohsl, hexToRgb, cssColorToRgbaValues, extractGradientRGBValues, isColorTransparent } from "../utils/colorUtils.js";
import { ignoredElementsContentScript, pageShadowClassListsMutationsToProcess, pageShadowClassListsMutationsToIgnore, ignoredElementsBrightTextColorDetection, defaultThemesTextColors } from "../constants.js";
import ThrottledTask from "./throttledTask.js";
import ImageProcessor from "./imageProcessor.js";
import ShadowDomProcessor from "./shadowDomProcessor.js";
import DarkThemeDetector from "./darkThemeDetector.js";

/**
 * Class used to analyze page elements and detect transparent background,
 * background images, bright colors, etc.
 */
export default class PageAnalyzer {

    imageProcessor;
    shadowDomProcessor;
    darkThemeDetector;

    websiteSpecialFiltersConfig = {};
    isEnabled = false;
    currentSettings = {};

    analyzingPage = false;
    startTimePageAnalysis = -1;
    pageAnalysisFinished = false;
    pageAnalysisCanceled = false;
    pageAnalysisFinishedBody = null;
    pageAnalysisAlreadyProcessedNodes = new WeakSet();

    multipleElementClassBatcherAdd = null;
    multipleElementClassBatcherRemove = null;

    debugLogger;

    throttledTaskAnalyzeElements;
    throttledTaskAnalyzeSubchilds;
    throttledTaskAnalyzeImages;

    themeColorRGB = "";

    constructor(websiteSpecialFiltersConfig, currentSettings, isEnabled, multipleElementClassBatcherAdd, multipleElementClassBatcherRemove, debugLogger) {
        this.setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled);

        this.multipleElementClassBatcherAdd = multipleElementClassBatcherAdd;
        this.multipleElementClassBatcherRemove = multipleElementClassBatcherRemove;
        this.debugLogger = debugLogger;
        this.imageProcessor = new ImageProcessor(this.debugLogger, websiteSpecialFiltersConfig);
        this.shadowDomProcessor = new ShadowDomProcessor(currentSettings, websiteSpecialFiltersConfig, isEnabled);
        this.darkThemeDetector = new DarkThemeDetector(websiteSpecialFiltersConfig, debugLogger);

        this.shadowDomProcessor.analyzeSubElementsCallback = async currentElement => {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
                await this.analyzeElementChildrens(currentElement);
            }
        };

        this.initializeThrottledTasks();
    }

    async setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled) {
        if(!websiteSpecialFiltersConfig) {
            this.websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
        } else {
            this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        }

        this.currentSettings = currentSettings;
        this.isEnabled = isEnabled;

        if(this.imageProcessor) {
            this.imageProcessor.setSettings(websiteSpecialFiltersConfig);
        }

        if(this.shadowDomProcessor) {
            this.shadowDomProcessor.setSettings(currentSettings, websiteSpecialFiltersConfig, isEnabled);
        }

        if(this.darkThemeDetector) {
            this.darkThemeDetector.setSettings(currentSettings, websiteSpecialFiltersConfig);
        }

        if(this.throttledTaskAnalyzeElements) {
            this.throttledTaskAnalyzeElements.setSettings(this.websiteSpecialFiltersConfig);
        }

        if(this.throttledTaskAnalyzeSubchilds) {
            this.throttledTaskAnalyzeSubchilds.setSettings(this.websiteSpecialFiltersConfig);
        }

        if(this.throttledTaskAnalyzeImages) {
            this.throttledTaskAnalyzeImages.setSettings(this.websiteSpecialFiltersConfig);
        }

        if(this.currentSettings && this.currentSettings.theme && this.currentSettings.pageShadowEnabled == "true") {
            const { theme } = this.currentSettings;
            const themeColor = theme.startsWith("custom") ? (await getCustomThemeConfig(theme.replace("custom", ""), null)).textColor : defaultThemesTextColors[parseInt(theme, 10) - 1];

            this.themeColorRGB = hexToRgb(themeColor);
        } else {
            this.themeColorRGB = "";
        }
    }

    initializeThrottledTasks() {
        this.throttledTaskAnalyzeElements = new ThrottledTask(
            element => this.processElement(element, false),
            "throttledTaskAnalyzeElements",
            this.websiteSpecialFiltersConfig.backgroundDetectionStartDelay,
            this.websiteSpecialFiltersConfig.throttleBackgroundDetectionElementsTreatedByCall,
            this.websiteSpecialFiltersConfig.throttleBackgroundDetectionMaxExecutionTime
        );

        this.throttledTaskAnalyzeSubchilds = new ThrottledTask(
            element => this.processElement(element, false),
            "throttledTaskAnalyzeSubchilds",
            this.websiteSpecialFiltersConfig.delayMutationObserverBackgroundsSubchilds,
            this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsTreatedByCall,
            this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsMaxExecutionTime
        );

        this.throttledTaskAnalyzeImages = new ThrottledTask(
            task => this.taskAnalyzeImage(task.image, task.hasBackgroundImg, task.computedStyles, task.pseudoElt),
            "throttledTaskAnalyzeImages",
            this.websiteSpecialFiltersConfig.throttleDarkImageDetectionDelay,
            this.websiteSpecialFiltersConfig.throttleDarkImageDetectionBatchSize,
            this.websiteSpecialFiltersConfig.throttleDarkImageDetectionMaxExecutionTime,
            false,
            task => this.imageProcessor.detectionCanBeAwaited(task.image)
        );
    }

    async taskAnalyzeImage(image, hasBackgroundImg, computedStyles, pseudoElt) {
        if(!image) {
            return;
        }

        if(image.classList.contains(getPageAnalyzerCSSClass("pageShadowSelectiveInvert", pseudoElt))) {
            this.debugLogger.log("Ignored dark image detection for element because element already has class pageShadowSelectiveInvert", "debug", image);
            return;
        }

        const isDarkImage = await this.imageProcessor.detectDarkImage(image, hasBackgroundImg, computedStyles, pseudoElt);

        if (isDarkImage) {
            this.multipleElementClassBatcherAdd.add(image, getPageAnalyzerCSSClass("pageShadowSelectiveInvert", pseudoElt));

            const { useHrefs } = await extractSvgUseHref(image);

            for(const useHref of useHrefs) {
                const symbol = document.querySelector(useHref);

                if(symbol) {
                    this.multipleElementClassBatcherAdd.add(symbol, getPageAnalyzerCSSClass("pageShadowForceBlackColor", pseudoElt));
                }
            }
        }
    }

    async analyzeElements(tagName, forceDisableThrottle) {
        this.debugLogger?.log(`PageAnalyzer analyzeElements - Beginning analyzing page elements - elements tagName: ${tagName}`);

        if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
            if(this.analyzingPage || this.pageAnalysisFinished) {
                this.debugLogger?.log("PageAnalyzer analyzeElements - Already analyzing or analyzed page elements, exiting");
                return;
            }

            this.darkThemeDetector?.clear();

            this.analyzingPage = true;
            this.startTimePageAnalysis = performance.now();
            this.pageAnalysisCanceled = false;

            addClass(document.documentElement, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
            addClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");

            await this.processElement(document.body, true);

            const elements = Array.from(document.body.getElementsByTagName(tagName));

            if(this.websiteSpecialFiltersConfig.throttleBackgroundDetection && !forceDisableThrottle) {
                await this.runThrottledPageAnalysis(elements);
            } else {
                await this.runNormalPageAnalysis(elements, forceDisableThrottle);
            }

            this.analyzingPage = false;
        } else {
            this.setPageAnalysisFinished();
        }
    }

    async runNormalPageAnalysis(elements, forceDisableThrottle) {
        removeClass(document.documentElement, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
        removeClass(document.body, "pageShadowDisableBackgroundStyling");

        const elementsLength = elements.length;

        let startTime = performance.now();
        let totalExecutionTime = 0;

        let currentIndex = 0;

        while(currentIndex < elementsLength) {
            if(this.pageAnalysisCanceled) {
                this.pageAnalysisCanceled = false;
                return;
            }

            await this.processElement(elements[currentIndex], true);
            currentIndex++;

            const currentTime = performance.now();
            const addTime = currentTime - startTime;
            totalExecutionTime += addTime;
            startTime = currentTime;

            if(!forceDisableThrottle && totalExecutionTime >= this.websiteSpecialFiltersConfig.autoThrottleBackgroundDetectionTime) {
                this.debugLogger?.log(
                    `PageAnalyzer analyzeElements - Stopping early task to respect maxExecutionTime = ${this.websiteSpecialFiltersConfig.autoThrottleBackgroundDetectionTime} ms, and enabling throttling`
                );
                return this.runThrottledPageAnalysis(elements.slice(currentIndex));
            }
        }

        this.setPageAnalysisFinished();
    }

    async runThrottledPageAnalysis(elements) {
        if(this.pageAnalysisCanceled) {
            this.pageAnalysisCanceled = false;
            return;
        }

        removeClass(document.documentElement, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
        removeClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");

        await this.throttledTaskAnalyzeElements.start(elements);

        this.setPageAnalysisFinished();
    }

    setPageAnalysisFinished() {
        removeClass(document.documentElement, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
        removeClass(document.body, "pageShadowDisableBackgroundStyling", "pageShadowDisableStyling");

        addClass(document.body, "pageShadowBackgroundDetected");

        this.pageAnalysisFinished = true;
        this.pageAnalysisCanceled = false;
        this.pageAnalysisFinishedBody = document.body;

        this.debugLogger?.log(`PageAnalyzer - setPageAnalysisFinished - Page analysis completed in ${performance.now() - this.startTimePageAnalysis} ms`);
    }

    cancelPageAnalysis() {
        this.pageAnalysisFinished = false;
        this.analyzingPage = false;
        this.pageAnalysisCanceled = true;
        this.throttledTaskAnalyzeElements.clear();

        this.debugLogger?.log("PageAnalyzer - cancelPageAnalysis - Cancelled page analyzing");
    }

    async executePostActions() {
        await this.darkThemeDetector.executeActions();
    }

    async processElement(element, disableDestyling) {
        if(element && element.shadowRoot != null && this.websiteSpecialFiltersConfig.enableShadowRootStyleOverride) {
            await this.processShadowRoots(element);
        }

        if(!element || (element != document.body && (element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected"))) || this.pageAnalysisAlreadyProcessedNodes.has(element) || ignoredElementsContentScript.includes(element.localName) || !element.isConnected) {
            return;
        }

        const elementWasAlreadyDisabled = element.classList.contains("pageShadowElementDisabled");

        if(!disableDestyling) {
            addClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
        }

        this.analyzeElement(element, null);

        if(this.websiteSpecialFiltersConfig.enablePseudoElementsAnalysis) {
            // Analyze pseudo-element :before
            const hasPseudoEltBefore = this.analyzeElement(element, ":before");

            // Analyze pseudo-element :after
            const hasPseudoEltAfter = this.analyzeElement(element, ":after");

            if(hasPseudoEltBefore || hasPseudoEltAfter) {
                addClass(element, "pageShadowHasPseudoElement");
            }
        }

        if(this.websiteSpecialFiltersConfig.useBackgroundDetectionAlreadyProcessedNodes) {
            this.pageAnalysisAlreadyProcessedNodes.add(element);
        }

        if(!disableDestyling) {
            if(elementWasAlreadyDisabled) {
                removeClass(element, "pageShadowDisableStyling");
            } else {
                removeClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
            }
        }
    }

    analyzeElement(element, pseudoElt) {
        const computedStyles = window.getComputedStyle(element, pseudoElt);

        // If the pseudo-element is not defined, we stop here
        if(pseudoElt && computedStyles.content === "none") {
            return false;
        }

        const hasClassImg = element.classList.contains(getPageAnalyzerCSSClass("pageShadowHasBackgroundImg", pseudoElt));
        const hasBackgroundImg = hasClassImg || this.hasBackgroundImage(element, computedStyles, pseudoElt);
        const hasTransparentBackgroundClass = element.classList.contains(getPageAnalyzerCSSClass("pageShadowHasTransparentBackground", pseudoElt));

        // Detect image with dark color (text, logos, etc)
        if (this.websiteSpecialFiltersConfig.enableDarkImageDetection) {
            if(!element.classList.contains(getPageAnalyzerCSSClass("pageShadowSelectiveInvert", pseudoElt)) && elementIsImage(element, hasBackgroundImg)) {
                if (this.websiteSpecialFiltersConfig.throttleDarkImageDetection) {
                    this.throttledTaskAnalyzeImages.start([{
                        image: element,
                        computedStyles,
                        hasBackgroundImg,
                        pseudoElt
                    }]);
                } else {
                    this.taskAnalyzeImage(element, hasBackgroundImg, computedStyles, pseudoElt);
                }
            }
        }

        if (hasBackgroundImg && !hasClassImg) {
            this.multipleElementClassBatcherAdd.add(element, getPageAnalyzerCSSClass("pageShadowHasBackgroundImg", pseudoElt));
        }

        let transparentColorDetected = false;

        if (this.websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled) {
            transparentColorDetected = this.detectTransparentBackground(element, computedStyles, hasBackgroundImg, hasTransparentBackgroundClass, pseudoElt);
        }

        if (this.websiteSpecialFiltersConfig.enableBrightColorDetection) {
            this.detectBrightColor(element, computedStyles, transparentColorDetected, hasTransparentBackgroundClass, pseudoElt);
        }

        if(pseudoElt) {
            return true;
        }

        this.darkThemeDetector.process(element, computedStyles, hasBackgroundImg, transparentColorDetected || hasTransparentBackgroundClass);
    }

    elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg) {
        if(!backgroundColor) {
            return true;
        }

        const rgbaColor = cssColorToRgbaValues(backgroundColor);
        const isTransparentColor = isColorTransparent(rgbaColor);
        const alpha = rgbaColor && rgbaColor.length === 4 ? rgbaColor[3] : 1;

        const hasBackgroundImageValue = this.elementHasBackgroundImageValue(backgroundImage);
        const hasNoBackgroundColorValue = backgroundColor && (backgroundColor.trim().toLowerCase().indexOf("transparent") != -1 || backgroundColor.trim().toLowerCase() == "none" || backgroundColor.trim() == "");

        return (hasNoBackgroundColorValue || isTransparentColor || (alpha <= this.websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold)) && !hasBackgroundImg && !hasBackgroundImageValue;
    }

    elementHasBackgroundImageValue(backgroundImage) {
        const hasBackgroundImageValue = backgroundImage && (backgroundImage.trim().toLowerCase() != "none" && backgroundImage.trim() != "");

        if(hasBackgroundImageValue) {
            const hasGradientValue = this.hasGradient(backgroundImage);

            if(hasGradientValue) {
                const rgbValuesLists = extractGradientRGBValues(backgroundImage);
                return !rgbValuesLists.every(([, , , alpha = 1]) => alpha <= this.websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold);
            }

            return true;
        }

        return false;
    }

    hasGradient(background) {
        return background && (background.trim().toLowerCase().indexOf("linear-gradient") != -1
            || background.trim().toLowerCase().indexOf("radial-gradient") != -1 || background.trim().toLowerCase().indexOf("conic-gradient") != -1);
    }

    elementHasBrightColor(background, backgroundColor, isText) {
        if(background) {
            const hasGradient = this.hasGradient(background);

            if(hasGradient) {
                const rgbValuesLists = extractGradientRGBValues(background);

                for(const rgbValuesList of rgbValuesLists) {
                    const isBrightColor = this.isBrightColor(rgbValuesList, isText, true);

                    if (isBrightColor && isBrightColor[0]) {
                        return isBrightColor;
                    }
                }
            }
        }

        if(backgroundColor) {
            return this.isBrightColor(cssColorToRgbaValues(backgroundColor), isText, false);
        }
    }

    isBrightColor(rgbValuesList, isText, isGradient) {
        if(!rgbValuesList) {
            return false;
        }

        const hsl = rgbTohsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);

        // If ligthness is between min and max values
        const minLightnessTreshold = isText ? this.websiteSpecialFiltersConfig.brightColorLightnessTresholdTextMin : this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMin;
        const maxLightnessTreshold = this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMax;
        const minSaturationTreshold = this.websiteSpecialFiltersConfig.brightColorSaturationTresholdMin;

        if (isText) {
            if(hsl[2] >= minLightnessTreshold && hsl[1] >= minSaturationTreshold) {
                return [true, false];
            }
        } else if(hsl[2] >= minLightnessTreshold && hsl[2] <= maxLightnessTreshold &&
            ((isGradient && hsl[1] >= minSaturationTreshold) || !isGradient)
        ) {
            if(hsl[2] >= 0.5) {
                return [true, true];
            }

            return [true, false];
        }

        return [false, false];
    }

    parentHasBrightColor(element) {
        return element.closest(".pageShadowHasBrightColorBackground") != null;
    }

    hasBackgroundImage(element, computedStyles, pseudoElt) {
        if(element.tagName.toLowerCase() === "img" || element.tagName.toLowerCase() === "picture") {
            return false;
        }

        if(element instanceof HTMLObjectElement && element.type && element.type.trim().toLowerCase().startsWith("image/")) {
            return true;
        }

        return this.valueContainsBackgroundImage(computedStyles.background) || this.valueContainsBackgroundImage(computedStyles.backgroundImage) || this.valueContainsBackgroundImage(computedStyles.maskImage) || (pseudoElt && this.valueContainsBackgroundImage(computedStyles.content));
    }

    valueContainsBackgroundImage(value) {
        if(!value || value.trim().length <= 0) {
            return false;
        }

        return value.split(" ").some(v => v.trim().substring(0, 4).toLowerCase().includes("url("));
    }

    isTextElement(element, computedStyles, pseudoElt) {
        if(pseudoElt) {
            return computedStyles.content != null && computedStyles.content.trim().length > 0;
        }

        if (!element || element.nodeType !== Node.ELEMENT_NODE || ignoredElementsBrightTextColorDetection.includes(element.tagName.toLowerCase())) {
            return false;
        }

        const hasShallowChildren = Array.from(element.children).every(child => child.children.length === 0);
        const notAllChildrenAreImg = Array.from(element.children).every(child => !ignoredElementsBrightTextColorDetection.includes(child.tagName.toLowerCase()));

        return hasShallowChildren && notAllChildrenAreImg;
    }

    detectBrightColor(element, computedStyles, transparentColorDetected, hasTransparentBackgroundClass, pseudoElt) {
        const { background, backgroundColor } = computedStyles;

        // Background color
        if (!transparentColorDetected && !hasTransparentBackgroundClass) {
            const hasBrightColor = this.elementHasBrightColor(background, backgroundColor, false);

            if (hasBrightColor && hasBrightColor[0]) {
                addClass(element, getPageAnalyzerCSSClass("pageShadowHasBrightColorBackground", pseudoElt));

                if (hasBrightColor[1]) {
                    this.multipleElementClassBatcherAdd.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorWithBlackText", pseudoElt));
                    this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorWithWhiteText", pseudoElt));
                } else {
                    this.multipleElementClassBatcherAdd.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorWithWhiteText", pseudoElt));
                    this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorWithBlackText", pseudoElt));
                }
            } else {
                this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowHasBrightColorBackground", pseudoElt),
                    getPageAnalyzerCSSClass("pageShadowBrightColorWithBlackText", pseudoElt), getPageAnalyzerCSSClass("pageShadowBrightColorWithWhiteText", pseudoElt));

                if (this.websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement && element && element.parentNode && element.parentNode.closest) {
                    const closestBright = element.parentNode.closest("." + getPageAnalyzerCSSClass("pageShadowHasBrightColorBackground", pseudoElt));

                    if (closestBright && closestBright != document.body) {
                        addClass(element, getPageAnalyzerCSSClass("pageShadowBrightColorForceCustomTextLinkColor", pseudoElt));
                    } else {
                        this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorForceCustomTextLinkColor", pseudoElt));
                    }
                } else {
                    this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorForceCustomTextLinkColor", pseudoElt));
                }
            }
        } else if (this.websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement && element && element.parentNode && element.parentNode.closest) {
            const closestForceCustom = element.parentNode.closest("." + getPageAnalyzerCSSClass("pageShadowBrightColorForceCustomTextLinkColor", pseudoElt));

            if (closestForceCustom && closestForceCustom != document.body) {
                addClass(element, getPageAnalyzerCSSClass("pageShadowBrightColorForceCustomTextLinkColor", pseudoElt));
            } else {
                this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowBrightColorForceCustomTextLinkColor", pseudoElt));
            }
        }

        // Text color
        const isTextElement = this.isTextElement(element, computedStyles, pseudoElt);

        if(isTextElement) {
            const textColor = computedStyles.color;

            if(textColor !== this.themeColorRGB) {
                const hasBrightColor = this.elementHasBrightColor(textColor, textColor, true);

                if (hasBrightColor && hasBrightColor[0]) {
                    this.multipleElementClassBatcherAdd.add(element, getPageAnalyzerCSSClass("pageShadowHasBrightColorText", pseudoElt));
                } else {
                    this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowHasBrightColorText", pseudoElt));
                }
            }
        }
    }

    detectTransparentBackground(element, computedStyles, hasBackgroundImg, hasTransparentBackgroundClass, pseudoElt) {
        const { backgroundColor, backgroundImage } = computedStyles;

        const hasTransparentBackground = this.elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg);
        const backgroundClip = computedStyles.getPropertyValue("background-clip") || computedStyles.getPropertyValue("-webkit-background-clip");
        const hasBackgroundClipText = backgroundClip && backgroundClip.trim().toLowerCase() == "text";

        if ((hasTransparentBackground || hasBackgroundClipText)) {
            if (!hasTransparentBackgroundClass) {
                this.multipleElementClassBatcherAdd.add(element, getPageAnalyzerCSSClass("pageShadowHasTransparentBackground", pseudoElt));
                return true;
            }
        } else if (hasTransparentBackgroundClass) {
            this.multipleElementClassBatcherRemove.add(element, getPageAnalyzerCSSClass("pageShadowHasTransparentBackground", pseudoElt));
        }

        return false;
    }

    async processShadowRoots(element) {
        if (this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay > 0) {
            setTimeout(() => this.processShadowRoot(element), this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
        } else {
            await this.processShadowRoot(element);
        }
    }

    async processShadowRoot(currentElement) {
        await this.shadowDomProcessor.processShadowRoot(currentElement);
    }

    clearShadowRoots() {
        this.shadowDomProcessor.clearShadowRoots();
    }

    async resetShadowRoots() {
        await this.shadowDomProcessor.resetShadowRoots();
    }

    async mutationForElement(element, attribute, attributeOldValue) {
        if(!element || !element.classList || element == document.body || ignoredElementsContentScript.includes(element.localName) || element.nodeType != 1) {
            return false;
        }

        if(attribute && (!this.websiteSpecialFiltersConfig.enableMutationObserverAttributes || (attribute.toLowerCase() == "class" && !this.websiteSpecialFiltersConfig.enableMutationObserverClass)
            || (attribute.toLowerCase() == "style" && !this.websiteSpecialFiltersConfig.enableMutationObserverStyle))) {
            return false;
        }

        if(attribute == "class" && attributeOldValue != null) {
            if(attributeOldValue.indexOf("pageShadowDisableStyling") !== -1 ||
                element.classList.contains("pageShadowDisableStyling") ||
                attributeOldValue.indexOf("pageShadowElementDisabled") !== -1 ||
                element.classList.contains("pageShadowElementDisabled")) {
                return false;
            }

            if(element.classList.length <= 0) {
                return false;
            }

            let noChange = true;

            for(const _class of attributeOldValue.split(" ")) {
                if(!element.classList.contains(_class)) {
                    noChange = false;
                    break;
                }
            }

            if(noChange) {
                return false;
            }

            let hasMutationPageShadowClass = false;
            let newClassContainsPageShadowClass = false;
            let modifiedClassContainsPageShadowClassToIgnore = false;

            for(const _class of pageShadowClassListsMutationsToProcess) {
                const indexOfClass = attributeOldValue.indexOf(_class);
                const elementContainsClass = element.classList.contains(_class);

                if(indexOfClass !== -1 && !elementContainsClass) {
                    hasMutationPageShadowClass = true;
                }

                if(indexOfClass === -1 && elementContainsClass) {
                    newClassContainsPageShadowClass = true;
                }
            }

            for(const _class of pageShadowClassListsMutationsToIgnore) {
                const indexOfClass = attributeOldValue.indexOf(_class);
                const elementContainsClass = element.classList.contains(_class);

                if((indexOfClass !== -1 && !elementContainsClass) ||
                    (indexOfClass === -1 && elementContainsClass)) {
                    modifiedClassContainsPageShadowClassToIgnore = true;
                }
            }

            if(newClassContainsPageShadowClass || modifiedClassContainsPageShadowClassToIgnore) {
                return false;
            }

            if(hasMutationPageShadowClass) {
                if(this.websiteSpecialFiltersConfig.useBackgroundDetectionAlreadyProcessedNodes) {
                    this.pageAnalysisAlreadyProcessedNodes.delete(element);
                }
            }
        }

        await this.processElement(element, false);

        // Detect element childrens
        if (!attribute && this.websiteSpecialFiltersConfig.enableMutationObserversForSubChilds) {
            await this.analyzeElementChildrens(element);
        }
    }

    async analyzeElementChildrens(currentElement) {
        if (currentElement.getElementsByTagName || currentElement.querySelectorAll) {
            const elementChildrens = currentElement.getElementsByTagName ? currentElement.getElementsByTagName("*") : currentElement.querySelectorAll("*");

            if (this.websiteSpecialFiltersConfig.throttleMutationObserverBackgroundsSubChilds) {
                this.throttledTaskAnalyzeSubchilds.start(elementChildrens);
            } else {
                for (const element of elementChildrens) {
                    await this.processElement(element);
                }
            }
        }
    }
}