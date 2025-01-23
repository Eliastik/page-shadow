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
import { sendMessageWithPromise } from "./browserUtils.js";
import { defaultThemesSelectBgColors, defaultThemesSelectTextColors, defaultThemesInsBgColors, defaultThemesInsTextColors, defaultThemesDelBgColors, defaultThemesDelTextColors, defaultThemesMarkBgColors, defaultThemesMarkTextColors, defaultThemesImgBgColors, defaultThemesBrightColorTextWhite, defaultThemesBrightColorTextBlack, attenuateDefaultValue } from "../constants.js";

/** Utils related to shadow dom processing */

async function processRules(style, themeConfig, isShadowRoot) {
    if(!style.sheet) {
        return;
    }

    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const response = await sendMessageWithPromise({ "type": "getGlobalPageShadowStyle" }, "getGlobalPageShadowStyleResponse");

    style.textContent = processRulesConfig(response.data, themeConfig);

    if(style.sheet) {
        if(isShadowRoot) {
            style.sheet.insertRule(":host { color: unset !important; background: unset !important; }");
        }
    }
}

function processRulesConfig(style, themeConfig) {
    const colorMap = {
        "--page-shadow-bgcolor": themeConfig.backgroundColor,
        "--page-shadow-txtcolor": themeConfig.textColor,
        "--page-shadow-lnkcolor": themeConfig.linkColor,
        "--page-shadow-visitedlnkcolor": themeConfig.visitedLinkColor,
        "--page-shadow-selectbgcolor": themeConfig.selectBackgroundColor || defaultThemesSelectBgColors[0],
        "--page-shadow-selecttxtcolor": themeConfig.selectTextColor || defaultThemesSelectTextColors[0],
        "--page-shadow-insbgcolor": themeConfig.insBackgroundColor || defaultThemesInsBgColors[0],
        "--page-shadow-instcolor": themeConfig.insTextColor || defaultThemesInsTextColors[0],
        "--page-shadow-delbgcolor": themeConfig.delBackgroundColor || defaultThemesDelBgColors[0],
        "--page-shadow-deltcolor": themeConfig.delTextColor || defaultThemesDelTextColors[0],
        "--page-shadow-markbgcolor": themeConfig.markBackgroundColor || defaultThemesMarkBgColors[0],
        "--page-shadow-marktxtcolor": themeConfig.markTxtColor || defaultThemesMarkTextColors[0],
        "--page-shadow-imgbgcolor": themeConfig.imageBackgroundColor || defaultThemesImgBgColors[0],
        "--page-shadow-customfontfamily": themeConfig.fontFamily || "default",
        "--page-shadow-brightcolorxtwhite": themeConfig.brightColorTextWhite || defaultThemesBrightColorTextWhite[0],
        "--page-shadow-brightcolortxtblack": themeConfig.brightColorTextBlack || defaultThemesBrightColorTextBlack[0]
    };

    return style.replace(/var\((--page-shadow-[a-zA-Z-]+)\)/g, (match, varName) => colorMap[varName] || match);
}

function processShadowRootStyle(style) {
    let newStyle = style.replaceAll(/html\.pageShadowBackgroundContrast\b/g, ":host");
    newStyle = newStyle.replaceAll(/html\.pageShadowContrastBlack\b/g, ":host");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertImageColor\b/g, ":host(.pageShadowInvertImageColor)");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertBgColor\b/g, ":host(.pageShadowInvertBgColor)");
    newStyle = newStyle.replaceAll(/body\.pageShadowInvertVideoColor\b/g, ":host(.pageShadowInvertVideoColor)");
    newStyle = newStyle.replaceAll(/.pageShadowCustomFontFamily\b/g, ":host");
    newStyle = newStyle.replaceAll(/\.pageShadowContrastBlack(?=[\s\S]*\{)/g, ":host");
    newStyle = newStyle.replaceAll(/:root/g, ":host");
    newStyle = newStyle.replaceAll(/:host:host/g, ":host");
    newStyle = newStyle.replaceAll(/:host(?:\s*:\s*not\([^)]+\))+\s/g, ":host ");

    return newStyle;
}

