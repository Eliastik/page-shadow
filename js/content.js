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
            
            appendLum(elLum);
        }
    }
    
    function appendLum(element) {
        if (document.body) return document.body.appendChild(elLum);
        setTimeout(appendLum, 100);
    }
    
    function applyAP() {
        if (document.body) return assombrirPage(theme);
        setTimeout(applyAP, 100);
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
    
    chrome.runtime.sendMessage({method: "getSites"}, function(responseSite) {
        if(responseSite.status != "") {
            var siteInterdits = responseSite.status.split("\n");
            main(siteInterdits);
        }
        else {
            var siteInterdits = "";
            main(siteInterdits);
        }
    });
    
    function main(siteInterdits) {
        chrome.runtime.sendMessage({method: "getStatus"}, function(response) {
            chrome.runtime.sendMessage({method: "getThemeStatus"}, function(responseTheme) {
                chrome.runtime.sendMessage({method: "getInvertColorStatus"}, function(responseColor) {
                    if(response.status == "true" && in_array(window.location.href, siteInterdits) == false) {
                        theme = responseTheme.status; // global
                        colorInvert = responseColor.status; // global
                        applyAP();
                    }
                });
            });
        });

        chrome.runtime.sendMessage({method: "getStatusIfLum"}, function(responseIfLum) {
            chrome.runtime.sendMessage({method: "getStatusLum"}, function(responseNbLum) {
                chrome.runtime.sendMessage({method: "getStatusNightMode"}, function(responseNightMode) {
                    luminositePage(responseIfLum.status, responseNbLum.status, responseNightMode.status, siteInterdits);
                });
            });
        });
    }
}());
