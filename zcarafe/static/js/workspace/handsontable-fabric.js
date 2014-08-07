define([
	"jquery.handsontable.full",
], function() {

	return {
		HDT_fabric: HDT_fabric
	}

	function HDT_fabric(table, updateEditorText) {

		this.options = {
			data: table.data,
			colHeaders: table.param.col == null ? true : table.param.col,
			minSpareRows: 1,
			stretchH: 'all',
			width: Math.min(75 * table.data[0].length-1, 750),
			colWidths:25,
			cells: table.cells,
			afterChange: afterChange,
			afterRemoveRow: afterRemoveRow,
			afterRemoveCol: afterRemoveCol,
			afterCreateRow: afterCreateRow,
			afterCreateCol: afterCreateCol,
			contextMenu: {

				items: {
					"row_above": {
						disabled: function() {
							return (Math.min(this.getSelected()[2], this.getSelected()[0]) >= this.countRows() - 1);
						}
					},
					"row_below": {
						disabled: function() {
							return (Math.max(this.getSelected()[2], this.getSelected()[0]) >= this.countRows() - 2);
						}
					},
					"remove_row": {
						disabled: function() {
							return (Math.max(this.getSelected()[2], this.getSelected()[0]) >= this.countRows() - 1);
						}
					},
					"hsep1": "---------",
					"col_left": {},
					"col_right": {},
					"remove_col": {}

				}
			}
		}

		//EVENT
		function afterCreateCol(index, number) {
			table.event.afterCreateCol(index, number);
			this.updateSettings({
				width: Math.min(75 * table.data[0].length, 750)
			})
			updateEditorText();
		}

		function afterRemoveCol(col) {
			var selection = this.getSelected()
			var colBegin = selection[0]
			var colEnd = selection[2]
			if (colBegin > colEnd) {
				var temp = colEnd;
				colEnd = colBegin;
				colBegin = temp;
			}
			for (var i = colBegin; i <= colEnd; i++) {
				table.event.afterRemoveCol(col);
			}

			updateEditorText();
		}

		function afterCreateRow(index, number) {

			if (index < this.countRows() - 1)
				table.event.afterCreateRow(index, number);
			updateEditorText();
		}

		function afterRemoveRow(row) {
			var selection = this.getSelected()
			var rowBegin = selection[0]
			var rowEnd = selection[2]
			if (rowBegin > rowEnd) {
				var temp = rowEnd;
				rowEnd = rowBegin;
				rowBegin = temp;
			}
			console.log([rowBegin,rowEnd])
			for (var i = rowBegin; i <= rowEnd; i++) {
				var gt = row >= this.countRows()
				var rowToDelete = gt ? row : row + 1
				//if (row < this.countRows())
					table.event.afterRemoveRow(rowToDelete);
			}

			updateEditorText()
		}

		function afterChange(hooks) {
			var handsontable = this
			if (hooks != null) {
				hooks.forEach(function(hook, i) {
					changeCell(handsontable, hook)
				})
			}
			updateEditorText()
		}
		//HELPER
		function changeCell(handsontable, hook) {
			var row = hook[0];
			var col = hook[1];
			var old_value = hook[2]
			var new_value = hook[3]
		
			if (row < handsontable.countRows() - 1)
				table.event.afterChange({
					'row': row,
					'col': col,
					'old': old_value,
					'new': new_value
				});

		}



		function convertNullBeforeEndToEmptyString(that, table, row, col) {
			for (var i = 0; i < row; i++) {
				if (table.getDataAtCell(i, col) == null && i < table.countRows() - 1) {
					//console.log(row)
					that.event.afterChange({
						'row': row,
						'col': col,
						'old': null,
						'new': ""
					});
				}
			}
		}


		function setEmptyStringNull(table) {
			var cells = table.getDataAtRow(table.countRows() - 1);
			cells.forEach(function(val, i) {
				if (val == "") {
					table.setDataAtCell(table.countRows() - 1, i, null)
				}
			})
		}
	}
});