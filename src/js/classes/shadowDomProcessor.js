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
import { getCustomThemeConfig, processRules, processRulesInvert } from "../utils/util.js";
import { defaultThemesBackgrounds, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesTextColors, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack } from "../constants.js";
import ThrottledTask from "./throttledTask.js";

export default class ShadowDomProcessor {

    currentSettings;
    websiteSpecialFiltersConfig;
    isEnabled;

    processedShadowRoots = new Set();

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

    async processShadowRoot(currentElement) {
        if(currentElement) {
            if(currentElement.shadowRoot != null) {
                await this.processOneShadowRoot(currentElement);

                const elementChildrens = currentElement.shadowRoot.querySelectorAll("*");

                if(elementChildrens && elementChildrens.length > 0) {
                    this.throttledTaskAnalyzeSubchildsShadowRoot.start(elementChildrens);
                }
            }
        }
    }

    async processOneShadowRoot(element) {
        if(element && element.shadowRoot) {
            const oldStyles = element.shadowRoot.querySelectorAll(".pageShadowCSSShadowRoot, .pageShadowCSSShadowRootInvert");

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
                                backgroundColor: defaultThemesBackgrounds[currentTheme - 1],
                                textColor: defaultThemesTextColors[currentTheme - 1],
                                linkColor: defaultThemesLinkColors[currentTheme - 1],
                                visitedLinkColor: defaultThemesVisitedLinkColors[currentTheme - 1],
                                selectBackgroundColor: defaultThemesSelectBgColors[currentTheme - 1],
                                selectTextColor: defaultThemesSelectTextColors[currentTheme - 1],
                                insBackgroundColor: defaultThemesInsBgColors[currentTheme - 1],
                                insTextColor: defaultThemesInsTextColors[currentTheme - 1],
                                delBackgroundColor: defaultThemesDelBgColors[currentTheme - 1],
                                delTextColor: defaultThemesDelTextColors[currentTheme - 1],
                                markBackgroundColor: defaultThemesMarkBgColors[currentTheme - 1],
                                markTxtColor: defaultThemesMarkTextColors[currentTheme - 1],
                                imageBackgroundColor: defaultThemesImgBgColors[currentTheme - 1],
                                brightColorTextWhite: defaultThemesBrightColorTextWhite[currentTheme - 1],
                                brightColorTextBlack: defaultThemesBrightColorTextBlack[currentTheme - 1]
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
            }

            this.removeOldShadowRootStyle(element, oldStyles);

            this.processedShadowRoots.add(element);
        }
    }

    removeOldShadowRootStyle(element, oldStyles) {
        if(element && element.shadowRoot) {
            const styles = oldStyles || element.shadowRoot.querySelectorAll(".pageShadowCSSShadowRoot, .pageShadowCSSShadowRootInvert");

            for(const style of styles) {
                if(element.shadowRoot.contains(style)) {
                    element.shadowRoot.removeChild(style);
                }
            }
        }
    }

    clearShadowRoots() {
        for(const element of this.processedShadowRoots) {
            this.removeOldShadowRootStyle(element);
        }
    }

    async resetShadowRoots() {
        for(const element of this.processedShadowRoots) {
            await this.processOneShadowRoot(element);
        }
    }
}