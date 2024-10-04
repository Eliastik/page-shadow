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
import ThrottledTask from "./throttledTask.js";

/**
 * Class used to apply or remove CSS classes in batch to one or multiple elements
 */
export default class MultipleElementClassBatcher {

    classListsWithElement = new Map();

    maxElementsTreatedByCall = 5000;

    throttledTaskClassApplyAdd;
    throttledTaskClassApplyRemove;

    constructor(maxElementsTreatedByCall) {
        this.maxElementsTreatedByCall = maxElementsTreatedByCall;

        this.throttledTaskClassApplyAdd = new ThrottledTask(
            (task) => addClass(task.element, ...task.classList),
            "throttledTaskClassApplyAdd",
            5,
            this.maxElementsTreatedByCall
        );

        this.throttledTaskClassApplyRemove = new ThrottledTask(
            (task) => removeClass(task.element, ...task.classList),
            "throttledTaskClassApplyRemove",
            5,
            this.maxElementsTreatedByCall
        );
    }

    add(element, ...classList) {
        const currentClassList = this.classListsWithElement.get(element) || [];
        this.classListsWithElement.set(element, [...new Set([...currentClassList, ...classList])]);
    }

    removeAll() {
        this.classListsWithElement.clear();
    }

    applyAdd() {
        const tasks = this.mapToTasks();
        this.throttledTaskClassApplyAdd.start(tasks);
        this.removeAll();
    }

    applyRemove() {
        const tasks = this.mapToTasks();
        this.throttledTaskClassApplyRemove.start(tasks);
        this.removeAll();
    }

    mapToTasks() {
        return Array.from(this.classListsWithElement.entries()).map(([element, classList]) => ({
            element,
            classList,
        }));
    }
}