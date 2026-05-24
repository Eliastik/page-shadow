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
function snapshotComputedStyle(element, pseudoElt = null) {
    const computed = window.getComputedStyle(element, pseudoElt);
    const backgroundClip = computed.getPropertyValue("background-clip")
        || computed.getPropertyValue("-webkit-background-clip");

    return {
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
        background: computed.background,
        color: computed.color,
        content: computed.content,
        maskImage: computed.maskImage,
        _backgroundClip: backgroundClip,
        getPropertyValue(prop) {
            if(prop === "background-clip" || prop === "-webkit-background-clip") {
                return this._backgroundClip;
            }

            return "";
        }
    };
}

export { snapshotComputedStyle };