/* Page Shadow
 *
 * Copyright (C) 2015-2022 Eliastik (eliastiksofts.com)
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
 * Optimized Timer class that uses requestAnimationFrame to
 * throttle when the page is in idle (for example, when the tab is
 * inactive) to preserve performance
 */
export default class SafeTimer {
    constructor(callback) {
        this.requestAnimationId = this.timeoutId = null;
        this.callback = callback;
    }

    start(delay) {
        if(!delay) {
            if(!this.requestAnimationId) {
                this.requestAnimationId = requestAnimationFrame(() => {
                    this.onRequestAnimationFrame();
                });
            }

            return;
        }

        if(!this.requestAnimationId && !this.timeoutId) {
            this.timeoutid = setTimeout(() => {
                this.macroToMicro();
            }, delay);
        }
    }

    clear() {
        if(this.requestAnimationId) {
            cancelAnimationFrame(this.requestAnimationId);
            this.requestAnimationId = null;
        }

        if(this.timeoutid) {
            clearTimeout(this.timeoutid);
            this.timeoutid = null;
        }
    }

    macroToMicro() {
        this.timeoutid = null;
        this.start();
    }

    onRequestAnimationFrame() {
        this.requestAnimationId = null;
        this.callback();
    }
}