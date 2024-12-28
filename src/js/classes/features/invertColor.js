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
import { getInvertPageVariablesKeyValues } from "../../utils/cssVariableUtils.js";
import { removeClass } from "../../utils/cssClassUtils.js";

export default class InvertColor {

    bodyClassBatcher;
    htmlClassBatcher;
    bodyClassBatcherRemover;

    debugLogger;

    currentSettings;
    websiteSpecialFiltersConfig;

    constructor(debugLogger) {
        this.debugLogger = debugLogger;
    }

    setSettings(settings, bodyClassBatcher, htmlClassBatcher, bodyClassBatcherRemover, websiteSpecialFiltersConfig) {
        this.currentSettings = settings;
        this.bodyClassBatcher = bodyClassBatcher;
        this.htmlClassBatcher = htmlClassBatcher;
        this.bodyClassBatcherRemover = bodyClassBatcherRemover;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    apply() {
        const invertImageColors = this.currentSettings.invertImageColors;
        const invertEntirePage = this.currentSettings.invertEntirePage;
        const invertVideoColors = this.currentSettings.invertVideoColors;
        const invertBgColors = this.currentSettings.invertBgColor;
        const selectiveInvert = this.currentSettings.selectiveInvert;
        const invertBrightColors = this.currentSettings.invertBrightColors;

        const invertPageVariables = getInvertPageVariablesKeyValues(invertEntirePage, selectiveInvert, this.websiteSpecialFiltersConfig.enableSelectiveInvertPreserveColors);

        for(const [key, value] of invertPageVariables) {
            document.documentElement.style.setProperty(key, value);
        }

        if(this.currentSettings.colorInvert === "true") {
            this.debugLogger?.log(`Applying invert color with settings : invertImageColors = ${invertImageColors} / invertEntirePage = ${invertEntirePage} / invertVideoColors = ${invertVideoColors} / invertBgColors = ${invertBgColors} / selectiveInvert = ${selectiveInvert} / invertBrightColors = ${invertBrightColors}`);

            if(invertEntirePage === "true") {
                this.htmlClassBatcher.add("pageShadowInvertEntirePage", "pageShadowBackground");

                if(invertImageColors === "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertImageColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertImageColor");
                }

                if(invertBgColors === "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBgColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors === "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertVideoColor");
                }

                if(selectiveInvert === "true") {
                    this.bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                } else {
                    this.bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                }

                if(invertBrightColors === "true") {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBrightColors");
                } else {
                    this.bodyClassBatcher.add("pageShadowInvertBrightColors");
                }
            } else {
                removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");

                if(invertImageColors === "true") {
                    this.bodyClassBatcher.add("pageShadowInvertImageColor");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertImageColor");
                }

                if(invertBgColors !== "false") {
                    this.bodyClassBatcher.add("pageShadowInvertBgColor");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors === "true") {
                    this.bodyClassBatcher.add("pageShadowInvertVideoColor");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertVideoColor");
                }

                if(selectiveInvert === "true") {
                    this.bodyClassBatcher.add("pageShadowEnableSelectiveInvert");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowEnableSelectiveInvert");
                }

                if(invertBrightColors === "true") {
                    this.bodyClassBatcher.add("pageShadowInvertBrightColors");
                } else {
                    this.bodyClassBatcherRemover.add("pageShadowInvertBrightColors");
                }
            }

            this.debugLogger?.log("Applied invert color");
        } else {
            this.resetInvertPage();
        }
    }

    resetInvertPage() {
        this.debugLogger?.log("Resetting invert color");

        this.bodyClassBatcherRemover.add("pageShadowInvertImageColor", "pageShadowInvertVideoColor", "pageShadowInvertBgColor", "pageShadowEnableSelectiveInvert", "pageShadowInvertBrightColors");
        removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");

        this.debugLogger?.log("Reseted invert color");
    }
}