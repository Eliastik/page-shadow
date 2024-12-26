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
import { rgb2hsl } from "../utils/util.js";

/** Class used to analyze and detect website having a dark theme */
export default class DarkThemeDetector {

    analyzedElements = 0;
    darkElements = 0;
    lightElements = 0;

    currentSettings;
    websiteSpecialFiltersConfig;

    constructor(currentSettings, websiteSpecialFiltersConfig) {
        this.currentSettings = currentSettings;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    process(computedStyles, hasBackgroundImg, hasTransparentColor) {
        if(hasBackgroundImg || hasTransparentColor) {
            return;
        }

        const backgroundColor = computedStyles.backgroundColor;

        const hslBackgroundColor = this.getHSLFromColor(backgroundColor);

        if(backgroundColor && backgroundColor.trim().startsWith("rgb")) {
            // TODO constant websiteSpecialFiltersConfig
            const lightnessBackgroundColor = hslBackgroundColor[2];
            const saturationBackgroundColor = hslBackgroundColor[1];

            if(lightnessBackgroundColor <= 0.25 && saturationBackgroundColor <= 0.5) {
                this.darkElements++;
            } else {
                this.lightElements++;
            }

            this.analyzedElements++;
        }
    }

    getHSLFromColor(color) {
        const rgbValues = color.split("(")[1].split(")")[0];
        const rgbValuesList = rgbValues.trim().split(",");

        return rgb2hsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);
    }

    hasDarkTheme() {
        // TODO constant websiteSpecialFiltersConfig
        return this.analyzedElements > 0 && this.getPercentDarkElements() >= 0.6;
    }

    getPercentDarkElements() {
        return (this.darkElements / this.analyzedElements) || 0;
    }
}