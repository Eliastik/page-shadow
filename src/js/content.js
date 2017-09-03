(function(){
    var nbThemes = 10; // nb of themes

    function assombrirPage(pageShadowEnabled, theme, colorInvert) {
        if(pageShadowEnabled !== null && pageShadowEnabled == "true") {
            if(theme !== null) {
                if(theme == "1") {
                    document.body.classList.add("pageShadowContrastBlack");
                } else {
                    document.body.classList.add("pageShadowContrastBlack" + theme);
                }
            } else {
                document.body.classList.add("pageShadowContrastBlack");
            }
        }

        if(colorInvert !== null && colorInvert == "true") {
            document.body.classList.add("pageShadowInvertImageColor");
        }

        if(document.readyState == "complete") {
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

    function invertColor(enabled) {
        if(enabled !== null && enabled == "true") {
            document.body.classList.add("pageShadowInvertImageColor");

            if(document.readyState == "complete") {
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

    function luminositePage(enabled, pourcentage, nightmode, siteInterdits) {
        var elLum = document.createElement("div");

        if(enabled == "true") {
            elLum.style.display = "block";
            if(nightmode == "true") {
                elLum.setAttribute("id", "pageShadowLuminositeDivNightMode");
            } else {
                elLum.setAttribute("id", "pageShadowLuminositeDiv");
            }
            elLum.style.opacity = pourcentage / 100;

            applyAL(elLum);
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
        if (document.body) return appendLum(element);
        timeOutLum = setTimeout(function() { applyAL(element) }, 50);
    }

    function applyAP(pageShadowEnabled, theme, colorInvert) {
        if (document.body) return assombrirPage(pageShadowEnabled, theme, colorInvert);
        timeOutAP = setTimeout(function() { applyAP(pageShadowEnabled, theme, colorInvert) }, 50);
    }

    function applyIC(colorInvert) {
        if (document.body) return invertColor(colorInvert);
        timeOutIC = setTimeout(function() { applyIC(colorInvert) }, 50);
    }

    function mutationObserve(type) {
        if(type == "contrast") {
            mut_contrast = new MutationObserver(function(mutations, mut){
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

                if(containsPageContrast == false || classList.contains("pageShadowInvertImageColor") == false) {
                    setTimeout(main("onlycontrast"), 1);
                }
            });
            mut_contrast.observe(document.body, {
                'attributes': true,
                'subtree': false,
                'childList': false,
                'attributeFilter': ["class"]
            });
        } else if(type == "invert") {
            mut_invert = new MutationObserver(function(mutations, mut){
                mut_invert.disconnect();
                var classList = document.body.classList;

                if(classList.contains("pageShadowInvertImageColor") == false) {
                    setTimeout(main("onlyInvert"), 1);
                }
            });
            mut_invert.observe(document.body, {
                'attributes': true,
                'subtree': false,
                'childList': false,
                'attributeFilter': ["class"]
            });
        }
    }

    function main(type) {
        chrome.storage.local.get(['sitesInterditPageShadow', 'pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert'], function (result) {
            if(typeof timeOutLum !== "undefined") clearTimeout(timeOutLum);
            if(typeof timeOutAP !== "undefined") clearTimeout(timeOutAP);
            if(typeof timeOutIC !== "undefined") clearTimeout(timeOutIC);
            if(typeof mut_contrast !== 'undefined') mut_contrast.disconnect();
            if(typeof mut_invert !== 'undefined') mut_invert.disconnect();

            if(type == "reset" || type == "onlyreset") {
                document.body.classList.remove("pageShadowInvertImageColor");

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

            if(strict_in_array(domain, siteInterdits) !== true && strict_in_array(websiteUrl, siteInterdits) !== true) {
                var pageShadowEnabled = result.pageShadowEnabled;
                var theme = result.theme;
                var colorInvert = result.colorInvert;

                if(type == "onlyContrast") {
                    assombrirPage(pageShadowEnabled, theme, colorInvert);
                } else if(type == "onlyInvert") {
                    invertColor(colorInvert);
                } else if(pageShadowEnabled == "true") {
                    applyAP(pageShadowEnabled, theme, colorInvert);
                } else {
                    applyIC(colorInvert);
                }

                if(type !== "onlyContrast" && type !== "onlyInvert") {
                    luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, siteInterdits);
                }
            }
        });
    }

    main();

    // Execute Page Shadow on the page when the settings have been changed:
    chrome.storage.onChanged.addListener(function() {
        chrome.storage.local.get('liveSettings', function (result) {
            if(result.liveSettings == "true") {
                main('reset');
            }
        });
    });
}());
