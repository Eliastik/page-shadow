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
import { isElementNotVisible, hasDarkColorScheme, hasLightColorScheme, getElementSize } from "../utils/browserUtils.js";
import { cssColorToRgbaValues, getHSLFromColor, isColorTransparent } from "../utils/colorUtils.js";
import { getGlobalSettings } from "../utils/settingsUtils.js";
import { brightnessReductionElementId, blueLightReductionElementId } from "../constants.js";

/** Class used to analyze and detect websites having a dark theme */
export default class DarkThemeDetector {

    analyzedElements = 0;
    darkElementsScore = 0;
    lightElementsScore = 0;

    websiteSpecialFiltersConfig;

    debugLogger;

    mapTagNames = new Map();

    constructor(websiteSpecialFiltersConfig, debugLogger) {
        this.debugLogger = debugLogger;
        this.setSettings(null, websiteSpecialFiltersConfig);
    }

    setSettings(currentSettings, websiteSpecialFiltersConfig) {
        this.currentSettings = currentSettings;
        this.websiteSpecialFiltersConfig = websiteSpecialFiltersConfig;
    }

    process(element, computedStyles, hasBackgroundImg, hasTransparentColor) {
        if(this.isIgnoredElement(element, computedStyles, hasBackgroundImg, hasTransparentColor)) {
            return;
        }

        const { backgroundColor } = computedStyles;

        const rgbValuesList = cssColorToRgbaValues(backgroundColor);
        const hslBackgroundColor = getHSLFromColor(rgbValuesList);
        const isBackgroundTransparent = isColorTransparent(rgbValuesList);

        if(!hslBackgroundColor || (isBackgroundTransparent && element !== document.body
            && element !== document.documentElement)) {
            return;
        }

        // If the body element is transparent, we analyze the background of the HTML element
        if(this.isBodyTransparent(element, rgbValuesList)) {
            return this.process(document.documentElement, window.getComputedStyle(document.documentElement), false, false);
        }

        if(this.isElementDark(element, computedStyles, rgbValuesList, hslBackgroundColor)) {
            this.darkElementsScore += getElementSize(element);
        } else if(this.isElementLight(element, computedStyles, rgbValuesList, hslBackgroundColor)) {
            this.lightElementsScore += getElementSize(element);
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
        return element === document.body && isColorTransparent(rgbValuesList);
    }

    isHTMLElementTransparent(element, rgbValuesList) {
        return element === document.documentElement && isColorTransparent(rgbValuesList);
    }

    isElementDark(element, computedStyles, rgbValuesList, hslBackgroundColor) {
        const saturationBackgroundColor = hslBackgroundColor[1];
        const lightnessBackgroundColor = hslBackgroundColor[2];

        if(hasDarkColorScheme(computedStyles) && isColorTransparent(rgbValuesList)) {
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

        if(hasLightColorScheme(computedStyles) && isColorTransparent(rgbValuesList)) {
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
        return this.analyzedElements > 0 && this.getPercentDarkElements() >= this.websiteSpecialFiltersConfig.darkThemeDetectionPercentageRatioDarkLightElements && this.isAllowedPageType();
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

    isAllowedPageType() {
        return document.contentType === "text/html" && !this.isImageViewerPage();
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
                url = new URL(getCurrentURL());
            } catch(e) {
                this.debugLogger?.log(e, "error");
                return;
            }

            const settings = await getGlobalSettings();

            if(settings.autoDisableDarkThemedWebsite == "true" && settings.whiteList != "true") {
                const type = settings.autoDisableDarkThemedWebsiteType;
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