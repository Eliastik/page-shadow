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
 * along with Page Shadow.  If not, see <http://www.gnu.org/licenses/>. */
let filters = [];

function openFiltersFiles(func) {
    const files = {};

    fetch("/filters/standard.txt").then((data) => {
        data.text().then(text => {
            files["/filters/standard.txt"] = text;
            func(files);
        })
    });
}

function parseLine(line) {
    if(line.length > 0) {
        const parts = line.split("|");
        const lineTrimmed = line.trim();
        const isComment = lineTrimmed[0] == "#";
    
        if(parts.length > 0 && !isComment) {
            const website = parts[0];
            const type = parts[1];
            const filter = parts[2];
    
            return { "website": website, "type": type, "filter": filter };
        }
    }

    return null;
}

function cacheFilters() {
    openFiltersFiles(function(data) {
        Object.keys(data).forEach((key) => {
            const lines = data[key].split("\n");
            lines.forEach(line => {
                const parsed = parseLine(line);

                if(parsed) {
                    filters.push(parsed);
                }
            });
        });
    });
}

cacheFilters();

if(typeof(chrome.runtime) !== 'undefined' && typeof(chrome.runtime.onMessage) !== 'undefined') {
    chrome.runtime.onMessage.addListener(function(message, sender, sendMessage) {
        if(message && message.type == "getAllFilters") {
            sendMessage({ type: "getAllFiltersResponse", filters: filters });
        }

        return true;
    });
}