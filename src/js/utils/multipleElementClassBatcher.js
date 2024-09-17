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
import { addClass, removeClass } from "./util.js";
/**
 * Class used to apply or remove CSS classes in batch to one or multiple elements
 */
export default class MultipleElementClassBatcher {
    classListsWithElement = [];

    add(element, ...classList) {
        const currentElement = this.classListsWithElement.find(v => v.element === element);

        if (currentElement) {
            currentElement.classList.push(...classList);
        } else {
            this.classListsWithElement.push({
                element,
                classList: [...classList]
            });
        }
    }

    removeAll() {
        this.classListWithElement = [];
    }

    applyAdd() {
        this.classListsWithElement.forEach(classListWithElement => {
            addClass(classListWithElement.element, ...classListWithElement.classList);
        });

        this.removeAll();
    }

    applyRemove() {
        this.classListsWithElement.forEach(classListWithElement => {
            removeClass(classListWithElement.element, ...classListWithElement.classList);
        });

        this.removeAll();
    }
}