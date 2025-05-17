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
import { pageAnalyzerCSSClasses, colorTemperaturesAvailable } from "../constants.js";
import { getCustomThemeConfig } from "./customThemeUtils.js";
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used to process CSS classes */

const debugLogger = new DebugLogger();

function removeClass(element, ...classes) {
    if(!element) {
        return;
    }

    classes.forEach(c => {
        if(c && element.classList.contains(c)) {
            element.classList.remove(c);
        }
    });
}

function addClass(element, ...classes) {
    if(!element) {
        return;
    }

    const classToAdd = [];

    classes.forEach(c => {
        if(c && !element.classList.contains(c)) {
            classToAdd.push(c);
        }
    });

    element.classList.add(...classToAdd);
}

function areAllClassesDefinedForHTMLElement(settings) {
    const { pageShadowEnabled, colorInvert, invertEntirePage, theme } = settings;
    const element = document.documentElement;

    if(element) {
        const classAttribute = element.getAttribute("class") || "";

        if(colorInvert == "true" && invertEntirePage == "true" &&
            (!classAttribute.includes("pageShadowInvertEntirePage") ||
            !classAttribute.includes("pageShadowBackground"))) {
            return false;
        }

        if(pageShadowEnabled == "true" && !classAttribute.includes("pageShadowBackgroundContrast")) {
            return false;
        }

        if(pageShadowEnabled == "true" && theme.startsWith("custom")
            && !classAttribute.includes("pageShadowBackgroundCustom")) {
            return false;
        }

        return true;
    }
}

function areAllClassesDefinedForBodyElement(settings) {
    const { pageShadowEnabled, colorInvert, disableImgBgColor, brightColorPreservation, attenuateColors, theme } = settings;
    const element = document.body;

    if(element) {
        const classAttribute = element.getAttribute("class") || "";

        if(pageShadowEnabled == "true") {
            if(!classAttribute.includes("pageShadowContrastBlack")) {
                return false;
            }

            if(disableImgBgColor == "true" && !classAttribute.includes("pageShadowDisableImgBgColor")) {
                return false;
            }

            if(brightColorPreservation == "true" && !classAttribute.includes("pageShadowPreserveBrightColor")) {
                return false;
            }

            if(theme != undefined && typeof(theme) == "string" && theme.startsWith("custom")) {
                const customThemeNb = theme.replace("custom", "");
                const { fontFamily } = getCustomThemeConfig(customThemeNb, null);

                if(fontFamily && fontFamily.trim() !== "" && !classAttribute.includes("pageShadowCustomFontFamily")) {
                    return false;
                }
            }
        }

        if(colorInvert == "true") {
            const invertBodyClasses = getInvertPageBodyClasses(settings);

            for(const expectedClass of invertBodyClasses.classesToAdd) {
                if(!classAttribute.includes(expectedClass)) {
                    return false;
                }
            }
        }

        if(attenuateColors == "true") {
            const attenuateBodyClasses = getAttenuatePageBodyClasses(settings);

            for(const expectedClass of attenuateBodyClasses.classesToAdd) {
                if(!classAttribute.includes(expectedClass)) {
                    return false;
                }
            }
        }

        return true;
    }
}

function getPageAnalyzerCSSClass(cssClass, pseudoElt) {
    const type = pseudoElt ? "pseudoElt" : "normal";
    const cssClassData = pageAnalyzerCSSClasses[cssClass];

    if(!cssClassData) {
        debugLogger.log(`getPageAnalyzerCSSClass - Unknown class ${cssClass} - type: ${type}`, "warn");
        return cssClass;
    }

    let finalClass = cssClassData[type];

    if(pseudoElt) {
        finalClass += (pseudoElt === ":after" ? "After" : "Before");
    }

    if(!finalClass) {
        debugLogger.log(`getPageAnalyzerCSSClass - Unknown class ${cssClass} for type: ${type}`, "warn");
    }

    return finalClass;
}

function getBlueLightReductionFilterCSSClass(colorTemp) {
    const tempIndex = parseInt(colorTemp || "2000", 10);
    return "k" + colorTemperaturesAvailable[tempIndex - 1];
}

function getInvertPageBodyClasses(settings) {
    const { invertEntirePage, invertImageColors, invertBgColor, invertVideoColors, selectiveInvert, invertBrightColors } = settings;

    const classesToAdd = [];
    const classesToRemove = [];

    if (invertEntirePage === "true") {
        if(invertImageColors === "true") {
            classesToRemove.push("pageShadowInvertImageColor");
        } else {
            classesToAdd.push("pageShadowInvertImageColor");
        }

        if(invertBgColor === "true") {
            classesToRemove.push("pageShadowInvertBgColor");
        } else {
            classesToAdd.push("pageShadowInvertBgColor");
        }

        if(invertVideoColors === "true") {
            classesToRemove.push("pageShadowInvertVideoColor");
        } else {
            classesToAdd.push("pageShadowInvertVideoColor");
        }

        if(selectiveInvert === "true") {
            classesToRemove.push("pageShadowEnableSelectiveInvert");
        } else {
            classesToAdd.push("pageShadowEnableSelectiveInvert");
        }

        if(invertBrightColors === "true") {
            classesToRemove.push("pageShadowInvertBrightColors");
        } else {
            classesToAdd.push("pageShadowInvertBrightColors");
        }

    } else {
        if(invertImageColors === "true") {
            classesToAdd.push("pageShadowInvertImageColor");
        } else {
            classesToRemove.push("pageShadowInvertImageColor");
        }

        if(invertBgColor !== "false") {
            classesToAdd.push("pageShadowInvertBgColor");
        } else {
            classesToRemove.push("pageShadowInvertBgColor");
        }

        if(invertVideoColors === "true") {
            classesToAdd.push("pageShadowInvertVideoColor");
        } else {
            classesToRemove.push("pageShadowInvertVideoColor");
        }

        if(selectiveInvert === "true") {
            classesToAdd.push("pageShadowEnableSelectiveInvert");
        } else {
            classesToRemove.push("pageShadowEnableSelectiveInvert");
        }

        if(invertBrightColors === "true") {
            classesToAdd.push("pageShadowInvertBrightColors");
        } else {
            classesToRemove.push("pageShadowInvertBrightColors");
        }
    }

    return {
        classesToAdd,
        classesToRemove
    };
}

function getAttenuatePageBodyClasses(settings) {
    const { attenuateImgColors, attenuateBgColors, attenuateVideoColors, attenuateBrightColors } = settings;

    const classesToAdd = [];
    const classesToRemove = [];

    if(attenuateImgColors === "true") {
        classesToAdd.push("pageShadowAttenuateImageColor");
    } else {
        classesToRemove.push("pageShadowAttenuateImageColor");
    }

    if(attenuateBgColors === "true") {
        classesToAdd.push("pageShadowAttenuateBgColor");
    } else {
        classesToRemove.push("pageShadowAttenuateBgColor");
    }

    if(attenuateVideoColors === "true") {
        classesToAdd.push("pageShadowAttenuateVideoColor");
    } else {
        classesToRemove.push("pageShadowAttenuateVideoColor");
    }

    if(attenuateBrightColors === "true") {
        classesToAdd.push("pageShadowAttenuateBrightColor");
    } else {
        classesToRemove.push("pageShadowAttenuateBrightColor");
    }

    return {
        classesToAdd,
        classesToRemove
    };
}

export { removeClass, addClass, areAllClassesDefinedForHTMLElement, getPageAnalyzerCSSClass, getBlueLightReductionFilterCSSClass, areAllClassesDefinedForBodyElement, getInvertPageBodyClasses, getAttenuatePageBodyClasses };