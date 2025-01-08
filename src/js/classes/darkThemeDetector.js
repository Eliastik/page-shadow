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
import { isElementNotVisible, hasDarkColorScheme, hasLightColorScheme } from "../utils/browserUtils.js";
import { rgbTohsl, cssColorToRgbaValues } from "../utils/colorUtils.js";
import { brightnessReductionElementId, blueLightReductionElementId } from "../constants.js";

/** Class used to analyze and detect website having a dark theme */
export default class DarkThemeDetector {

    analyzedElements = 0;
    darkElementsScore = 0;
    lightElementsScore = 0;

    currentSettings;
    websiteSpecialFiltersConfig;

    debugLogger;

    mapTagNames = new Map();

    constructor(currentSettings, websiteSpecialFiltersConfig, debugLogger) {
        this.currentSettings = currentSettings;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
        this.debugLogger = debugLogger;
    }

    process(element, computedStyles, hasBackgroundImg, hasTransparentColor) {
        if(this.isIgnoredElement(element, computedStyles, hasBackgroundImg, hasTransparentColor)) {
            return;
        }

        const backgroundColor = computedStyles.backgroundColor;

        const rgbValuesList = cssColorToRgbaValues(backgroundColor);
        const hslBackgroundColor = this.getHSLFromColor(rgbValuesList);
        const isBackgroundTransparent = this.isColorTransparent(rgbValuesList);

        if(!hslBackgroundColor || (isBackgroundTransparent && element !== document.body
            && element !== document.documentElement)) {
            return;
        }

        // If the body element is transparent, we analyze the background of the HTML element
        if(this.isBodyTransparent(element, rgbValuesList)) {
            return this.process(document.documentElement, window.getComputedStyle(document.documentElement), false, false);
        }

        if(this.isElementDark(element, computedStyles, rgbValuesList, hslBackgroundColor)) {
            this.darkElementsScore += this.getElementSize(element);
        } else if(this.isElementLight(element, computedStyles, rgbValuesList, hslBackgroundColor)) {
            this.lightElementsScore += this.getElementSize(element);
        }

        this.storeTagName(element);

        this.analyzedElements++;
    }

    storeTagName(element) {
        if(element && element.tagName) {
            const tagName = element.tagName.toLowerCase();

            const currentCount = this.mapTagNames.get(tagName);

            if(currentCount) {
                this.mapTagNames.set(tagName, currentCount + 1);
            } else {
                this.mapTagNames.set(tagName, 1);
            }
        }
    }

    isColorTransparent(rgbValuesList) {
        return (rgbValuesList && rgbValuesList.length === 4 && rgbValuesList[3] == 0);
    }

    getHSLFromColor(rgbValuesList) {
        if(!rgbValuesList) return null;
        return rgbTohsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);
    }

    getElementSize(element) {
        if(element === document.body || element === document.documentElement) {
            return document.documentElement.scrollWidth * document.documentElement.scrollHeight;
        }

        const rect = element.getBoundingClientRect();
        return rect.width * rect.height;
    }

    isIgnoredElement(element, computedStyles, hasBackgroundImg, hasTransparentColor) {
        if(element === document.body || element === document.documentElement) {
            return false;
        }

        if(!element || !computedStyles || hasBackgroundImg
            || hasTransparentColor || isElementNotVisible(element, computedStyles)) {
            return true;
        }

        return [brightnessReductionElementId, blueLightReductionElementId].includes(element.id);
    }

    isBodyTransparent(element, rgbValuesList) {
        return element === document.body && this.isColorTransparent(rgbValuesList);
    }

    isHTMLElementTransparent(element, rgbValuesList) {
        return element === document.documentElement && this.isColorTransparent(rgbValuesList);
    }

    isElementDark(element, computedStyles, rgbValuesList, hslBackgroundColor) {
        const saturationBackgroundColor = hslBackgroundColor[1];
        const lightnessBackgroundColor = hslBackgroundColor[2];

        if(hasDarkColorScheme(computedStyles)) {
            return true;
        }

        // If the HTML element is transparent, we consider that it have a light background
        if(this.isHTMLElementTransparent(element, rgbValuesList)) {
            return false;
        }

        if(lightnessBackgroundColor <= this.websiteSpecialFiltersConfig.darkThemeDetectionMaxLightness
            && saturationBackgroundColor <= this.websiteSpecialFiltersConfig.darkThemeDetectionMaxSaturation) {
            return true;
        }

        return false;
    }

    isElementLight(element, computedStyles, rgbValuesList, hslBackgroundColor) {
        const lightnessBackgroundColor = hslBackgroundColor[2];

        if(hasLightColorScheme(computedStyles)) {
            return true;
        }

        // If the HTML element is transparent, we consider that it have a light background
        if(this.isHTMLElementTransparent(element, rgbValuesList)) {
            return true;
        }

        if(lightnessBackgroundColor >= this.websiteSpecialFiltersConfig.darkThemeDetectionMinLightnessLightElements) {
            return true;
        }

        return false;
    }

    hasDarkTheme() {
        return this.analyzedElements > 0 && this.getPercentDarkElements() >= this.websiteSpecialFiltersConfig.darkThemeDetectionPercentageRatioDarkLightElements && !this.isImageViewerPage();
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

    isImageViewerPage() {
        let hasHtmlOrBody = false;
        let hasOnlyOneImg = false;

        for(const [key, value] of this.mapTagNames) {
            if(key === "html" || key === "body") {
                hasHtmlOrBody = true;
            } else if(key === "img" && value <= 1) {
                hasOnlyOneImg = true;
            } else {
                return false;
            }
        }

        return hasHtmlOrBody && hasOnlyOneImg;
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