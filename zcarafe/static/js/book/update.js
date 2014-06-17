$(function(){
   $('#btn-send').click(function(){
   	var $form = $('form').first();
    $.post($(this).attr('action'), $form.serialize(), function(response){
           alert("salut")
    },'json');
    return false;
   });

});

  function update(){
   	var $form = $('form').first();
    $.post($(this).attr('action'), $form.serialize(), function(response){
          
    },'json'); 
 }