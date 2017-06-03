chrome.runtime.sendMessage({method: "getStatus"}, function(response) { // on vérifie le localstorage du background.js
  chrome.runtime.sendMessage({method: "getSites"}, function(responseSite) { // on vérifie le localstorage du background.js
    function in_array(needle, haystack) {
	var key = '';
		for (key in haystack) {
		  if (needle.indexOf(haystack[key]) != -1) {
			return true;
		  }
		}
	  return false;
	}
	function assombrirPage() {
		$("body").addClass("pageShadowContrastBlack");
	}
	
	if(responseSite.status != "") {
		var siteInterdits = responseSite.status.split("\n");
	}
	else {
		var siteInterdits = "";
	}
	
	if(response.status == "true" && in_array(window.location.href, siteInterdits) == false) { // si c'est OK
			assombrirPage();
			document.addEventListener('DOMNodeInserted', assombrirPage);
	}
	
	chrome.runtime.sendMessage({method: "getStatusIfLum"}, function(responseIfLum) { // on vérifie le localstorage du background.js
		if(responseIfLum.status == "true" && in_array(window.location.href, siteInterdits) == false) { // si c'est OK
				chrome.runtime.sendMessage({method: "getStatusLum"}, function(responseNbLum) {
					elLumB = document.createElement("div");
					elLumB.setAttribute("id", "pageShadowLuminositeDiv");
					elLumB.style.opacity = responseNbLum.status / 100;
					document.body.appendChild(elLumB);
				});
		}
	});
  });
});