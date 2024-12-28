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
import { blueLightReductionElementId, brightnessDefaultValue, minBrightnessPercentage, maxBrightnessPercentage } from "../../constants.js";
import { getBlueLightReductionFilterCSSClass } from "../../utils/cssClassUtils.js";

export default class BluelightReduction {

    elementBlueLightFilter;
    elementBrightnessWrapper;

    debugLogger;

    currentSettings;
    websiteSpecialFiltersConfig;

    constructor(debugLogger) {
        this.debugLogger = debugLogger;
    }

    setSettings(settings, elementBlueLightFilter, elementBrightnessWrapper) {
        this.currentSettings = settings;
        this.elementBlueLightFilter = elementBlueLightFilter;
        this.elementBrightnessWrapper = elementBrightnessWrapper;
    }

    apply() {
        this.elementBlueLightFilter.setAttribute("class", "");

        if(this.currentSettings.blueLightReductionEnabled == "true" && !this.runningInIframe && this.elementBlueLightFilter) {
            const percentage = this.currentSettings.percentageBlueLightReduction;
            const colorTemp = this.currentSettings.colorTemp;

            this.debugLogger?.log("Applying blue light reduction");

            if(this.elementBlueLightFilter.style) {
                this.elementBlueLightFilter.style.display = "block";
                this.elementBlueLightFilter.setAttribute("id", blueLightReductionElementId);
                this.elementBlueLightFilter.setAttribute("class", "");

                if(colorTemp != undefined) {
                    const tempClass = getBlueLightReductionFilterCSSClass(colorTemp);
                    this.elementBlueLightFilter.setAttribute("class", tempClass);
                } else {
                    this.elementBlueLightFilter.setAttribute("class", "k2000");
                }

                if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                    this.elementBlueLightFilter.style.opacity = brightnessDefaultValue;
                } else {
                    this.elementBlueLightFilter.style.opacity = percentage / 100;
                }
            }

            this.appendBlueLightElement(this.elementBlueLightFilter, this.elementBrightnessWrapper);

            this.debugLogger?.log("Applied blue light reduction");
        } else {
            this.resetBlueLightPage();
        }
    }

    appendBlueLightElement(elementBlueLightFilter, elementWrapper) {
        if(document.body) {
            this.debugLogger?.log("Appending blue light reduction element");

            const blueLightPageElement = document.getElementById(blueLightReductionElementId);

            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBlueLightFilter)) {
                elementWrapper.removeChild(elementBlueLightFilter);
            }

            document.body.appendChild(elementWrapper);

            // Remove old blue light page filters if found
            if(blueLightPageElement) {
                blueLightPageElement.remove();
            }

            this.debugLogger?.log("Appended blue light reduction element");
        }

        elementWrapper.appendChild(elementBlueLightFilter);
    }

    resetBlueLightPage() {
        if(this.elementBrightnessWrapper && document.body && document.body.contains(this.elementBrightnessWrapper) && document.body.contains(this.elementBlueLightFilter)) {
            this.elementBrightnessWrapper.removeChild(this.elementBlueLightFilter);
        }
    }
}