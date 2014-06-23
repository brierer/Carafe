$.fn.serializeObject = function() {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || '');
    } else {
      o[this.name] = this.value || '';
    }
  });
  return o;
};

var eqWrapper = EqWrapper();
var editor;

$(function() {
  initComposent();
  initPollingGetCalcResult();  
})




function initComposent() {

  $("#formulaToggle").click(
    function() {
      if ($('#formula').is(':visible')) {
        $('#formula').hide();
        $("#page-wrapper").css("margin-left", "0px");
      } else {
        $('#formula').show();
        $("#page-wrapper").css("margin-left", "250px");
      }
    }
  );
  $("input").not("[type=submit]").jqBootstrapValidation();
  $('input').keydown(function(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  });
  $("#generator").hide()

  $("#hide-generator").click(function() {
    $("#generator").hide()
  })

  $("#generate_table").click(
    function() {
      $("#generator").show()
    }
  )


  $("#create-generator").click(
    function() {
      addTable($('#generator').serializeObject())
    }
  )
 
  editor = CodeMirror.fromTextArea(document.getElementById("id_equations"), {
    mode: "haskell",
    lineNumbers: true,
    theme: "elegant"

  });

  $("#editor").css("visibility", "visible");

  $("#dashBoardToggle").click(
    function() {
      $("#dashboard").toggle();
    }
  );

  $("#equationToggle").click(
    function() {
      $("form").toggle();
    }
  );





  $("a").dblclick(function() {
    insertAtCursor($(this).attr('title'));
  });

  $(".btn_eval").click(
    function() {
      eqEvaluation();
    });


}


function insertAtCursor(text) {
  var field = document.getElementById("id_equations");

  if (document.selection) {
    var range = document.selection.createRange();

    if (!range || range.parentElement() != field) {
      field.focus();
      range = field.createTextRange();
      range.collapse(false);
    }
    range.text = text;
    range.collapse(false);
    range.select();
  } else {
    field.focus();
    var val = field.value;
    var selStart = field.selectionStart;
    var caretPos = selStart + text.length;
    field.value = val.slice(0, selStart) + text + val.slice(field.selectionEnd);
    field.setSelectionRange(caretPos, caretPos);
  }
}