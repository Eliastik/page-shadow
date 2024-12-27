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
import DebugLogger from "./../classes/debugLogger.js";

/** Utils function used to process CSS classes */

const debugLogger = new DebugLogger();

function removeClass(element, ...classes) {
    if(!element) return;

    classes.forEach(c => {
        if(c && element.classList.contains(c)) {
            element.classList.remove(c);
        }
    });
}

function addClass(element, ...classes) {
    if(!element) return;
    const classToAdd = [];

    classes.forEach(c => {
        if(c && !element.classList.contains(c)) {
            classToAdd.push(c);
        }
    });

    element.classList.add(...classToAdd);
}

function areAllClassesDefinedForHTMLElement(contrastEnabled, invertEnabled, invertEntirePage, contrastTheme) {
    const element = document.documentElement;

    if (element) {
        const classAttribute = element.getAttribute("class") || "";

        if(invertEnabled == "true" && invertEntirePage == "true" &&
            (!classAttribute.includes("pageShadowInvertEntirePage") ||
            !classAttribute.includes("pageShadowBackground"))) {
            return false;
        }

        if(contrastEnabled == "true" && !classAttribute.includes("pageShadowBackgroundContrast")) {
            return false;
        }

        if(contrastEnabled == "true" && contrastTheme.startsWith("custom")
            && !classAttribute.includes("pageShadowBackgroundCustom")) {
            return false;
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
    const tempIndex = parseInt(colorTemp || "2000");
    return "k" + colorTemperaturesAvailable[tempIndex - 1];
}

export { removeClass, addClass, areAllClassesDefinedForHTMLElement, getPageAnalyzerCSSClass, getBlueLightReductionFilterCSSClass };