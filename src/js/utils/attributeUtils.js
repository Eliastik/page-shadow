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

function addNewStyleAttribute(element, styleToAdd) {
    const oldStyleAttribute = element.getAttribute("style") || "";

    const styleToAddParts = styleToAdd.split(";").map(part => part.trim()).filter(Boolean);
    const oldStyleParts = oldStyleAttribute.split(";").map(part => part.trim()).filter(Boolean);

    const stylesToActuallyAdd = styleToAddParts.filter(newStyle => {
        return !oldStyleParts.some(oldStyle => oldStyle === newStyle);
    });

    if(stylesToActuallyAdd.length > 0) {
        let newStyleAttribute = oldStyleAttribute.trim();

        if(newStyleAttribute && !newStyleAttribute.endsWith(";")) {
            newStyleAttribute += "; ";
        }

        newStyleAttribute += stylesToActuallyAdd.join("; ");
        element.setAttribute("style", newStyleAttribute);
    }
}

function removeStyleAttribute(element, styleToRemove) {
    const oldStyleAttribute = element.getAttribute("style");
    if (!oldStyleAttribute) return;
    const stylesArray = oldStyleAttribute.split(";").map(s => s.trim()).filter(s => s.length > 0);
    const newStylesArray = stylesArray.filter(style => !style.startsWith(styleToRemove.split(":")[0].trim()));
    const newStyleAttribute = newStylesArray.join("; ");

    if (newStyleAttribute.trim() === "") {
        element.removeAttribute("style");
    } else {
        element.setAttribute("style", newStyleAttribute);
    }
}

export { addNewStyleAttribute, removeStyleAttribute };