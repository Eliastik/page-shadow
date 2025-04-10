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
import { addClass, removeClass } from "../utils/cssClassUtils.js";
/**
 * Class used to apply or remove CSS classes in batch to an element
 */
export default class ElementClassBatcher {
    element = null;
    classList = [];

    constructor(type = "add", elementType, ...classList) {
        this.type = type;

        if(this.type !== "add" && this.type !== "remove") {
            throw new Error("[PAGE SHADOW ERROR] ElementClassBatcher - type need to be either 'add' or 'remove' in constructor");
        }

        this.elementType = elementType;
        this.add(...classList);
    }

    add(...classList) {
        this.classList.push(...classList);
    }

    removeAll() {
        this.classList = [];
    }

    doAddAllClasses() {
        addClass(this.getElement(), ...this.classList);
        this.removeAll();
    }

    doRemoveAllClasses() {
        removeClass(this.getElement(), ...this.classList);
        this.removeAll();
    }

    getElement() {
        return this.elementType === "html" ? document.getElementsByTagName("html")[0] : document.body;
    }

    apply() {
        if(this.type === "add") {
            this.doAddAllClasses();
        } else {
            this.doRemoveAllClasses();
        }
    }
}