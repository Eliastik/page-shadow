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
import { addNewStyleAttribute, removeStyleAttribute, sha256 } from "../utils/util.js";

/**
 * Class used to process the filter rules
 */
export default class PageFilterProcessor {

    pageAnalyzer;

    filtersCache = null;
    multipleElementClassBatcherAdd = null;
    multipleElementClassBatcherRemove = null;
    websiteSpecialFiltersConfig = null;

    filterMatchingHistory = new Map();

    constructor(pageAnalyzer, multipleElementClassBatcherAdd, multipleElementClassBatcherRemove, websiteSpecialFiltersConfig) {
        this.pageAnalyzer = pageAnalyzer;
        this.multipleElementClassBatcherAdd = multipleElementClassBatcherAdd;
        this.multipleElementClassBatcherRemove = multipleElementClassBatcherRemove;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    async doProcessFilters(element, applyToChildrens) {
        if(!this.filtersCache) return;

        const enableNotMatchingFiltersDetection = this.websiteSpecialFiltersConfig.enableNotMatchingFiltersDetection;

        for(const filter of this.filtersCache) {
            const selector = filter.filter;
            const filterTypes = filter.type.split(",");

            const elementsNotMatching = [];
            let elementsMatching = [];

            let filterHash = "";

            if (enableNotMatchingFiltersDetection) {
                filterHash = await sha256(selector);
            }

            try {
                elementsMatching = (element ? [element] : (selector && selector.trim() === "body" ? [document.body] : document.body.querySelectorAll(selector)));
            } catch(e) {
                continue; // Continue to next filter if selector is not valid
            }

            if(element) {
                if(!filterTypes.includes("disableShadowRootsCustomStyle")) {
                    try {
                        if(element.matches) {
                            if (element.matches(selector)) {
                                if (enableNotMatchingFiltersDetection) {
                                    const newValue = {
                                        element,
                                        children: false
                                    };

                                    const currentValue = this.filterMatchingHistory.get(filterHash);

                                    if (currentValue) {
                                        currentValue.push(newValue);
                                    } else {
                                        this.filterMatchingHistory.set(filterHash, [newValue]);
                                    }

                                }
                            } else {
                                elementsMatching = [];

                                if (enableNotMatchingFiltersDetection) {
                                    const previousMatchedFilter = this.filterMatchingHistory.get(filterHash);
                                    const previousMatched = previousMatchedFilter
                                        .find(v => v.element === element && !v.children);

                                    if (previousMatched) {
                                        elementsNotMatching.push(element);
                                        previousMatchedFilter.splice(previousMatched, 1);
                                    }
                                }
                            }
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
                                if(childrenElement.matches) {
                                    if (childrenElement.matches(selector)) {
                                        elementsMatching.push(childrenElement);

                                        if (enableNotMatchingFiltersDetection) {
                                            const newValue = {
                                                childrenElement,
                                                children: true
                                            };
        
                                            const currentValue = this.filterMatchingHistory.get(filterHash);
        
                                            if (currentValue) {
                                                currentValue.push(newValue);
                                            } else {
                                                this.filterMatchingHistory.set(filterHash, [newValue]);
                                            }
                                        }
                                    } else {
                                        if (enableNotMatchingFiltersDetection) {
                                            const previousMatchedFilter = this.filterMatchingHistory.get(filterHash);
                                            const previousMatchedChildren = previousMatchedFilter
                                                .find(v => v.element === childrenElement && v.children);

                                            if (previousMatchedChildren) {
                                                elementsNotMatching.push(childrenElement);
                                                previousMatchedFilter.splice(previousMatchedChildren, 1);
                                            }
                                        }
                                    }
                                }
                            } catch(e) {
                                break;
                            }
                        }
                    }
                }
            }

            this.processElementsList(elementsMatching, filterTypes, false);
            this.processElementsList(elementsNotMatching, filterTypes, true);
        }
    }

    processElementsList(elements, filterTypes, remove) {
        for (let i = 0, len = elements.length; i < len; i++) {
            const element = elements[i];

            if (element && element.classList) {
                filterTypes.forEach(filterType => {
                    this.processElement(filterType, element, remove);
                });
            }
        }
    }

