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
 * Patches a bug in the Colpick Color Picker ID generator.
 * Colpick uses `parseInt(Math.random() * 1000)` to generate IDs, which can lead to collisions in some rare cases.
 * This patch ensures unique IDs by using a counter instead.
 *
 * @param {jQuery} jQuery The jQuery instance used in the project.
 */
export default function patchColpick(jQuery) {
    (function($) {
        const originalColpick = $.fn.colpick;

        let colpickCounter = 1;

        $.fn.colpick = function(opt) {
            const result = originalColpick.call(this, opt);

            this.each(function() {
                const colpickId = $(this).data("colpickId");

                if(colpickId) {
                    const uniqueId = "collorpicker_" + colpickCounter;

                    $(this).data("colpickId", uniqueId);
                    $("#" + colpickId).attr("id", uniqueId);

                    colpickCounter++;
                }
            });

            return result;
        };
    })(jQuery);
}