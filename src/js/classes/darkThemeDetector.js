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
import { getCurrentURL } from "../utils/urlUtils.js";
import { disableEnableToggle } from "../utils/enableDisableUtils.js";
import { getPresetData, disableEnablePreset, getPresetWithAutoEnableForDarkWebsites } from "../utils/presetUtils.js";
import { isElementNotVisible } from "../utils/browserUtils.js";
import { rgbTohsl, cssColorToRgbaValues } from "../utils/colorUtils.js";

/** Class used to analyze and detect website having a dark theme */
export default class DarkThemeDetector {

    analyzedElements = 0;
    darkElementsScore = 0;
    lightElementsScore = 0;

    currentSettings;
    websiteSpecialFiltersConfig;

    debugLogger;

    constructor(currentSettings, websiteSpecialFiltersConfig, debugLogger) {
        this.currentSettings = currentSettings;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.debugLogger = debugLogger;
    }

    process(element, computedStyles, hasBackgroundImg, hasTransparentColor) {
        if(!element || !computedStyles || hasBackgroundImg || hasTransparentColor
            || isElementNotVisible(element, computedStyles)) {
            return;
        }

        const backgroundColor = computedStyles.backgroundColor;

        const rgbValuesList = cssColorToRgbaValues(backgroundColor);
        const hslBackgroundColor = this.getHSLFromColor(rgbValuesList);

        if(!hslBackgroundColor || (rgbValuesList && rgbValuesList.length === 4 && rgbValuesList[3] == 0)) {
            return;
        }

        const lightnessBackgroundColor = hslBackgroundColor[2];
        const saturationBackgroundColor = hslBackgroundColor[1];

        if(lightnessBackgroundColor <= this.websiteSpecialFiltersConfig.darkThemeDetectionMaxLightness
            && saturationBackgroundColor <= this.websiteSpecialFiltersConfig.darkThemeDetectionMaxSaturation) {
            const rect = element.getBoundingClientRect();
            this.darkElementsScore += (rect.width * rect.height);
        } else if(lightnessBackgroundColor >= this.websiteSpecialFiltersConfig.darkThemeDetectionMinLightnessLightElements) {
            const rect = element.getBoundingClientRect();
            this.lightElementsScore += (rect.width * rect.height);
        }

        this.analyzedElements++;
    }

    getHSLFromColor(rgbValuesList) {
        if(!rgbValuesList) return null;
        return rgbTohsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);
    }

    hasDarkTheme() {
        return this.analyzedElements > 0 && this.getPercentDarkElements() >= this.websiteSpecialFiltersConfig.darkThemeDetectionPercentageRatioDarkLightElements;
    }

    getPercentDarkElements() {
        const totalScore = this.darkElementsScore + this.lightElementsScore;
        const totalPageArea = document.documentElement.scrollWidth * document.documentElement.scrollHeight;

        if(totalScore === 0 || totalPageArea === 0) {
            return 0;
        }

        const normalizedDarkScore = this.darkElementsScore / totalPageArea;
        const normalizedLightScore = this.lightElementsScore / totalPageArea;

        return normalizedDarkScore / (normalizedDarkScore + normalizedLightScore);
    }

    async executeActions() {
        const percentDarkElements = Math.round(this.getPercentDarkElements() * 100);

        if(this.hasDarkTheme()) {
            this.debugLogger?.log(`PageAnalyzer - Detected this page as having a dark theme with a score of ${percentDarkElements}%`);

            let url;

            try {
                url = new URL(await getCurrentURL());
            } catch(e) {
                this.debugLogger?.log(e, "error");
                return;
            }

            if(this.currentSettings.autoDisableDarkThemedWebsite == "true") {
                const type = this.currentSettings.autoDisableDarkThemedWebsiteType;
                await disableEnableToggle(type === "webpage" ? "disable-webpage" : "disable-website", true, url);
            }

            const presetToAutoEnable = await getPresetWithAutoEnableForDarkWebsites();

            if(presetToAutoEnable) {
                const presetData = await getPresetData(presetToAutoEnable);

                if(presetData) {
                    const type = await getPresetData(presetToAutoEnable).autoEnablePresetForDarkWebsitesType;
                    await disableEnablePreset(type === "webpage" ? "toggle-webpage" : "toggle-website", presetToAutoEnable, true, url);
                }
            }
        } else {
            this.debugLogger?.log(`PageAnalyzer - This website doesn't have a dark theme (${percentDarkElements}% score)`);
        }
    }

    clear() {
        this.analyzedElements = 0;
        this.darkElementsScore = 0;
        this.lightElementsScore = 0;
    }
}