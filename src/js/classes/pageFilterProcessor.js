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

import { mapFiltersCSSClass, websiteSpecialFiltersProcessingConfig } from "../constants.js";
import { addNewStyleAttribute, removeStyleAttribute, sha256 } from "../utils/util.js";
import SafeTimer from "./safeTimer.js";

/**
 * Class used to process the filter rules
 */
export default class PageFilterProcessor {

    pageAnalyzer;
    debugLogger;

    filtersCache = null;
    multipleElementClassBatcherAdd = null;
    multipleElementClassBatcherRemove = null;
    websiteSpecialFiltersConfig = null;

    filterMatchingHistory = new Map();

    constructor(pageAnalyzer, multipleElementClassBatcherAdd, multipleElementClassBatcherRemove, websiteSpecialFiltersConfig, debugLogger) {
        this.pageAnalyzer = pageAnalyzer;
        this.multipleElementClassBatcherAdd = multipleElementClassBatcherAdd;
        this.multipleElementClassBatcherRemove = multipleElementClassBatcherRemove;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.debugLogger = debugLogger;
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
                this.debugLogger?.log(e, "error");
                continue; // Continue to next filter if selector is not valid
            }

            if(element) {
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

                                if (previousMatchedFilter) {
                                    const previousMatched = previousMatchedFilter
                                        .find(v => v.element === element && !v.children);

                                    if (previousMatched) {
                                        elementsNotMatching.push(element);
                                        previousMatchedFilter.splice(previousMatched, 1);
                                    }
                                }
                            }
                        }
                    }
                } catch(e) {
                    this.debugLogger?.log(e, "error");
                    continue;
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
                                    } else if (enableNotMatchingFiltersDetection) {
                                        const previousMatchedFilter = this.filterMatchingHistory.get(filterHash);

                                        if (previousMatchedFilter) {
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
                                this.debugLogger?.log(e, "error");
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

            if (element) {
                for(const filterType of filterTypes) {
                    this.processElement(filterType, element, remove);
                }
            }
        }
    }

    processElement(filterType, element, remove) {
        const classToAddOrRemove = mapFiltersCSSClass[filterType];

        if (classToAddOrRemove) {
            if (remove) {
                if (element.classList && element.classList.contains(classToAddOrRemove)) {
                    this.multipleElementClassBatcherRemove.add(element, classToAddOrRemove);
                    this.debugLogger?.log(`PageFilterProcessor - Removing class ${classToAddOrRemove} on element`, "debug", element);
                }
            } else if (element.classList && !element.classList.contains(classToAddOrRemove)) {
                this.multipleElementClassBatcherAdd.add(element, classToAddOrRemove);
            }
        }

        if (filterType == "forceDisableDefaultBackgroundColor") {
            if (remove) {
                removeStyleAttribute(element, "background-color: unset !important");
                this.debugLogger?.log("PageFilterProcessor - Removing unset style background-color on element", "debug", element);
            } else {
                addNewStyleAttribute(element, "background-color: unset !important");
            }
        }

        if (filterType == "forceDisableDefaultBackground") {
            if (remove) {
                removeStyleAttribute(element, "background: unset !important");
                this.debugLogger?.log("PageFilterProcessor - Removing unset style background on element", "debug", element);
            } else {
                addNewStyleAttribute(element, "background: unset !important");
            }
        }

        if (filterType == "forceDisableDefaultFontColor") {
            if (remove) {
                removeStyleAttribute(element, "color: unset !important");
                this.debugLogger?.log("PageFilterProcessor - Removing unset style color on element", "debug", element);
            } else {
                addNewStyleAttribute(element, "color: unset !important");
            }
        }

        if (filterType == "disableShadowRootsCustomStyle" || filterType == "overrideShadowRootsCustomStyle") {
            const safeTimerApplyShadowRootsCustomStyle = new SafeTimer(async () => {
                safeTimerApplyShadowRootsCustomStyle.clear();

                if(element.shadowRoot != null) {
                    await this.pageAnalyzer.processShadowRoot(element);
                } else {
                    safeTimerApplyShadowRootsCustomStyle.start(this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
                }
            });

            safeTimerApplyShadowRootsCustomStyle.start(this.websiteSpecialFiltersConfig.shadowRootStyleOverrideDelay);
        }
    }

    processSpecialRules(rules) {
        rules.forEach(rule => {
            const filterTypes = rule.type.split(",");
            const filterRule = !isNaN(rule.filter) ? parseFloat(rule.filter) : null;

            filterTypes.forEach(type => {
                const filterConfig = websiteSpecialFiltersProcessingConfig[type];

                if(filterConfig) {
                    switch(filterConfig.type) {
                    case "enable":
                        this.websiteSpecialFiltersConfig[filterConfig.name] = true;
                        break;
                    case "disable":
                        this.websiteSpecialFiltersConfig[filterConfig.name] = false;
                        break;
                    case "value":
                        this.websiteSpecialFiltersConfig[filterConfig.name] = filterRule;
                        break;
                    }
                } else {
                    this.debugLogger?.warn(`Unknown special filter rule: ${filterConfig}`);
                }
            });
        });
    }
}