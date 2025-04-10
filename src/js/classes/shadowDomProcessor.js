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
import { getCustomThemeConfig } from "../utils/customThemeUtils.js";
import { processRules, processRulesInvert, processRulesAttenuate } from "../utils/shadowDomUtils.js";
import { getContrastPageTheme } from "../utils/cssVariableUtils.js";
import ThrottledTask from "./throttledTask.js";

export default class ShadowDomProcessor {

    currentSettings;
    websiteSpecialFiltersConfig;
    isEnabled;

    processedShadowRoots = new Set();

    throttledTaskAnalyzeSubchildsShadowRoot;

    // eslint-disable-next-line no-unused-vars
    analyzeSubElementsCallback = async currentElement => {};

    constructor(currentSettings, websiteSpecialFiltersConfig, isEnabled) {
        this.setSettings(currentSettings, websiteSpecialFiltersConfig, isEnabled);
        this.setupThrottledTasks();
    }

    setSettings(currentSettings, websiteSpecialFiltersConfig, isEnabled) {
        this.currentSettings = currentSettings;
        this.isEnabled = isEnabled;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;

        this.setupThrottledTasks();
    }

    setupThrottledTasks() {
        this.debugLogger?.log("ShadowDomProcessor setupThrottledTasks - Setup throttled tasks", "debug");

        this.throttledTaskAnalyzeSubchildsShadowRoot = this.throttledTaskAnalyzeSubchildsShadowRoot || new ThrottledTask(
            element => this.processShadowRoot(element),
            "throttledTaskAnalyzeSubchildsShadowRoot"
        );

        if(this.throttledTaskAnalyzeSubchildsShadowRoot) {
            this.throttledTaskAnalyzeSubchildsShadowRoot.setSettings(
                this.websiteSpecialFiltersConfig.delayMutationObserverBackgroundsSubchilds,
                this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsTreatedByCall,
                this.websiteSpecialFiltersConfig.throttledMutationObserverSubchildsMaxExecutionTime
            );
        }
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
            const oldStyles = element.shadowRoot.querySelectorAll(".pageShadowCSSShadowRoot, .pageShadowCSSShadowRootInvert, .pageShadowCSSShadowRootAttenuate");

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
                            themeConfig = getContrastPageTheme(currentTheme);
                        }

                        await processRules(styleTag, themeConfig, true);
                    }
                }

                if(this.currentSettings.colorInvert != undefined && this.currentSettings.colorInvert == "true") {
                    const styleTagInvert = document.createElement("style");
                    styleTagInvert.classList.add("pageShadowCSSShadowRootInvert");
                    element.shadowRoot.appendChild(styleTagInvert);

                    processRulesInvert(element, styleTagInvert, this.currentSettings, this.websiteSpecialFiltersConfig.enableSelectiveInvertPreserveColors);
                }

                if(this.currentSettings.attenuateColors != undefined && this.currentSettings.attenuateColors == "true") {
                    const styleTagAttenuate = document.createElement("style");
                    styleTagAttenuate.classList.add("pageShadowCSSShadowRootAttenuate");
                    element.shadowRoot.appendChild(styleTagAttenuate);

                    processRulesAttenuate(styleTagAttenuate, this.currentSettings);
                }
            }

            this.removeOldShadowRootStyle(element, oldStyles);

            this.processedShadowRoots.add(element);

            if(this.analyzeSubElementsCallback) {
                await this.analyzeSubElementsCallback(element.shadowRoot);
            }
        }
    }

    removeOldShadowRootStyle(element, oldStyles) {
        if(element && element.shadowRoot) {
            const styles = oldStyles || element.shadowRoot.querySelectorAll(".pageShadowCSSShadowRoot, .pageShadowCSSShadowRootInvert, .pageShadowCSSShadowRootAttenuate");

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