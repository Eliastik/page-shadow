/* Page Shadow
 *
 * Copyright (C) 2015-2019 Eliastik (eliastiksofts.com)
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
(function(){
    var style = document.createElement('style');
    style.type = 'text/css';
    var lnkCustomTheme = document.createElement('link');
    var backgroundDetected = 0;
    var timeOutLum, timeOutAP, timeOutIC, timeOutBI;
    var elLumWrapper = document.createElement("div");
    var elLum = document.createElement("div");
    var precEnabled = false;
    var started = false;
    var runningInIframe = window !== window.top;
    var filtersCache = [];

    function assombrirPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) {
        if(pageShadowEnabled != undefined && pageShadowEnabled == "true") {
            if(theme != undefined) {
                if(theme == "1") {
                    document.body.classList.add("pageShadowContrastBlack");
                    document.getElementsByTagName('html')[0].classList.add("pageShadowBackgroundContrast");
                } else if(theme.startsWith("custom")) {
                    customThemeApply();
                    document.body.classList.add("pageShadowContrastBlackCustom");
                    document.getElementsByTagName('html')[0].classList.add("pageShadowBackgroundCustom");
                } else {
                    document.body.classList.add("pageShadowContrastBlack" + theme);
                    document.getElementsByTagName('html')[0].classList.add("pageShadowBackgroundContrast" + theme);
                }
            } else {
                document.body.classList.add("pageShadowContrastBlack");
                document.getElementsByTagName('html')[0].classList.add("pageShadowBackgroundContrast");
            }

            if(disableImgBgColor != undefined && disableImgBgColor == "true") {
                document.body.classList.add("pageShadowDisableImgBgColor");
            }
        }

        invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);

        if(document.readyState == "complete" || document.readyState == "interactive") {
            mutationObserve("contrast");
        } else {
            window.addEventListener("load", function() {
                mutationObserve("contrast");
            });
        }

        if(typeof timeOutAP !== "undefined") {
            clearTimeout(timeOutAP)
        }
    }

    function customThemeApply() {
        chrome.storage.local.get("theme", function(result) {
            if(result.theme != undefined && typeof(result.theme) == "string" && result.theme.startsWith("custom")) {
                customTheme(result.theme.replace("custom", ""), style, false, lnkCustomTheme);
            }
        });
    }

    function invertColor(enabled, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) {
        document.body.classList.remove("pageShadowInvertImageColor");
        document.getElementsByTagName('html')[0].classList.remove("pageShadowInvertEntirePage");
        document.body.classList.remove("pageShadowInvertVideoColor");
        document.body.classList.remove("pageShadowInvertBgColor");
        document.getElementsByTagName('html')[0].classList.remove("pageShadowBackground");

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                document.getElementsByTagName('html')[0].classList.add("pageShadowInvertEntirePage");
                document.getElementsByTagName('html')[0].classList.add("pageShadowBackground");

                if(invertImageColors !== null && invertImageColors == "true") {
                    document.body.classList.remove("pageShadowInvertImageColor");
                } else {
                    document.body.classList.add("pageShadowInvertImageColor");
                }

                if(invertBgColors !== "false") {
                    document.body.classList.remove("pageShadowInvertBgColor");
                } else {
                    document.body.classList.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors !== null && invertVideoColors == "true") {
                    document.body.classList.remove("pageShadowInvertVideoColor");
                } else {
                    document.body.classList.add("pageShadowInvertVideoColor");
                }
            } else {
                if(invertImageColors !== null && invertImageColors == "true") {
                    document.body.classList.add("pageShadowInvertImageColor");
                }

                if(invertBgColors !== "false") {
                    document.body.classList.add("pageShadowInvertBgColor");
                }

                if(invertVideoColors !== null && invertVideoColors == "true") {
                    document.body.classList.add("pageShadowInvertVideoColor");
                }
            }

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve("invert");
            } else {
                window.addEventListener("load", function() {
                    mutationObserve("invert");
                });
            }
        }

        if(typeof timeOutIC !== "undefined") {
            clearTimeout(timeOutIC)
        }
    }

    function detectBackground(tagName, add, type) {
        var elements = document.body.getElementsByTagName(tagName);
        var computedStyle = null;

        if(backgroundDetected <= 0) {
            document.body.classList.add("pageShadowBackgroundDetected");
        }

        for(var i = 0; i < elements.length; i++) {
            elements[i].classList.add("pageShadowDisableStyling");
            var computedStyle = window.getComputedStyle(elements[i], null);

            if(type == 1 || type == 3 || type == "image" || typeof type === "undefined") {
                var hasBackgroundImg = computedStyle.getPropertyValue("background").substr(0, 4) == "url(" || computedStyle.getPropertyValue("background-image").substr(0, 4) == "url(";
                var hasClassImg = elements[i].classList.contains("pageShadowHasBackgroundImg");
                var hasElementHidden = elements[i].contains(elements[i].querySelector("canvas")) || elements[i].contains(elements[i].querySelector("video"));

                if(hasBackgroundImg && !hasClassImg) {
                    elements[i].classList.add("pageShadowHasBackgroundImg");
                }

                if(hasElementHidden) {
                    elements[i].classList.add("pageShadowHasHiddenElement");
                }
            }

            if(type == 2 || type == 3 || type == "color") {
                var hasBackgroundColor = computedStyle.getPropertyValue("background-image").substr(0, 4) !== "url(" && computedStyle.getPropertyValue("background-color") !== "" && computedStyle.getPropertyValue("background-color").substr(0, 4) !== "none";
                var hasClassColor = elements[i].classList.contains("pageShadowHasBackgroundColor");

                if(hasBackgroundColor && !hasClassColor) {
                    elements[i].classList.add("pageShadowHasBackgroundColor");
                }
            }

            elements[i].classList.remove("pageShadowDisableStyling");
        }

        if(backgroundDetected <= 0) {
            mutationObserve("backgrounds");
        }

        if(typeof add !== "undefined") {
            backgroundDetected += add;
        }
    }

    function applyDetectBackground(type, element, add, detectType) {
        if(backgroundDetected > 2) {
            return false;
        }

        if(type == "loading") {
            document.onreadystatechange = function() {
                // when the DOM is ready
                if(document.readyState === 'interactive') {
                    setTimeout(function() { applyBI(element, add, detectType); }, 1); // detect for all the elements of the page
                }
                // when the page is entirely loaded
                if(document.readyState === 'complete') {
                    setTimeout(function() { applyBI(element, add, detectType); }, 1500); // detect for all the elements of the page after 1500 ms
                }
            };
        } else {
            if(document.readyState === 'complete') {
                setTimeout(function() { applyBI(element, add, detectType); }, 1); // detect for all the elements of the page
            } else {
                applyDetectBackground("loading", element, add, detectType);
            }
        }
    }

    function luminositePage(enabled, pourcentage, nightmode, colorTemp) {
        elLum.setAttribute("class", "");

        if(enabled == "true" && !runningInIframe) {
            elLum.style.display = "block";
            if(nightmode == "true") {
                elLum.setAttribute("id", "pageShadowLuminositeDivNightMode");
                elLum.setAttribute("class", "");

                var tempColor = "2000";

                if(colorTemp != undefined) {
                    var tempIndex = parseInt(colorTemp);
                    var tempColor = colorTemperaturesAvailable[tempIndex - 1];

                    elLum.setAttribute("class", "k" + tempColor);
                } else {
                    elLum.setAttribute("class", "k2000");
                }
            } else {
                elLum.setAttribute("id", "pageShadowLuminositeDiv");
            }

            if(pourcentage / 100 > maxBrightnessPercentage || pourcentage / 100 < minBrightnessPercentage || typeof pourcentage === "undefined" || typeof pourcentage == null) {
                elLum.style.opacity = brightnessDefaultValue;
            } else {
                elLum.style.opacity = pourcentage / 100;
            }

            applyAL(elLum, elLumWrapper);

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve("brightness");
            } else {
                window.addEventListener("load", function() {
                    mutationObserve("brightness");
                });
            }
        }
    }

    function appendLum(elLum, elLumWrapper) {
        if(document.getElementById("pageShadowLuminositeDiv") !== null && document.body.contains(elLumWrapper)) {
            elLumWrapper.removeChild(document.getElementById("pageShadowLuminositeDiv"));
        }

        if(document.getElementById("pageShadowLuminositeDivNightMode") !== null && document.body.contains(elLumWrapper)) {
            elLumWrapper.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
        }

        document.body.appendChild(elLumWrapper);
        elLumWrapper.appendChild(elLum);

        if(typeof timeOutLum !== "undefined") {
            clearTimeout(timeOutLum);
        }
    }

    function applyAL(element, wrapper) {
        if(document.body) return appendLum(element, wrapper);
        timeOutLum = setTimeout(function() { applyAL(element, wrapper) }, 50);
    }

    function applyAP(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) {
        if(document.body) return assombrirPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors);
        timeOutAP = setTimeout(function() { applyAP(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, disableImgBgColor, invertBgColors) }, 50);
    }

    function applyIC(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) {
        if(document.body) return invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
        timeOutIC = setTimeout(function() { applyIC(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors) }, 50);
    }

    function applyBI(tagName, add, type) {
        if(document.body) return detectBackground(tagName, add, type);
        timeOutBI = setTimeout(function() { applyBI(tagName, add, type) }, 50);
    }

    function mutationObserve(type) {
        if(type == "contrast") {
            if(typeof mut_contrast !== 'undefined') mut_contrast.disconnect();

            mut_contrast = new MutationObserver(function(mutations, mut) {
                mut_contrast.disconnect();
                var classList = document.body.classList;
                var containsPageContrast = true;

                for(var i = 1; i <= nbThemes; i++) {
                    if(i == "1" && !classList.contains("pageShadowContrastBlack")) {
                        var containsPageContrast = false;
                    } else if(!classList.contains("pageShadowContrastBlack" + i)) {
                        var containsPageContrast = false;
                    }
                }

                mutations.forEach(function(mutation) {
                    if(mutation.type == "attributes" && mutation.attributeName == "class") {
                        var classList = document.body.classList;

                        if(mutation.oldValue.indexOf("pageShadowDisableImgBgColor") !== -1 && !classList.contains("pageShadowDisableImgBgColor")) {
                            containsPageContrast = false;
                        }
                    }
                });

                if(!containsPageContrast) {
                    setTimeout(function() { main("onlycontrast", "contrast"); }, 1);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve("contrast");
                    } else {
                        window.addEventListener("load", function() {
                            mutationObserve("contrast");
                        });
                    }
                }
            });

            mut_contrast.observe(document.body, {
                'attributes': true,
                'subtree': false,
                'childList': false,
                'characterData': false,
                'attributeOldValue': true,
                'attributeFilter': ["class"]
            });
        } else if(type == "invert") {
            if(typeof mut_invert !== 'undefined') mut_invert.disconnect();

            mut_invert = new MutationObserver(function(mutations, mut) {
                mut_invert.disconnect();

                function reMutObserveInvert() {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve("invert");
                    } else {
                        window.addEventListener("load", function() {
                            mutationObserve("invert");
                        });
                    }
                }

                mutations.forEach(function(mutation) {
                    if(mutation.type == "attributes" && mutation.attributeName == "class") {
                        var classList = document.body.classList;
                        var classListHTML = document.getElementsByTagName('html')[0].classList;

                        if(mutation.oldValue.indexOf("pageShadowInvertImageColor") !== -1 && !classList.contains("pageShadowInvertImageColor")) {
                            setTimeout(function() { main("onlyInvert", "invert"); }, 1);
                        } else if(mutation.oldValue.indexOf("pageShadowInvertVideoColor") !== -1 && !classList.contains("pageShadowInvertVideoColor")) {
                            setTimeout(function() { main("onlyInvert", "invert"); }, 1);
                        } else if(mutation.oldValue.indexOf("pageShadowInvertBgColor") !== -1 && !classList.contains("pageShadowInvertBgColor")) {
                            setTimeout(function() { main("onlyInvert", "invert"); }, 1);
                        } else {
                            reMutObserveInvert();
                        }
                    } else {
                        reMutObserveInvert();
                    }
                });
            });

            mut_invert.observe(document.body, {
                'attributes': true,
                'subtree': false,
                'childList': false,
                'characterData': false,
                'attributeOldValue': true,
                'attributeFilter': ["class"]
            });
        } else if(type == "brightness") {
            if(typeof mut_brightness !== 'undefined') mut_brightness.disconnect();

            mut_brightness = new MutationObserver(function(mutations, mut) {
                mut_brightness.disconnect();
                var brightness = document.getElementById("pageShadowLuminositeDiv");
                var nightmode = document.getElementById("pageShadowLuminositeDivNightMode");

                mutations.forEach(function(mutation) {
                    if((!document.body.contains(brightness) && !document.body.contains(nightmode)) || (mutation.type == "attributes" && mutation.attributeName == "style")) {
                        setTimeout(function() { main("onlyBrightness", "brightness"); }, 1);
                    } else {
                        if(document.readyState == "complete" || document.readyState == "interactive") {
                            mutationObserve("brightness");
                        } else {
                            window.addEventListener("load", function() {
                                mutationObserve("brightness");
                            });
                        }
                    }
                });
            });

            mut_brightness.observe(elLumWrapper, {
                'attributes': true,
                'subtree': true,
                'childList': true,
                'characterData': false
            });
        } else if(type == "backgrounds") {
            mut_backgrounds = new MutationObserver(function(mutations, mut) {
                mutations.forEach(function(mutation) {
                    if(mutation.type == "childList") {
                        for(var i = 0; i < mutation.addedNodes.length; i++) {
                            mutationElementsBackgrounds(mutation.addedNodes[i], null, null);
                            doProcessFilters(filtersCache, mutation.addedNodes[i]);
                        }
                    } else if(mutation.type == "attributes") {
                        mutationElementsBackgrounds(mutation.target, mutation.attributeName, mutation.oldValue);
                    }
                });
            });

            mut_backgrounds.observe(document.body, {
                'attributes': false,
                'subtree': true,
                'childList': true,
                'characterData': false
            });
        }
    }

    function mutationElementsBackgrounds(element, attribute, attributeOldValue) {
        if(typeof(element.classList) === "undefined" || element.classList == null || attribute == "class") {
            return false;
        }

        if(element.classList.contains("pageShadowHasBackgroundImg") || element.classList.contains("pageShadowDisableStyling") || element.classList.contains("pageShadowBackgroundDetected")) {
            return false;
        }

        if(attributeOldValue !== null && attributeOldValue.indexOf("pageShadowDisableStyling") !== -1) {
            return false;
        }

        element.classList.add("pageShadowDisableStyling");

        var computedStyle = window.getComputedStyle(element, null);
        var hasBackgroundImg = computedStyle.getPropertyValue("background").trim().substr(0, 4).toLowerCase() == "url(" || computedStyle.getPropertyValue("background-image").trim().substr(0, 4).toLowerCase() == "url(";
        var hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");
        var hasElementHidden = element.contains(element.querySelector("canvas")) || element.contains(element.querySelector("video"));

        if(hasBackgroundImg && !hasClassImg) {
            element.classList.add("pageShadowHasBackgroundImg");
        }

        if(hasElementHidden) {
            element.classList.add("pageShadowHasHiddenElement");
        }

        element.classList.remove("pageShadowDisableStyling");
    }

    function processFilters() {
        chrome.runtime.sendMessage({
            "type": "getAllFilters"
        }, function(response) {
            if(response && response.type == "getAllFiltersResponse" && response.filters) {
                filtersCache = response.filters;
                doProcessFilters(response.filters);
            }

            return true;
        });
    }

    function doProcessFilters(filters, element) {
        var url = window.location.href;
        var websuteUrl_tmp = new URL(url);
        var domain = websuteUrl_tmp.hostname;

        filters.forEach(filter => {
            if(matchWebsite(domain, filter.website) || matchWebsite(url, filter.website)) {
                var selector = filter.filter;
                var elements = (element ? [element] : document.querySelectorAll(selector));

                if(element) {
                    if(element.matches && !element.matches(selector)) {
                        elements = [];
                    }

                    if(element.getElementsByTagName) {
                        var elementChildrens = element.getElementsByTagName("*");
    
                        if(elementChildrens && elementChildrens.length > 0) {
                            for(childrenElement of elementChildrens) {
                                if(childrenElement.matches && !childrenElement.matches(selector)) {
                                    elements.push(childrenElement);
                                }
                            }
                        }
                    }
                }

                elements.forEach(element => {
                    if(element && element.classList) {
                        if(filter.type == "disableContrastFor") {
                            if(!element.classList.contains("pageShadowElementDisabled")) element.classList.add("pageShadowElementDisabled");
                        } else if(filter.type == "forceTransparentBackground") {
                            if(!element.classList.contains("pageShadowElementForceTransparentBackground")) element.classList.add("pageShadowElementForceTransparentBackground");
                        }
                    }
                });
            }
        });
    }

    function main(type, mutation) {
        if(type == "reset" || type == "onlyreset") {
            mutation = "all";
        }

        if(mutation == null) mutation = "none";

        if(typeof timeOutLum !== "undefined") clearTimeout(timeOutLum);
        if(typeof timeOutAP !== "undefined") clearTimeout(timeOutAP);
        if(typeof timeOutIC !== "undefined") clearTimeout(timeOutIC);
        if(typeof timeOutBI !== "undefined") clearTimeout(timeOutBI);
        if(typeof mut_contrast !== 'undefined' && (mutation == "contrast" || mutation == "all")) mut_contrast.disconnect();
        if(typeof mut_invert !== 'undefined' && (mutation == "invert" || mutation == "all")) mut_invert.disconnect();
        if(typeof mut_brightness !== 'undefined' && (mutation == "brightness" || mutation == "all")) mut_brightness.disconnect();
        if(typeof lnkCustomTheme !== 'undefined') lnkCustomTheme.setAttribute('href', '');

        if(started && (type == "reset" || type == "onlyreset")) {
            document.body.classList.remove("pageShadowInvertImageColor");
            document.getElementsByTagName('html')[0].classList.remove("pageShadowInvertEntirePage");
            document.body.classList.remove("pageShadowInvertVideoColor");
            document.getElementsByTagName('html')[0].classList.remove("pageShadowBackground");
            document.getElementsByTagName('html')[0].classList.remove("pageShadowBackgroundCustom");
            document.body.classList.remove("pageShadowContrastBlackCustom");
            document.body.classList.remove("pageShadowDisableImgBgColor");
            document.body.classList.remove("pageShadowInvertBgColor");

            for(var i = 1; i <= nbThemes; i++) {
                if(i == 1) {
                    document.body.classList.remove("pageShadowContrastBlack");
                    document.getElementsByTagName('html')[0].classList.remove("pageShadowBackgroundContrast");
                } else {
                    document.body.classList.remove("pageShadowContrastBlack" + i);
                    document.getElementsByTagName('html')[0].classList.remove("pageShadowBackgroundContrast" + i);
                }
            }

            if(document.getElementById("pageShadowLuminositeDiv") != null && document.body.contains(elLumWrapper)) {
                elLumWrapper.removeChild(document.getElementById("pageShadowLuminositeDiv"));
            }

            if(document.getElementById("pageShadowLuminositeDivNightMode") != null && document.body.contains(elLumWrapper)) {
                elLumWrapper.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
            }

            if(type == "onlyreset") {
                return;
            }
        }

        if(runningInIframe) {
            chrome.runtime.sendMessage({
                "type": "isEnabledForThisPage"
            }, function(response) {
                if(response && response.type == "isEnabledForThisPageResponse" && response.enabled) {
                    process(true, type);
                }

                return true;
            });
        } else {
            pageShadowAllowed(window.location.href, function(allowed) {
                process(allowed, type);
            });
        }
    }

    function process(allowed, type) {
        if(allowed) {
            chrome.storage.local.get(['sitesInterditPageShadow', 'pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert', 'invertPageColors', 'invertImageColors', 'invertEntirePage', 'invertEntirePage', 'whiteList', 'colorTemp', 'globallyEnable', 'invertVideoColors', 'disableImgBgColor', 'invertBgColor'], function(result) {
                precEnabled = true;

                var pageShadowEnabled = result.pageShadowEnabled;
                var theme = result.theme;
                var colorTemp = result.colorTemp;
                var invertEntirePage = result.invertEntirePage;
                var invertImageColors = result.invertImageColors;
                var invertVideoColors = result.invertVideoColors;
                var invertBgColors = result.invertBgColor;

                if(result.colorInvert == "true") {
                    var colorInvert = "true";
                    var invertImageColors = "true";
                } else if(result.invertPageColors == "true") {
                    var colorInvert = "true";
                } else {
                    var colorInvert = "false";
                }

                if(type == "onlyContrast") {
                    assombrirPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, result.disableImgBgColor, invertBgColors);
                } else if(type == "onlyInvert") {
                    invertColor(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
                } else if(type == "onlyBrightness") {
                    luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, colorTemp);
                } else if(pageShadowEnabled == "true") {
                    applyAP(pageShadowEnabled, theme, colorInvert, colorTemp, invertImageColors, invertEntirePage, invertVideoColors, result.disableImgBgColor, invertBgColors);
                } else {
                    applyIC(colorInvert, invertImageColors, invertEntirePage, invertVideoColors, invertBgColors);
                }

                if(type !== "onlyContrast" && type !== "onlyInvert" && type !== "onlyBrightness") {
                    luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, colorTemp);
                }

                if(pageShadowEnabled == "true" || colorInvert == "true") {
                    if(type == "start") {
                        applyDetectBackground("loading", "*", 1, 1);
                    } else {
                        applyDetectBackground(null, "*", 2, 1);
                    }
                }

                if(document.readyState == "complete") {
                    processFilters();
                } else {
                    window.addEventListener("load", function() {
                        processFilters();
                    });
                }
            });
        } else {
            precEnabled = false;
        }

        started = true;
    }

    main("start");

    // Execute Page Shadow on the page when the settings have been changed:
    chrome.storage.onChanged.addListener(function() {
        chrome.storage.local.get('liveSettings', function(result) {
            if(result.liveSettings !== "false") {
                main("reset", "all");
            }
        });
    });

    // Execute when the page URL changes in Single Page Applications
    chrome.runtime.onMessage.addListener(function(msg) {
        if(msg) {
            var enabled = started && ((msg.enabled && !precEnabled) || (!msg.enabled && precEnabled));
    
            if(msg.type == "websiteUrlUpdated" && enabled) {
                main("reset", "all");
            }
        }
    });
}());