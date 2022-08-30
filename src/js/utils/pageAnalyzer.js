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
import { getCustomThemeConfig, processRules, removeClass, addClass, processRulesInvert, loadWebsiteSpecialFiltersConfig, rgb2hsl } from "./util.js";
import SafeTimer from "./safeTimer.js";
import { ignoredElementsContentScript, defaultThemesBackgrounds, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesTextColors } from "../constants.js";

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

    constructor(websiteSpecialFiltersConfig, currentSettings, isEnabled) {
        this.setSettings(websiteSpecialFiltersConfig, currentSettings, isEnabled);
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
                    addClass(document.body, "pageShadowDisableStyling", "pageShadowDisableBackgroundStyling");
                    this.detectBackgroundForElement(document.body, true);
                    removeClass(document.body, "pageShadowDisableBackgroundStyling");

                    const elements = Array.prototype.slice.call(document.body.getElementsByTagName(tagName));
                    let i = elements.length;

                    while(i--) {
                        this.detectBackgroundForElement(elements[i], true);
                    }

                    removeClass(document.body, "pageShadowDisableStyling");
                    addClass(document.body, "pageShadowBackgroundDetected");

                    this.backgroundDetected = true;
                    detectBackgroundTimer.clear();

                    resolve();
                });

                detectBackgroundTimer.start();
            } else {
                addClass(document.body, "pageShadowBackgroundDetected");
                this.backgroundDetected = true;
                resolve();
            }
        });
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

    elementHasBrightColor(backgroundColor) {
        if(backgroundColor) {
            const hasGradient = backgroundColor.trim().toLowerCase().indexOf("linear-gradient") != -1
                || backgroundColor.trim().toLowerCase().indexOf("radial-gradient") != -1 || backgroundColor.trim().toLowerCase().indexOf("conic-gradient") != -1;

            if(backgroundColor.trim().startsWith("rgb")) {
                const rgbValues = backgroundColor.split("(")[1].split(")")[0];
                const rgbValuesList = rgbValues.trim().split(",");
                const hsl = rgb2hsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);

                // If ligthness is between min and max values
                if(hsl[2] >= this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMin
                    && hsl[2] <= this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMax) {
                    return true;
                }
            }

            return hasGradient;
        }

        return false;
    }

    detectBackgroundForElement(element, disableDestyling) {
        if(element && element.shadowRoot != null && this.websiteSpecialFiltersConfig.enableShadowRootStyleOverride) {
            if(this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay > 0) {
                setTimeout(() => this.processShadowRoot(element), this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
            } else {
                this.processShadowRoot(element);
            }
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

        const hasBackgroundImg = background.trim().substr(0, 4).toLowerCase().includes("url(") || backgroundImage.trim().substr(0, 4).toLowerCase() == "url(";
        const hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");
        const hasTransparentBackgroundClass = element.classList.contains("pageShadowHasTransparentBackground");


        if(hasBackgroundImg && !hasClassImg) {
            addClass(element, "pageShadowHasBackgroundImg");
        }

        let transparentColorDetected = false;

        if(this.websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled) {
            const hasTransparentBackground = this.elementHasTransparentBackground(backgroundColor, backgroundImage, hasBackgroundImg);
            const backgroundClip = computedStyle.getPropertyValue("background-clip") || computedStyle.getPropertyValue("-webkit-background-clip");
            const hasBackgroundClipText = backgroundClip && backgroundClip.trim().toLowerCase() == "text";

            if((hasTransparentBackground || hasBackgroundClipText) && !hasTransparentBackgroundClass) {
                addClass(element, "pageShadowHasTransparentBackground");
                transparentColorDetected = true;
            }
        }

        if(this.websiteSpecialFiltersConfig.enableBrightColorDetection && !transparentColorDetected) {
            const hasBrightColor = this.elementHasBrightColor(backgroundColor);

            if(hasBrightColor) {
                addClass(element, "pageShadowHasBrightColorBackground");
            }
        }

        this.backgroundDetectionAlreadyProcessedNodes.push(element);

        if(!disableDestyling) {
            removeClass(element, "pageShadowDisableStyling", "pageShadowElementDisabled");
        }
    }

    mutationForElement(element, attribute, attributeOldValue) {
        if(!element || !element.classList || element == document.body || ignoredElementsContentScript.includes(element.localName) || element.nodeType != 1) {
            return false;
        }

        if(attribute && (!this.websiteSpecialFiltersConfig.enableMutationObserverAttributes || (attribute.toLowerCase() == "class" && !this.websiteSpecialFiltersConfig.enableMutationObserverClass)
            || (attribute.toLowerCase() == "style" && !this.websiteSpecialFiltersConfig.enableMutationObserverStyle))) {
            return false;
        }

        if(attribute == "class" && attributeOldValue !== null) {
            if(attributeOldValue.indexOf("pageShadowDisableStyling") !== -1) {
                return false;
            }

            if((attributeOldValue.indexOf("pageShadowHasTransparentBackground") !== -1 && !element.classList.contains("pageShadowHasTransparentBackground")) ||
                (attributeOldValue.indexOf("pageShadowHasBackgroundImg") !== -1 && !element.classList.contains("pageShadowHasBackgroundImg"))) {
                this.backgroundDetectionAlreadyProcessedNodes = this.backgroundDetectionAlreadyProcessedNodes.filter(node => node != element);
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

            if(this.isEnabled && ((this.currentSettings.pageShadowEnabled != undefined && this.currentSettings.pageShadowEnabled == "true") || (this.currentSettings.colorInvert != undefined && this.currentSettings.colorInvert == "true") || (this.currentSettings.attenuateImageColor != undefined && this.currentSettings.attenuateImageColor == "true"))) {
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
}