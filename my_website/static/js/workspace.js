var isCalculatingWaiting = false;

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

var editor
$(function() {
  editor = CodeMirror.fromTextArea(document.getElementById("id_formulas"), {
    mode: "haskell",
    lineNumbers: true,
    theme: "elegant"

  });
  $("#editor").css("visibility","visible");
  eqEvaluation();
})

var startTime = new Date().getTime();


  function eqEvaluation() {
    startTime = new Date().getTime();
    editor.save();
    var formData = $("form").serialize();
    isCalculatingWaiting = true;
    $.post('postCalcResult', formData, function() {
      initPollingGetCalcResult();
    });
  };


function initPollingGetCalcResult() {
  setTimeout(function() {
    pollingServerCalcGetResult(0);
  }, 500);
}

function pollingServerCalcGetResult(nbTry) {
  if (nbTry < 5) {
  var id_form = $("#id_form_id").serialize();
  var id_book = $("#id_book_id").serialize();
    $.get('getCalcResult/?'+id_form, function(data, status) {
      var now = new Date().getTime();
      var timesRun = nbTry;
      console.log('Action ' + (timesRun + 1) + ' started ' + (now - startTime) + 'ms after script start');
      if (data != null) {
        displayData(data);
        isCalculatingWaiting = false;
      } else {
        setTimeout(function() {
          pollingServerCalcGetResult(nbTry + 1)
        }, 500);
      }
    });
  } else {
    alert("Hummm, this is fucking long");
    isCalculatingWaiting = false;
  }
}

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


function setDraggableWidget() {
  $(".ui-widget-content").draggable({
    containment: "parent"
  });
}



function displayChart(chart) {
  chart.forEach(function(entry) {
    $("#containment-wrapper").append("<div id='chart1' class='chart'></div>")
    var chartData = []
    var i = 0;

    entry['data'].forEach(function(d) {

      i++;
      chartData.push({
        year: "" + (2008 + i),
        value: d
      });
    });


    new Morris.Line({
      // ID of the element in which to draw the chart.
      element: 'chart1',
      // Chart data records -- each entry in this array corresponds to a point on
      // the chart.
      data: chartData,
      // The name of the data record attribute that contains x-values.
      xkey: 'year',
      // A list of names of data record attributes that contain y-values.
      ykeys: ['value'],
      // Labels for the ykeys -- will be displayed when you hover over the
      // chart.
    });
  });
}



$("#test").click(
  function() {
    $("#containment-wrapper").empty();
    var formData = $("form").serialize();
    $.post('test', formData, function(data, status) {
      displayData(data);
    });
  }
);

function displayData(data) {
  var html = "";
  html += displayAllTable(data[0]);
  $("#containment-wrapper").html(html);
  setDraggableWidget();
  displayChart(data[1]);
  setWidgetEvent();

}

function setWidgetEvent(){
  $("th").dblclick(function () {
    alert("salut");
  })
}

function displayAllTable(tables) {
  var html = "";
  $.each(tables, function(i, table) {
    html += displayOneTable(table);
  });
  return html;
};

function displayOneTable(table) {
  var html = '<table class="ui-widget-content draggable table table-bordered table-hover table-striped" style="width: 179px;"><thead style="width: 179px;"><tr>'

  $.each(table[0], function(i, col) {
    html += displayOneCol(col);
  });

  html += '</tr></thead><tbody>'

  $.each(table, function(i, col) {
    html += displayOneColVal(col);
  });

  html += '</tbody></table>'
  return html;

};

function displayOneColVal(col) {
  var html = '<tr style="width: 20px;">'
  $.each(col, function(i, value) {
    html += '<td style="width: 20px;">' + value + '</td>';
  });
  html += '</tr>';
  return html;
};


function displayOneCol(col) {
  var html = '<th style="width: 20px;">Col</th>'
  return html
};

function insertAtCursor(text) {
  var field = document.getElementById("id_formulas");

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

$("a").dblclick(function() {
  insertAtCursor($(this).attr('title'));
});

$("#btn_eval").click(
  function() {
    eqEvaluation();
  });