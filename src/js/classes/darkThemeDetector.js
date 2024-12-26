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
import { rgb2hsl, getCurrentURL, disableEnableToggle, getPresetWithAutoEnableForDarkWebsites, getPresetData, disableEnablePreset } from "../utils/util.js";

/** Class used to analyze and detect website having a dark theme */
export default class DarkThemeDetector {

    analyzedElements = 0;
    darkElements = 0;
    lightElements = 0;

    currentSettings;
    websiteSpecialFiltersConfig;

    debugLogger;

    constructor(currentSettings, websiteSpecialFiltersConfig, debugLogger) {
        this.currentSettings = currentSettings;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.debugLogger = debugLogger;
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

    async executeActions() {
        const percentDarkElements = Math.round(this.getPercentDarkElements() * 100);

        if(this.hasDarkTheme()) {
            this.debugLogger?.log(`PageAnalyzer - Detected this page as having a dark theme with ${percentDarkElements}% of dark elements`);

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
            this.debugLogger?.log(`PageAnalyzer - This website doesn't have a dark theme (${percentDarkElements}% of dark elements)`);
        }
    }
}