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
import { maxElementsPerBatch, throttledTaskReduceThrottleMargin } from "../constants.js";
import SafeTimer from "./safeTimer.js";
import DebugLogger from "./debugLogger.js";

/**
 * Class used to throttle task working on DOM elements
 */
export default class ThrottledTask {

    constructor(
        callback,
        name,
        delay,
        elementsPerBatch = 1,
        maxExecutionTime = 25,
        processNewestFirst = false,
        callbackCanBeAwaited = () => true,
        minDelay = 1,
        maxDelay = 1000,
        autoThrottlingAdjustmentFactor = 0.5
    ) {
        this.callback = callback;
        this.callbackCanBeAwaited = callbackCanBeAwaited;
        this.name = name;
        this.delay = delay;
        this.elementsPerBatch = elementsPerBatch;
        this.maxExecutionTime = maxExecutionTime;
        this.minDelay = minDelay;
        this.maxDelay = maxDelay;
        this.autoThrottlingAdjustmentFactor = autoThrottlingAdjustmentFactor;
        this.processNewestFirst = processNewestFirst;

        this.initialDelay = delay;
        this.initialElementsPerBatch = elementsPerBatch;

        this.maxElementsPerBatch = this.calculateMaxElementsPerBatch(elementsPerBatch);

        this.elements = [];
        this.timer = new SafeTimer(() => this.processBatch());
        this.resolve = null;
        this.isRunning = false;
        this.lastBatchTime = 0;
        this.debugLogger = new DebugLogger();

        this.averageBatchDuration = 0;
        this.batchCounter = 0;
    }

    setSettings(delay, elementsPerBatch, maxExecutionTime, processNewestFirst) {
        this.delay = delay;
        this.initialDelay = delay;

        this.elementsPerBatch = elementsPerBatch;
        this.maxElementsPerBatch = this.calculateMaxElementsPerBatch(elementsPerBatch);
        this.initialElementsPerBatch = elementsPerBatch;

        this.maxExecutionTime = maxExecutionTime;

        this.processNewestFirst = processNewestFirst;
    }

    calculateMaxElementsPerBatch(elementsPerBatch) {
        return Math.min(maxElementsPerBatch, elementsPerBatch * 100);
    }

    start(newElements) {
        return new Promise(resolve => {
            this.elements = [...this.elements, ...newElements];
            this.resolve = resolve;

            if(!this.isRunning) {
                this.isRunning = true;
                this.timer.start(this.delay);
            }
        });
    }

    async processBatch() {
        const startTime = performance.now();

        const batchSize = Math.min(this.elements.length, this.elementsPerBatch);

        for(let i = 0; i < batchSize; i++) {
            try {
                const element = this.processNewestFirst ? this.elements.pop() : this.elements.shift();
                const runAwait = this.callbackCanBeAwaited(element);

                if(runAwait) {
                    await this.callback(element);
                } else {
                    this.callback(element);
                }
            } catch(e) {
                this.debugLogger?.log(`ThrottledTask ${this.name} - Error executing task: ${e}`, "error");
            }

            if(performance.now() - startTime >= this.maxExecutionTime) {
                this.debugLogger?.log(`ThrottledTask ${this.name} - Stopping early task to respect maxExecutionTime = ${this.maxExecutionTime} ms`);
                break;
            }
        }

        const batchDuration = performance.now() - startTime;

        this.averageBatchDuration = this.averageBatchDuration
            ? (this.averageBatchDuration * 0.75) + (batchDuration * 0.25)
            : batchDuration;

        // Adjust throttling each 3 iterations
        if (++this.batchCounter >= 3) {
            this.adjustThrottling(this.averageBatchDuration);
            this.batchCounter = 0;
        }

        if(this.elements.length > 0) {
            await this.timer.start(this.delay);
        } else {
            this.clear();
        }
    }

    adjustThrottling(batchDuration) {
        const oldDelay = this.delay;
        const oldElementsPerBatch = this.elementsPerBatch;

        if(batchDuration >= this.maxExecutionTime) {
            this.delay = Math.min(this.maxDelay, Math.ceil(this.delay * (1 + this.autoThrottlingAdjustmentFactor * Math.log(batchDuration + 1))));

            this.elementsPerBatch = Math.max(2, Math.floor(this.elementsPerBatch * (1 - this.autoThrottlingAdjustmentFactor)));
        } else if(batchDuration < this.maxExecutionTime * throttledTaskReduceThrottleMargin) {
            this.delay = Math.max(this.minDelay, Math.floor(this.delay / (1 + this.autoThrottlingAdjustmentFactor * Math.log(batchDuration + 1))));

            this.elementsPerBatch = Math.max(this.initialElementsPerBatch, Math.floor(this.elementsPerBatch * (1 + this.autoThrottlingAdjustmentFactor)));
        }

        this.delay = Math.max(this.minDelay, Math.min(this.delay, this.maxDelay));
        this.elementsPerBatch = Math.max(2, Math.min(this.elementsPerBatch, this.maxElementsPerBatch));

        if(oldDelay < this.delay || oldElementsPerBatch > this.elementsPerBatch) {
            this.debugLogger?.log(`ThrottledTask ${this.name} - Increased throttling - Delay: ${oldDelay} > ${this.delay}, ElementsPerBatch: ${oldElementsPerBatch} > ${this.elementsPerBatch}`);
        } else if(oldDelay > this.delay || oldElementsPerBatch < this.elementsPerBatch) {
            this.debugLogger?.log(`ThrottledTask ${this.name} - Reduced throttling - Delay: ${oldDelay} > ${this.delay}, ElementsPerBatch: ${oldElementsPerBatch} > ${this.elementsPerBatch}`);
        }
    }

    clear() {
        this.timer.clear();
        this.elements = [];
        this.isRunning = false;

        if (this.resolve) {
            this.resolve();
        }
    }
}