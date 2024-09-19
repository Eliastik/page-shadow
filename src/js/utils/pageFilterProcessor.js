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

import { mapFiltersCSSClass } from "../constants.js";
import { addNewStyleAttribute } from "./util.js";

/**
 * Class used to process the filter rules
 */
export default class PageFilterProcessor {
    pageAnalyzer;

    multipleElementClassBatcherAdd = null;

    constructor(pageAnalyzer, multipleElementClassBatcherAdd) {
        this.pageAnalyzer = pageAnalyzer;
        this.multipleElementClassBatcherAdd = multipleElementClassBatcherAdd;
    }

    doProcessFilters(filters, element, applyToChildrens) {
        if(!filters) return;

        for(const filter of filters) {
            const selector = filter.filter;
            const filterTypes = filter.type.split(",");
            let elements;

            try {
                elements = (element ? [element] : (selector && selector.trim() === "body" ? [document.body] : document.body.querySelectorAll(selector)));
            } catch(e) {
                continue; // Continue to next filter if selector is not valid
            }

            if(element) {
                if(!filterTypes.includes("disableShadowRootsCustomStyle")) {
                    try {
                        if(element.matches && !element.matches(selector)) {
                            elements = [];
                        }
                    } catch(e) {
                        continue;
                    }
                }

                if(element.getElementsByTagName && applyToChildrens) {
                    const elementChildrens = element.getElementsByTagName("*");

                    if(elementChildrens && elementChildrens.length > 0) {
                        for(let i = 0, len = elementChildrens.length; i < len; i++) {
                            const childrenElement = elementChildrens[i];

                            try {
                                if(childrenElement.matches && childrenElement.matches(selector)) {
                                    elements.push(childrenElement);
                                }
                            } catch(e) {
                                break;
                            }
                        }
                    }
                }
            }

            for(let i = 0, len = elements.length; i < len; i++) {
                const element = elements[i];

                if(element && element.classList) {
                    filterTypes.forEach(filterType => {
                        const classToAdd = mapFiltersCSSClass[filterType];
                        
                        if(!element.classList.contains(classToAdd)) {
                            this.multipleElementClassBatcherAdd.add(element, classToAdd);
                        }
                        
                        if (filterType == "forceDisableDefaultBackgroundColor") {
                            addNewStyleAttribute(element, "background-color: unset !important");
                        }
                        
                        if (filterType == "forceDisableDefaultBackground") {
                            addNewStyleAttribute(element, "background: unset !important");
                        }
                        
                        if (filterType == "forceDisableDefaultFontColor") {
                            addNewStyleAttribute(element, "color: unset !important");
                        }

                        if (filterType == "disableShadowRootsCustomStyle" || filterType == "overrideShadowRootsCustomStyle") {
                            if(element.shadowRoot != null) this.pageAnalyzer.processShadowRoot(element);
                        }
                    });
                }
            }
        }
    }

