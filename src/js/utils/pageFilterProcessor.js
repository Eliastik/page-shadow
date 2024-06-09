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
import { addClass, addNewStyleAttribute } from "./util.js";

/**
 * Class used to process the filter rules
 */
export default class PageFilterProcessor {
    pageAnalyzer;

    constructor(pageAnalyzer) {
        this.pageAnalyzer = pageAnalyzer;
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
                        switch(filterType) {
                        case "disableContrastFor":
                            if(!element.classList.contains("pageShadowElementDisabled")) addClass(element, "pageShadowElementDisabled");
                            break;
                        case "forceTransparentBackground":
                            if(!element.classList.contains("pageShadowElementForceTransparentBackground")) addClass(element, "pageShadowElementForceTransparentBackground");
                            break;
                        case "disableBackgroundStylingFor":
                            if(!element.classList.contains("pageShadowDisableBackgroundStyling")) addClass(element, "pageShadowDisableBackgroundStyling");
                            break;
                        case "disableTextColorStylingFor":
                            if(!element.classList.contains("pageShadowDisableColorStyling")) addClass(element, "pageShadowDisableColorStyling");
                            break;
                        case "disableInputBorderStylingFor":
                            if(!element.classList.contains("pageShadowDisableInputBorderStyling")) addClass(element, "pageShadowDisableInputBorderStyling");
                            break;
                        case "forceInputBorderStylingFor":
                            if(!element.classList.contains("pageShadowForceInputBorderStyling")) addClass(element, "pageShadowForceInputBorderStyling");
                            break;
                        case "disableLinkStylingFor":
                            if(!element.classList.contains("pageShadowDisableLinkStyling")) addClass(element, "pageShadowDisableLinkStyling");
                            break;
                        case "disableFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowDisableFontFamilyStyling")) addClass(element, "pageShadowDisableFontFamilyStyling");
                            break;
                        case "forceFontFamilyStylingFor":
                            if(!element.classList.contains("pageShadowForceFontFamilyStyling")) addClass(element, "pageShadowForceFontFamilyStyling");
                            break;
                        case "disableElementInvertFor":
                            if(!element.classList.contains("pageShadowDisableElementInvert")) addClass(element, "pageShadowDisableElementInvert");
                            break;
                        case "hasBackgroundImg":
                            if(!element.classList.contains("pageShadowHasBackgroundImg")) addClass(element, "pageShadowHasBackgroundImg");
                            break;
                        case "forceCustomLinkColorFor":
                            if(!element.classList.contains("pageShadowForceCustomLinkColor")) addClass(element, "pageShadowForceCustomLinkColor");
                            break;
                        case "forceCustomBackgroundColorFor":
                            if(!element.classList.contains("pageShadowForceCustomBackgroundColor")) addClass(element, "pageShadowForceCustomBackgroundColor");
                            break;
                        case "forceCustomTextColorFor":
                            if(!element.classList.contains("pageShadowForceCustomTextColor")) addClass(element, "pageShadowForceCustomTextColor");
                            break;
                        case "forceCustomVisitedLinkColor":
                            if(!element.classList.contains("pageShadowForceCustomVisitedLinkColor")) addClass(element, "pageShadowForceCustomVisitedLinkColor");
                            break;
                        case "disableCustomVisitedLinkColor":
                            if(!element.classList.contains("pageShadowDisableCustomVisitedLinkColor")) addClass(element, "pageShadowDisableCustomVisitedLinkColor");
                            break;
                        case "forceCustomLinkColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomLinkColorAsBackground")) addClass(element, "pageShadowForceCustomLinkColorAsBackground");
                            break;
                        case "forceCustomTextColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomTextColorAsBackground")) addClass(element, "pageShadowForceCustomTextColorAsBackground");
                            break;
                        case "forceCustomLinkVisitedColorAsBackground":
                            if(!element.classList.contains("pageShadowForceCustomLinkVisitedColorAsBackground")) addClass(element, "pageShadowForceCustomLinkVisitedColorAsBackground");
                            break;
                        case "enablePseudoElementsStyling":
                            if(!element.classList.contains("pageShadowEnablePseudoElementStyling")) addClass(element, "pageShadowEnablePseudoElementStyling");
                            break;
                        case "invertElementAsImage":
                            if(!element.classList.contains("pageShadowInvertElementAsImage")) addClass(element, "pageShadowInvertElementAsImage");
                            break;
                        case "invertElementAsVideo":
                            if(!element.classList.contains("pageShadowInvertElementAsVideo")) addClass(element, "pageShadowInvertElementAsVideo");
                            break;
                        case "invertElementAsBackground":
                            if(!element.classList.contains("pageShadowInvertElementAsBackground")) addClass(element, "pageShadowInvertElementAsBackground");
                            break;
                        case "enableSelectiveInvert":
                            if(!element.classList.contains("pageShadowSelectiveInvert")) addClass(element, "pageShadowSelectiveInvert");
                            break;
                        case "enablePseudoElementSelectiveInvert":
                            if(!element.classList.contains("pageShadowSelectiveInvertPseudoElement")) addClass(element, "pageShadowSelectiveInvertPseudoElement");
                            break;
                        case "invertPseudoElement":
                            if(!element.classList.contains("pageShadowInvertPseudoElement")) addClass(element, "pageShadowInvertPseudoElement");
                            break;
                        case "forceDisableDefaultBackgroundColor": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultBackgroundColor")) {
                                addNewStyleAttribute(element, "background-color: unset !important");
                                addClass(element, "pageShadowforceDisableDefaultBackgroundColor");
                            }
                            break;
                        }
                        case "forceDisableDefaultBackground": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultBackground")) {
                                addNewStyleAttribute(element, "background: unset !important");
                                addClass(element, "pageShadowforceDisableDefaultBackground");
                            }
                            break;
                        }
                        case "forceDisableDefaultFontColor": {
                            if(!element.classList.contains("pageShadowforceDisableDefaultFontColor")) {
                                addNewStyleAttribute(element, "color: unset !important");
                                addClass(element, "pageShadowforceDisableDefaultFontColor");
                            }
                            break;
                        }
                        case "disableShadowRootsCustomStyle":
                        case "overrideShadowRootsCustomStyle":
                            if(element.shadowRoot != null) this.pageAnalyzer.processShadowRoot(element);
                            break;
                        case "preserveBrightColor":
                            if(!element.classList.contains("pageShadowHasBrightColorBackground")) addClass(element, "pageShadowHasBrightColorBackground");
                            break;
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
                if(type == "brightColorLightnessTresholdMax") websiteSpecialFiltersConfig.brightColorLightnessTresholdMax = rule.filter;
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