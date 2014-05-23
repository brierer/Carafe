function EqWrapper() {
	var eqObj = null

	return {
		toStr: function() {
			return stringifyEqObj()
		},
		setEQ: function(eq) {
			eqObj = eq;
		},
		isColReadOnly: isColReadOnly
	}



	function stringifyEqObj() {
		var text = ""
		for (var val in eqObj) {
			text += stringifyEquation(val);
		}
		return text

		function stringifyEquation(val) {
			return val + " = " + stringifyVal(eqObj[val]);
		}

		function stringifyVal(subTree) {
			var s1, v, s2 = ""
			s1 = subTree.s1
			s2 = subTree.s2
			var value = subTree.v
			if (value.a !== undefined) {
				v = stringifyArray(value.a)
			} else if (value.f !== undefined) {
				v = stringifyFunction(value.f)
			} else if (value.o !== undefined) {
				v = stringifyObj(value.o)
			} else {
				v = stringifySingleValue(value.tag, value.contents);
			}
			return s1 + v + s2
		}

		function stringifyArray(contents) {
			var text = ""
			contents.forEach(function(val, i) {
				if (i != 0) {
					text += ','
				}
				text += stringifyVal(val);;
			})

			return "[" + text + "]";
		}


		function stringifyFunction(f) {

			if (f.arg.length == 0) {
				return f.name;
			} else {
				var text = f.name + "("
				var values = f.arg
				values.forEach(function(val, i) {
					if (i != 0) {
						text += ','
					}
					text += stringifyVal(val);;
				})
				return text + ")";
			}
		}

		function stringifyObj(contents) {
			var text = ""
			contents.forEach(function(content, i) {
				if (i != 0) {
					text += ','
				}
				tag = content[0];
				value = stringifyVal(content[1]);
				text += tag + ':' + value
			});
			return "{" + text + "}";
		}

		function stringifySingleValue(tag, contents) {
			if (tag == "Pstring") {
				return "\"" + contents + "\""
			} else {
				return contents
			}
		}
	}
};



function getFunction(name, i) {
	return function(eqObj) {
		if (eqObj.v.f !== undefined) {
			if (eqObj.v.f.name == name) {
				return eqObj.v.f.arg[i]
			} else {
				return null
			}
		}
	}
	return null
}

function getElemOfArray(i) {
	return function(eqObj) {
		if (eqObj.v !== undefined && eqObj.v.a !== undefined) {
			return eqObj.v.a[i]
		}
		return null
	}
}



function isArray(eqObj) {
	if (eqObj.v.a !== undefined) {
		return eqObj.v.a;
	}
	return null;
}


function isVariable(eqObj) {
	if (eqObj.v !== undefined && eqObj.v.f !== undefined) {
		if (eqObj.v.f.arg.length == 0) {
			return eqObj.v.f
		} else {
			return null
		}
	}
	return null
}


function isSingleValue(eqObj) {

	if (eqObj.v !== undefined && eqObj.v.tag !== undefined) {
		return eqObj.v
	}

	return null
}


function manySearch(eqTree, maybe, binds) {
	binds.forEach(function(fn, i) {
		maybeVariable = maybe.bind(isVariable)
		if (maybeVariable.isNothing()) {
			maybe = maybe.bind(fn);
		} else {
			maybe = Maybe(eqTree[maybeVariable.val().name])
			maybe = maybe.bind(fn);
		}
	})

	return maybe
}

