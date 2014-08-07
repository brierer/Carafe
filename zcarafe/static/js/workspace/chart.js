define([],function(){
function Chart(chart) {
	this.x = chart.x
	this.y = chart.y
	this.data = chartData(chart.x,chart.y);
	this.param = chart.p
	function validateChartParameter(p) {
		if (p.title == undefined)
			(p.title = "")
		if (p.color == undefined)
			(p.color = "steelblue")
		return p
	}

	function chartData(x,y) {
		chartData = [];
		$(y).each(function(i) {
			chartData.push({
				x: x[i],
				y: y[i]
			});
		})
		return chartData;
	}
};

Chart.fromNative = function(chart) {
	return new Chart(chart);
}
return {Chart:Chart}
})