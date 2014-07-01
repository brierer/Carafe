function validateChartParameter(p) {
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

  var graph = new Rickshaw.Graph({
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

  var x_ticks = new Rickshaw.Graph.Axis.X({
    graph: graph,
    grid: false,
    orientation: 'bottom',
    element: document.getElementById('x_axis'),
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT
  });

  var y_ticks = new Rickshaw.Graph.Axis.Y({
    graph: graph,
    grid: false,
    scale: chart.y,
    orientation: 'left',
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
    element: document.getElementById('y_axis'),
  });


  var hoverDetail = new Rickshaw.Graph.HoverDetail({
    graph: graph,
    formatter: function(series, x, y) {
      var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
      var content = swatch + series.name + ": " + (y) + '<br>';
      return content;
    }
  });
  graph.render();
  $(".chart-title").html(p.title);
}


function displayData(data) {
  if (data.parse !== undefined) {
    updateEditorText()
    if (data.eval.statut == "ok") {
      displayResult(data.parse, data.eval.res);
    } else if (data.statut == 'tko') {
      displayBadEval(data.eval);
    } else if (data.statut == 'ko') {
      displayError(data.eval);
    }
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

function displayResult(parse, data) {
  var html = "";
  $("#containment-wrapper").html(html);
  $(data).each(function(id, d) {
    if (this instanceof Array) {
      var table = validateTableWithArray(this);
      displayOneTable(parse, table, id);
    }
    if (this.type == 'graph') {
      displayChart(this);
    }
    if (this.type == 'table') {
      displayOneTable(parse, this, id);
    }
  })


  setWidget();
  $('#invisible-wrapper').css("visibility", "hidden");

}

function validateTableWithArray(data) {
  var table = {
    data: data,
    p: {
      col: []
    }
  }
  $.each(table.data, function(i, col) {
    table.p.col = true;
  });
  return table;
}


function displayOneTable(parse, table, id) {
  $("#containment-wrapper").append("<div class='table-container ui-widget-content draggable'><div class='handsontable-wrapper'></div<</div>")


  var widthTable = Math.min(75 * table.data[0].length, 750);

  $('#containment-wrapper div').last().outerWidth(widthTable);
  var tableAdd = $('#containment-wrapper div.handsontable-wrapper').last()

  tableAdd.handsontable({
    data: table.data,
    colHeaders: table.p.col == null ? true : table.p.col,
    minSpareRows: 1,
    contextMenu: true,
    stretchH: 'all',
    width: widthTable,
    cells: function(row, col, prop) {
      var cellProperties = {};
      cellProperties.readOnly = isColReadOnly(row, col, parse, id);
      return cellProperties;
    },
    afterChange: function(hooks) {
      var table = this
      if (hooks != null) {
        hooks.forEach(function(hook, i) {
          table.getDataAtCol(hook[1])


          if (!(hook[3] == null || hook[3] == "" && table.getDataAtCol(hook[1]).length - 1 == hook[0])) {
            for (var i = 0; i < hook[0]; i++) {
              if (table.getDataAtCell(i, hook[1]) == null && i < table.countRows() - 1) {
                table.setDataAtCell(i, hook[1], "")
              }
            }

            changeValue({
              'row': hook[0],
              'col': hook[1],
              'old': hook[2],
              'new': hook[3]
            }, parse, id);
            updateEditorText()
          }
          var cells = table.getDataAtRow(table.countRows() - 1);
          cells.forEach(function(val, i) {
            if (val == "") {
              table.setDataAtCell(table.countRows() - 1, i, null)
            }
          })

        })
      }
    },
    afterRemoveRow: function(hook) {

      var gt = hook >= this.countRows()

      var rowToDelete = gt ? hook : hook
      removeRow(rowToDelete, parse, id);
      updateEditorText()
    }

  });

};

function updateEditorText() {
  editor.getDoc().setValue(eqWrapper.toStr());
  editor.save();
}

function displayCells(col) {
  var html = '<tr style="width: 20px;">'
  $.each(col, function(i, value) {
    html += '<td style="width: 20px;">' + value + '</td>';
  });
  html += '</tr>';
  return html;
};


function displayOneCol(col) {
  var html = '<th style="width: 20px;">' + col + '<i class="hidden fa fa-sort-asc pull-right" ></th>'
  return html
};

function setWidget() {
  setDraggableWidget();
  setIconTable();
}

function setDraggableWidget() {
  $(".ui-widget-content").draggable({
    containment: "parent",
    handle: "thead"
  });
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

function addTable(param) {
  var id = $(".table-container").length
  var nbCol = Number(param["nb-col"])
  var arr = [];
  for (var i = 0; i < nbCol; ++i) {
    arr.push(null);
  }
  for (var a = []; a.length < 1; a.push(arr.slice(0)));

  var f = createFunction("table", [createMatrix(nbCol, 0), createObject()])
  addShow(addEq(param["table-name"], f))
  updateEditorText()
  displayOneTable(eqWrapper.getEQ(), validateTableWithArray(a), id)
  setWidget();
}