    processSpecialRules(rules, websiteSpecialFiltersConfig) {
        rules.forEach(rule => {
            const filterTypes = rule.type.split(",");

            filterTypes.forEach(type => {
                if(type == "enablePerformanceMode") websiteSpecialFiltersConfig.performanceModeEnabled = true;
                if(type == "disablePerformanceMode") websiteSpecialFiltersConfig.performanceModeEnabled = false;
                if(type == "enableTransparentBackgroundAutoDetect") websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = true;
                if(type == "disableTransparentBackgroundAutoDetect") websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = false;
                if(type == "enableMutationObserversForSubChilds") websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = true;
                if(type == "disableMutationObserversForSubChilds") websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = false;
                if(type == "opacityDetectedAsTransparentThreshold") websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold = rule.filter;
                if(type == "enableMutationObserverAttributes") websiteSpecialFiltersConfig.enableMutationObserverAttributes = true;
                if(type == "disableMutationObserverAttributes") websiteSpecialFiltersConfig.enableMutationObserverAttributes = false;
                if(type == "enableMutationObserverClass") websiteSpecialFiltersConfig.enableMutationObserverClass = true;
                if(type == "disableMutationObserverClass") websiteSpecialFiltersConfig.enableMutationObserverClass = false;
                if(type == "enableMutationObserverStyle") websiteSpecialFiltersConfig.enableMutationObserverStyle = true;
                if(type == "disableMutationObserverStyle") websiteSpecialFiltersConfig.enableMutationObserverStyle = false;
                if(type == "enableShadowRootStyleOverride") websiteSpecialFiltersConfig.enableShadowRootStyleOverride = true;
                if(type == "disableShadowRootStyleOverride") websiteSpecialFiltersConfig.enableShadowRootStyleOverride = false;
                if(type == "shadowRootStyleOverrideDelay") websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay = rule.filter;
                if(type == "enableThrottleMutationObserverBackgrounds") {
                    websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = true;
                    websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = false;
                }
                if(type == "disableThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = false;
                if(type == "delayMutationObserverBackgrounds") websiteSpecialFiltersConfig.delayMutationObserverBackgrounds = rule.filter;
                if(type == "autoThrottleMutationObserverBackgroundsTreshold") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsTreshold = rule.filter;
                if(type == "throttledMutationObserverTreatedByCall") websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall = rule.filter;
                if(type == "enableAutoThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = true;
                if(type == "disableAutoThrottleMutationObserverBackgrounds") websiteSpecialFiltersConfig.autoThrottleMutationObserverBackgroundsEnabled = false;
                if(type == "delayApplyMutationObserversSafeTimer") websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer = rule.filter;
                if(type == "enableObserveBodyChange") websiteSpecialFiltersConfig.observeBodyChange = true;
                if(type == "disableObserveBodyChange") websiteSpecialFiltersConfig.observeBodyChange = false;
                if(type == "observeBodyChangeTimerInterval") websiteSpecialFiltersConfig.observeBodyChangeTimerInterval = rule.filter;
                if(type == "enableBrightColorDetection") websiteSpecialFiltersConfig.enableBrightColorDetection = true;
                if(type == "disableBrightColorDetection") websiteSpecialFiltersConfig.enableBrightColorDetection = false;
                if(type == "brightColorLightnessTresholdMin") websiteSpecialFiltersConfig.brightColorLightnessTresholdMin = rule.filter;
                if(type == "brightColorLightnessTresholdTextMin") websiteSpecialFiltersConfig.brightColorLightnessTresholdTextMin = rule.filter;
                if(type == "brightColorLightnessTresholdMax") websiteSpecialFiltersConfig.brightColorLightnessTresholdMax = rule.filter;
                if(type == "brightColorSaturationTresholdTextMin") websiteSpecialFiltersConfig.brightColorSaturationTresholdTextMin = rule.filter;
                if(type == "enableThrottleBackgroundDetection") websiteSpecialFiltersConfig.throttleBackgroundDetection = true;
                if(type == "disableThrottleBackgroundDetection") websiteSpecialFiltersConfig.throttleBackgroundDetection = false;
                if(type == "throttleBackgroundDetectionElementsTreatedByCall") websiteSpecialFiltersConfig.throttleBackgroundDetectionElementsTreatedByCall = rule.filter;
                if(type == "backgroundDetectionStartDelay") websiteSpecialFiltersConfig.backgroundDetectionStartDelay = rule.filter;
                if(type == "useBackgroundDetectionAlreadyProcessedNodes") websiteSpecialFiltersConfig.useBackgroundDetectionAlreadyProcessedNodes = true;
                if(type == "enableBrightColorDetectionSubelement") websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement = true;
                if(type == "disableBrightColorDetectionSubelement") websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement = false;
                if(type == "enableObserveDocumentChange") websiteSpecialFiltersConfig.observeDocumentChange = true;
                if(type == "disableObserveDocumentChange") websiteSpecialFiltersConfig.observeDocumentChange = false;
                if(type == "observeDocumentChangeTimerInterval") websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval = rule.filter;
                if(type == "enableDarkImageDetection") websiteSpecialFiltersConfig.enableDarkImageDetection = true;
                if(type == "disableDarkImageDetection") websiteSpecialFiltersConfig.enableDarkImageDetection = false;
                if(type == "darkImageDetectionHslTreshold") websiteSpecialFiltersConfig.darkImageDetectionHslTreshold = rule.filter;
                if(type == "darkImageDetectionDarkPixelCountTreshold") websiteSpecialFiltersConfig.darkImageDetectionDarkPixelCountTreshold = rule.filter;
            });
        });
    }
}