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
import DebugLogger from "./debugLogger.js";

/**
 * Class used to throttle task working on DOM elements
 */
export default class ThrottledTask {
    constructor(callback, name, delay, elementsPerBatch = 1, minDelay = 5, maxDelay = 250) {
        this.callback = callback;
        this.initialDelay = delay;
        this.delay = delay;
        this.name = name;
        this.elementsPerBatch = elementsPerBatch;
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;
        this.index = 0;
        this.elements = [];
        this.timer = new SafeTimer(() => this.processBatch());
        this.resolve = null;
        this.isRunning = false;
        this.lastBatchTime = 0;
        this.debugLogger = new DebugLogger();
    }

    start(newElements) {
        return new Promise((resolve) => {
            this.elements = [...this.elements, ...newElements];
            this.resolve = resolve;

            if(!this.isRunning) {
                this.index = 0;
                this.isRunning = true;
                this.processBatch();
            }
        });
    }

    processBatch() {
        const startTime = performance.now();
        const batchEnd = Math.min(this.index + this.elementsPerBatch, this.elements.length);
        
        for(let i = this.index; i < batchEnd; i++) {
            this.callback(this.elements[i]);
        }

        this.index = batchEnd;
        const batchDuration = performance.now() - startTime;
        this.adjustThrottling(batchDuration);

        if(this.index < this.elements.length) {
            this.timer.start(this.delay);
        } else {
            this.clear();
        }
    }

    adjustThrottling(batchDuration) {
        if(batchDuration > 20 && this.delay < this.maxDelay) {
            this.delay = Math.min(this.maxDelay, this.delay + 5);
            this.elementsPerBatch = Math.max(1, this.elementsPerBatch - 5);
            this.debugLogger.log(`ThrottledTask ${this.name} - Increased throttling delay and reduced elementsPerBatch - Delay = ${this.delay} / ElementsPerBatch = ${this.elementsPerBatch}`);
        } else if (batchDuration < 10 && this.delay > this.minDelay) {
            this.delay = Math.max(this.minDelay, this.delay - 5);
            this.elementsPerBatch += 5;
            this.debugLogger.log(`ThrottledTask ${this.name} - Reduced throttling delay and increased elementsPerBatch - Delay = ${this.delay} / ElementsPerBatch = ${this.elementsPerBatch}`);
        }
    }

    clear() {
        this.timer.clear();
        this.elements = [];
        this.index = 0;
        this.isRunning = false;

        if (this.resolve) {
            this.resolve();
        }
    }
}