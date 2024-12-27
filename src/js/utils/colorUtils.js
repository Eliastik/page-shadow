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

function rgb2hsl(r, g, b) {
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

function oklchToRgba(oklch) {
    const [L, C, h, alpha = 1] = oklch;

    // OKLCH to OKLab
    const a = C * Math.cos((h * Math.PI) / 180);
    const bValue = C * Math.sin((h * Math.PI) / 180);

    // OKLab to XYZ (D65)
    const L_ = (L + 0.3963377774 * a + 0.2158037573 * bValue) ** 3;
    const M_ = (L - 0.1055613458 * a - 0.0638541728 * bValue) ** 3;
    const S_ = (L - 0.0894841775 * a - 1.291485548 * bValue) ** 3;

    const X = +1.2270138511 * L_ - 0.5577999807 * M_ + 0.2812561489 * S_;
    const Y = -0.0405801784 * L_ + 1.1122568696 * M_ - 0.0716766787 * S_;
    const Z = -0.0763812845 * L_ - 0.4214819784 * M_ + 1.5861632204 * S_;

    // XYZ to Linear RGB
    const R = +3.2409699419 * X - 1.5373831776 * Y - 0.4986107603 * Z;
    const G = -0.9692436363 * X + 1.8759675015 * Y + 0.0415550574 * Z;
    const B = +0.0556300797 * X - 0.2039769589 * Y + 1.0569715142 * Z;

    // Linear RGB to sRGB
    const toSrgb = (c) =>
        c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

    const r = Math.min(1, Math.max(0, toSrgb(R))) * 255;
    const g = Math.min(1, Math.max(0, toSrgb(G))) * 255;
    const b = Math.min(1, Math.max(0, toSrgb(B))) * 255;

    return [Math.round(r), Math.round(g), Math.round(b), alpha];
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

    return {
        L, C, h, alpha
    };
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
            return oklchToRgba([parsedOklch.L, parsedOklch.C, parsedOklch.h, parsedOklch.alpha]);
        } else {
            debugLogger.log(`cssColorToRgbaValues - CSS color format not recognized: ${cssColor.split("(")[0]}`, "error");
        }
    }

    return null;
}

export { rgb2hsl, hexToRgb, oklchToRgba, parseOklchColor, cssColorToRgbaValues };