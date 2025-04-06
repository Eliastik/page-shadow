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
import { applyContrastPageVariables } from "./cssVariableUtils.js";
import { setSettingItem } from "./storageUtils.js";
import { defaultBGColorCustomTheme, defaultTextsColorCustomTheme, defaultLinksColorCustomTheme, defaultVisitedLinksColorCustomTheme, defaultFontCustomTheme, defaultCustomThemes, defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack } from "../constants.js";
import browser from "webextension-polyfill";

/** Utils function used for the custom theme feature of Page Shadow */

async function getCustomThemesListData(customThemesSettings) {
    if(customThemesSettings) {
        return customThemesSettings;
    }

    const { customThemes } = await browser.storage.local.get("customThemes");

    if(!customThemes) {
        return JSON.parse(JSON.stringify(defaultCustomThemes));
    }

    return customThemes;
}

async function getCustomThemeData(nb, customThemesSettings) {
    const customThemes = await getCustomThemesListData(customThemesSettings);

    let currentCustomTheme = defaultCustomThemes[nb];

    if(customThemes && customThemes[nb]) {
        currentCustomTheme = customThemes[nb];
    }

    return { currentCustomTheme, customThemes };
}

async function getCustomThemeConfig(nb, customThemesSettings) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    let backgroundTheme, textsColorTheme, linksColorTheme, linksVisitedColorTheme, fontTheme, customCSSCode;

    const { currentCustomTheme } = await getCustomThemeData(nb, customThemesSettings);

    if(currentCustomTheme && currentCustomTheme["customThemeBg"] != undefined) {
        backgroundTheme = currentCustomTheme["customThemeBg"];
    } else {
        backgroundTheme = defaultBGColorCustomTheme;
    }

    if(currentCustomTheme && currentCustomTheme["customThemeTexts"] != undefined) {
        textsColorTheme = currentCustomTheme["customThemeTexts"];
    } else {
        textsColorTheme = defaultTextsColorCustomTheme;
    }

    if(currentCustomTheme && currentCustomTheme["customThemeLinks"] != undefined) {
        linksColorTheme = currentCustomTheme["customThemeLinks"];
    } else {
        linksColorTheme = defaultLinksColorCustomTheme;
    }

    if(currentCustomTheme && currentCustomTheme["customThemeLinksVisited"] != undefined) {
        linksVisitedColorTheme = currentCustomTheme["customThemeLinksVisited"];
    } else {
        linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
    }

    if(currentCustomTheme && currentCustomTheme["customThemeFont"] != undefined && currentCustomTheme["customThemeFont"].trim() != "") {
        fontTheme = "\"" + currentCustomTheme["customThemeFont"] + "\"";
    } else {
        fontTheme = defaultFontCustomTheme;
    }

    if(currentCustomTheme && currentCustomTheme["customCSSCode"] != undefined && typeof(currentCustomTheme["customCSSCode"]) == "string" && currentCustomTheme["customCSSCode"].trim() != "") {
        // eslint-disable-next-line prefer-destructuring
        customCSSCode = currentCustomTheme["customCSSCode"];
    } else {
        customCSSCode = "";
    }

    return {
        backgroundColor: "#" + backgroundTheme,
        textColor: "#" + textsColorTheme,
        linkColor: "#" + linksColorTheme,
        visitedLinkColor: "#" + linksVisitedColorTheme,
        selectBackgroundColor: defaultThemesSelectBgColors[0],
        selectTextColor: defaultThemesSelectTextColors[0],
        insBackgroundColor: defaultThemesInsBgColors[0],
        insTextColor: defaultThemesInsTextColors[0],
        delBackgroundColor: defaultThemesDelBgColors[0],
        delTextColor: defaultThemesDelTextColors[0],
        markBackgroundColor: defaultThemesMarkBgColors[0],
        markTxtColor: defaultThemesMarkTextColors[0],
        imageBackgroundColor: defaultThemesImgBgColors[0],
        brightColorTextWhite: defaultThemesBrightColorTextWhite[0],
        brightColorTextBlack: defaultThemesBrightColorTextBlack[0],
        fontFamily: fontTheme,
        customCSSCode
    };
}

/**
 *
 * @param {*} nb theme number
 * @param {*} disableCustomCSS disable applying custom CSS code
 * @param {*} lnkCssElement link element for applying custom CSS code
 * @returns true if applying custom font family, false otherwise
 */
async function customTheme(nb, disableCustomCSS, lnkCssElement, customThemesSettings) {
    const config = await getCustomThemeConfig(nb, customThemesSettings);

    disableCustomCSS = disableCustomCSS == undefined ? false : disableCustomCSS;

    applyContrastPageVariables(config, customThemesSettings);

    // Apply custom CSS
    if(!disableCustomCSS && config.customCSSCode != "") {
        lnkCssElement.setAttribute("rel", "stylesheet");
        lnkCssElement.setAttribute("type", "text/css");
        lnkCssElement.setAttribute("id", "pageShadowCustomCSS");
        lnkCssElement.setAttribute("name", "pageShadowCustomCSS");
        lnkCssElement.setAttribute("href", "data:text/css;charset=UTF-8," + encodeURIComponent(config.customCSSCode));
        document.getElementsByTagName("head")[0].appendChild(lnkCssElement);
    }

    if(config.fontFamily && config.fontFamily.trim() != "") {
        return true;
    }

    return false;
}

async function saveCustomTheme(nb, { backgroundColor, textColor, linkColor, visitedLinkColor, fontFamily, customCSSCode }) {
    nb = nb == undefined || (typeof(nb) == "string" && nb.trim() == "") ? "1" : nb;

    const { currentCustomTheme, customThemes } = await getCustomThemeData(nb);

    currentCustomTheme["customThemeBg"] = backgroundColor;
    currentCustomTheme["customThemeTexts"] = textColor;
    currentCustomTheme["customThemeLinks"] = linkColor;
    currentCustomTheme["customThemeLinksVisited"] = visitedLinkColor;
    currentCustomTheme["customThemeFont"] = fontFamily;
    currentCustomTheme["customCSSCode"] = customCSSCode;

    customThemes[nb] = currentCustomTheme;

    await setSettingItem("customThemes", customThemes);
}

export { customTheme, getCustomThemeConfig, getCustomThemesListData, getCustomThemeData, saveCustomTheme };