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
import { getCustomThemeConfig, processRules, processRulesInvert, sendMessageWithPromise } from "../utils/util.js";
import { defaultThemesBackgrounds, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesTextColors } from "../constants.js";
import ThrottledTask from "./throttledTask.js";

export default class ShadowDomProcessor {

    currentSettings;
    websiteSpecialFiltersConfig;
    isEnabled;

    processedShadowRoots = [];

    throttledTaskAnalyzeSubchildsShadowRoot;

    constructor(currentSettings, websiteSpecialFiltersConfig, isEnabled) {
        this.currentSettings = currentSettings;
        this.isEnabled = isEnabled;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;

        this.initializeThrottledTasks();
    }

    initializeThrottledTasks() {
        this.throttledTaskAnalyzeSubchildsShadowRoot = new ThrottledTask(
            (element) => this.processShadowRoot(element),
            "throttledTaskAnalyzeSubchildsShadowRoot",
            this.websiteSpecialFiltersConfig.delayMutationObserverBackgroundsSubchilds,
            this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsTreatedByCall,
            this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsMaxExecutionTime
        );
    }

    processShadowRoot(currentElement) {
        if(currentElement) {
            if(currentElement.shadowRoot != null) {
                this.processOneShadowRoot(currentElement);

                const elementChildrens = currentElement.shadowRoot.querySelectorAll("*");

                if(elementChildrens && elementChildrens.length > 0) {
                    this.throttledTaskAnalyzeSubchildsShadowRoot.start(elementChildrens);
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

                        await processRules(styleTag, themeConfig, true);
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