function isColReadOnly(row, col, eqObj, id) {

	getDisplayItem = Maybe(eqObj.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTableCol = manySearch(eqObj, getDisplayItem, [getFunction("table", 0), getElemOfArray(col)])

	getArrayCol = manySearch(eqObj, getDisplayItem, [getElemOfArray(col)])

	var getElemAtCol
	if (!getTableCol.isNothing()) {
		getElemAtCol = getTableCol
	} else if (!getArrayCol.isNothing()) {
		getElemAtCol = getArrayCol
	} else {
		return true
	}

	validArray = manySearch(eqObj, getElemAtCol, [isArray]);

	if (!validArray.isNothing()) {
		if (validArray.val().length - 1 < row) {
			return false
		} else {
			return manySearch(eqObj, getElemAtCol, [getElemOfArray(row), isSingleValue]).isNothing()
		}

	}

	return true

}


function changeValue(hook, eqObj, id) {

	displayItem = Maybe(eqObj.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTableCol = manySearch(eqObj, displayItem, [getFunction("table", 0), getElemOfArray(hook.col), isArray])

	getArrayCol = manySearch(eqObj, displayItem, [getElemOfArray(hook.col), isArray])
	if (!getArrayCol.isNothing()) {
		addOrChangeSingleValue(hook, getArrayCol.val(), eqObj)
	} else if (!getTableCol.isNothing()) {
		addOrChangeSingleValue(hook, getTableCol.val(), eqObj)
	}

}



function getDisplayItem_(eqObj, id) {
	return Maybe(eqObj.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))
}

function isTableOrArray(eqObj, item) {
	getTableCol = manySearch(eqObj, item, [getFunction("table", 0), isArray])
	getArrayCol = manySearch(eqObj, item, [isArray])
	if (!getArrayCol.isNothing()) {
		return getArrayCol
	} else if (!getTableCol.isNothing()) {
		return getTableCol
	}

}

function removeRow(row, eqObj, id) {

	displayItem = getDisplayItem_(eqObj, id)
	data = isTableOrArray(eqObj, displayItem)

	if (!data.isNothing()) {

		data.val().forEach(function(val, i) {
			valueToDelete = Maybe(val);
			if (!valueToDelete.isNothing()) {
				if (val.v != undefined && val.v.f != undefined && val.v.f.arg.length == 0) {
					var valueToChange = eqObj[val.v.f.name].v;
					removeFromVariable(row, valueToChange, eqObj);
				} else {
					val.v.a.splice(row - 1, 1);
				}
			}
		})

	}

}


function removeFromVariable(hook, subeqObj, eqObj) {
	if (subeqObj.f != undefined && subeqObj.f.arg.length == 0) {
		var valueToChange = eqObj[subeqObj.f.name].v;

		removeFromVariable(hook, valueToChange, eqObj);
	} else {
		subeqObj.a.splice(hook - 1, 1);
	}
}

function addOrChangeSingleValue(hook, subeqObj, eqObj) {
	
	if (subeqObj.v != undefined && subeqObj.v.f != undefined && subeqObj.v.f.arg == 0) {
		addOrChangeSingleValue(hook, eqObj[subeqObj.v.f.name], eqObj);
	} else {
		if (hook.old == null) {
			addSingleValue(hook, subeqObj)
		} else {
			if (subeqObj[hook.row] != undefined) {
				if (subeqObj[hook.row].v != undefined && subeqObj[hook.row].v.f != undefined && subeqObj[hook.row].v.f.arg.length == 0) {
					var valueToChange = eqObj[subeqObj[hook.row].v.f.name].v;
					changeVariable(hook.new, valueToChange, eqObj);
				} else {
					var valueToChange = subeqObj[hook.row].v
					changeSingleValue(hook.new, valueToChange)
				}
			}
		}
	}
}



function changeVariable(value, subeqObj, eqObj) {
	if (subeqObj.f != undefined && subeqObj.f.arg.length == 0) {
		var valueToChange = eqObj[subeqObj.f.name].v;
		changeVariable(value, valueToChange, eqObj);
	} else {
		changeSingleValue(value, subeqObj)
	}
}

function addSingleValue(hook, subeqObj) {
	var value = {}
	if (hook.new == "false" || hook.new == "true") {
		value = createVal(hook.new, subeqObj, changePbool)
	} else if (hook.new != "" && !isNaN(hook.new)) {
		value = createVal(hook.new, subeqObj, changePnum)
	} else {
		value = createVal(hook.new, subeqObj, changePstring)
	}

	var diff = hook.row - subeqObj.length - 1
	while (diff >= 0) {
		var empty = createVal("", subeqObj, changePstring)
			//  subeqObj.push(empty);
		diff--
	}

	subeqObj.push(value);
}



function changeSingleValue(newValue, subeqObj) {
	var value = {}
	if (newValue == "false" || newValue == "true") {
		value = changePbool(newValue, subeqObj)
	} else if (newValue != "" && !isNaN(newValue)) {
		value = changePnum(newValue, subeqObj);
	} else {
		value = changePstring(newValue, subeqObj);
	}
}

function changePbool(value, subeqObj) {
	subeqObj.tag = 'Pbool'
	if (value == "false")
		subeqObj.contents = false
	else {
		subeqObj.contents = true
	};
}

function changePstring(value, subeqObj) {
	subeqObj.tag = 'Pstring'
	subeqObj.contents = value
}

function changePnum(value, subeqObj) {
	subeqObj.tag = 'Pnum'
	subeqObj.contents = Number(value)
}

function createVal(hook, subeqObj, fn) {
	var value = {}
	value.v = {};
	fn(hook, value.v)
	value.s1 = ""
	value.s2 = ""
	return value
}


function addFunctionTable(name) {
	maybe(eqObjJSON).bind()
}

function addTable(param) {
	var id = $(".table-container").length + 1
	var nbCol = Number(param["nb-col"])
	var arr = [];
	for (var i = 0; i < nbCol; ++i) {
		arr.push(null);
	}
	for (var a = []; a.length < 1; a.push(arr.slice(0)));
	displayOneTable(eqObjJSON, validateTableWithArray(a), id)
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