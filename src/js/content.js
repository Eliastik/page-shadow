(function(){
    function assombrirPage(themeContrast) {
        if(theme != null) {
            if(theme == "1") {
                document.body.classList.add("pageShadowContrastBlack");
            } else {
                document.body.classList.add("pageShadowContrastBlack" + themeContrast);
            }
        } else {
            document.body.classList.add("pageShadowContrastBlack");
        }

        if(colorInvert != null && colorInvert == "true") {
            document.body.classList.add("pageShadowInvertImageColor");
        }
        
        if(typeof timeOutAP !== "undefined") {
            clearTimeout(timeOutAP)
        }
    
        window.onload = function() {
            var mut = new MutationObserver(function(mutations, mut){
                mutations.forEach(function(mutation) {
                    if(mutation.attributeName == "class") {
                        main("onlyContrast");
                    }
                });
            });
            mut.observe(document.querySelector("body"),{
              'attributes': true
            });
        }
    }

    function invertColor(enabled) {
        if(colorInvert != null && colorInvert == "true") {
            document.body.classList.add("pageShadowInvertImageColor");
        }
        
        if(typeof timeOutIC !== "undefined") {
            clearTimeout(timeOutIC)
        }
        
        window.onload = function() {
            var mut = new MutationObserver(function(mutations, mut){
                mutations.forEach(function(mutation) {
                    if(mutation.attributeName == "class") {
                        main("onlyContrast");
                    }
                });
            });
            mut.observe(document.querySelector("body"),{
              'attributes': true
            });
        }
    }

    function luminositePage(enabled, pourcentage, nightmode, siteInterdits) {
        if(enabled == "true" && in_array(window.location.href, siteInterdits) == false) {
            elLum = document.createElement("div");
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
        document.body.appendChild(elLum)
        
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

    function in_array(needle, haystack) {
        var key = '';
            for (key in haystack) {
                if (needle.indexOf(haystack[key]) != -1) {
                    return true;
                }
            }
        return false;
    }

    function main(type) {
        chrome.storage.local.get(['sitesInterditPageShadow', 'pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert'], function (result) {
            if(result.sitesInterditPageShadow != "") {
                var siteInterdits = result.sitesInterditPageShadow.split("\n");
            }
            else {
                var siteInterdits = "";
            }
            
            if(result.pageShadowEnabled == "true" && in_array(window.location.href, siteInterdits) == false) {
                theme = result.theme; // global
                colorInvert = result.colorInvert; // global
                applyAP();
            } else if(in_array(window.location.href, siteInterdits) == false) {
                colorInvert = result.colorInvert; // global
                applyIC();
            }
            
            if(type !== "onlyContrast") {
                luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, siteInterdits);
            }
        });
    }

    main();
}());
