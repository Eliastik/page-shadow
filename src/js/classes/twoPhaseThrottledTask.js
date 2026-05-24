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
import ThrottledTask from "./throttledTask.js";

export default class TwoPhaseThrottledTask extends ThrottledTask {

    preReadQueue = [];

    constructor(
        readCallback,
        writeCallback,
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
        super(
            null,
            name,
            delay,
            elementsPerBatch,
            maxExecutionTime,
            processNewestFirst,
            callbackCanBeAwaited,
            minDelay,
            maxDelay,
            autoThrottlingAdjustmentFactor
        );

        this.readCallback = readCallback;
        this.writeCallback = writeCallback;
    }

    startWithPreReadData(preReadResults, remainingElements = []) {
        this.preReadQueue = [...this.preReadQueue, ...preReadResults];
        return super.start(remainingElements);
    }

    async processBatch() {
        const startTime = performance.now();

        if(this.callbackBeforeStart) {
            this.callbackBeforeStart();
        }

        if(this.preReadQueue.length > 0) {
            const batchSize = Math.min(this.preReadQueue.length, this.elementsPerBatch);
            const toWrite = this.preReadQueue.splice(0, batchSize);

            for(const { element, data } of toWrite) {
                try {
                    if(this.callbackCanBeAwaited(element)) {
                        await this.writeCallback(element, data);
                    } else {
                        this.writeCallback(element, data);
                    }
                } catch(e) {
                    this.debugLogger?.log(`TwoPhaseThrottledTask ${this.name} - Error in pre-read write phase: ${e}`, "error");
                }

                if(performance.now() - startTime >= this.maxExecutionTime) {
                    break;
                }
            }
        }

        if(this.elements.length > 0 && performance.now() - startTime < this.maxExecutionTime) {
            const batchSize = Math.min(this.elements.length, this.elementsPerBatch);

            if(this.callbackBeforeStart) {
                this.callbackBeforeStart();
            }

            const readResults = [];

            for(let i = 0; i < batchSize; i++) {
                if(performance.now() - startTime >= this.maxExecutionTime) {
                    this.debugLogger?.log(`TwoPhaseThrottledTask ${this.name} - Stopping early read phase to respect maxExecutionTime = ${this.maxExecutionTime} ms`);
                    break;
                }

                const element = this.processNewestFirst
                    ? this.elements.pop()
                    : this.elements.shift();

                try {
                    readResults.push({ element, data: this.readCallback(element) });
                } catch(e) {
                    this.debugLogger?.log(`TwoPhaseThrottledTask ${this.name} - Error in read phase: ${e}`, "error");
                }
            }

            if(this.callbackAfterFinish) {
                this.callbackAfterFinish();
            }

            for(const { element, data } of readResults) {
                try {
                    if(this.callbackCanBeAwaited(element)) {
                        await this.writeCallback(element, data);
                    } else {
                        this.writeCallback(element, data);
                    }
                } catch(e) {
                    this.debugLogger?.log(`TwoPhaseThrottledTask ${this.name} - Error in write phase: ${e}`, "error");
                }
            }
        } else if(this.callbackAfterFinish) {
            this.callbackAfterFinish();
        }

        await this.finalizeBatch(startTime);
    }

    clear() {
        super.clear();
        this.preReadQueue = [];
    }
}