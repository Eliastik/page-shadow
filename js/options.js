$(document).ready(function() {
    $( "#validerButton" ).click(function() {
        localStorage.setItem("sitesInterditPageShadow", $("#textareaAssomPage").val());
        $('#saved').modal("show");
    });

    if(localStorage.getItem("sitesInterditPageShadow") != null) {
        $("#textareaAssomPage").val(localStorage.getItem("sitesInterditPageShadow"));
    }
    
    $('span[data-toggle="tooltip"]').tooltip({
        animated: 'fade',
        placement: 'bottom',
        trigger: 'click',
        placement: 'top'
    });
});
