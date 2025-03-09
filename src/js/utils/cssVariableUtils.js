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
import { defaultThemesBackgrounds, defaultThemesTextColors, defaultThemesLinkColors, defaultThemesVisitedLinkColors, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack } from "../constants.js";

/** Utils function used to process CSS variables used by Page Shadow */

function applyContrastPageVariablesWithTheme(theme) {
    const themeNumber = parseInt(theme, 10) - 1;

    applyContrastPageVariables({
        backgroundColor: defaultThemesBackgrounds[themeNumber],
        textColor: defaultThemesTextColors[themeNumber],
        linkColor: defaultThemesLinkColors[themeNumber],
        visitedLinkColor: defaultThemesVisitedLinkColors[themeNumber],
        selectBackgroundColor: defaultThemesSelectBgColors[themeNumber],
        selectTextColor: defaultThemesSelectTextColors[themeNumber],
        insBackgroundColor: defaultThemesInsBgColors[themeNumber],
        insTextColor: defaultThemesInsTextColors[themeNumber],
        delBackgroundColor: defaultThemesDelBgColors[themeNumber],
        delTextColor: defaultThemesDelTextColors[themeNumber],
        markBackgroundColor: defaultThemesMarkBgColors[themeNumber],
        markTxtColor: defaultThemesMarkTextColors[themeNumber],
        imageBackgroundColor: defaultThemesImgBgColors[themeNumber],
        brightColorTextWhite: defaultThemesBrightColorTextWhite[themeNumber],
        brightColorTextBlack: defaultThemesBrightColorTextBlack[themeNumber]
    });
}

function applyContrastPageVariables(config) {
    document.documentElement.style.setProperty("--page-shadow-bgcolor", config.backgroundColor);
    document.documentElement.style.setProperty("--page-shadow-txtcolor", config.textColor);
    document.documentElement.style.setProperty("--page-shadow-lnkcolor", config.linkColor);
    document.documentElement.style.setProperty("--page-shadow-visitedlnkcolor", config.visitedLinkColor);
    document.documentElement.style.setProperty("--page-shadow-selectbgcolor", config.selectBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-selectxtcolor", config.selectTextColor);
    document.documentElement.style.setProperty("--page-shadow-insbgcolor", config.insBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-instxtcolor", config.insTextColor);
    document.documentElement.style.setProperty("--page-shadow-delbgcolor", config.delBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-deltxtcolor", config.delTextColor);
    document.documentElement.style.setProperty("--page-shadow-markbgcolor", config.markBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-marktxtcolor", config.markTxtColor);
    document.documentElement.style.setProperty("--page-shadow-imgbgcolor", config.imageBackgroundColor);
    document.documentElement.style.setProperty("--page-shadow-brightcolortxtwhite", config.brightColorTextWhite);
    document.documentElement.style.setProperty("--page-shadow-brightcolortxtblack", config.brightColorTextBlack);

    if(config && config.fontFamily && config.fontFamily.trim() != "") {
        document.documentElement.style.setProperty("--page-shadow-customfontfamily", config.fontFamily);
    } else {
        document.documentElement.style.removeProperty("--page-shadow-customfontfamily");
    }
}

function getInvertPageVariablesKeyValues(invertEntirePage, selectiveInvert, enablePreserveColorsSelectiveInvert) {
    const invertPageVariables = new Map();

    invertPageVariables.set("--page-shadow-invert-filter", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-image-backgrounds", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-bg-backgrounds", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-video-backgrounds", "invert(100%)");
    invertPageVariables.set("--page-shadow-invert-filter-bright-color-backgrounds", "invert(100%)");

    if(invertEntirePage === "true") {
        if(selectiveInvert === "true") {
            const filter = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
            invertPageVariables.set("--page-shadow-invert-filter-selective-image", filter);
            invertPageVariables.set("--page-shadow-invert-filter-selective-bg", filter);
            invertPageVariables.set("--page-shadow-invert-filter-selective-video", filter);
        } else {
            invertPageVariables.set("--page-shadow-invert-filter-selective-image", "invert(100%)");
            invertPageVariables.set("--page-shadow-invert-filter-selective-bg", "invert(100%)");
            invertPageVariables.set("--page-shadow-invert-filter-selective-video", "invert(100%)");
        }

        const filterParentBright = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
        invertPageVariables.set("--page-shadow-invert-filter-selective-image-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-bg-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-video-parent-bright", filterParentBright);
    } else {
        const filter = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
        invertPageVariables.set("--page-shadow-invert-filter-selective-image", filter);
        invertPageVariables.set("--page-shadow-invert-filter-selective-bg", filter);
        invertPageVariables.set("--page-shadow-invert-filter-selective-video", filter);

        const filterParentBright = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
        invertPageVariables.set("--page-shadow-invert-filter-selective-image-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-bg-parent-bright", filterParentBright);
        invertPageVariables.set("--page-shadow-invert-filter-selective-video-parent-bright", filterParentBright);

    }

    return invertPageVariables;
}

function getPageVariablesToApply(contrastEnabled, invertEnabled, attenuateColors) {
    const pageVariablesToApply = [];

    if (contrastEnabled == "true") {
        pageVariablesToApply.push(
            "--page-shadow-bgcolor",
            "--page-shadow-txtcolor",
            "--page-shadow-lnkcolor",
            "--page-shadow-visitedlnkcolor",
            "--page-shadow-selectbgcolor",
            "--page-shadow-selectxtcolor",
            "--page-shadow-insbgcolor",
            "--page-shadow-instxtcolor",
            "--page-shadow-delbgcolor",
            "--page-shadow-deltxtcolor",
            "--page-shadow-markbgcolor",
            "--page-shadow-marktxtcolor",
            "--page-shadow-imgbgcolor",
            "--page-shadow-brightcolortxtwhite",
            "--page-shadow-brightcolortxtblack"
        );
    }

    if(invertEnabled == "true") {
        pageVariablesToApply.push(
            "--page-shadow-invert-filter",
            "--page-shadow-invert-filter-image-backgrounds",
            "--page-shadow-invert-filter-bg-backgrounds",
            "--page-shadow-invert-filter-video-backgrounds",
            "--page-shadow-invert-filter-bright-color-backgrounds",
            "--page-shadow-invert-filter-selective-image",
            "--page-shadow-invert-filter-selective-bg",
            "--page-shadow-invert-filter-selective-video",
            "--page-shadow-invert-filter-selective-image-parent-bright",
            "--page-shadow-invert-filter-selective-bg-parent-bright",
            "--page-shadow-invert-filter-selective-video-parent-bright"
        );
    }

    if(attenuateColors == "true") {
        pageVariablesToApply.push(
            "--page-shadow-attenuate-filter"
        );
    }

    return pageVariablesToApply;
}

function areAllCSSVariablesDefinedForHTMLElement(contrastEnabled, invertEnabled, attenuateColors) {
    const element = document.documentElement;

    if (element && element.style) {
        return getPageVariablesToApply(contrastEnabled, invertEnabled, attenuateColors).every(variable => element.style.getPropertyValue(variable) !== "");
    }
}

export { areAllCSSVariablesDefinedForHTMLElement, applyContrastPageVariablesWithTheme, applyContrastPageVariables, getInvertPageVariablesKeyValues, getPageVariablesToApply };