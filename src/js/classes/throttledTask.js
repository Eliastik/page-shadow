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
    constructor(callback, name, delay, elementsPerBatch = 1, maxExecutionTime = 25, minDelay = 5, maxDelay = 500, autoThrottlingAdjustmentFactor = 0.5) {
        this.callback = callback;
        this.name = name;
        this.delay = delay;
        this.elementsPerBatch = elementsPerBatch;
        this.maxExecutionTime = maxExecutionTime;
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;
        this.autoThrottlingAdjustmentFactor = autoThrottlingAdjustmentFactor;

        this.initialDelay = delay;
        this.initialElementsPerBatch = elementsPerBatch;

        this.maxElementsPerBatch = Math.min(10000, elementsPerBatch * 100);

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
                this.timer.start(this.delay);
            }
        });
    }

    processBatch() {
        const startTime = performance.now();

        let batchEnd = Math.min(this.index + this.elementsPerBatch, this.elements.length);
        
        for(let i = this.index; i < batchEnd; i++) {
            try {
                this.callback(this.elements[i]);
            } catch(e) {
                this.debugLogger.error(`ThrottledTask ${this.name} - Error executing task: ${e}`);
            }
            
            const currentTime = performance.now();

            if(currentTime - startTime >= this.maxExecutionTime) {
                batchEnd = i + 1;
                this.debugLogger.log(`ThrottledTask ${this.name} - Stopping early task to respect maxExecutionTime = ${this.maxExecutionTime} ms`);
                break;
            }
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
        const oldDelay = this.delay;
        const oldElementsPerBatch = this.elementsPerBatch;

        if(batchDuration >= this.maxExecutionTime) {
            this.delay = Math.max(this.minDelay, Math.floor(this.delay * (1 + this.autoThrottlingAdjustmentFactor)));
            this.elementsPerBatch = Math.max(2, Math.floor(this.elementsPerBatch * (1 - this.autoThrottlingAdjustmentFactor)));
        } else if(batchDuration < this.maxExecutionTime) {
            this.delay = Math.max(this.minDelay, Math.floor(this.delay * (1 - this.autoThrottlingAdjustmentFactor)));
            this.elementsPerBatch = Math.max(this.initialElementsPerBatch, Math.floor(this.elementsPerBatch * (1 + this.autoThrottlingAdjustmentFactor)));
        }

        this.delay = Math.max(this.minDelay, Math.min(this.delay, this.maxDelay));
        this.elementsPerBatch = Math.max(2, Math.min(this.elementsPerBatch, this.maxElementsPerBatch));

        if(oldDelay < this.delay || oldElementsPerBatch > this.elementsPerBatch) {
            this.debugLogger.log(`ThrottledTask ${this.name} - Increased throttling - Delay: ${oldDelay} > ${this.delay}, ElementsPerBatch: ${oldElementsPerBatch} > ${this.elementsPerBatch}`);
        } else if(oldDelay > this.delay || oldElementsPerBatch < this.elementsPerBatch) {
            this.debugLogger.log(`ThrottledTask ${this.name} - Reduced throttling - Delay: ${oldDelay} > ${this.delay}, ElementsPerBatch: ${oldElementsPerBatch} > ${this.elementsPerBatch}`);
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