    processElement(filterType, element, remove) {
        const classToAddOrRemove = mapFiltersCSSClass[filterType];

        if (remove) {
            if (element.classList.contains(classToAddOrRemove)) {
                this.multipleElementClassBatcherRemove.add(element, classToAddOrRemove);
            }
        } else {
            if (!element.classList.contains(classToAddOrRemove)) {
                this.multipleElementClassBatcherAdd.add(element, classToAddOrRemove);
            }
        }

        if (filterType == "forceDisableDefaultBackgroundColor") {
            if (remove) {
                removeStyleAttribute(element, "background-color: unset !important");
            } else {
                addNewStyleAttribute(element, "background-color: unset !important");
            }
        }

        if (filterType == "forceDisableDefaultBackground") {
            if (remove) {
                removeStyleAttribute(element, "background: unset !important");
            } else {
                addNewStyleAttribute(element, "background: unset !important");
            }
        }

        if (filterType == "forceDisableDefaultFontColor") {
            if (remove) {
                removeStyleAttribute(element, "background: unset !important");
            } else {
                addNewStyleAttribute(element, "color: unset !important");
            }
        }

        if (filterType == "disableShadowRootsCustomStyle" || filterType == "overrideShadowRootsCustomStyle") {
            if (element.shadowRoot != null) this.pageAnalyzer.processShadowRoot(element);
        }
    }

