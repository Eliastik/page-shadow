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
    delayApplyClassChanges = 5;

    throttledTaskClassApplyAdd;
    throttledTaskClassApplyRemove;

    constructor(type = "add", maxElementsTreatedByCall, delayApplyClassChanges, throttleClassApply = true) {
        this.type = type;
        this.maxElementsTreatedByCall = maxElementsTreatedByCall;
        this.delayApplyClassChanges = delayApplyClassChanges;
        this.throttleClassApply = throttleClassApply;

        if(this.type !== "add" && this.type !== "remove") {
            throw new Error("[PAGE SHADOW ERROR] MultipleElementClassBatcher - type need to be either 'add' or 'remove' in constructor");
        }

        this.throttledTaskClassApplyAdd = new ThrottledTask(
            task => addClass(task.element, ...task.classList),
            "throttledTaskClassApplyAdd",
            this.delayApplyClassChanges,
            this.maxElementsTreatedByCall,
            this.applyClassChangesMaxExecutionTime
        );

        this.throttledTaskClassApplyRemove = new ThrottledTask(
            task => removeClass(task.element, ...task.classList),
            "throttledTaskClassApplyRemove",
            this.delayApplyClassChanges,
            this.maxElementsTreatedByCall,
            this.applyClassChangesMaxExecutionTime
        );
    }

    add(element, ...classList) {
        if(!this.throttleClassApply) {
            if(this.type === "add") {
                addClass(element, ...classList);
            } else {
                removeClass(element, ...classList);
            }
        } else {
            const currentClassList = this.classListsWithElement.get(element) || [];
            this.classListsWithElement.set(element, [...new Set([...currentClassList, ...classList])]);
        }
    }

    removeAll() {
        this.classListsWithElement.clear();
    }

    doAddAllClasses() {
        const tasks = this.mapToTasks();
        this.throttledTaskClassApplyAdd.start(tasks);
        this.removeAll();
    }

    doRemoveAllClasses() {
        const tasks = this.mapToTasks();
        this.throttledTaskClassApplyRemove.start(tasks);
        this.removeAll();
    }

    apply() {
        if(this.throttleClassApply) {
            if(this.type === "add") {
                this.doAddAllClasses();
            } else {
                this.doRemoveAllClasses();
            }
        }
    }

    mapToTasks() {
        return Array.from(this.classListsWithElement.entries()).map(([element, classList]) => ({
            element,
            classList,
        }));
    }
}