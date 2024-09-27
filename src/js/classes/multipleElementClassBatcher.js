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

import { addClass, removeClass } from "../utils/util.js";

/**
 * Class used to apply or remove CSS classes in batch to one or multiple elements
 */
export default class MultipleElementClassBatcher {
    classListsWithElement = [];
    
    maxElementsTreatedByCall = 500;

    constructor(maxElementsTreatedByCall) {
        this.maxElementsTreatedByCall = maxElementsTreatedByCall;
    }

    add(element, ...classList) {
        const currentElement = this.classListsWithElement.find(v => v.element === element);

        if (currentElement) {
            currentElement.classList = [...new Set([...currentElement.classList, ...classList])];
        } else {
            this.classListsWithElement.unshift({
                element,
                classList: [...new Set(classList)]
            });
        }
    }

    removeAll() {
        this.classListsWithElement = [];
    }

    applyAdd() {
        for (let i = 0; i < this.maxElementsTreatedByCall && i < this.classListsWithElement.length; i++) {
            const classListWithElement = this.classListsWithElement.pop();

            addClass(classListWithElement.element, ...classListWithElement.classList);
        }
    }

    applyRemove() {
        for (let i = 0; i < this.maxElementsTreatedByCall && i < this.classListsWithElement.length; i++) {
            const classListWithElement = this.classListsWithElement.pop();
            
            removeClass(classListWithElement.element, ...classListWithElement.classList);
        }
    }
}