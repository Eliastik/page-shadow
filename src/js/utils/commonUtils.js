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
import { Sha256 } from "@aws-crypto/sha256-browser";

function commentAllLines(string) {
    return string
        .split("\n")
        .map(line => line.trim() && !line.trim().startsWith("#") ? "#" + line : line)
        .join("\n");
}

function removeElementsFromArray(arr, ...values) {
    return arr.filter(item => !values.includes(item));
}

function downloadData(data, name) {
    const url = "data:text/plain;charset=utf-8," + encodeURIComponent(data);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", name || "");
    a.setAttribute("type", "text/plain");
    a.dispatchEvent(new MouseEvent("click"));
}

function convertBytes(size) {
    const result = {
        size: 0,
        unit: "byte"
    };

    if(size >= 1000000000) {
        result.size = (size / 1000000000).toFixed(2).replace(".", ",");
        result.unit = "gigabyte";
    } else if(size >= 1000000) {
        result.size = (size / 1000000).toFixed(2).replace(".", ",");
        result.unit = "megabyte";
    } else if(size >= 1000) {
        result.size = (size / 1000).toFixed(2).replace(".", ",");
        result.unit = "kilobyte";
    } else {
        result.size = size;
        result.unit = "byte";
    }

    return result;
}

function getSizeObject(object) {
    if(!object) {
        return 0;
    }

    return new TextEncoder().encode(
        Object.entries(object)
            .map(([key, value]) => key + JSON.stringify(value))
            .join("")
    ).length;
}

async function sha256(url) {
    const hash = new Sha256();
    hash.update(url);
    const hashBuffer = await hash.digest();
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

function base64EncodeUnicode(str) {
    const uint8Array = new TextEncoder().encode(str);
    const binaryString = Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join("");
    return btoa(binaryString);
}

export { removeElementsFromArray, commentAllLines, downloadData, convertBytes, getSizeObject, sha256, base64EncodeUnicode };