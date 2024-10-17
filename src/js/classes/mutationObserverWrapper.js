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

/**
 * Mutation Observer Wrapper class adding new features to Mutation Observers :
 *
 * - pause() : pauses the Mutation Observer. When enableQueueMutations is set to true, the Mutation Observers listen
 * to new mutations and executes them when the Mutation Observer is restarted
 *
 * - start() : start the Mutation Observer
 */
export default class MutationObserverWrapper {
    callback = null;
    options = null;
    mutationObserver = null;
    target = null;
    pausing = false;
    queueMutations = [];
    enableQueueMutations = false;

    constructor(callback, options, target, enableQueueMutations) {
        this.callback = callback;
        this.options = options;
        this.target = target;
        this.enableQueueMutations = enableQueueMutations;

        if(this.mutationObserver) {
            this.disconnect();
        }

        this.setupMutationObserver();
    }

    setupMutationObserver() {
        this.mutationObserver = new MutationObserver(mutations => {
            if(!this.pausing) {
                this.disconnect();
                this.callback(mutations);
            } else {
                if(this.enableQueueMutations) {
                    this.queueMutations.push(...mutations);
                }
            }
        });
    }

    disconnect() {
        if(this.mutationObserver) {
            const records = this.mutationObserver.takeRecords();
            this.queueMutations.push(...records);
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }

    pause() {
        this.pausing = true;
    }

    observe(target, options) {
        if(this.mutationObserver) {
            this.pausing = false;
            this.options = options;
            this.target = this.target || target;
            this.mutationObserver.observe(this.target || document.body, options);
        }
    }

    start() {
        if(this.options) {
            this.pausing = false;

            if(this.queueMutations.length > 0) {
                const queueMutations = [...this.queueMutations];
                this.queueMutations = [];
                this.callback(queueMutations);
            }

            if(!this.mutationObserver) {
                this.setupMutationObserver(this.callback);
            }

            this.observe(this.target, this.options);
        }
    }
}