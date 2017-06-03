$(document).ready(function() {
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
	
	$("#helpAssom").click(function() {
		$("#assomInfos").fadeToggle();
	});
	
	$("#helpLum").click(function() {
		$("#lumInfos").fadeToggle();
	});
	
	$( "#checkAssomPage" ).change(function() {
		if($(this).is(':checked') == true) {
			localStorage.setItem("pageShadowEnabled", "true");
			$("body").css("background", "black");
			$("body").css("color", "white");
			$("a").css("color", "lighblue");
		}
		else {
			localStorage.setItem("pageShadowEnabled", "false");
			$("body").css("background", "white");
			$("body").css("color", "black");
		}
	});
	
	$( "#checkLuminositePage" ).change(function() {
		if($(this).is(':checked') == true) {
			localStorage.setItem("pageLumEnabled", "true");
			$("#sliderLuminositeDiv").show();
			elLumB = document.createElement("div");
			elLumB.setAttribute("id", "pageShadowLuminositeDiv");
			elLumB.style.opacity = localStorage.getItem("pourcentageLum") / 100;
			document.body.appendChild(elLumB);
			$("#sliderLuminositeDiv").fadeIn();
		}
		else {
			localStorage.setItem("pageLumEnabled", "false");
			$("#sliderLuminositeDiv").fadeOut();
			elLumB.style.display = "none";
		}
	});
	
	$("#sliderLuminosite").change(function() {
		$("#sliderLumOutput").val(document.getElementById("sliderLuminosite").valueAsNumber);
		if(elLumB != null) {
			elLumB.style.opacity = document.getElementById("sliderLuminosite").valueAsNumber / 100;
		}
		localStorage.setItem("pourcentageLum", document.getElementById("sliderLuminosite").valueAsNumber);
	});
	
	if(localStorage.getItem("pageShadowEnabled") == "true") {
		$("#checkAssomPage").attr("checked", "checked");
		$("body").css("background", "black");
		$("body").css("color", "white");
		$("a").css("color", "lighblue");
	}
	
	if(localStorage.getItem("pageLumEnabled") == "true") {
		$("#checkLuminositePage").attr("checked", "checked");
		$("#sliderLuminositeDiv").show();
			if(localStorage.getItem("pourcentageLum") != null) {
				elLumB = document.createElement("div");
				elLumB.setAttribute("id", "pageShadowLuminositeDiv");
				elLumB.style.opacity = localStorage.getItem("pourcentageLum") / 100;
				document.body.appendChild(elLumB);
			}
	}
	
	if(localStorage.getItem("pourcentageLum") != null) {
		$("#sliderLumOutput").val(localStorage.getItem("pourcentageLum"));
		$("#sliderLuminosite").val(localStorage.getItem("pourcentageLum"));
	}
});