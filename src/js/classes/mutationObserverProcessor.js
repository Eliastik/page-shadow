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
import { getCurrentURL } from "../utils/util.js";
import { ignoredElementsContentScript } from "../constants.js";
import MutationObserverWrapper from "./mutationObserverWrapper.js";
import SafeTimer from "./safeTimer.js";
import ThrottledTask from "./throttledTask.js";
import ContentProcessorConstants from "./contentProcessorConstants.js";

export default class MutationObserverProcessor {

    safeTimerMutationBackgrounds = null;
    mutationObserverAddedNodes = [];
    delayedMutationObserversCalls = [];
    safeTimerMutationDelayed = null;
    mutationDetected = false;

    elementBrightnessWrapper;

    mutationObserverBody;
    mutationObserverBackgrounds;
    mutationObserverBrightnessBluelight;
    mutationObserverBluelightWrapper;

    currentSettings;
    websiteSpecialFiltersConfig;

    pageAnalyzer;
    filterProcessor;
    debugLogger;

    constructor(pageAnalyzer, filterProcessor, debugLogger, elementBrightnessWrapper, websiteSpecialFiltersConfig) {
        this.pageAnalyzer = pageAnalyzer;
        this.filterProcessor = filterProcessor;
        this.debugLogger = debugLogger;
        this.elementBrightnessWrapper = elementBrightnessWrapper;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    setSettings(websiteSpecialFiltersConfig, currentSettings) {
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.currentSettings = currentSettings;
    }

    pause(mutationType) {
        if(this.mutationObserverBody && (mutationType == ContentProcessorConstants.MUTATION_TYPE_BODY || mutationType == ContentProcessorConstants.TYPE_ALL)) {
            this.mutationObserverBody.pause();
        }

        if(this.mutationObserverBrightnessBluelight && (mutationType == ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutationType == ContentProcessorConstants.TYPE_ALL)) {
            this.mutationObserverBrightnessBluelight.pause();
        }

        if(this.mutationObserverBluelightWrapper && (mutationType == ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || mutationType == ContentProcessorConstants.TYPE_ALL)) {
            this.mutationObserverBluelightWrapper.pause();
        }
    }

    mutationObserve(type, forceReset) {
        // Mutation Observer for the body element classList (contrast/invert/attenuate)
        this.debugLogger?.log(`Applying mutation observer for type = ${type} / forceReset ? ${forceReset}`);

        if(type == ContentProcessorConstants.MUTATION_TYPE_BODY) {
            this.setupMutationObserverBody(forceReset);
        } else if(type == ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT) { // Mutation Observer for the brigthness/bluelight settings
            this.setupMutationObserverBrightnessBluelight(forceReset);
        } else if(type == ContentProcessorConstants.MUTATION_TYPE_BACKGROUNDS) { // Mutation Observer for analyzing whole page elements (detecting backgrounds and applying filters)
            this.setupMutationObserverBackgrounds(forceReset);
        }

        // Mutation for the brigthness wrapper element
        if(type === ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT || type === ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESSWRAPPER) { // Mutation for the brightness/bluelight wrapper element
            this.setupMutationObserverBrightnessBluelightWrapper(forceReset);
        }
    }

    setupMutationObserverBrightnessBluelightWrapper(forceReset) {
        if (this.mutationObserverBluelightWrapper != null && !forceReset) {
            this.mutationObserverBluelightWrapper.start();
        } else {
            if (typeof this.mutationObserverBluelightWrapper !== "undefined") this.mutationObserverBluelightWrapper.disconnect();

            this.mutationObserverBluelightWrapper = new MutationObserverWrapper(mutations => {
                let reStart = true;
                this.mutationObserverBluelightWrapper.pause();

                mutations.forEach(mutation => {
                    mutation.removedNodes.forEach(removedNode => {
                        if (removedNode === this.elementBrightnessWrapper) {
                            reStart = false;

                            const timerApplyMutationBrightnessWrapper = new SafeTimer(() => {
                                document.body.appendChild(this.elementBrightnessWrapper);
                                timerApplyMutationBrightnessWrapper.clear();
                                this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                            });

                            timerApplyMutationBrightnessWrapper.start();
                        }
                    });
                });

                if (reStart) {
                    if (document.readyState == "complete" || document.readyState == "interactive") {
                        this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                    } else {
                        const eventReadyStateMutationObserverBrightnessWrapper = document.addEventListener("readystatechange", () => {
                            if (document.readyState === "interactive" || document.readyState == "complete") {
                                document.removeEventListener("readystatechange", eventReadyStateMutationObserverBrightnessWrapper);
                                this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESSWRAPPER);
                            }
                        });
                    }
                }
            }, {
                "attributes": false,
                "subtree": false,
                "childList": true,
                "characterData": false
            }, null, false);

            this.mutationObserverBluelightWrapper.start();
        }
    }

