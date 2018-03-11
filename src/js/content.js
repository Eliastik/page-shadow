/* Page Shadow
 *
 * Copyright (C) 2015-2018 Eliastik (eliastiksofts.com)
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
    /* Check if the configuration variables are set, if not set some default values (the variables are set globally, so we use window[variableName]) */
    if(typeof(window["nbThemes"]) == "undefined") nbThemes = 15;
    if(typeof(window["colorTemperaturesAvailable"]) == "undefined") colorTemperaturesAvailable = ["1000", "1200", "1500", "1800", "2000", "2200", "2600", "2900", "3100", "3600"];
    if(typeof(window["minBrightnessPercentage"]) == "undefined") minBrightnessPercentage = 0;
    if(typeof(window["maxBrightnessPercentage"]) == "undefined") maxBrightnessPercentage = 0.9;
    if(typeof(window["brightnessDefaultValue"]) == "undefined") brightnessDefaultValue = 0.15;
    if(typeof(window["defaultBGColorCustomTheme"]) == "undefined") defaultBGColorCustomTheme = "000000";
    if(typeof(window["defaultTextsColorCustomTheme"]) == "undefined") defaultTextsColorCustomTheme = "FFFFFF";
    if(typeof(window["defaultLinksColorCustomTheme"]) == "undefined") defaultLinksColorCustomTheme = "1E90FF";
    if(typeof(window["defaultVisitedLinksColorCustomTheme"]) == "undefined") defaultVisitedLinksColorCustomTheme = "ff00ff";
    if(typeof(window["defaultFontCustomTheme"]) == "undefined") defaultFontCustomTheme = "";

    var style = document.createElement('style');
    style.type = 'text/css';
    var backgroundDetected = 0;
    var timeOutLum, timeOutAP, timeOutIC, timeOutBI;
    var elLum = document.createElement("div");

    function assombrirPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertEntirePage) {
        if(pageShadowEnabled !== null && pageShadowEnabled == "true") {
            if(theme !== null) {
                if(theme == "1") {
                    document.body.classList.add("pageShadowContrastBlack");
                } else if(theme == "custom") {
                    customThemeApply();
                    document.body.classList.add("pageShadowContrastBlackCustom");
                } else {
                    document.body.classList.add("pageShadowContrastBlack" + theme);
                }
            } else {
                document.body.classList.add("pageShadowContrastBlack");
            }
        }

        invertColor(colorInvert, invertEntirePage);

        if(document.readyState == "complete" || document.readyState == "interactive") {
            mutationObserve("contrast");
        } else {
            window.onload = function() {
                mutationObserve("contrast");
            }
        }

        if(typeof timeOutAP !== "undefined") {
            clearTimeout(timeOutAP)
        }
    }

    function customThemeApply() {
        customTheme(style);
    }

    function invertColor(enabled, invertEntirePage) {
        document.body.classList.remove("pageShadowInvertImageColor");
        document.body.classList.remove("pageShadowInvertEntirePage");
        document.getElementsByTagName('html')[0].classList.remove("pageShadowBackground");

        if(enabled !== null && enabled == "true") {
            if(invertEntirePage !== null && invertEntirePage == "true") {
                document.body.classList.add("pageShadowInvertEntirePage");
                document.getElementsByTagName('html')[0].classList.add("pageShadowBackground");
            } else {
                document.body.classList.add("pageShadowInvertImageColor");
            }

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve("invert");
            } else {
                window.onload = function() {
                    mutationObserve("invert");
                }
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

                if(hasBackgroundImg && !hasClassImg) {
                    elements[i].classList.add("pageShadowHasBackgroundImg");
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
                    setTimeout(function() { applyBI(element, add, detectType); }, 1); // detect for all the elements of the page
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

    function luminositePage(enabled, pourcentage, nightmode, siteInterdits, colorTemp) {
        elLum.setAttribute("class", "");

        if(enabled == "true") {
            elLum.style.display = "block";
            if(nightmode == "true") {
                elLum.setAttribute("id", "pageShadowLuminositeDivNightMode");
                elLum.setAttribute("class", "");

                var tempColor = "2000";

                if(colorTemp !== null) {
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

            applyAL(elLum);

            if(document.readyState == "complete" || document.readyState == "interactive") {
                mutationObserve("brightness");
            } else {
                window.onload = function() {
                    mutationObserve("brightness");
                }
            }
        }
    }

    function appendLum(elLum) {
        if(document.getElementById("pageShadowLuminositeDiv") !== null) {
            document.body.removeChild(document.getElementById("pageShadowLuminositeDiv"));
        }

        if(document.getElementById("pageShadowLuminositeDivNightMode") !== null) {
            document.body.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
        }

        document.body.appendChild(elLum);

        if(typeof timeOutLum !== "undefined") {
            clearTimeout(timeOutLum);
        }
    }

    function applyAL(element) {
        if(document.body) return appendLum(element);
        timeOutLum = setTimeout(function() { applyAL(element) }, 50);
    }

    function applyAP(pageShadowEnabled, theme, colorInvert, colorTemp, invertEntirePage) {
        if(document.body) return assombrirPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertEntirePage);
        timeOutAP = setTimeout(function() { applyAP(pageShadowEnabled, theme, colorInvert, colorTemp, invertEntirePage) }, 50);
    }

    function applyIC(colorInvert, invertEntirePage) {
        if(document.body) return invertColor(colorInvert, invertEntirePage);
        timeOutIC = setTimeout(function() { applyIC(colorInvert, invertEntirePage) }, 50);
    }

    function applyBI(tagName, add, type) {
        if(document.body) return detectBackground(tagName, add, type);
        timeOutBI = setTimeout(function() { applyBI(tagName, add, type) }, 50);
    }

    function mutationObserve(type) {
        if(type == "contrast") {
            mut_contrast = new MutationObserver(function(mutations, mut) {
                mut_contrast.disconnect();
                var classList = document.body.classList;
                var containsPageContrast = true;

                for(i=1; i<=nbThemes; i++) {
                    if(i == "1" && !classList.contains("pageShadowContrastBlack")) {
                        var containsPageContrast = false;
                    } else if(!classList.contains("pageShadowContrastBlack" + i)) {
                        var containsPageContrast = false;
                    }
                }

                if(!containsPageContrast) {
                    setTimeout(main("onlycontrast"), 1);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve("contrast");
                    } else {
                        window.onload = function() {
                            mutationObserve("contrast");
                        }
                    }
                }
            });

            mut_contrast.observe(document.body, {
                'attributes': true,
                'subtree': false,
                'childList': false,
                'characterData': false,
                'attributeFilter': ["class"]
            });
        } else if(type == "invert") {
            mut_invert = new MutationObserver(function(mutations, mut) {
                mut_invert.disconnect();
                var classList = document.body.classList;

                if(!classList.contains("pageShadowInvertImageColor") && !classList.contains("pageShadowInvertEntirePage")) {
                    setTimeout(main("onlyInvert"), 1);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve("invert");
                    } else {
                        window.onload = function() {
                            mutationObserve("invert");
                        }
                    }
                }
            });

            mut_invert.observe(document.body, {
                'attributes': true,
                'subtree': false,
                'childList': false,
                'characterData': false,
                'attributeFilter': ["class"]
            });
        } else if(type == "brightness") {
            mut_brightness = new MutationObserver(function(mutations, mut) {
                mut_brightness.disconnect();
                var brightness = document.getElementById("pageShadowLuminositeDiv");
                var nightmode = document.getElementById("pageShadowLuminositeDivNightMode");

                if (!document.body.contains(brightness) && !document.body.contains(nightmode)) {
                    setTimeout(main("onlyBrightness"), 1);
                } else {
                    if(document.readyState == "complete" || document.readyState == "interactive") {
                        mutationObserve("brightness");
                    } else {
                        window.onload = function() {
                            mutationObserve("brightness");
                        }
                    }
                }
            });

            mut_brightness.observe(document.body, {
                'attributes': false,
                'subtree': false,
                'childList': true,
                'characterData': false
            });
        } else if(type == "backgrounds") {
            mut_backgrounds = new MutationObserver(function(mutations, mut) {
                mutations.forEach(function(mutation) {
                    if(mutation.type == "childList") {
                        for(var i = 0; i < mutation.addedNodes.length; i++) {
                            mutationElementsBackgrounds(mutation.addedNodes[i]);
                        }
                    } else if(mutation.type == "attributes") {
                        mutationElementsBackgrounds(mutation.target);
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

    function mutationElementsBackgrounds(element) {
        if(typeof(element.classList) === "undefined" || element.classList == null) {
            return false;
        }

        element.classList.add("pageShadowDisableStyling");

        var computedStyle = window.getComputedStyle(element, null);
        var hasBackgroundImg = computedStyle.getPropertyValue("background").substr(0, 4) == "url(" || computedStyle.getPropertyValue("background-image").substr(0, 4) == "url(";
        var hasClassImg = element.classList.contains("pageShadowHasBackgroundImg");

        if(hasBackgroundImg && !hasClassImg) {
            element.classList.add("pageShadowHasBackgroundImg");
        }

        element.classList.remove("pageShadowDisableStyling");
    }

    function main(type) {
        chrome.storage.local.get(['sitesInterditPageShadow', 'pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert', 'invertEntirePage', 'whiteList', 'colorTemp', 'globallyEnable'], function (result) {
            if(typeof timeOutLum !== "undefined") clearTimeout(timeOutLum);
            if(typeof timeOutAP !== "undefined") clearTimeout(timeOutAP);
            if(typeof timeOutIC !== "undefined") clearTimeout(timeOutIC);
            if(typeof timeOutBI !== "undefined") clearTimeout(timeOutBI);
            if(typeof mut_contrast !== 'undefined') mut_contrast.disconnect();
            if(typeof mut_invert !== 'undefined') mut_invert.disconnect();
            if(typeof mut_brightness !== 'undefined') mut_brightness.disconnect();

            if(type == "reset" || type == "onlyreset") {
                document.body.classList.remove("pageShadowInvertImageColor");
                document.body.classList.remove("pageShadowInvertEntirePage");
                document.getElementsByTagName('html')[0].classList.remove("pageShadowBackground");
                document.body.classList.remove("pageShadowContrastBlackCustom");

                for(i=1; i<=nbThemes; i++) {
                    if(i == "1") {
                        document.body.classList.remove("pageShadowContrastBlack");
                    } else {
                        document.body.classList.remove("pageShadowContrastBlack" + i);
                    }
                }

                if(document.getElementById("pageShadowLuminositeDiv") != null) {
                    document.body.removeChild(document.getElementById("pageShadowLuminositeDiv"));
                }

                if(document.getElementById("pageShadowLuminositeDivNightMode") != null) {
                    document.body.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
                }

                if(type == "onlyreset") {
                    return;
                }
            }

            if(result.globallyEnable !== "false") {
                if(result.sitesInterditPageShadow !== "") {
                    var siteInterdits = result.sitesInterditPageShadow.trim().split("\n");
                } else {
                    var siteInterdits = "";
                }

                var websiteUrl = window.location.href;
                var websuteUrl_tmp = new URL(websiteUrl);
                var domain = websuteUrl_tmp.hostname;

                if(result.whiteList == "true" && strict_in_array(domain, siteInterdits) == true || result.whiteList !== "true" && strict_in_array(domain, siteInterdits) !== true && strict_in_array(websiteUrl, siteInterdits) !== true) {
                    var pageShadowEnabled = result.pageShadowEnabled;
                    var theme = result.theme;
                    var colorInvert = result.colorInvert;
                    var colorTemp = result.colorTemp;
                    var invertEntirePage = result.invertEntirePage;

                    if(type == "onlyContrast") {
                        assombrirPage(pageShadowEnabled, theme, colorInvert, colorTemp, invertEntirePage);
                    } else if(type == "onlyInvert") {
                        invertColor(colorInvert, invertEntirePage);
                    } else if(type == "onlyBrightness") {
                        luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, siteInterdits, colorTemp);
                    } else if(pageShadowEnabled == "true") {
                        applyAP(pageShadowEnabled, theme, colorInvert, colorTemp, invertEntirePage);
                    } else {
                        applyIC(colorInvert, invertEntirePage);
                    }

                    if(type !== "onlyContrast" && type !== "onlyInvert" && type !== "onlyBrightness") {
                        luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, siteInterdits, colorTemp);
                    }

                    if(pageShadowEnabled == "true" || colorInvert == "true") {
                        if(type == "start") {
                            applyDetectBackground("loading", "*", 1, 1);
                        } else {
                            applyDetectBackground(null, "*", 2, 1);
                        }
                    }
                }
            }
        });
    }

    main("start");

    // Execute Page Shadow on the page when the settings have been changed:
    chrome.storage.onChanged.addListener(function() {
        chrome.storage.local.get('liveSettings', function (result) {
            if(result.liveSettings !== "false") {
                main('reset');
            }
        });
    });
}());
