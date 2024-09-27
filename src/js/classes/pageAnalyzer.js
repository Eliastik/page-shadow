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
import { getCustomThemeConfig, processRules, removeClass, addClass, processRulesInvert, loadWebsiteSpecialFiltersConfig, rgb2hsl, svgElementToImage, backgroundImageToImage } from "../utils/util.js";
import SafeTimer from "./safeTimer.js";
import { ignoredElementsContentScript, defaultThemesBackgrounds, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesTextColors, pageShadowClassListsMutationsIgnore, maxImageSizeDarkImageDetection, ignoredElementsBrightTextColorDetection } from "../constants.js";

/**
 * Class used to analyze the pages and detect transparent background,
 * background images, etc.
 */
export default class PageAnalyzer {
    websiteSpecialFiltersConfig = {};
    isEnabled = false;
    currentSettings = {};

    backgroundDetected = false;
    backgroundDetectionAlreadyProcessedNodes = [];
    processedShadowRoots = [];

    multipleElementClassBatcherAdd = null;
    multipleElementClassBatcherRemove = null;

    debugLogger;

    constructor(websiteSpecialFiltersConfig, currentSettings, isEnabled, multipleElementClassBatcherAdd, multipleElementClassBatcherRemove, debugLogger) {
        this.setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled);

