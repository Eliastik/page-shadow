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
import DebugLogger from "./../classes/debugLogger.js";

/** Utils related to color management */

const debugLogger = new DebugLogger();

function rgbTohsl(r, g, b) {
    const v = Math.max(r, g, b), c = v - Math.min(r, g, b), f = (1 - Math.abs(v + v - c - 1));
    const h = c && ((v == r) ? (g - b) / c : ((v == g) ? 2 + (b - r) / c : 4 + (r - g) / c));

    return [60 * (h < 0 ? h + 6 : h), f ? c / f : 0, (v + v - c) / 2];
}

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

    const regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    const result = regex.exec(hex);

    if(!result) {
        return "";
    }

    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
}

function oklabToRgba(oklab) {
    const [L, a, b, alpha = 1] = oklab;

    // OKLab to XYZ (D65)
    const L_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const M_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const S_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

    const X = +1.2270138511 * L_ - 0.5577999807 * M_ + 0.2812561489 * S_;
    const Y = -0.0405801784 * L_ + 1.1122568696 * M_ - 0.0716766787 * S_;
    const Z = -0.0763812845 * L_ - 0.4214819784 * M_ + 1.5861632204 * S_;

    // XYZ to Linear RGB
    const rgbFromXyz = xyzD65ToRgba([X, Y, Z, alpha]);

    const R = rgbFromXyz[0] / 255;
    const G = rgbFromXyz[1] / 255;
    const B = rgbFromXyz[2] / 255;

    // Linear RGB to sRGB
    const toSrgb = (c) =>
        c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

    const r = Math.min(1, Math.max(0, toSrgb(R))) * 255;
    const g = Math.min(1, Math.max(0, toSrgb(G))) * 255;
    const bValue = Math.min(1, Math.max(0, toSrgb(B))) * 255;

    return [Math.round(r), Math.round(g), Math.round(bValue), alpha];
}

function oklchToRgba(oklch) {
    const [L, C, h, alpha = 1] = oklch;

    // OKLCH to OKLab
    const a = C * Math.cos((h * Math.PI) / 180);
    const b = C * Math.sin((h * Math.PI) / 180);

    return oklabToRgba([L, a, b, alpha]);
}

function labToRgba(lab) {
    const [L, a, b, alpha = 1] = lab;

    const refX =  0.95047;
    const refY =  1.00000;
    const refZ =  1.08883;

    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;

    const xyzX = refX * (fx > 0.206893034 ? Math.pow(fx, 3) : (fx - 16 / 116) / 7.787);
    const xyzY = refY * (fy > 0.206893034 ? Math.pow(fy, 3) : (fy - 16 / 116) / 7.787);
    const xyzZ = refZ * (fz > 0.206893034 ? Math.pow(fz, 3) : (fz - 16 / 116) / 7.787);

    // XYZ to RGB
    const rgbFromXyz = xyzD65ToRgba([xyzX, xyzY, xyzZ, alpha]);

    const R = rgbFromXyz[0] / 255;
    const G = rgbFromXyz[1] / 255;
    const B = rgbFromXyz[2] / 255;

    // Gamma correction
    const gamma = (value) => {
        return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
    };

    const rGamma = gamma(R);
    const gGamma = gamma(G);
    const bGamma = gamma(B);

    const r = Math.round(Math.max(0, Math.min(255, rGamma * 255)));
    const g = Math.round(Math.max(0, Math.min(255, gGamma * 255)));
    const bValue = Math.round(Math.max(0, Math.min(255, bGamma * 255)));

    return [Math.round(r), Math.round(g), Math.round(bValue), alpha];
}

function lchToRgba(lch) {
    const [L, C, h, alpha = 1] = lch;

    // LCH to Lab
    const a = C * Math.cos((h * Math.PI) / 180);
    const b = C * Math.sin((h * Math.PI) / 180);

    return labToRgba([L, a, b, alpha]);
}

function parseOklchColor(oklchColor) {
    const oklchRegex = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/?\s*([\d.]+)?\s*\)/i;
    const match = oklchColor.match(oklchRegex);

    if(!match) {
        return null;
    }

    const L = parseFloat(match[1]);
    const C = parseFloat(match[2]);
    const h = parseFloat(match[3]);
    const alpha = match[4] ? parseFloat(match[4]) : 1;

    return { L, C, h, alpha };
}

