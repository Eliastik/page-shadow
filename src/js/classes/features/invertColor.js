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
import { getInvertPageBodyClasses, removeClass } from "../../utils/cssClassUtils.js";

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
        const { invertImageColors, invertEntirePage, invertVideoColors, invertBgColor, selectiveInvert, invertBrightColors } = this.currentSettings;

        const invertPageVariables = getInvertPageVariablesKeyValues(invertEntirePage, selectiveInvert, this.websiteSpecialFiltersConfig.enableSelectiveInvertPreserveColors);

        for(const [key, value] of invertPageVariables) {
            document.documentElement.style.setProperty(key, value);
        }

        if(this.currentSettings.colorInvert === "true") {
            this.debugLogger?.log(`Applying invert color with settings : invertImageColors = ${invertImageColors} / invertEntirePage = ${invertEntirePage} / invertVideoColors = ${invertVideoColors} / invertBgColors = ${invertBgColor} / selectiveInvert = ${selectiveInvert} / invertBrightColors = ${invertBrightColors}`);

            const { classesToAdd, classesToRemove } = getInvertPageBodyClasses(this.currentSettings);

            this.bodyClassBatcher.add(...classesToAdd);
            this.bodyClassBatcherRemover.add(...classesToRemove);

            if(invertEntirePage === "true") {
                this.htmlClassBatcher.add("pageShadowInvertEntirePage", "pageShadowBackground");
            } else {
                removeClass(document.getElementsByTagName("html")[0], "pageShadowInvertEntirePage", "pageShadowBackground");
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