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

  $("#editor").css("visibility", "visible");
  initPollingGetCalcResult();
})

var startTime = new Date().getTime();


function eqEvaluation() {
  $('#invisible-wrapper').css("visibility", "visible");
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
    $.get('getCalcResult/?' + id_form, function(data, status) {
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


function setWidget() {
  setDraggableWidget();
  setIconTable();
}



function setIconTable() {
  $("th").find("i").click(function(e) {

    var $contextMenu = $("#contextMenu");


    $contextMenu.css({
      display: "block",
      left: e.pageX,
      top: e.pageY
    });


    $contextMenu.on("click", "a", function() {
      $contextMenu.hide();
    });
    var contextVisible = false;

    $("#dashboard").click(function() {
      if (contextVisible) {
        $contextMenu.hide();
        contextVisible = false;
        $("#dashboard").unbind();
      } else {
        contextVisible = true;
      }
    });

  });


  $("th").mouseover(function() {
    $(this).find("i").removeClass("hidden");
  });
  $("th").mouseout(function() {
    $(this).find("i").addClass("hidden");
  });

}

function setDraggableWidget() {
  $(".ui-widget-content").draggable({
    containment: "parent",
    handle: "thead" 
  });
}


function validateChartParameter(p){
  if (p.title == undefined)  
    (p.title = "")
  if (p.color == undefined)
    (p.color = "steelblue")
      
  return p  
}

function displayChart(chart) {
  var p = validateChartParameter(chart.p);

   $("#containment-wrapper").append("<div class='chart-container ui-widget-content draggable'><div class='chart-title'></div><div id='y_axis'></div><div id='chart' class='chart'></div><div id='x_axis'></div></div>")
    var chartData = []
    

    $(chart.y).each(function(i) {
      chartData.push({
        x: chart.x[i],
        y: chart.y[i]
      });
    });

var format = function(n) {
  return n.toFixed(2);
}

var graph = new Rickshaw.Graph( {
    element: document.querySelector("#chart"),  
    renderer: 'lineplot',
    height: 250,
    width: 300,
    series: [{
        color: p.color,
        data: chartData,
        name: 'y'
    }]
});

var x_ticks = new Rickshaw.Graph.Axis.X( {
  graph: graph,
  grid: false,
  orientation: 'bottom',
  element: document.getElementById('x_axis'),
  tickFormat: Rickshaw.Fixtures.Number.formatKMBT
} );

var y_ticks = new Rickshaw.Graph.Axis.Y( {
  graph: graph,
  grid: false,
  scale: chart.y,
  orientation: 'left',
  tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
  element: document.getElementById('y_axis'),
} );


var hoverDetail = new Rickshaw.Graph.HoverDetail( {
  graph: graph,
  formatter: function(series, x, y) {
    var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
    var content = swatch + series.name + ": " + (y) + '<br>';
    return content;
  }
} );
graph.render();
  $(".chart-title").html(p.title);   
}


function displayData(data) {
  if (data.statut == "ok")
  {
    displayResult(data.res);
  }else if (data.statut == 'tko' ){
    displayBadEval(data);
  }else if (data.statut == 'ko'){
    displayError(data);
  }
}


function displayError(data) {
  var html = "";
  html += data.res;
  html += "<br/>"
  html += JSON.stringify(data.stack);
  $("#containment-wrapper").html(html);
}

function displayBadEval(data) {
  var html = "";
  html += data.res;
  html += "<br/>"
  html += JSON.stringify(data.stack);
  $("#containment-wrapper").html(html);
}

function displayResult(data) {
  var html = "";
  $("#containment-wrapper").html(html);
  $(data).each(function(d) {
    if (this instanceof Array) {
      var table = validateTableWithArray(this);
      displayOneTable(table);
    }
    if (this.type == 'graph') {
        displayChart(this);
    }
    if (this.type == 'table') { 
        displayOneTable(this);
    }
  })


  setWidget();
  $('#invisible-wrapper').css("visibility", "hidden");

}

function validateTableWithArray(data){
  var table = {data:data,p:{col:[]}}
  $.each(table.data, function(i, col) {
    table.p.col = true;
  });
  return table;
}  


function displayOneTable(table) {
   $("#containment-wrapper").append("<div class='table-container ui-widget-content draggable'><div class='handsontable-wrapper'></div<</div>")  


  var widthTable = Math.min(75*table.data[0].length,750);
  
  $('#containment-wrapper div').last().outerWidth(widthTable);
  
  $('#containment-wrapper div.handsontable-wrapper').last().handsontable({
    data: table.data,
    colHeaders: table.p.col,
    minSpareRows: 1,
    contextMenu: true,
    stretchH: 'all',
    width: widthTable,
  });
};

function displayCells(col) {
  var html = '<tr style="width: 20px;">'
  $.each(col, function(i, value) {
    html += '<td style="width: 20px;">' + value + '</td>';
  });
  html += '</tr>';
  return html;
};


function displayOneCol(col) {
  var html = '<th style="width: 20px;">'+col+'<i class="hidden fa fa-sort-asc pull-right" ></th>'
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



