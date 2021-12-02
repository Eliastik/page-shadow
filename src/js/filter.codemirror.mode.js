/* Page Shadow
 *
 * Copyright (C) 2015-2021 Eliastik (eliastiksofts.com)
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
 * along with Page Shadow.  If not, see <http://www.gnu.org/licenses/ */
import { availableFilterRulesType } from "./constants.js";

export default function registerCodemirrorFilterMode(CodeMirror) {
    console.log("/(" + availableFilterRulesType.join("|") + ")/");
    CodeMirror.defineSimpleMode("filtermode", {
        "start": [
            {regex: /\s*#!(.*)/, token: "meta", next: "start", sol: true},
            {regex: /\s*#(.*)/, token: "comment", next: "start", sol: true},
            {regex: /^((.*)\/(?:[^\\]|\\.)*?\/)(\|)/, token: ["operator", null, "string"], sol: true},
            {regex: /(.*?[^|])?(\|)/, token: ["atom", "string"], sol: true},
            {regex: "/" + availableFilterRulesType.join("|") + "/", token: "keyword"},
            {regex: /(\|)(.*)/, token: ["string", "variable"]},
            {regex: /(.*)/, token: "empty", next: "start", sol: true}
        ],
        meta: {
            lineComment: "#"
        }
    });
}