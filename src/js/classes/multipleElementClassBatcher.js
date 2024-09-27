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

    classListsWithElement = new Map();

    maxElementsTreatedByCall = 500;

    constructor(maxElementsTreatedByCall) {
        this.maxElementsTreatedByCall = maxElementsTreatedByCall;
    }

    add(element, ...classList) {
        const currentClassList = this.classListsWithElement.get(element) || [];
        this.classListsWithElement.set(element, [...new Set([...currentClassList, ...classList])]);
    }

    removeAll() {
        this.classListsWithElement.clear();
    }

    applyAdd() {
        let count = 0;

        for(const [element, classList] of this.classListsWithElement) {
            if(count >= this.maxElementsTreatedByCall) break;
            addClass(element, ...classList);
            this.classListsWithElement.delete(element);
            count++;
        }
    }

    applyRemove() {
        let count = 0;

        for(const [element, classList] of this.classListsWithElement) {
            if(count >= this.maxElementsTreatedByCall) break;
            removeClass(element, ...classList);
            this.classListsWithElement.delete(element);
            count++;
        }
    }
}