(function(){
    var nbThemes = 10; // nb of themes

    function assombrirPage(themeContrast) {
        if(pageShadowEnabled != null && pageShadowEnabled == "true") {
            if(theme != null) {
                if(theme == "1") {
                    document.body.classList.add("pageShadowContrastBlack");
                } else {
                    document.body.classList.add("pageShadowContrastBlack" + themeContrast);
                }
            } else {
                document.body.classList.add("pageShadowContrastBlack");
            }
        }

        if(colorInvert != null && colorInvert == "true") {
            document.body.classList.add("pageShadowInvertImageColor");
        }

        window.onload = function() {
            var mut = new MutationObserver(function(mutations, mut){
                var classList = document.body.classList;
                var containsPageContrast = true;

                for(i=1; i<=nbThemes; i++) {
                    if(i == "1" && !classList.contains("pageShadowContrastBlack")) {
                        var containsPageContrast = false;
                    } else if(!classList.contains("pageShadowContrastBlack" + i)) {
                        var containsPageContrast = false;
                    }
                }

                if(mutation.attributeName == "class" && containsPageContrast == false || mutation.attributeName == "class" && classList.contains("pageShadowInvertImageColor") == false) {
                    main("onlycontrast");
                }
            });
            mut.observe(document.body,{
              'attributes': true,
              'subtree': false,
              'childList': false,
              'attributeFilter': ["class"]
            });
        }

        if(typeof timeOutAP !== "undefined") {
            clearTimeout(timeOutAP)
        }
    }

    function invertColor(enabled) {
        if(colorInvert != null && colorInvert == "true") {
            document.body.classList.add("pageShadowInvertImageColor");

            window.onload = function() {
                var mut = new MutationObserver(function(mutations, mut){
                    var classList = document.body.classList;
                    var containsPageContrast = true;

                    for(i=1; i<=nbThemes; i++) {
                        if(i == "1" && !classList.contains("pageShadowContrastBlack")) {
                            var containsPageContrast = false;
                        } else if(!classList.contains("pageShadowContrastBlack" + i)) {
                            var containsPageContrast = false;
                        }
                    }

                    if(mutation.attributeName == "class" && containsPageContrast == false || mutation.attributeName == "class" && classList.contains("pageShadowInvertImageColor") == false) {
                        main("onlycontrast");
                    }
                });
                mut.observe(document.body,{
                  'attributes': true,
                  'subtree': false,
                  'childList': false,
                  'attributeFilter': ["class"]
                });
            }
        }

        if(typeof timeOutIC !== "undefined") {
            clearTimeout(timeOutIC)
        }
    }

    function luminositePage(enabled, pourcentage, nightmode, siteInterdits) {
        elLum = document.createElement("div");

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

    function appendLum() {
        if(document.getElementById("pageShadowLuminositeDiv") != null) {
            document.body.removeChild(document.getElementById("pageShadowLuminositeDiv"));
        }

        if(document.getElementById("pageShadowLuminositeDivNightMode") != null) {
            document.body.removeChild(document.getElementById("pageShadowLuminositeDivNightMode"));
        }

        document.body.appendChild(elLum);

        if(typeof timeOutLum !== "undefined") {
            clearTimeout(timeOutLum)
        }
    }

    function applyAL(element) {
        if (document.body) return appendLum();
        timeOutLum = setTimeout(applyAL, 50);
    }

    function applyAP() {
        if (document.body) return assombrirPage(theme);
        timeOutAP = setTimeout(applyAP, 50);
    }

    function applyIC() {
        if (document.body) return invertColor(colorInvert);
        timeOutIC = setTimeout(applyIC, 50);
    }

    function main(type) {
        chrome.storage.local.get(['sitesInterditPageShadow', 'pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert'], function (result) {
            if(typeof timeOutLum !== "undefined") clearTimeout(timeOutLum);
            if(typeof timeOutAP !== "undefined") clearTimeout(timeOutAP);
            if(typeof timeOutIC !== "undefined") clearTimeout(timeOutIC);
            
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
                if(result.pageShadowEnabled == "true") {
                    pageShadowEnabled = result.pageShadowEnabled; // global
                    theme = result.theme; // global
                    colorInvert = result.colorInvert; // global
                    applyAP();
                } else {
                    pageShadowEnabled = result.pageShadowEnabled; // global
                    colorInvert = result.colorInvert; // global
                    applyIC();
                }

                if(type !== "onlyContrast") {
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