function parseOklabColor(oklabColor) {
    const oklabRegex = /oklab\(\s*([\d.\-e]+)\s+([\d.\-e]+)\s+([\d.\-e]+)\s*(?:\/\s*([\d.]+))?\s*\)/i;
    const match = oklabColor.match(oklabRegex);

    if(!match) {
        return null;
    }

    const L = parseFloat(match[1]);
    const a = parseFloat(match[2]);
    const b = parseFloat(match[3]);
    const alpha = match[4] ? parseFloat(match[4]) : 1;

    return { L, a, b, alpha };
}

function parseLchColor(lchColor) {
    const lchRegex = /lch\(\s*([\d.\-e]+)\s+([\d.\-e]+)\s+([\d.\-e]+)\s*\/?\s*([\d.\-e]+)?\s*\)/i;
    const match = lchColor.match(lchRegex);

    if(!match) {
        return null;
    }

    const L = parseFloat(match[1]);
    const C = parseFloat(match[2]);
    const h = parseFloat(match[3]);
    const alpha = match[4] ? parseFloat(match[4]) : 1;

    return { L, C, h, alpha };
}

function parseLabColor(labColor) {
    const labRegex = /lab\(\s*([\d.\-e]+)\s+([\d.\-e]+)\s+([\d.\-e]+)\s*\/?\s*([\d.\-e]+)?\s*\)/i;
    const match = labColor.match(labRegex);

    if (!match) {
        return null;
    }

    const L = parseFloat(match[1]);
    const a = parseFloat(match[2]);
    const b = parseFloat(match[3]);
    const alpha = match[4] ? parseFloat(match[4]) : 1;

    return { L, a, b, alpha };
}

function srgbToRgba([r, g, b, alpha = 1]) {
    return [
        Math.min(Math.max(r * 255, 0), 255),
        Math.min(Math.max(g * 255, 0), 255),
        Math.min(Math.max(b * 255, 0), 255),
        alpha
    ];
}

function xyzD50ToRgba([x, y, z, alpha = 1]) {
    const r = x * 3.1331 + y * -1.6170 + z * -0.4906;
    const g = x * -0.6461 + y * 1.6153 + z * 0.0312;
    const b = x * 0.0217 + y * -0.2362 + z * 1.0050;

    return [
        Math.min(Math.max(r * 255, 0), 255),
        Math.min(Math.max(g * 255, 0), 255),
        Math.min(Math.max(b * 255, 0), 255),
        alpha
    ];
}

function xyzD65ToRgba([x, y, z, alpha = 1]) {
    const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const b = x * 0.0556 + y * -0.204 + z * 1.0572;

    return [
        Math.min(Math.max(r * 255, 0), 255),
        Math.min(Math.max(g * 255, 0), 255),
        Math.min(Math.max(b * 255, 0), 255),
        alpha
    ];
}

function parseAndConvertColorFunction(cssColor) {
    const colorRegex = /color\(([\w-]+)\s+([\d.\-e%]+)\s*([\d.\-e%]+)?\s*([\d.\-e%]+)?\s*\/?\s*([\d.]+)?\s*\)/i;
    const match = cssColor.match(colorRegex);

    if(!match) {
        debugLogger.log(`parseAndConvertColorFunction - Failed to parse color() function: ${cssColor}`, "error");
        return null;
    }

    const colorSpace = match[1];
    const component1 = parseFloat(match[2]);
    const component2 = match[3] ? parseFloat(match[3]) : 0;
    const component3 = match[4] ? parseFloat(match[4]) : 0;
    const alpha = match[5] ? parseFloat(match[5]) : 1;

    switch (colorSpace.toLowerCase()) {
    case "srgb":
    case "srgb-linear":
    case "display-p3":
    case "a98-rgb":
    case "prophoto-rgb":
    case "rec2020":
    case "rec2100-pq":
    case "rec2100-hlg":
    case "rec2100-linear":
        return srgbToRgba([component1, component2, component3, alpha]);
    case "xyz-d50":
        return xyzD50ToRgba([component1, component2, component3, alpha]);
    case "xyz":
    case "xyz-d65":
        return xyzD65ToRgba([component1, component2, component3, alpha]);
    case "lab":
        return labToRgba([component1, component2, component3, alpha]);
    case "lch":
        return lchToRgba([component1, component2, component3, alpha]);
    case "oklab":
        return oklabToRgba([component1, component2, component3, alpha]);
    case "oklch":
        return oklchToRgba([component1, component2, component3, alpha]);
    default:
        debugLogger.log(`parseAndConvertColorFunction - Unknown color space: ${colorSpace}`, "error");
        return null;
    }
}