function processRulesInvert(parentElement, style, settings, enablePreserveColorsSelectiveInvert) {
    if(!style.sheet) {
        return;
    }

    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const enabled = settings.colorInvert;

    const { invertEntirePage } = settings;
    let { invertImageColors, invertVideoColors, invertBgColor, selectiveInvert, invertBrightColors } = settings;

    let { percentageAttenuateColors } = settings;

    if(percentageAttenuateColors / 100 > 1 || percentageAttenuateColors / 100 < 0 || typeof percentageAttenuateColors === "undefined" || percentageAttenuateColors == null) {
        percentageAttenuateColors = attenuateDefaultValue;
    }

    const { attenuateColors, attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors } = settings;

    let invertImageFilter = "invert(100%)";
    let invertImageFilterSelective = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
    let invertBgFilter = "invert(100%)";
    let invertBgFilterSelective = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
    let invertVideoFilter = "invert(100%)";
    let invertVideoFilterSelective = enablePreserveColorsSelectiveInvert ? "invert(100%) hue-rotate(180deg)" : "invert(100%)";
    let invertBrightColorsFilter = "invert(100%)";

    if(invertEntirePage === "true") {
        if(selectiveInvert === "true") {
            invertImageFilterSelective = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
            invertBgFilterSelective = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
            invertVideoFilterSelective = enablePreserveColorsSelectiveInvert ? "hue-rotate(180deg)" : "invert(0)";
        } else {
            invertImageFilterSelective = "invert(100%)";
            invertBgFilterSelective = "invert(100%)";
            invertVideoFilterSelective = "invert(100%)";
        }
    }

    if(attenuateColors == "true" && attenuateImgColors == "true") {
        invertImageFilter = invertImageFilter + " grayscale(" + percentageAttenuateColors + "%)";
        invertImageFilterSelective = invertImageFilterSelective + " grayscale(" + percentageAttenuateColors + "%)";
    }

    if(attenuateColors == "true" && attenuateBgColors == "true") {
        invertBgFilter = invertBgFilter + " grayscale(" + percentageAttenuateColors + "%)";
        invertBgFilterSelective = invertBgFilterSelective + " grayscale(" + percentageAttenuateColors + "%)";
    }

    if(attenuateColors == "true" && attenuateVideoColors == "true") {
        invertVideoFilter = invertVideoFilter + " grayscale(" + percentageAttenuateColors + "%)";
        invertVideoFilterSelective = invertVideoFilterSelective + " grayscale(" + percentageAttenuateColors + "%)";
    }

    if(attenuateColors == "true" && attenuateBrightColors == "true") {
        invertBrightColorsFilter = invertBrightColorsFilter + " grayscale(" + percentageAttenuateColors + "%)";
    }

    const closestBrightColorBackground = parentElement && parentElement.closest && parentElement.closest(".pageShadowHasBrightColorBackground");
    const parentHasBrightColorBackground = parentElement && (parentElement.classList.contains("pageShadowHasBrightColorBackground") || (closestBrightColorBackground != null && closestBrightColorBackground != document.body));
    const parentHasBrightColorText = parentElement && parentElement.classList.contains("pageShadowHasBrightColorText");

    // Conditions are inverted if inverting entire page
    if(invertEntirePage == "true") {
        invertImageColors = invertImageColors == "false" ? "true" : "false";
        invertVideoColors = invertVideoColors == "false" ? "true" : "false";
        invertBgColor = invertBgColor == "false" ? "true" : "false";
        invertBrightColors = invertBrightColors == "false" ? "true" : "false";
        selectiveInvert = selectiveInvert == "false" ? "true" : "false";
    }

    const shouldInvertBrightColors = invertBrightColors != "true" || (invertBrightColors == "true" && !parentHasBrightColorText && !parentHasBrightColorBackground);

    if(enabled == "true") {
        if(invertEntirePage == "true") {
            style.sheet.insertRule(":host .pageShadowDisableElementInvert { filter: invert(100%) !important; -moz-filter: invert(100%) !important; -o-filter: invert(100%) !important; -webkit-filter: invert(100%) !important; }");
            style.sheet.insertRule(":host .pageShadowDisableElementInvert > * { filter: invert(0%) !important; -moz-filter: invert(0%) !important; -o-filter: invert(0%) !important; -webkit-filter: invert(0%) !important; }");

            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host iframe, :host frame { filter: invert(0%) !important; -moz-filter: invert(0%) !important; -o-filter: invert(0%) !important; -webkit-filter: invert(0%) !important; }");
            }
        }

        if(invertBrightColors == "true") {
            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg):not(:has(> .pageShadowHasBackgroundImg)) > *:not(.pageShadowHasBrightColorText):not(.pageShadowHasBrightColorBackground):not(.pageShadowSelectiveInvert) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");

                style.sheet.insertRule(":host .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg):has(> .pageShadowHasBackgroundImg) > *:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBackgroundImg):not(.pageShadowSelectiveInvert) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                if(shouldInvertBrightColors) {
                    style.sheet.insertRule(":host > .pageShadowHasBrightColorBackground:not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg), :host > .pageShadowHasBrightColorText { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(!parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) .pageShadowHasBrightColorBackground:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(!parentHasBrightColorText) {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:has(> .pageShadowHasBackgroundImg)) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }
            } else if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host > .pageShadowHasBrightColorBackground:not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg), :host > .pageShadowHasBrightColorText:not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText) .pageShadowHasBrightColorBackground:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText) .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(body.pageShadowInvertBgColor .pageShadowHasBackgroundImg > *):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg):not(:has(> .pageShadowHasBackgroundImg)) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
            }
        }

        if(invertImageColors == "true") {
            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *) use[href^=\"#\"], :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(:host .pageShadowHasBackgroundImg > *) { filter: " + invertImageFilter + " !important; -moz-filter: " + invertImageFilter + " !important; -o-filter: " + invertImageFilter + " !important; -webkit-filter: " + invertImageFilter + " !important; background-color: transparent !important; }");
            }

            if(selectiveInvert == "true" && shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; background-color: transparent !important; }");
            }

            if(invertEntirePage == "true" && shouldInvertBrightColors) {
                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground) > * img { filter: " + invertImageFilter + " !important; -moz-filter: " + invertImageFilter + " !important; -o-filter: " + invertImageFilter + " !important; -webkit-filter: " + invertImageFilter + " !important; background-color: transparent !important; }");
            }
        }

        if(invertBrightColors == "true") {
            if(parentHasBrightColorBackground) {
                if(invertImageColors != "true") {
                    style.sheet.insertRule(":host img:not(.pageShadowHasBrightColorBackground), :host svg:not(.pageShadowHasBrightColorBackground), :host .pageShadowInvertElementAsImage:not(.pageShadowHasBrightColorBackground) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(invertBgColor != "true") {
                    style.sheet.insertRule(":host .pageShadowHasBackgroundImg:not(.pageShadowHasBrightColorBackground), :host .pageShadowInvertElementAsBackground:not(.pageShadowHasBrightColorBackground) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(invertVideoColors != "true") {
                    style.sheet.insertRule(":host video:not(.pageShadowHasBrightColorBackground), :host canvas:not(.pageShadowHasBrightColorBackground), :host .pageShadowInvertElementAsVideo:not(.pageShadowHasBrightColorBackground) { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                if(invertEntirePage != "true") {
                    style.sheet.insertRule(":host iframe, :host frame { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
                }

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) .pageShadowPseudoElementHasBrightColorBackgroundBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBrightColorBackgroundAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):after, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBrightColorTextBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBrightColorTextAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):after { filter: " + invertBrightColorsFilter + " !important; -moz-filter: " + invertBrightColorsFilter + " !important; -o-filter: " + invertBrightColorsFilter + " !important; -webkit-filter: " + invertBrightColorsFilter + " !important; }");
            }
        }

        if((invertEntirePage != "true" && selectiveInvert == "true") || (invertEntirePage == "true" && selectiveInvert != "true" && !parentHasBrightColorBackground)) {
            // Image selective invert
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; }");

            style.sheet.insertRule(":host .pageShadowHasBrightColorText:not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) > img.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host .pageShadowHasBrightColorText:not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) > svg.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host .pageShadowHasBrightColorText:not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) > .pageShadowInvertElementAsImage.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; }");

            // Background images selective invert
            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo) { filter: " + invertBgFilterSelective + " !important; -moz-filter: " + invertBgFilterSelective + " !important; -o-filter: " + invertBgFilterSelective + " !important; -webkit-filter: " + invertBgFilterSelective + " !important; }");
        }

        if(selectiveInvert == "true") {
            // Pseudo-elements selective invert
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert) .pageShadowSelectiveInvertPseudoElementBefore:not(.pageShadowDisableElementInvert):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert) .pageShadowSelectiveInvertPseudoElementAfter:not(.pageShadowDisableElementInvert):after { filter: " + invertImageFilterSelective + " !important; -moz-filter: " + invertImageFilterSelective + " !important; -o-filter: " + invertImageFilterSelective + " !important; -webkit-filter: " + invertImageFilterSelective + " !important; }");

            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(body.pageShadowInvertBrightColors .pageShadowHasBrightColorBackground *):not(.pageShadowDisableBackgroundStyling):not(img):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg), :host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(body.pageShadowInvertBrightColors .pageShadowHasBrightColorBackground *):not(.pageShadowDisableBackgroundStyling):not(img):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo):not(.pageShadowHasBackgroundImg) > *, :host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvertPseudoElementBefore:before, :host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvertPseudoElementAfter:after { color: black; }");

            // Background images selective invert (subelements)
            if(!parentHasBrightColorBackground) {
                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert):not(img):not(svg):not(svg use):not(.pageShadowInvertElementAsImage):not(video):not(canvas):not(.pageShadowInvertElementAsVideo) > * { filter: " + invertBgFilterSelective + " !important; -moz-filter: " + invertBgFilterSelective + " !important; -o-filter: " + invertBgFilterSelective + " !important; -webkit-filter: " + invertBgFilterSelective + " !important; }");
            }
        }

        if(invertBgColor == "true") {
            style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertPseudoElement:not(.pageShadowDisableElementInvert):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertPseudoElement:not(.pageShadowDisableElementInvert):after { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

            style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) > * { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

            if(invertEntirePage != "true") {
                if(parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");
                }
            } else {
                if(!parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowDisableElementInvert) .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");
                }

                if(invertBrightColors == "true" && !parentHasBrightColorBackground) {
                    style.sheet.insertRule(":host .pageShadowHasBrightColorText > *:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(body.pageShadowInvertBrightColors .pageShadowHasBrightColorBackground *):not(.pageShadowDisableBackgroundStyling) { color: black; }");
                }
            }

            if(!parentHasBrightColorBackground) {
                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground):not(select):not(.pageShadowHasBrightColorText):not(.pageShadowDisableBackgroundStyling) { color: white; }");

                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert):not(.pageShadowHasBrightColorBackground) *:not(.pageShadowHasBrightColorBackground):not(.pageShadowHasBrightColorText):not(a):not(.pageShadowDisableBackgroundStyling) { color: black; }");
            }

            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowDisableElementInvert) .pageShadowInvertElementAsBackground:not(.pageShadowDisableElementInvert) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground) > *:not(picture):not(a) { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

                style.sheet.insertRule(":host *:not(.pageShadowDisableElementInvert) > .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground) > picture > img { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");

                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBackgroundImgBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowSelectiveInvertPseudoElementBefore):before, :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowPseudoElementHasBackgroundImgAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):not(.pageShadowSelectiveInvertPseudoElementAfter):after { filter: " + invertBgFilter + " !important; -moz-filter: " + invertBgFilter + " !important; -o-filter: " + invertBgFilter + " !important; -webkit-filter: " + invertBgFilter + " !important; }");
            }
        }

        if(invertVideoColors == "true") {
            if(shouldInvertBrightColors) {
                style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host > video:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host > canvas:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert), :host > .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) { filter: " + invertVideoFilter + " !important; -moz-filter: " + invertVideoFilter + " !important; -o-filter: " + invertVideoFilter + " !important; -webkit-filter: " + invertVideoFilter + " !important; }");

                if(selectiveInvert != "true") {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo:not(.pageShadowDisableElementInvert) { filter: " + invertVideoFilter + " !important; -moz-filter: " + invertVideoFilter + " !important; -o-filter: " + invertVideoFilter + " !important; -webkit-filter: " + invertVideoFilter + " !important; }");
                } else {
                    style.sheet.insertRule(":host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) video.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) canvas.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert), :host :not(.pageShadowHasBackgroundImg):not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvert) .pageShadowInvertElementAsVideo.pageShadowSelectiveInvert:not(.pageShadowDisableElementInvert) { filter: " + invertVideoFilterSelective + " !important; -moz-filter: " + invertVideoFilterSelective + " !important; -o-filter: " + invertVideoFilterSelective + " !important; -webkit-filter: " + invertVideoFilterSelective + " !important; }");
                }
            }
        }
    }
}

