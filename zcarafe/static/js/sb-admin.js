var frameSrc = "/profil";
$(function() { 
    $('.update-modal').click(function() {

         $('iframe').attr("src",$(this).attr("data-href"));
        $('#myModal').on('show', function () {
       
    });
    $('#myModal').modal({show:true})


$('#btn-update-book').click(function(){
document.getElementById('frame-update').contentWindow.update();
 location.reload();
})

   
});});