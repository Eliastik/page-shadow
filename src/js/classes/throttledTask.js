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
import SafeTimer from "./safeTimer.js";

/**
 * Class used to throttle task working on DOM elements
 */
export default class ThrottledTask {
    constructor(callback, delay, elementsPerBatch = 1) {
        this.callback = callback;
        this.delay = delay;
        this.elementsPerBatch = elementsPerBatch;
        this.index = 0;
        this.elements = [];
        this.timer = new SafeTimer(() => this.processBatch());
        this.resolve = null;
    }

    start(elements) {
        return new Promise((resolve) => {
            this.elements = elements;
            this.index = 0;
            this.resolve = resolve;
            this.processBatch();
        });
    }

    processBatch() {
        const batchEnd = Math.min(this.index + this.elementsPerBatch, this.elements.length);

        for(let i = this.index; i < batchEnd; i++) {
            this.callback(this.elements[i]);
        }

        this.index = batchEnd;

        if(this.index < this.elements.length) {
            this.timer.start(this.delay);
        } else {
            this.clear();
        }
    }

    clear() {
        this.timer.clear();
        this.elements = [];
        this.index = 0;

        if(this.resolve) {
            this.resolve();
        }
    }
}