function processRulesAttenuate(style, settings) {
    if(!style.sheet) {
        return;
    }

    if(style.cssRules) { // Remove all rules
        for(let i = 0; i < style.cssRules.length; i++) {
            style.sheet.deleteRule(i);
        }
    }

    const enabled = settings.attenuateColors;
    const enabledInvertPage = settings.colorInvert;

    const { attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors} = settings;
    const { invertEntirePage, invertImageColors, invertVideoColors, invertBgColor, invertBrightColors } = settings;

    let { percentageAttenuateColors } = settings;

    if(percentageAttenuateColors / 100 > 1 || percentageAttenuateColors / 100 < 0 || typeof percentageAttenuateColors === "undefined" || percentageAttenuateColors == null) {
        percentageAttenuateColors = attenuateDefaultValue;
    }

    const attenuateFilter = "grayscale(" + percentageAttenuateColors + "%)";

    if(enabled == "true") {
        if(attenuateImgColors == "true") {
            if(enabledInvertPage == "true" && invertImageColors != "true") {
                style.sheet.insertRule(":host img:not(.pageShadowDisableElementInvert), :host svg:not(.pageShadowDisableElementInvert) { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host img.pageShadowDisableElementInvert, :host svg.pageShadowDisableElementInvert { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host img.pageShadowDisableElementInvert, :host svg.pageShadowDisableElementInvert { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }

        if(attenuateBgColors == "true") {
            if(enabledInvertPage == "true" && invertBgColor != "true") {
                style.sheet.insertRule(":host .pageShadowHasBackgroundImg:not(.pageShadowDisableElementInvert), :host .pageShadowPseudoElementHasBackgroundImgBefore:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvertPseudoElementBefore):before, :host .pageShadowPseudoElementHasBackgroundImgAfter:not(.pageShadowDisableElementInvert):not(.pageShadowSelectiveInvertPseudoElementAfter):after { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host .pageShadowHasBackgroundImg.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBackgroundImgBefore.pageShadowDisableElementInvert:before, :host .pageShadowPseudoElementHasBackgroundImgAfter.pageShadowDisableElementInvert:after { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host .pageShadowHasBackgroundImg.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBackgroundImgBefore.pageShadowDisableElementInvert:before, :host .pageShadowPseudoElementHasBackgroundImgAfter.pageShadowDisableElementInvert:after { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }

        if(attenuateVideoColors == "true") {
            if(enabledInvertPage == "true" && invertVideoColors != "true") {
                style.sheet.insertRule(":host video:not(.pageShadowDisableElementInvert), :host canvas:not(.pageShadowDisableElementInvert) { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host video.pageShadowDisableElementInvert, :host canvas.pageShadowDisableElementInvert { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host video.pageShadowDisableElementInvert, :host canvas.pageShadowDisableElementInvert { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }

        if(attenuateBrightColors == "true") {
            if(enabledInvertPage == "true" && invertBrightColors != "true") {
                style.sheet.insertRule(":host .pageShadowHasBrightColorBackground:not(.pageShadowDisableElementInvert), :host .pageShadowHasBrightColorText:not(.pageShadowDisableElementInvert), :host .pageShadowPseudoElementHasBrightColorBackgroundAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorTextAfter:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorBackgroundBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):before, :host .pageShadowPseudoElementHasBrightColorTextBefore:not(.pageShadowDisableElementInvert):not(.pageShadowHasBrightColorBackground):before { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            }

            if(invertEntirePage != "true") {
                style.sheet.insertRule(":host .pageShadowHasBrightColorBackground.pageShadowDisableElementInvert, :host .pageShadowHasBrightColorText.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBrightColorBackground.pageShadowDisableElementInvertAfter:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorText.pageShadowDisableElementInvertAfter:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorBackgroundBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before, :host .pageShadowPseudoElementHasBrightColorTextBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before { filter: " + attenuateFilter + " !important; -moz-filter: " + attenuateFilter + " !important; -o-filter: " + attenuateFilter + " !important; -webkit-filter: " + attenuateFilter + " !important; }");
            } else {
                style.sheet.insertRule(":host .pageShadowHasBrightColorBackground.pageShadowDisableElementInvert, :host .pageShadowHasBrightColorText.pageShadowDisableElementInvert, :host .pageShadowPseudoElementHasBrightColorBackgroundAfter.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorTextAfter.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):after, :host .pageShadowPseudoElementHasBrightColorBackgroundBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before, :host .pageShadowPseudoElementHasBrightColorTextBefore.pageShadowDisableElementInvert:not(.pageShadowHasBrightColorBackground):before { filter: invert(100%) " + attenuateFilter + " !important; -moz-filter: invert(100%) " + attenuateFilter + " !important; -o-filter: invert(100%) " + attenuateFilter + " !important; -webkit-filter: invert(100%) " + attenuateFilter + " !important; }");
            }
        }
    }
}

export { processRules, processRulesConfig, processShadowRootStyle, processRulesInvert, processRulesAttenuate };