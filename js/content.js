(function(){
    function assombrirPage() {
        $("body").addClass("pageShadowContrastBlack");
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
            document.body.appendChild(elLum);
        }
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
            if(response.status == "true" && in_array(window.location.href, siteInterdits) == false) {
                assombrirPage();
                document.addEventListener('DOMNodeInserted', assombrirPage);
            }
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
