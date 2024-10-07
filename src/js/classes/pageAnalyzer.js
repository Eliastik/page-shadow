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
import { removeClass, addClass, loadWebsiteSpecialFiltersConfig, rgb2hsl } from "../utils/util.js";
import { ignoredElementsContentScript, pageShadowClassListsMutationsIgnore, ignoredElementsBrightTextColorDetection } from "../constants.js";
import ThrottledTask from "./throttledTask.js";
import ImageProcessor from "./imageProcessor.js";
import ShadowDomProcessor from "./shadowDomProcessor.js";

/**
 * Class used to analyze the pages and detect transparent background,
 * background images, etc.
 */
export default class PageAnalyzer {

    imageProcessor;
    shadowDomProcessor;

    websiteSpecialFiltersConfig = {};
    isEnabled = false;
    currentSettings = {};

    backgroundDetected = false;
    backgroundDetectionAlreadyProcessedNodes = [];
    processedShadowRoots = [];

    multipleElementClassBatcherAdd = null;
    multipleElementClassBatcherRemove = null;

    debugLogger;

    throttledTaskDetectBackgrounds;
    throttledTaskAnalyzeSubchilds;
    throttledTaskAnalyzeImages;

    constructor(websiteSpecialFiltersConfig, currentSettings, isEnabled, multipleElementClassBatcherAdd, multipleElementClassBatcherRemove, debugLogger) {
        this.setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled);

        this.multipleElementClassBatcherAdd = multipleElementClassBatcherAdd;
        this.multipleElementClassBatcherRemove = multipleElementClassBatcherRemove;
        this.debugLogger = debugLogger;
        this.imageProcessor = new ImageProcessor(this.debugLogger, websiteSpecialFiltersConfig);
        this.shadowDomProcessor = new ShadowDomProcessor(currentSettings, isEnabled);

