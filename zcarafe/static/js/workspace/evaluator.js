var isCalculatingWaiting = false;

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
	}, 10);
}

function pollingServerCalcGetResult(nbTry) {
	console.log("ag");
	if (nbTry < 5) {
		var id_form = $("#id_form_id").serialize();
		var id_book = $("#id_book_id").serialize();
		$.getJSON('getCalcResult/?' + id_form, function(r) {
			var now = new Date().getTime();
			var timesRun = nbTry;
			console.log('Action ' + (timesRun + 1) + ' started ' + (now - startTime) + 'ms after script start');
			if (r.data != null) {
				eqWrapper.setEQ(r.data.parse)
				displayData(r.data);
				isCalculatingWaiting = false;
			} else {
				setTimeout(function() {
					pollingServerCalcGetResult(nbTry + 1)
				}, 10);
			}
		});
	} else {
		console.log("Hummm, this is long , very long");
		isCalculatingWaiting = false;
	}
}

