$(document).ready(function() {
	$( "#validerButton" ).click(function() {
		localStorage.setItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
		alert("Paramètres sauvegardés !")
	});
	if(localStorage.getItem("sitesInterditPageShadow") != null) {
		$("#textareaAssomPage").val(localStorage.getItem("sitesInterditPageShadow"));
	}
	$("#helpImg").click(function() {
		$("#aide").fadeToggle();
	});
	$("#aboutImg").click(function() {
		$("#about").fadeToggle();
	});
});