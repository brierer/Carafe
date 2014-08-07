define([
  "rickshaw",
], function() {



  function Rickshaw_fabric(chart, elements) {
    var format = function(n) {
      return n.toFixed(2);
    }

    var graph = new Rickshaw.Graph({
      element: elements.chart,
      renderer: 'lineplot',
      height: 250,
      width: 300,
      series: [{
        color: chart.param.color,
        data: chart.data,
        name: 'y'
      }]
    });

    var x_ticks = new Rickshaw.Graph.Axis.X({
      graph: graph,
      grid: false,
      orientation: 'bottom',
      element: elements.x_axis,
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT
    });

    var y_ticks = new Rickshaw.Graph.Axis.Y({
      graph: graph,
      grid: false,
      scale: chart.y,
      orientation: 'left',
      tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
      element: elements.y_axis,
    });


    var hoverDetail = new Rickshaw.Graph.HoverDetail({
      graph: graph,
      formatter: function(series, x, y) {
        var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
        var content = swatch + series.name + ": " + (y) + '<br>';
        return content;
      }
    });
    return graph
  }
return {Rickshaw_fabric:Rickshaw_fabric}
}

);