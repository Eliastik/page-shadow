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
import { brightnessReductionElementId, brightnessDefaultValue, minBrightnessPercentage, maxBrightnessPercentage } from "../../constants.js";

export default class BrightnessReduction {

    elementBrightness;
    elementBrightnessWrapper;
    runningInIframe;

    debugLogger;

    currentSettings;

    constructor(debugLogger) {
        this.debugLogger = debugLogger;
    }

    setSettings(settings, elementBrightness, elementBrightnessWrapper, runningInIframe) {
        this.currentSettings = settings;
        this.elementBrightness = elementBrightness;
        this.elementBrightnessWrapper = elementBrightnessWrapper;
        this.runningInIframe = runningInIframe;
    }

    apply() {
        if(!this.elementBrightness) {
            return;
        }

        this.elementBrightness.setAttribute("class", "");

        if(this.currentSettings && this.currentSettings.pageLumEnabled == "true" && !this.runningInIframe && this.elementBrightness) {
            const percentage = this.currentSettings.pourcentageLum;

            this.debugLogger?.log("Applying brightness reduction");

            if(this.elementBrightness.style) {
                this.elementBrightness.style.display = "block";
                this.elementBrightness.setAttribute("id", brightnessReductionElementId);

                if(percentage / 100 > maxBrightnessPercentage || percentage / 100 < minBrightnessPercentage || typeof percentage === "undefined" || percentage == null) {
                    this.elementBrightness.style.opacity = brightnessDefaultValue;
                } else {
                    this.elementBrightness.style.opacity = percentage / 100;
                }
            }

            this.appendBrightnessElement(this.elementBrightness, this.elementBrightnessWrapper);

            this.debugLogger?.log("Applied brightness reduction");
        } else {
            this.resetBrightnessPage();
        }
    }

    appendBrightnessElement(elementBrightness, elementWrapper) {
        if(document.body) {
            this.debugLogger?.log("Appending brightness reduction element");

            const brightnessPageElement = document.getElementById(brightnessReductionElementId);

            if(elementWrapper && document.body.contains(elementWrapper) && elementWrapper.contains(elementBrightness)) {
                elementWrapper.removeChild(elementBrightness);
            }

            document.body.appendChild(elementWrapper);

            // Remove old decrease brightness if found
            if(brightnessPageElement) {
                brightnessPageElement.remove();
            }

            this.debugLogger?.log("Appended brightness reduction element");
        }

        elementWrapper.appendChild(elementBrightness);
    }

    resetBrightnessPage() {
        if(this.elementBrightnessWrapper && document.body && document.body.contains(this.elementBrightnessWrapper) && document.body.contains(this.elementBrightness)) {
            this.elementBrightnessWrapper.removeChild(this.elementBrightness);
        }
    }
}