    setupMutationObserverBackgrounds(forceReset) {
        if (this.mutationObserverBackgrounds != null && !forceReset) {
            this.mutationObserverBackgrounds.start();
        } else {
            // Clear old mutation timers
            if (this.safeTimerMutationBackgrounds) this.safeTimerMutationBackgrounds.clear();
            if (this.safeTimerMutationDelayed) this.safeTimerMutationDelayed.clear();
            if (this.mutationObserverBackgrounds) this.mutationObserverBackgrounds.disconnect();

            this.mutationObserverBackgrounds = new MutationObserverWrapper(mutations => {
                this.delayedMutationObserversCalls.push(...mutations);

                if (this.websiteSpecialFiltersConfig.throttleMutationObserverBackgrounds) {
                    this.safeTimerMutationDelayed.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
                } else {
                    this.treatAllMutations();
                }

                this.mutationObserverBackgrounds.start();
            }, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false,
                "attributeFilter": ["class", "style"],
                "attributeOldValue": true,
                "characterDataOldValue": false
            }, null, true);

            this.safeTimerMutationBackgrounds = new SafeTimer(() => this.treatAllMutationsAddedNodes());
            this.safeTimerMutationDelayed = new SafeTimer(() => this.treatAllMutations());

            this.mutationObserverBackgrounds.start();
        }
    }

    async treatAllMutations() {
        if(this.delayedMutationObserversCalls.length > 0) {
            await this.pageAnalyzer.setSettings(this.websiteSpecialFiltersConfig, this.currentSettings, this.precEnabled);

            const throttledTask = new ThrottledTask(
                (mutation) => this.treatOneMutation(mutation),
                this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds,
                this.websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall
            );
        
            throttledTask.start(this.delayedMutationObserversCalls).then(() => {
                this.safeTimerMutationBackgrounds.start(this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds);
            });

            this.delayedMutationObserversCalls = [];
        }
    }

    treatOneMutation(mutation) {
        if(mutation.type == "childList") {
            const nodeList = mutation.addedNodes;

            if(nodeList.length > 0) {
                this.mutationObserverAddedNodes.push(...Array.prototype.slice.call(nodeList));
            }
        } else if(mutation.type == "attributes") {
            if(!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
                this.pageAnalyzer.mutationForElement(mutation.target, mutation.attributeName, mutation.oldValue);
            }

            this.filterProcessor.doProcessFilters(mutation.target, false);
        }
    }

    treatAllMutationsAddedNodes() {
        const throttledTask = new ThrottledTask(
            (node) => this.treatOneMutationAddedNode(node),
            this.websiteSpecialFiltersConfig.delayMutationObserverBackgrounds,
            this.websiteSpecialFiltersConfig.throttledMutationObserverTreatedByCall
        );
    
        throttledTask.start(this.mutationObserverAddedNodes);
    
        this.mutationObserverAddedNodes = [];
    }

    treatOneMutationAddedNode(node) {
        if(!node || !node.classList || node == document.body || ignoredElementsContentScript.includes(node.localName) || node.nodeType != 1 || node.shadowRoot) {
            return;
        }

        if (!this.websiteSpecialFiltersConfig.performanceModeEnabled) {
            this.pageAnalyzer.mutationForElement(node, null, null);
        }

        this.filterProcessor.doProcessFilters(node, true);
    }

    setupMutationObserverBrightnessBluelight(forceReset) {
        if (this.mutationObserverBrightnessBluelight != null && !forceReset) {
            this.mutationObserverBrightnessBluelight.start();

            this.safeTimerMutationBackgrounds = null;
            this.mutationObserverAddedNodes = [];
            this.delayedMutationObserversCalls = [];

            this.safeTimerMutationDelayed = MutationObserverWrapper(mutations => {
                let reApplyBrightness = false;
                let reApplyBlueLight = false;

                mutations.forEach(mutation => {
                    if (this.currentSettings && this.currentSettings.pageLumEnabled != undefined && this.currentSettings.pageLumEnabled === "true") {
                        if ((!document.body.contains(this.elementBrightness) || !document.body.contains(this.elementBrightnessWrapper)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                            reApplyBrightness = true;
                        }
                    }

                    if (this.currentSettings && this.currentSettings.blueLightReductionEnabled != undefined && this.currentSettings.blueLightReductionEnabled === "true") {
                        if ((!document.body.contains(this.elementBlueLightFilter) || !document.body.contains(this.elementBrightnessWrapper)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                            reApplyBlueLight = true;
                        }
                    }
                });

                if (reApplyBrightness || reApplyBlueLight) {
                    const timerApplyMutationBlueLight = new SafeTimer(() => {
                        timerApplyMutationBlueLight.clear();

                        if (this.precUrl == getCurrentURL()) {
                            if (reApplyBrightness && reApplyBlueLight) {
                                this.main(ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS_AND_BLUELIGHT, ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            } else if (reApplyBrightness) {
                                this.main(ContentProcessorConstants.TYPE_ONLY_BRIGHTNESS, ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            } else if (reApplyBlueLight) {
                                this.main(ContentProcessorConstants.TYPE_ONLY_BLUELIGHT, ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            }
                        } else {
                            this.mutationDetected = true;
                        }
                    });

                    timerApplyMutationBlueLight.start(this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                } else {
                    if (document.readyState == "complete" || document.readyState == "interactive") {
                        this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                    } else {
                        const eventReadyStateMutationObserverBrightnessBluelight = document.addEventListener("readystatechange", () => {
                            if (document.readyState === "interactive" || document.readyState == "complete") {
                                document.removeEventListener("readystatechange", eventReadyStateMutationObserverBrightnessBluelight);
                                this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BRIGHTNESS_BLUELIGHT);
                            }
                        });
                    }
                }
            }, {
                "attributes": true,
                "subtree": true,
                "childList": true,
                "characterData": false
            }, this.elementBrightnessWrapper, false);

            this.mutationObserverBrightnessBluelight.start();
        }
    }

    setupMutationObserverBody(forceReset) {
        if (this.mutationObserverBody != null && !forceReset) {
            this.mutationObserverBody.start();
        } else {
            if (typeof this.mutationObserverBody !== "undefined") this.mutationObserverBody.disconnect();

            this.mutationObserverBody = new MutationObserverWrapper(mutations => {
                const classList = document.body.classList;

                let reApplyContrast = false;
                let reApplyInvert = false;
                let reApplyAttenuate = false;

                if (this.currentSettings && this.currentSettings.pageShadowEnabled != undefined && this.currentSettings.pageShadowEnabled == "true") {
                    let classFound = false;

                    if (classList.contains("pageShadowContrastBlack")) {
                        classFound = true;
                    }

                    if (classList.contains("pageShadowCustomFontFamily")) {
                        classFound = true;
                    }

                    if (!classFound) {
                        reApplyContrast = true;
                    }
                }

                mutations.forEach(mutation => {
                    if (this.currentSettings && this.currentSettings.colorInvert !== null && this.currentSettings.colorInvert == "true") {
                        if (mutation.type == "attributes" && mutation.attributeName == "class") {
                            const classList = document.body.classList;

                            if (mutation.oldValue && ((mutation.oldValue.indexOf("pageShadowInvertImageColor") !== -1 && !classList.contains("pageShadowInvertImageColor"))
                                || (mutation.oldValue.indexOf("pageShadowInvertVideoColor") !== -1 && !classList.contains("pageShadowInvertVideoColor"))
                                || (mutation.oldValue.indexOf("pageShadowInvertBgColor") !== -1 && !classList.contains("pageShadowInvertBgColor"))
                                || (mutation.oldValue.indexOf("pageShadowEnableSelectiveInvert") !== -1 && !classList.contains("pageShadowEnableSelectiveInvert")))) {
                                reApplyInvert = true;
                            }
                        }

                        if (mutation.type == "attributes" && mutation.attributeName == "class") {
                            const classList = document.body.classList;

                            if ((mutation.oldValue && mutation.oldValue.indexOf("pageShadowDisableImgBgColor") !== -1 && !classList.contains("pageShadowDisableImgBgColor"))
                                || (mutation.oldValue && mutation.oldValue.indexOf("pageShadowPreserveBrightColor") !== -1 && !classList.contains("pageShadowPreserveBrightColor"))) {
                                reApplyContrast = true;
                            }
                        }
                    }

                    if (this.currentSettings && this.currentSettings.attenuateColors !== null && this.currentSettings.attenuateColors == "true") {
                        if (mutation.type == "attributes" && mutation.attributeName == "class") {
                            const classList = document.body.classList;

                            if (this.currentSettings && this.currentSettings.attenuateImgColors !== null && this.currentSettings.attenuateImgColors == "true") {
                                if (mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateImageColor") !== -1 && !classList.contains("pageShadowAttenuateImageColor")) {
                                    reApplyAttenuate = true;
                                }
                            }

                            if (this.currentSettings && this.currentSettings.attenuateBgColors !== null && this.currentSettings.attenuateBgColors == "true") {
                                if (mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateBgColor") !== -1 && !classList.contains("pageShadowAttenuateBgColor")) {
                                    reApplyAttenuate = true;
                                }
                            }

                            if (this.currentSettings && this.currentSettings.attenuateVideoColors !== null && this.currentSettings.attenuateVideoColors == "true") {
                                if (mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateVideoColor") !== -1 && !classList.contains("pageShadowAttenuateVideoColor")) {
                                    reApplyAttenuate = true;
                                }
                            }

                            if (this.currentSettings && this.currentSettings.attenuateBrightColors !== null && this.currentSettings.attenuateBrightColors == "true") {
                                if (mutation.oldValue && mutation.oldValue.indexOf("pageShadowAttenuateBrightColor") !== -1 && !classList.contains("pageShadowAttenuateBrightColor")) {
                                    reApplyAttenuate = true;
                                }
                            }
                        }
                    }
                });

                if (reApplyContrast || reApplyInvert || reApplyAttenuate) {
                    const timerReapply = new SafeTimer(() => {
                        timerReapply.clear();

                        if (this.precUrl == getCurrentURL()) {
                            if (!reApplyContrast && (reApplyInvert || reApplyAttenuate)) {
                                this.main(ContentProcessorConstants.TYPE_ONLY_INVERT, ContentProcessorConstants.MUTATION_TYPE_BODY);
                            } else {
                                this.main(ContentProcessorConstants.TYPE_ONLY_CONTRAST, ContentProcessorConstants.MUTATION_TYPE_BODY);
                            }
                        } else {
                            this.mutationDetected = true;
                        }
                    });

                    timerReapply.start(this.websiteSpecialFiltersConfig.delayApplyMutationObserversSafeTimer);
                } else {
                    if (document.readyState == "complete" || document.readyState == "interactive") {
                        this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BODY);
                    } else {
                        const eventReadyStateMutationObserverBody = document.addEventListener("readystatechange", () => {
                            if (document.readyState === "interactive" || document.readyState == "complete") {
                                document.removeEventListener("readystatechange", eventReadyStateMutationObserverBody);
                                this.mutationObserve(ContentProcessorConstants.MUTATION_TYPE_BODY);
                            }
                        });
                    }
                }
            }, {
                "attributes": true,
                "subtree": false,
                "childList": false,
                "characterData": false,
                "attributeOldValue": true,
                "attributeFilter": ["class"]
            }, null, false);

            this.mutationObserverBody.start();
        }
    }
}