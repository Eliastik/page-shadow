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
import { attenuateDefaultValue } from "../../constants.js";
import { getInvertPageVariablesKeyValues } from "../../utils/cssVariableUtils.js";
import { getAttenuatePageBodyClasses } from "../../utils/cssClassUtils.js";

export default class AttenuateColor {

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
        const { attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors, invertEntirePage, selectiveInvert } = this.currentSettings;

        const invertPageVariables = getInvertPageVariablesKeyValues(invertEntirePage, selectiveInvert, this.websiteSpecialFiltersConfig.enableSelectiveInvertPreserveColors);

        let { percentageAttenuateColors } = this.currentSettings;

        if(percentageAttenuateColors / 100 > 1 || percentageAttenuateColors / 100 < 0 || typeof percentageAttenuateColors === "undefined" || percentageAttenuateColors == null) {
            percentageAttenuateColors = attenuateDefaultValue;
        }

        if(this.currentSettings.attenuateColors == "true") {
            this.debugLogger?.log(`Applying invert color with settings : attenuateImgColors = ${attenuateImgColors} / attenuateBgColors = ${attenuateBgColors} / attenuateVideoColors = ${attenuateVideoColors} / attenuateBrightColors = ${attenuateBrightColors} / percentageAttenuateColors = ${percentageAttenuateColors}`);

            const { classesToAdd, classesToRemove } = getAttenuatePageBodyClasses(this.currentSettings);

            this.bodyClassBatcher.add(...classesToAdd);
            this.bodyClassBatcherRemover.add(...classesToRemove);

            document.documentElement.style.setProperty("--page-shadow-attenuate-filter", "grayscale(" + percentageAttenuateColors + "%)");

            if(attenuateImgColors == "true") {
                const invertFilterImage = invertPageVariables.get("--page-shadow-invert-filter-image-backgrounds");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-image-backgrounds", invertFilterImage + " grayscale(" + percentageAttenuateColors + "%)");

                const invertSelectiveFilterImage = invertPageVariables.get("--page-shadow-invert-filter-selective-image");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-selective-image", invertSelectiveFilterImage + " grayscale(" + percentageAttenuateColors + "%)");

                const invertSelectiveFilterImageParentBright = invertPageVariables.get("--page-shadow-invert-filter-selective-image-parent-bright");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-selective-image-parent-bright", invertSelectiveFilterImageParentBright + " grayscale(" + percentageAttenuateColors + "%)");
            }

            if(attenuateBgColors == "true") {
                const invertFilterBg = invertPageVariables.get("--page-shadow-invert-filter-bg-backgrounds");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-bg-backgrounds", invertFilterBg + " grayscale(" + percentageAttenuateColors + "%)");

                const invertSelectiveFilterBg = invertPageVariables.get("--page-shadow-invert-filter-selective-bg");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-selective-bg", invertSelectiveFilterBg + " grayscale(" + percentageAttenuateColors + "%)");

                const invertSelectiveFilterBgParentBright = invertPageVariables.get("--page-shadow-invert-filter-selective-bg-parent-bright");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-selective-bg-parent-bright", invertSelectiveFilterBgParentBright + " grayscale(" + percentageAttenuateColors + "%)");
            }

            if(attenuateVideoColors == "true") {
                const invertFilterVideo = invertPageVariables.get("--page-shadow-invert-filter-video-backgrounds");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-video-backgrounds", invertFilterVideo + " grayscale(" + percentageAttenuateColors + "%)");

                const invertSelectiveFilterVideo = invertPageVariables.get("--page-shadow-invert-filter-selective-video");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-selective-video", invertSelectiveFilterVideo + " grayscale(" + percentageAttenuateColors + "%)");

                const invertSelectiveFilterVideoParentBright = invertPageVariables.get("--page-shadow-invert-filter-selective-video-parent-bright");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-selective-video-parent-bright", invertSelectiveFilterVideoParentBright + " grayscale(" + percentageAttenuateColors + "%)");
            }

            if(attenuateBrightColors == "true") {
                const invertFilterBright = invertPageVariables.get("--page-shadow-invert-filter-bright-color-backgrounds");
                document.documentElement.style.setProperty("--page-shadow-invert-filter-bright-color-backgrounds", invertFilterBright + " grayscale(" + percentageAttenuateColors + "%)");
            }

            this.debugLogger?.log("Applied attenuate color");
        } else {
            this.resetAttenuateColor();
        }
    }

    resetAttenuateColor() {
        this.debugLogger?.log("Resetting attenuate color");

        this.bodyClassBatcherRemover.add("pageShadowAttenuateImageColor");
        this.bodyClassBatcherRemover.add("pageShadowAttenuateBgColor");
        this.bodyClassBatcherRemover.add("pageShadowAttenuateVideoColor");
        this.bodyClassBatcherRemover.add("pageShadowAttenuateBrightColor");

        this.debugLogger?.log("Reseted attenuate color");
    }
}