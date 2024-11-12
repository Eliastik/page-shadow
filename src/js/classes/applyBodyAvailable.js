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
import SafeTimer from "./safeTimer";

/**
 * Helper class that apply a callback when the body element is available
 */
export default class ApplyBodyAvailable {
    callback;
    timer;
    oldDelay;
    cleared = false;

    constructor(callback) {
        this.callback = callback;
        this.timer = new SafeTimer(() => this.apply());
    }

    apply() {
        if(!this.cleared) {
            this.timer.clear();
            this.start(this.oldDelay);
        }
    }

    start(delay) {
        this.oldDelay = delay;

        if(document.body) {
            this.timer.clear();
            this.callback();
        } else {
            this.timer.start(delay);
        }
    }

    clear() {
        this.timer.clear();
        this.cleared = true;
    }
}