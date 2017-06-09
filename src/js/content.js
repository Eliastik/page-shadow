(function(){
    function assombrirPage(themeContrast) {
        if(theme != null) {
            if(theme == "1") {
                $("body").addClass("pageShadowContrastBlack");
            } else {
                $("body").addClass("pageShadowContrastBlack" + themeContrast);
            }
        } else {
            $("body").addClass("pageShadowContrastBlack");
        }

        if(colorInvert != null && colorInvert == "true") {
            $("body").addClass("pageShadowInvertImageColor");
        }
        
        if(typeof timeOutAP !== "undefined") {
            clearTimeout(timeOutAP)
        }
    }

    function invertColor(enabled) {
        if(colorInvert != null && colorInvert == "true") {
            $("body").addClass("pageShadowInvertImageColor");
        }
        
        if(typeof timeOutIC !== "undefined") {
            clearTimeout(timeOutIC)
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

    chrome.storage.local.get('sitesInterditPageShadow', function (result) {
        if(result.sitesInterditPageShadow != "") {
            var siteInterdits = result.sitesInterditPageShadow.split("\n");
            main(siteInterdits);
        }
        else {
            var siteInterdits = "";
            main(siteInterdits);
        }
    });

    function main(siteInterdits) {
        chrome.storage.local.get(['pageShadowEnabled', 'theme', 'pageLumEnabled', 'pourcentageLum', 'nightModeEnabled', 'colorInvert'], function (result) {
            if(result.pageShadowEnabled == "true" && in_array(window.location.href, siteInterdits) == false) {
                theme = result.theme; // global
                colorInvert = result.colorInvert; // global
                applyAP();
            } else if(in_array(window.location.href, siteInterdits) == false) {
                colorInvert = result.colorInvert; // global
                applyIC();
            }
            luminositePage(result.pageLumEnabled, result.pourcentageLum, result.nightModeEnabled, siteInterdits);
        });
    }
}());