        this.multipleElementClassBatcherAdd = multipleElementClassBatcherAdd;
        this.multipleElementClassBatcherRemove = multipleElementClassBatcherRemove;
        this.debugLogger = debugLogger;
    }

    async setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled) {
        if(!websiteSpecialFiltersConfig) {
            this.websiteSpecialFiltersConfig = await loadWebsiteSpecialFiltersConfig();
        }

        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.currentSettings = currentSettings;
        this.isEnabled = isEnabled;
    }

    async detectBackground(tagName) {
        return new Promise(resolve => {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
                const detectBackgroundTimer = new SafeTimer(() => {
                    const throttledBackgroundDetection = this.websiteSpecialFiltersConfig.throttleBackgroundDetection || this.websiteSpecialFiltersConfig.backgroundDetectionStartDelay > 0;

                    addClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");

                    this.detectBackgroundForElement(document.body, true);

                    if (throttledBackgroundDetection) {
                        removeClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
                    } else {
                        removeClass(document.body, "pageShadowDisableBackgroundStyling");
                    }

                    const elements = Array.prototype.slice.call(document.body.getElementsByTagName(tagName));
                    const elementsLength = elements.length;
                    let index = 0;

                    if(throttledBackgroundDetection) {
                        const throttledBackgroundDetectionTimer = new SafeTimer(() => {
                            index = this.detectBackgroundLoop(elements, index, elementsLength, false);

                            if(index >= elementsLength) {
                                detectBackgroundTimer.clear();
                                resolve();
                            } else {
                                throttledBackgroundDetectionTimer.start(1);
                            }
                        });

                        throttledBackgroundDetectionTimer.start(this.websiteSpecialFiltersConfig.backgroundDetectionStartDelay);
                    } else {
                        this.detectBackgroundLoop(elements, index, elementsLength, true);
                        detectBackgroundTimer.clear();
                        resolve();
                    }
                });

                detectBackgroundTimer.start();
            } else {
                addClass(document.body, "pageShadowBackgroundDetected");
                this.backgroundDetected = true;
                resolve();
            }
        });
    }

    detectBackgroundLoop(elements, i, length, disableDestyling) {
        while(i < length) {
            this.detectBackgroundForElement(elements[i], disableDestyling);
            i++;

            if(this.websiteSpecialFiltersConfig.throttleBackgroundDetection &&
                i % this.websiteSpecialFiltersConfig.throttleBackgroundDetectionElementsTreatedByCall == 0) {
                break;
            }
        }

        if(i >= length) {
            removeClass(document.body, "pageShadowDisableStyling");
            addClass(document.body, "pageShadowBackgroundDetected");

            this.backgroundDetected = true;
        }

        return i;
    }

    elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg) {
        if(!backgroundColor) return true;

        const isRgbaColor = backgroundColor.trim().startsWith("rgba");
        const isTransparentColor = backgroundColor.trim().startsWith("rgba(0, 0, 0, 0)");
        const alpha = isRgbaColor ? parseFloat(backgroundColor.split(",")[3]) : -1;
        const hasBackgroundImageValue = backgroundImage && (backgroundImage.trim().toLowerCase() != "none" && backgroundImage.trim() != "");
        const hasNoBackgroundColorValue = backgroundColor && (backgroundColor.trim().toLowerCase().indexOf("transparent") != -1 || backgroundColor.trim().toLowerCase() == "none" || backgroundColor.trim() == "");

        return (hasNoBackgroundColorValue || isTransparentColor || (isRgbaColor && alpha <= this.websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold)) && !hasBackgroundImg && !hasBackgroundImageValue;
    }

    elementHasBrightColor(background, backgroundColor, isText) {
        if(background) {
            const hasGradient = background && (background.trim().toLowerCase().indexOf("linear-gradient") != -1
                || background.trim().toLowerCase().indexOf("radial-gradient") != -1 || background.trim().toLowerCase().indexOf("conic-gradient") != -1);

            if (hasGradient) {
                const pattern = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/g;
                const matches = [...background.matchAll(pattern)];
                const rgbValuesLists = matches.map(match => match.slice(1, 4).map(Number));

                for (const rgbValuesList of rgbValuesLists) {
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
                this.detectDarkImage(element, hasBackgroundImg).then(isDarkImage => {
                    if(isDarkImage) {
                        this.multipleElementClassBatcherAdd.add(element, "pageShadowSelectiveInvert");
                    }
                });
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
            this.detectBrightColor(transparentColorDetected, hasTransparentBackgroundClass, background, backgroundColor, element);
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

    isTextElement(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE || ignoredElementsBrightTextColorDetection.includes(element.tagName.toLowerCase())) {
            return false;
        }

        const hasShallowChildren = Array.from(element.children).every(child => child.children.length === 0);
        const notAllChildrenAreImg = Array.from(element.children).every(child => !ignoredElementsBrightTextColorDetection.includes(child.tagName.toLowerCase()));
    
        return hasShallowChildren && notAllChildrenAreImg;
    }

    detectBrightColor(transparentColorDetected, hasTransparentBackgroundClass, background, backgroundColor, element) {
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
            const textColor = window.getComputedStyle(element).color;
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

                if(elementChildrens && elementChildrens.length > 0) {
                    let i = elementChildrens.length;

                    while(i--) {
                        this.detectBackgroundForElement(elementChildrens[i], false);
                    }
                }
            }
        }
    }

    processShadowRoot(currentElement) {
        if(currentElement) {
            if(currentElement.shadowRoot != null) {
                this.processOneShadowRoot(currentElement);
                const elementChildrens = currentElement.shadowRoot.querySelectorAll("*");

                if(elementChildrens && elementChildrens.length > 0) {
                    for(let i = 0, len = elementChildrens.length; i < len; i++) {
                        this.processShadowRoot(elementChildrens[i]);
                    }
                }
            }
        }
    }

    async processOneShadowRoot(element) {
        if(element.shadowRoot) {
            const currentCSSStyle = element.shadowRoot.querySelector(".pageShadowCSSShadowRoot");
            const currentCSSStyleInvert = element.shadowRoot.querySelector(".pageShadowCSSShadowRootInvert");

            if(currentCSSStyle) {
                element.shadowRoot.removeChild(currentCSSStyle);
            }

            if(currentCSSStyleInvert) {
                element.shadowRoot.removeChild(currentCSSStyleInvert);
            }

            if(this.isEnabled && ((this.currentSettings.pageShadowEnabled != undefined && this.currentSettings.pageShadowEnabled == "true") || (this.currentSettings.colorInvert != undefined && this.currentSettings.colorInvert == "true") || (this.currentSettings.attenuateColors != undefined && this.currentSettings.attenuateColors == "true"))) {
                if(this.currentSettings.pageShadowEnabled != undefined && this.currentSettings.pageShadowEnabled == "true") {
                    const currentTheme = this.currentSettings.theme;

                    if(currentTheme != null) {
                        const styleTag = document.createElement("style");
                        styleTag.classList.add("pageShadowCSSShadowRoot");
                        element.shadowRoot.appendChild(styleTag);

                        let themeConfig = {};

                        if(currentTheme.startsWith("custom")) {
                            themeConfig = await getCustomThemeConfig(this.currentSettings.theme.replace("custom", ""));
                        } else {
                            themeConfig = {
                                backgroundColor: defaultThemesBackgrounds[currentTheme - 1].replace("#", ""),
                                textColor: defaultThemesLinkColors[currentTheme - 1].replace("#", ""),
                                linkColor: defaultThemesVisitedLinkColors[currentTheme - 1].replace("#", ""),
                                visitedLinkColor: defaultThemesTextColors[currentTheme - 1].replace("#", "")
                            };
                        }

                        processRules(styleTag, themeConfig, true);
                    }
                }

                if(this.currentSettings.colorInvert != undefined && this.currentSettings.colorInvert == "true") {
                    const styleTagInvert = document.createElement("style");
                    styleTagInvert.classList.add("pageShadowCSSShadowRootInvert");
                    element.shadowRoot.appendChild(styleTagInvert);

                    processRulesInvert(styleTagInvert, this.currentSettings.colorInvert, this.currentSettings.invertImageColors, this.currentSettings.invertEntirePage, this.currentSettings.invertVideoColors, this.currentSettings.invertBgColor, this.currentSettings.selectiveInvert);
                }

                this.processedShadowRoots.push(element.shadowRoot);
            }
        }
    }

    resetShadowRoots() {
        for(let i = 0, len = this.processedShadowRoots.length; i < len; i++) {
            const shadowRoot = this.processedShadowRoots[i];

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

        this.processedShadowRoots = [];
    }

    async detectDarkImage(element, hasBackgroundImg) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let image = element;

        // SVG element
        if((element instanceof SVGGraphicsElement) && element.nodeName.toLowerCase() === "svg") {
            try {
                removeClass(image, "pageShadowDisableStyling", "pageShadowElementDisabled");

                image = svgElementToImage(element, image);
                
                addClass(image, "pageShadowDisableStyling", "pageShadowElementDisabled");
            } catch(e) {
                this.debugLogger?.log(e.message, "error");
                return false;
            }
        }
        
        // Image element (or image element with svg file)
        if(!(image instanceof HTMLImageElement) && !(image instanceof SVGImageElement)) {
            if(hasBackgroundImg) {
                try {
                    image = await backgroundImageToImage(element, image);
                } catch(e) {
                    this.debugLogger?.log(e.message, "error");
                    return false;
                }
            } else {
                return false;
            }
        }

        // If the image is not yet loaded, we wait
        if(!image.complete) {
            await this.awaitImageLoading(image);
        }

        // Draw image on canvas
        const { newWidth, newHeight } = this.getResizedDimensions(image, maxImageSizeDarkImageDetection, maxImageSizeDarkImageDetection);
        canvas.width = newWidth;
        canvas.height = newHeight;

        try {
            ctx.drawImage(image, 0, 0, newWidth, newHeight);
        } catch(e) {
            this.debugLogger?.log(e.message, "error");
            return false;
        }

        // Check if the image is dark
        const isDarkImage = this.isImageDark(canvas, newWidth, newHeight);

        canvas.remove();

        if (isDarkImage) {
            this.debugLogger?.log(`Detected dark image - image URL: ${image.src}`);
        }

        return isDarkImage;
    }

    getResizedDimensions(image, maxWidth, maxHeight) {
        const width = image.width;
        const height = image.height;
    
        let newWidth = width;
        let newHeight = height;
    
        if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const resizeRatio = Math.min(widthRatio, heightRatio);
    
            newWidth = Math.round(width * resizeRatio);
            newHeight = Math.round(height * resizeRatio);
        }
    
        return { newWidth, newHeight };
    }

    isImageDark(canvas, width, height) {
        const ctx = canvas.getContext("2d");

        try {
            const blockSize = this.websiteSpecialFiltersConfig.darkImageDetectionBlockSize;

            if(width <= 0 || height <= 0) {
                return false;
            }

            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const red = data[index];
                    const green = data[index + 1];
                    const blue = data[index + 2];
                    const alpha = data[index + 3];

                    if (this.isPixelDark(red, green, blue, alpha)) {
                        if (this.hasTransparentSurroundingPixels(x, y, data, width, height, blockSize)) {
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch(e) {
            this.debugLogger?.log(e.message, "error");
            return false;
        }
    }

    isPixelDark(red, green, blue, alpha) {
        if (alpha >= this.websiteSpecialFiltersConfig.darkImageDetectionMinAlpha) {
            const hsl = rgb2hsl(red / 255, green / 255, blue / 255);

            if(hsl[2] <= this.websiteSpecialFiltersConfig.darkImageDetectionHslTreshold) {
                return true;
            }
        }

        return false;
    }

    hasTransparentSurroundingPixels(x, y, data, width, height, blockSize) {
        let transparentPixelCount = 0;
        let totalPixelCount = 0;
    
        const startX = Math.max(0, x - blockSize / 2);
        const startY = Math.max(0, y - blockSize / 2);
        const endX = Math.min(width, x + blockSize / 2);
        const endY = Math.min(height, y + blockSize / 2);
    
        for (let j = startY; j < endY; j++) {
            for (let i = startX; i < endX; i++) {
                const index = (j * width + i) * 4;
                const alpha = data[index + 3];
    
                if (alpha === 0) {
                    transparentPixelCount++;
                }

                totalPixelCount++;
            }
        }
    
        return transparentPixelCount / totalPixelCount > this.websiteSpecialFiltersConfig.darkImageDetectionTransparentPixelsRatio;
    }

    async awaitImageLoading(image) {
        return new Promise(resolve => {
            image.addEventListener("load", () => {
                resolve(image);
            });
        });
    }
}