        this.initializeThrottledTasks();
    }

    async setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled) {
        if(!websiteSpecialFiltersConfig) {
            this.websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
        }

        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.currentSettings = currentSettings;
        this.isEnabled = isEnabled;

        if(this.imageProcessor) {
            this.imageProcessor.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        }

        if(this.shadowDomProcessor) {
            this.shadowDomProcessor.currentSettings = currentSettings;
            this.shadowDomProcessor.isEnabled = isEnabled;
        }
    }

    initializeThrottledTasks() {
        this.throttledTaskDetectBackgrounds = new ThrottledTask(
            (element) => this.detectBackgroundForElement(element, false),
            "throttledTaskDetectBackgrounds",
            this.websiteSpecialFiltersConfig.backgroundDetectionStartDelay,
            this.websiteSpecialFiltersConfig.throttleBackgroundDetectionElementsTreatedByCall,
            this.websiteSpecialFiltersConfig.throttleBackgroundDetectionMaxExecutionTime
        );

        this.throttledTaskAnalyzeSubchilds = new ThrottledTask(
            (element) => this.detectBackgroundForElement(element, false),
            "throttledTaskAnalyzeSubchilds",
            this.websiteSpecialFiltersConfig.delayMutationObserverBackgroundsSubchilds,
            this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsTreatedByCall,
            this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsMaxExecutionTime
        );

        this.throttledTaskAnalyzeImages = new ThrottledTask((task) => {
            this.taskAnalyzeImage(task.image, task.hasBackgroundImg);
        },
        "throttledTaskAnalyzeImages",
        this.websiteSpecialFiltersConfig.throttleDarkImageDetectionDelay,
        this.websiteSpecialFiltersConfig.throttleDarkImageDetectionBatchSize,
        this.websiteSpecialFiltersConfig.throttleDarkImageDetectionMaxExecutionTime
        );
    }

    taskAnalyzeImage(image, hasBackgroundImg) {
        this.imageProcessor.detectDarkImage(image, hasBackgroundImg).then(isDarkImage => {
            if (isDarkImage) {
                this.multipleElementClassBatcherAdd.add(image, "pageShadowSelectiveInvert");
            }
        });
    }

    async detectBackground(tagName) {
        return new Promise(resolve => {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
                const throttledBackgroundDetection = this.websiteSpecialFiltersConfig.throttleBackgroundDetection;

                addClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");

                this.detectBackgroundForElement(document.body, true);

                if (throttledBackgroundDetection) {
                    removeClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
                } else {
                    removeClass(document.body, "pageShadowDisableBackgroundStyling");
                }

                const elements = Array.prototype.slice.call(document.body.getElementsByTagName(tagName));
                const elementsLength = elements.length;

                if(throttledBackgroundDetection) {
                    this.throttledTaskDetectBackgrounds.start(elements).then(() => {
                        this.setBackgroundDetectionFinished();
                        resolve();
                    });
                } else {
                    let i = 0;
                    
                    while(i < elementsLength) {
                        this.detectBackgroundForElement(elements[i], true);
                        i++;
                    }

                    this.setBackgroundDetectionFinished();
                    resolve();
                }
            } else {
                this.setBackgroundDetectionFinished();
                resolve();
            }
        });
    }

    setBackgroundDetectionFinished() {
        removeClass(document.body, "pageShadowDisableStyling");
        addClass(document.body, "pageShadowBackgroundDetected");
        this.backgroundDetected = true;
    }

    elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg) {
        if(!backgroundColor) return true;

        const isRgbaColor = backgroundColor.trim().startsWith("rgba");
        const isTransparentColor = backgroundColor.trim().startsWith("rgba(0, 0, 0, 0)");
        const alpha = isRgbaColor ? parseFloat(backgroundColor.split(",")[3]) : -1;
        const hasBackgroundImageValue = this.elementHasBackgroundImageValue(backgroundImage);
        const hasNoBackgroundColorValue = backgroundColor && (backgroundColor.trim().toLowerCase().indexOf("transparent") != -1 || backgroundColor.trim().toLowerCase() == "none" || backgroundColor.trim() == "");

        return (hasNoBackgroundColorValue || isTransparentColor || (isRgbaColor && alpha <= this.websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold)) && !hasBackgroundImg && !hasBackgroundImageValue;
    }

    elementHasBackgroundImageValue(backgroundImage) {
        const hasBackgroundImageValue = backgroundImage && (backgroundImage.trim().toLowerCase() != "none" && backgroundImage.trim() != "");

        if(hasBackgroundImageValue) {
            const hasGradientValue = this.hasGradient(backgroundImage);

            if(hasGradientValue) {
                const rgbValuesLists = this.extractGradientRGBValues(backgroundImage);
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

    extractGradientRGBValues(background) {
        const pattern = /rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d*\.?\d+))?\)/g;
        const matches = [...background.matchAll(pattern)];
        
        const rgbaValuesLists = matches.map(match => {
            const rgb = match.slice(1, 4).map(Number);
            const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
            return [...rgb, alpha];
        });
        
        return rgbaValuesLists;
    }

    elementHasBrightColor(background, backgroundColor, isText) {
        if(background) {
            const hasGradient = this.hasGradient(background);

            if(hasGradient) {
                const rgbValuesLists = this.extractGradientRGBValues(background);

                for(const rgbValuesList of rgbValuesLists) {
                    const isBrightColor = this.isBrightColor(rgbValuesList, isText, true);

                    if (isBrightColor && isBrightColor[0]) {
                        return isBrightColor;
                    }
                }
            }
        }

        if(backgroundColor && backgroundColor.trim().startsWith("rgb")) {
            const rgbValues = backgroundColor.split("(")[1].split(")")[0];
            const rgbValuesList = rgbValues.trim().split(",");
            return this.isBrightColor(rgbValuesList, isText, false);
        }
    }

    isBrightColor(rgbValuesList, isText, isGradient) {
        const hsl = rgb2hsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);

        // If ligthness is between min and max values
        const minLightnessTreshold = isText ? this.websiteSpecialFiltersConfig.brightColorLightnessTresholdTextMin : this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMin;
        const maxLightnessTreshold = this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMax;
        const minSaturationTreshold = this.websiteSpecialFiltersConfig.brightColorSaturationTresholdMin;

        if (isText) {
            if(hsl[2] >= minLightnessTreshold && hsl[1] >= minSaturationTreshold) {
                return [true, false];
            }
        } else {
            if(hsl[2] >= minLightnessTreshold && hsl[2] <= maxLightnessTreshold &&
                ((isGradient && hsl[1] >= minSaturationTreshold) || !isGradient)
            ) {
                if(hsl[2] >= 0.5) {
                    return [true, true];
                }
    
                return [true, false];
            }
        }

        return [false, false];
    }

    parentHasBrightColor(element) {
        return element.closest(".pageShadowHasBrightColorBackground") != null;
    }

    async detectBackgroundForElement(element, disableDestyling) {
        if(element && element.shadowRoot != null && this.websiteSpecialFiltersConfig.enableShadowRootStyleOverride) {
            this.processShadowRoots(element);
        }

        if(!element || (element != document.body && (element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected"))) || this.backgroundDetectionAlreadyProcessedNodes.indexOf(element) !== -1 || ignoredElementsContentScript.includes(element.localName)) {
            return;
        }

        if(!disableDestyling) {
            addClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
        }

        const computedStyle = window.getComputedStyle(element, null);
        const background = computedStyle.getPropertyValue("background");
        const backgroundColor = computedStyle.getPropertyValue("background-color");
        const backgroundImage = computedStyle.getPropertyValue("background-image");

        const hasBackgroundImg = background.split(" ").some(v => v.trim().substring(0, 4).toLowerCase().includes("url(")) || backgroundImage.split(" ").some(v => v.trim().substring(0, 4).toLowerCase().includes("url("));
        const hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");
        const hasTransparentBackgroundClass = element.classList.contains("pageShadowHasTransparentBackground");

        // Detect image with dark color (text, logos, etc)
        if(this.websiteSpecialFiltersConfig.enableDarkImageDetection) {
            if(!element.classList.contains("pageShadowSelectiveInvert")) {
                if(this.websiteSpecialFiltersConfig.throttleDarkImageDetection) {
                    this.throttledTaskAnalyzeImages.start([{
                        image: element,
                        hasBackgroundImg
                    }]);
                } else {
                    this.taskAnalyzeImage(element, hasBackgroundImg);
                }
            }
        }

        if(hasBackgroundImg && !hasClassImg) {
            this.multipleElementClassBatcherAdd.add(element, "pageShadowHasBackgroundImg");
        }

        let transparentColorDetected = false;

        if(this.websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled) {
            transparentColorDetected = this.detectTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg, computedStyle, hasTransparentBackgroundClass, element, transparentColorDetected);
        }

        if(this.websiteSpecialFiltersConfig.enableBrightColorDetection) {
            this.detectBrightColor(transparentColorDetected, hasTransparentBackgroundClass, background, backgroundColor, element, computedStyle);
        }

        if(this.websiteSpecialFiltersConfig.useBackgroundDetectionAlreadyProcessedNodes) {
            this.backgroundDetectionAlreadyProcessedNodes.push(element);
        }

        if(!disableDestyling) {
            removeClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
        }
    }

    processShadowRoots(element) {
        if (this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay > 0) {
            setTimeout(() => this.processShadowRoot(element), this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
        } else {
            this.processShadowRoot(element);
        }
    }

    processShadowRoot(currentElement) {
        this.shadowDomProcessor.processShadowRoot(currentElement);
    }

    resetShadowRoots() {
        this.shadowDomProcessor.resetShadowRoots();
    }

    isTextElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE || ignoredElementsBrightTextColorDetection.includes(element.tagName.toLowerCase())) {
            return false;
        }

        const hasShallowChildren = Array.from(element.children).every(child => child.children.length === 0);
        const notAllChildrenAreImg = Array.from(element.children).every(child => !ignoredElementsBrightTextColorDetection.includes(child.tagName.toLowerCase()));
    
        return hasShallowChildren && notAllChildrenAreImg;
    }

    detectBrightColor(transparentColorDetected, hasTransparentBackgroundClass, background, backgroundColor, element, computedStyle) {
        // Background color
        if (!transparentColorDetected && !hasTransparentBackgroundClass) {
            const hasBrightColor = this.elementHasBrightColor(background, backgroundColor, false);

            if (hasBrightColor && hasBrightColor[0]) {
                addClass(element, "pageShadowHasBrightColorBackground");

                if (hasBrightColor[1]) {
                    this.multipleElementClassBatcherAdd.add(element, "pageShadowBrightColorWithBlackText");
                    this.multipleElementClassBatcherRemove.add(element, "pageShadowBrightColorWithWhiteText");
                } else {
                    this.multipleElementClassBatcherAdd.add(element, "pageShadowBrightColorWithWhiteText");
                    this.multipleElementClassBatcherRemove.add(element, "pageShadowBrightColorWithBlackText");
                }
            } else {
                this.multipleElementClassBatcherRemove.add(element, "pageShadowHasBrightColorBackground", "pageShadowBrightColorWithBlackText", "pageShadowBrightColorWithWhiteText");

                if (this.websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement && element && element.parentNode && element.parentNode.closest) {
                    const closestBright = element.parentNode.closest(".pageShadowHasBrightColorBackground");

                    if (closestBright && closestBright != document.body) {
                        addClass(element, "pageShadowBrightColorForceCustomTextLinkColor");
                    } else {
                        this.multipleElementClassBatcherRemove.add(element, "pageShadowBrightColorForceCustomTextLinkColor");
                    }
                } else {
                    this.multipleElementClassBatcherRemove.add(element, "pageShadowBrightColorForceCustomTextLinkColor");
                }
            }
        } else if (this.websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement && element && element.parentNode && element.parentNode.closest) {
            const closestForceCustom = element.parentNode.closest(".pageShadowBrightColorForceCustomTextLinkColor");

            if (closestForceCustom && closestForceCustom != document.body) {
                addClass(element, "pageShadowBrightColorForceCustomTextLinkColor");
            } else {
                this.multipleElementClassBatcherRemove.add(element, "pageShadowBrightColorForceCustomTextLinkColor");
            }
        }

        // Text color
        const isTextElement = this.isTextElement(element);

        if (isTextElement) {
            const textColor = computedStyle.color;
            const hasBrightColor = this.elementHasBrightColor(textColor, textColor, true);

            if (hasBrightColor && hasBrightColor[0]) {
                this.multipleElementClassBatcherAdd.add(element, "pageShadowHasBrightColorText");
            } else {
                this.multipleElementClassBatcherRemove.add(element, "pageShadowHasBrightColorText");
            }
        }
    }

    detectTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg, computedStyle, hasTransparentBackgroundClass, element, transparentColorDetected) {
        const hasTransparentBackground = this.elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg);
        const backgroundClip = computedStyle.getPropertyValue("background-clip") || computedStyle.getPropertyValue("-webkit-background-clip");
        const hasBackgroundClipText = backgroundClip && backgroundClip.trim().toLowerCase() == "text";

        if ((hasTransparentBackground || hasBackgroundClipText)) {
            if (!hasTransparentBackgroundClass) {
                this.multipleElementClassBatcherAdd.add(element, "pageShadowHasTransparentBackground");
                transparentColorDetected = true;
            }
        } else {
            if (hasTransparentBackgroundClass) {
                this.multipleElementClassBatcherRemove.add(element, "pageShadowHasTransparentBackground");
                transparentColorDetected = false;
            }
        }

        return transparentColorDetected;
    }

    mutationForElement(element, attribute, attributeOldValue) {
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

            let hasMutationPageShadowClass = false;
            let newClassContainsPageShadowClass = false;
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

            for(const _class of pageShadowClassListsMutationsIgnore) {
                const indexOfClass = attributeOldValue.indexOf(_class);
                const elementContainsClass = element.classList.contains(_class);

                if(indexOfClass !== -1 && !elementContainsClass) {
                    hasMutationPageShadowClass = true;
                }

                if(indexOfClass < 0 && elementContainsClass) {
                    newClassContainsPageShadowClass = true;
                }
            }

            if(newClassContainsPageShadowClass) {
                return false;
            }

            if(hasMutationPageShadowClass) {
                if(this.websiteSpecialFiltersConfig.useBackgroundDetectionAlreadyProcessedNodes) {
                    this.backgroundDetectionAlreadyProcessedNodes = this.backgroundDetectionAlreadyProcessedNodes.filter(node => node != element);
                }
            }
        }

        this.detectBackgroundForElement(element, false);

        // Detect element childrens
        if(!attribute && this.websiteSpecialFiltersConfig.enableMutationObserversForSubChilds) {
            if(element.getElementsByTagName) {
                const elementChildrens = element.getElementsByTagName("*");

                if(this.websiteSpecialFiltersConfig.throttleMutationObserverBackgroundsSubChilds) {
                    this.throttledTaskAnalyzeSubchilds.start(elementChildrens);
                } else {
                    for(const element of elementChildrens) {
                        this.detectBackgroundForElement(element);
                    }
                }
            }
        }
    }
}