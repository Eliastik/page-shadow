/* Page Shadow
 *
 * Copyright (C) 2015-2017 Eliastik (eliastiksofts.com)
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

    var style = document.createElement('style');
    style.type = 'text/css';
    var backgroundImagesDetected = 0;
    var timeOutLum, timeOutAP, timeOutIC, timeOutBI;

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
        chrome.storage.local.get(['customThemeBg', 'customThemeTexts', 'customThemeLinks', 'customThemeLinksVisited', 'customThemeFont'], function (result) {
            if(typeof result.customThemeBg !== "undefined" && typeof result.customThemeBg !== null) {
                var backgroundTheme = result.customThemeBg;
            } else {
                var backgroundTheme = defaultBGColorCustomTheme;
            }

            if(typeof result.customThemeTexts !== "undefined" && typeof result.customThemeTexts !== null) {
                var textsColorTheme = result.customThemeTexts;
            } else {
                var textsColorTheme = defaultTextsColorCustomTheme;
            }

            if(typeof result.customThemeLinks !== "undefined" && typeof result.customThemeLinks !== null) {
                var linksColorTheme = result.customThemeLinks;
            } else {
                var linksColorTheme = defaultLinksColorCustomTheme;
            }
            
            if(typeof result.customThemeLinksVisited !== "undefined" && typeof result.customThemeLinksVisited !== null) {
                var linksVisitedColorTheme = result.customThemeLinksVisited;
            } else {
                var linksVisitedColorTheme = defaultVisitedLinksColorCustomTheme;
            }
            
            if(typeof result.customThemeFont !== "undefined" && typeof result.customThemeFont !== null && result.customThemeFont.trim() !== "") {
                var fontTheme = '"' + result.customThemeFont + '"';
            } else {
                var fontTheme = defaultFontCustomTheme;
            }

            if(document.getElementsByTagName('head')[0].contains(style)) { // remove style element
                document.getElementsByTagName('head')[0].removeChild(style);
            }

            // append style element
            document.getElementsByTagName('head')[0].appendChild(style);

            if(style.cssRules) { // remove all rules
                for(var i=0; i < style.cssRules.length; i++) {
                    style.sheet.deleteRule(i);
                }
            }

            // create rules
            style.sheet.insertRule(".pageShadowContrastBlackCustom { background: #"+ backgroundTheme +" !important; background-image: url(); }", 0);
            style.sheet.insertRule(".pageShadowContrastBlackCustom *:not(select):not(ins):not(del):not(mark):not(a):not(img):not(svg):not(yt-icon) { background-color: #"+ backgroundTheme +" !important; color: #"+ textsColorTheme +" !important; }", 0);
            style.sheet.insertRule(".pageShadowContrastBlackCustom * {  font-family: " + fontTheme + " !important; }", 0);
            style.sheet.insertRule(".pageShadowContrastBlackCustom :not(.pageShadowInvertImageColor) svg { color: #"+ textsColorTheme +" !important; }", 0);
            style.sheet.insertRule(".pageShadowContrastBlackCustom a { background-color: #"+ backgroundTheme +" !important; color: #"+ linksColorTheme +" !important; }", 0);
            style.sheet.insertRule(".pageShadowContrastBlackCustom a:visited:not(#linkNotVisited), .pageShadowContrastBlackCustom #linkVisited { background-color: #"+ backgroundTheme +" !important; color: #"+ linksVisitedColorTheme +" !important; }", 0);
        });
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

    function detectBackgroundImages(tagName) {
        var elements = document.body.getElementsByTagName(tagName);
        var computedStyle = null;

        for (var i = 0; i < elements.length; i++) {
            var computedStyle = window.getComputedStyle(elements[i], null);
            var hasBackground = computedStyle.getPropertyValue("background").substr(0, 4) == "url(" || computedStyle.getPropertyValue("background-image").substr(0, 4) == "url(";
            var hasClass = elements[i].classList.contains("pageShadowHasBackgroundImg");

            if(hasBackground && !hasClass) {
                elements[i].classList.add("pageShadowHasBackgroundImg");
            }
        }

        backgroundImagesDetected++;
    }

    function applyDetectBackgroundImages(type) {
        if(backgroundImagesDetected < 2) {
            if(type == "loading") {
                document.onreadystatechange = function() {
                    // when DOM loaded
                    if (document.readyState === 'interactive') {
                        setTimeout(function() { applyBI("*"); }, 1); // detect for all the elements of the page
                    }
                    // after loading complete
                    if (document.readyState === 'complete') {
                        setTimeout(function() { applyBI("*"); }, 1); // detect for all the elements of the page
                    }
                };
            } else {
                if (document.readyState === 'complete') {
                    setTimeout(function() { applyBI("*"); }, 1); // detect for all the elements of the page
                    backgroundImagesDetected = 2;
                } else {
                    applyDetectBackgroundImages("loading");
                }
            }
        }
    }

    function luminositePage(enabled, pourcentage, nightmode, siteInterdits, colorTemp) {
        var elLum = document.createElement("div");
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

    function applyBI(tagName) {
        if(document.body) return detectBackgroundImages(tagName);
        timeOutBI = setTimeout(function() { applyBI(tagName) }, 50);
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
        }
    }

    function main(type) {
        chrome.storage.local.get(['sitesInterditPageShadow', 'pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert', 'invertEntirePage', 'whiteList', 'colorTemp'], function (result) {
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


                if(colorInvert == "true") {
                    if(type == "start") {
                        applyDetectBackgroundImages("loading");
                    } else {
                        applyDetectBackgroundImages();
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
