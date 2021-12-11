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
import { availableFilterRulesType, specialFilterRules, regexpDetectionPatternHighlight } from "./constants.js";

function filtersHint(CodeMirror, editor, keywords, getToken) {
    const Pos = CodeMirror.Pos;

    const cur = editor.getCursor();
    const token = getToken(editor, cur);
    const suggestions = [];

    const fullText = editor.getValue();
    const line = cur.line;
    const end = cur.ch;
    let currentLine = fullText.split("\n")[line];
    currentLine = currentLine.substr(0, end);
    let start = currentLine.indexOf("|");

    if (start === -1) {
        start = 0;
    }

    const currentWord = currentLine.substr(start, end - start);
    const wordSplit = currentWord.split("|");

    if(wordSplit && wordSplit.length == 2) { // Autocomplete for rule types
        const str = wordSplit[1].trim();

        if(str) {
            if(str.trim() == "") {
                suggestions.push(...keywords);
            } else {
                suggestions.push(...keywords.filter(keyword => {
                    if(keyword.startsWith(str)) return true;
                    return false;
                }));
            }
        } else {
            suggestions.push(...keywords);
        }
    }

    return {list: suggestions,
        from: Pos(cur.line, start + 1),
        to: Pos(cur.line, token.end)};
}

export default function registerCodemirrorFilterMode(CodeMirror) {
    if(CodeMirror) {
        CodeMirror.defineSimpleMode("filtermode", {
            start: [
                {regex: /\s*#!(.*)/, token: "meta", next: "start", sol: true}, // Match metadata
                {regex: /\s*#(.*)/, token: "comment", next: "start", sol: true}, // Match comments
                {regex: regexpDetectionPatternHighlight, token: ["operator", null, "string"], sol: true}, // Match regular expressions (for website/webpage)
                {regex: /(.*?[^|])?(\|)/, token: ["atom", "string"], sol: true}, // Match website/webpage and first pipe character (|)
                {regex: "/|" + availableFilterRulesType.filter(rule => specialFilterRules.indexOf(rule) == -1).join("|") + "|/", token: "keyword"}, // Match rule
                {regex: "/|" + specialFilterRules.join("|") + "|/", token: "def"}, // Match rule
                {regex: /(\|)(.*)/, token: ["string", "variable"]}, // Match second pipe character and CSS selector
                {regex: /(.*)/, token: "comment", next: "start", sol: true} // Match other
            ],
            meta: {
                lineComment: "#"
            }
        });

        CodeMirror.registerHelper("hint", "filtermode", editor => filtersHint(CodeMirror, editor, availableFilterRulesType, (e, cur) => {return e.getTokenAt(cur);}));
    }
}