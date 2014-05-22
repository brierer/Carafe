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
	if (nbTry < 5) {
		var id_form = $("#id_form_id").serialize();
		var id_book = $("#id_book_id").serialize();
		$.get('getCalcResult/?' + id_form, function(data, status) {
			var now = new Date().getTime();
			var timesRun = nbTry;
			console.log('Action ' + (timesRun + 1) + ' started ' + (now - startTime) + 'ms after script start');
			if (data != null) {
				parseJSON = data.parse
				displayData(data);
				isCalculatingWaiting = false;
			} else {
				setTimeout(function() {
					pollingServerCalcGetResult(nbTry + 1)
				}, 10);
			}
		});
	} else {
		console.log("Hummm, this is fucking long");
		isCalculatingWaiting = false;
	}
}