    processSpecialRules(rules) {
        rules.forEach(rule => {
            const filterTypes = rule.type.split(",");
            const filterRule = !isNaN(rule.filter) ? parseFloat(rule.filter) : null;

            filterTypes.forEach(type => {
                if(type == "enablePerformanceMode") this.websiteSpecialFiltersConfig.performanceModeEnabled = true;
                if(type == "disablePerformanceMode") this.websiteSpecialFiltersConfig.performanceModeEnabled = false;
                if(type == "enableTransparentBackgroundAutoDetect") this.websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = true;
                if(type == "disableTransparentBackgroundAutoDetect") this.websiteSpecialFiltersConfig.autoDetectTransparentBackgroundEnabled = false;
                if(type == "enableMutationObserversForSubChilds") this.websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = true;
                if(type == "disableMutationObserversForSubChilds") this.websiteSpecialFiltersConfig.enableMutationObserversForSubChilds = false;
                if(type == "opacityDetectedAsTransparentThreshold") this.websiteSpecialFiltersConfig.opacityDetectedAsTransparentThreshold = filterRule;
                if(type == "enableMutationObserverAttributes") this.websiteSpecialFiltersConfig.enableMutationObserverAttributes = true;
                if(type == "disableMutationObserverAttributes") this.websiteSpecialFiltersConfig.enableMutationObserverAttributes = false;
                if(type == "enableMutationObserverClass") this.websiteSpecialFiltersConfig.enableMutationObserverClass = true;
                if(type == "disableMutationObserverClass") this.websiteSpecialFiltersConfig.enableMutationObserverClass = false;
                if(type == "enableMutationObserverStyle") this.websiteSpecialFiltersConfig.enableMutationObserverStyle = true;
                if(type == "disableMutationObserverStyle") this.websiteSpecialFiltersConfig.enableMutationObserverStyle = false;
                if(type == "enableShadowRootStyleOverride") this.websiteSpecialFiltersConfig.enableShadowRootStyleOverride = true;
                if(type == "disableShadowRootStyleOverride") this.websiteSpecialFiltersConfig.enableShadowRootStyleOverride = false;
                if(type == "shadowRootStyleOverrideDelay") this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay = filterRule;
                if(type == "enableThrottleMutationObserverBackgrounds") {
                    this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = true;
                }
                if(type == "disableThrottleMutationObserverBackgrounds") this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds = false;
                if(type == "delayMutationObserverBackgrounds") this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds = filterRule;
                if(type == "throttledMutationObserverTreatedByCall") this.websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall = filterRule;
                if(type == "delayApplyMutationObserversSafeTimer") this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer = filterRule;
                if(type == "enableObserveBodyChange") this.websiteSpecialFiltersConfig.observeBodyChange = true;
                if(type == "disableObserveBodyChange") this.websiteSpecialFiltersConfig.observeBodyChange = false;
                if(type == "observeBodyChangeTimerInterval") this.websiteSpecialFiltersConfig.observeBodyChangeTimerInterval = filterRule;
                if(type == "enableBrightColorDetection") this.websiteSpecialFiltersConfig.enableBrightColorDetection = true;
                if(type == "disableBrightColorDetection") this.websiteSpecialFiltersConfig.enableBrightColorDetection = false;
                if(type == "brightColorLightnessTresholdMin") this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMin = filterRule;
                if(type == "brightColorLightnessTresholdTextMin") this.websiteSpecialFiltersConfig.brightColorLightnessTresholdTextMin = filterRule;
                if(type == "brightColorLightnessTresholdMax") this.websiteSpecialFiltersConfig.brightColorLightnessTresholdMax = filterRule;
                if(type == "brightColorSaturationTresholdMin") this.websiteSpecialFiltersConfig.brightColorSaturationTresholdMin = filterRule;
                if(type == "enableThrottleBackgroundDetection") this.websiteSpecialFiltersConfig.throttleBackgroundDetection = true;
                if(type == "disableThrottleBackgroundDetection") this.websiteSpecialFiltersConfig.throttleBackgroundDetection = false;
                if(type == "throttleBackgroundDetectionElementsTreatedByCall") this.websiteSpecialFiltersConfig.throttleBackgroundDetectionElementsTreatedByCall = filterRule;
                if(type == "backgroundDetectionStartDelay") this.websiteSpecialFiltersConfig.backgroundDetectionStartDelay = filterRule;
                if(type == "useBackgroundDetectionAlreadyProcessedNodes") this.websiteSpecialFiltersConfig.useBackgroundDetectionAlreadyProcessedNodes = true;
                if(type == "enableBrightColorDetectionSubelement") this.websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement = true;
                if(type == "disableBrightColorDetectionSubelement") this.websiteSpecialFiltersConfig.enableBrightColorDetectionSubelement = false;
                if(type == "enableObserveDocumentChange") this.websiteSpecialFiltersConfig.observeDocumentChange = true;
                if(type == "disableObserveDocumentChange") this.websiteSpecialFiltersConfig.observeDocumentChange = false;
                if(type == "observeDocumentChangeTimerInterval") this.websiteSpecialFiltersConfig.observeDocumentChangeTimerInterval = filterRule;
                if(type == "enableDarkImageDetection") this.websiteSpecialFiltersConfig.enableDarkImageDetection = true;
                if(type == "disableDarkImageDetection") this.websiteSpecialFiltersConfig.enableDarkImageDetection = false;
                if(type == "darkImageDetectionHslTreshold") this.websiteSpecialFiltersConfig.darkImageDetectionHslTreshold = filterRule;
                if(type == "enableNotMatchingFiltersDetection") this.websiteSpecialFiltersConfig.enableNotMatchingFiltersDetection = true;
                if(type == "disableNotMatchingFiltersDetection") this.websiteSpecialFiltersConfig.enableNotMatchingFiltersDetection = false;
                if(type == "intervalApplyClassChanges") this.websiteSpecialFiltersConfig.intervalApplyClassChanges = filterRule;
                if(type == "classChangeMaxElementsTreatedByCall") this.websiteSpecialFiltersConfig.classChangeMaxElementsTreatedByCall = filterRule;
                if(type == "darkImageDetectionMinAlpha") this.websiteSpecialFiltersConfig.darkImageDetectionMinAlpha = filterRule;
                if(type == "darkImageDetectionBlockSize") this.websiteSpecialFiltersConfig.darkImageDetectionBlockSize = filterRule;
                if(type == "darkImageDetectionTransparentPixelsRatio") this.websiteSpecialFiltersConfig.darkImageDetectionTransparentPixelsRatio = filterRule;
                if(type == "darkImageDetectionDarkPixelsRatio") this.websiteSpecialFiltersConfig.darkImageDetectionDarkPixelsRatio = filterRule;
                if(type == "throttleDarkImageDetectionDelay") this.websiteSpecialFiltersConfig.throttleDarkImageDetectionDelay = filterRule;
                if(type == "throttleDarkImageDetectionBatchSize") this.websiteSpecialFiltersConfig.throttleDarkImageDetectionBatchSize = filterRule;
                if(type == "enableThrottleDarkImageDetection") this.websiteSpecialFiltersConfig.throttleDarkImageDetection = true;
                if(type == "disableThrottleDarkImageDetection") this.websiteSpecialFiltersConfig.throttleDarkImageDetection = false;
            });
        });
    }
}