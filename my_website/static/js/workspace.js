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
    console.log("Hummm, this is fucking long");
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
  editor.getDoc().setValue(decodeParse(data.parse));
  editor.save();
  if (data.eval.statut == "ok") {
    displayResult(data.parse, data.eval.res);
  } else if (data.statut == 'tko') {
    displayBadEval(data.eval);
  } else if (data.statut == 'ko') {
    displayError(data.eval);
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

  $('#containment-wrapper div.handsontable-wrapper').last().handsontable({
    data: table.data,
    colHeaders: table.p.col,
    minSpareRows: 1,
    contextMenu: true,
    stretchH: 'all',
    width: widthTable,
    cells: function(row, col, prop) {
      var cellProperties = {};
      cellProperties.readOnly = isColReadOnly(col, parse, id)
      return cellProperties;
    }

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
  var html = '<th style="width: 20px;">' + col + '<i class="hidden fa fa-sort-asc pull-right" ></th>'
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



function decodeParse(parse) {
  var text = ""

  for (var val in parse) {
    text += decodeEquation(parse, val);
  }

  //console.log(text);
  return text
}

function decodeEquation(parse, val) {
  return val + " = " + decodeVal(parse[val]);
}

function decodeVal(parse) {
  var s1, v, s2 = ""
  s1 = parse.s1
  s2 = parse.s2
  var value = parse.v
  //console.log(JSON.stringify(value))
  if (value.a !== undefined) {
    v = decodeArray(value.a)
  } else if (value.f !== undefined) {
    v = decodeFunction(value.f)
  } else if (value.o !== undefined) {
    v = decodeObj(value.o)
  } else {
    v = decodeSingleValue(value.tag, value.contents);
  }
  return s1 + v + s2
}

function decodeArray(contents) {
  var text = ""
  contents.forEach(function(val, i) {
    if (i != 0) {
      text += ','
    }
    text += decodeVal(val);;
  })

  return "[" + text + "]";
}


function decodeFunction(f) {

  if (f.arg.length == 0) {
    return f.name;
  } else {
    var text = f.name + "("
    var values = f.arg
    values.forEach(function(val, i) {
      if (i != 0) {
        text += ','
      }
      text += decodeVal(val);;
    })
    return text + ")";
  }
}

function decodeObj(contents) {
  var text = ""
  contents.forEach(function(content, i) {
    if (i != 0) {
      text += ','
    }
    tag = content[0];
    value = decodeVal(content[1]);
    text += tag + ':' + value
  });
  return "{" + text + "}";
}

function decodeSingleValue(tag, contents) {
  if (tag == "Pstring") {
    return "\"" + contents + "\""
  } else {
    return contents
  }
}


function getFunction(name, i) {
  return function(parse) {
    if (parse.v.f !== undefined) {
      if (parse.v.f.name == name) {
        return parse.v.f.arg[i]
      } else {
        return null
      }
    }
  }
  return null
}

function getArray(i) {
  return function(parse) {
    if (parse.v.a !== undefined) {
      return parse.v.a[i]
    }
    return null
  }
}

function isArray(parse) {
  if (parse.v.a !== undefined) {
    return parse.v.a;
  }
  return null;
}


function isVariable(parse) {
  if (parse.v.f !== undefined) {
    if (parse.v.f.arg.length == 0) {
      return parse.v.f
    } else {
      return null
    }
  }
  return null
}


function bindAll(parse, maybe, binds) {
  binds.forEach(function(fn, i) {
    maybeVariable = maybe.bind(isVariable)
    if (maybeVariable.isNothing()) {
      maybe = maybe.bind(fn);
    } else {
      maybe = Maybe(parse[maybeVariable.val().name])
      maybe = maybe.bind(fn);
    }
  })
  return maybe
}

function isColReadOnly(col, parse, id) {

  getDisplayItem = Maybe(parse.show)
    .bind(getFunction("show", 0))
    .bind(getArray(id))

  getTableCol = getDisplayItem
    .bind(getFunction("table", 0))
    .bind(getArray(col))
    .bind(isArray)

  getArrayCol = bindAll(parse, getDisplayItem, [getArray(col), isArray])

  return getTableCol.isNothing() && getArrayCol.isNothing() // !m1.isNothing()
}



Maybe = function(value) {
  var Nothing = {
    bind: function(fn) {
      return this;
    },
    isNothing: function() {
      return true;
    },
    val: function() {
      throw new Error("cannot call val() nothing");
    },
    maybe: function(def, fn) {
      return def;
    }
  };

  var Something = function(value) {
    return {
      bind: function(fn) {
        return Maybe(fn.call(this, value));
      },
      isNothing: function() {
        return false;
      },
      val: function() {
        return value;
      },
      maybe: function(def, fn) {
        return fn.call(this, value);
      }
    };
  };

  if (typeof value === 'undefined' ||
    value === null ||
    (typeof value.isNothing !== 'undefined' && value.isNothing())) {
    return Nothing;
  }

  return Something(value);
};