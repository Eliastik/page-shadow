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
import { applyContrastPageVariablesWithTheme } from "../../utils/cssVariableUtils.js";
import { customTheme } from "../../utils/customThemeUtils.js";
import ElementClassBatcher from "../elementClassBatcher.js";

export default class IncreasePageContrast {

    bodyClassBatcher;
    htmlClassBatcher;
    bodyClassBatcherRemover;

    debugLogger;

    currentSettings;

    constructor(debugLogger) {
        this.debugLogger = debugLogger;
    }

    setSettings(settings, bodyClassBatcher, htmlClassBatcher, bodyClassBatcherRemover) {
        this.currentSettings = settings;
        this.bodyClassBatcher = bodyClassBatcher;
        this.htmlClassBatcher = htmlClassBatcher;
        this.bodyClassBatcherRemover = bodyClassBatcherRemover;
    }

    async apply(init, customThemesSettings) {
        if(this.currentSettings.pageShadowEnabled == "true") {
            const theme = this.currentSettings.theme;
            const disableImgBgColor = this.currentSettings.disableImgBgColor;
            const brightColorPreservation = this.currentSettings.brightColorPreservation;

            this.debugLogger?.log(`Applying contrast page with settings : theme = ${theme} / disableImgBgColor = ${disableImgBgColor} / brightColorPreservation = ${brightColorPreservation}`);

            if(theme) {
                if(!init) {
                    this.resetContrastPage(theme, disableImgBgColor, brightColorPreservation);
                }

                if (theme.startsWith("custom")) {
                    await this.customThemeApply(theme, customThemesSettings);
                    this.htmlClassBatcher.add("pageShadowBackgroundCustom");
                } else {
                    applyContrastPageVariablesWithTheme(theme);
                }

                this.bodyClassBatcher.add("pageShadowContrastBlack");
                this.htmlClassBatcher.add("pageShadowBackgroundContrast");
            } else {
                this.bodyClassBatcher.add("pageShadowContrastBlack");
                this.htmlClassBatcher.add("pageShadowBackgroundContrast");
                this.resetContrastPage(1, disableImgBgColor, brightColorPreservation);
            }

            if (disableImgBgColor == "true") {
                this.bodyClassBatcher.add("pageShadowDisableImgBgColor");
            }

            if (brightColorPreservation == "true") {
                this.bodyClassBatcher.add("pageShadowPreserveBrightColor");
            }

            this.debugLogger?.log("Applied contrast page");
        } else if(!init) {
            this.resetContrastPage();
        }

        if(init) {
            this.bodyClassBatcher.apply();
            this.htmlClassBatcher.apply();
        }
    }

    resetContrastPage(themeException, disableImgBgColor, brightColorPreservation) {
        this.debugLogger?.log("Resetting contrast page");

        const removeBatcherHTML = new ElementClassBatcher("remove", "html");

        if(!themeException || !themeException.startsWith("custom")) {
            if(typeof this.lnkCustomTheme !== "undefined") this.lnkCustomTheme.setAttribute("href", "");
            removeBatcherHTML.add("pageShadowBackgroundCustom");
            this.bodyClassBatcherRemover.add("pageShadowCustomFontFamily");
        }

        if(!themeException) {
            removeBatcherHTML.add("pageShadowBackgroundContrast");
            this.bodyClassBatcherRemover.add("pageShadowContrastBlack");
        }

        if(disableImgBgColor != "true") {
            this.bodyClassBatcherRemover.add("pageShadowDisableImgBgColor");
        }

        if(brightColorPreservation != "true") {
            this.bodyClassBatcherRemover.add("pageShadowPreserveBrightColor");
        }

        removeBatcherHTML.apply();

        this.debugLogger?.log("Contrast page reseted");
    }

    async customThemeApply(theme, customThemesSettings) {
        if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
            const applyCustomFontFamily = await customTheme(theme.replace("custom", ""), false, this.lnkCustomTheme, customThemesSettings);

            if(applyCustomFontFamily) {
                this.bodyClassBatcher.add("pageShadowCustomFontFamily");
            } else {
                this.bodyClassBatcherRemover.add("pageShadowCustomFontFamily");
            }
        }
    }
}