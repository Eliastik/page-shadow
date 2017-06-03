chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getStatus")
      sendResponse({status: localStorage['pageShadowEnabled']});
    else if(request.method == "getSites") {
		sendResponse({status: localStorage['sitesInterditPageShadow']});
	}
	else if(request.method == "getStatusIfLum") {
		sendResponse({status: localStorage['pageLumEnabled']});
	}
	else if(request.method == "getStatusLum") {
		sendResponse({status: localStorage['pourcentageLum']});
	}
	else
      sendResponse({}); // snub them.
});
(function(){
	if(localStorage.getItem("pageShadowEnabled") == null) {
		localStorage.setItem("pageShadowEnabled", "false");
	}
	
	if(localStorage.getItem("pageLumEnabled") == null) {
		localStorage.setItem("pageLumEnabled", "false");
	}
	
	if(localStorage.getItem("pourcentageLum") == null) {
		localStorage.setItem("pourcentageLum", "15");
	}
	
	if(localStorage.getItem("sitesInterditPageShadow") == null) {
		localStorage.setItem("sitesInterditPageShadow", "");
	}
}());