function cssColorToRgbaValues(cssColor) {
    if(!cssColor) return null;

    if(cssColor) {
        if(cssColor.trim().toLowerCase().startsWith("rgb")) {
            const rgbValues = cssColor.split("(")[1].split(")")[0];
            const rgbValuesList = rgbValues.trim().split(",");
            return rgbValuesList;
        } else if(cssColor.trim().toLowerCase().startsWith("oklch")) {
            const parsedOklch = parseOklchColor(cssColor);

            if(!parsedOklch) {
                debugLogger.log(`cssColorToRgbaValues - Failed to parse oklch color: ${cssColor}`, "error");
                return null;
            }

            return oklchToRgba([parsedOklch.L, parsedOklch.C, parsedOklch.h, parsedOklch.alpha]);
        } else if(cssColor.trim().toLowerCase().startsWith("oklab")) {
            const parsedOklab = parseOklabColor(cssColor);

            if(!parseOklabColor) {
                debugLogger.log(`cssColorToRgbaValues - Failed to parse oklab color: ${cssColor}`, "error");
                return null;
            }

            return oklabToRgba([parsedOklab.L, parsedOklab.a, parsedOklab.b, parsedOklab.alpha]);
        } else if(cssColor.trim().toLowerCase().startsWith("lch")) {
            const parsedLch = parseLchColor(cssColor);

            if(!parsedLch) {
                debugLogger.log(`cssColorToRgbaValues - Failed to parse lch color: ${cssColor}`, "error");
                return null;
            }

            return lchToRgba([parsedLch.L, parsedLch.C, parsedLch.h, parsedLch.alpha]);
        } else if(cssColor.trim().toLowerCase().startsWith("lab")) {
            const parsedLab = parseLabColor(cssColor);

            if(!parsedLab) {
                debugLogger.log(`cssColorToRgbaValues - Failed to parse lab color: ${cssColor}`, "error");
                return null;
            }

            return labToRgba([parsedLab.L, parsedLab.a, parsedLab.b, parsedLab.alpha]);
        } else if(cssColor.trim().toLowerCase().startsWith("color")) {
            return parseAndConvertColorFunction(cssColor);
        } else {
            debugLogger.log(`cssColorToRgbaValues - CSS color format not recognized: ${cssColor.split("(")[0]}`, "error");
        }
    }

    return null;
}

function extractGradientRGBValues(background) {
    const pattern = /rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d*\.?\d+))?\)/g;
    const matches = [...background.matchAll(pattern)];

    const rgbaValuesLists = matches.map(match => {
        const rgb = match.slice(1, 4).map(Number);
        const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
        return [...rgb, alpha];
    });

    return rgbaValuesLists;
}

function isColorTransparent(rgbValuesList) {
    return (rgbValuesList && rgbValuesList.length === 4 && rgbValuesList[3] == 0);
}

function getHSLFromColor(rgbValuesList) {
    if(!rgbValuesList) return null;
    return rgbTohsl(rgbValuesList[0] / 255, rgbValuesList[1] / 255, rgbValuesList[2] / 255);
}

export { rgbTohsl, hexToRgb, oklchToRgba, oklabToRgba, lchToRgba, labToRgba, parseLabColor, parseLchColor, parseOklabColor, parseOklchColor, cssColorToRgbaValues, extractGradientRGBValues, srgbToRgba, xyzD50ToRgba, xyzD65ToRgba, parseAndConvertColorFunction, isColorTransparent, getHSLFromColor };