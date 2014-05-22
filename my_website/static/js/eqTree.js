function stringifyEqTree(eqTree) {
	var text = ""
	for (var val in eqTree) {
		text += stringifyEquation(eqTree, val);
	}
	return text

	function stringifyEquation(eqTree, val) {
		return val + " = " + stringifyVal(eqTree[val]);
	}

	function stringifyVal(eqTree) {
		var s1, v, s2 = ""
		s1 = eqTree.s1
		s2 = eqTree.s2
		var value = eqTree.v
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



function getFunction(name, i) {
	return function(eqTree) {
		if (eqTree.v.f !== undefined) {
			if (eqTree.v.f.name == name) {
				return eqTree.v.f.arg[i]
			} else {
				return null
			}
		}
	}
	return null
}

function getElemOfArray(i) {
	return function(eqTree) {
		if (eqTree.v !== undefined && eqTree.v.a !== undefined) {
			return eqTree.v.a[i]
		}
		return null
	}
}



function isArray(eqTree) {
	if (eqTree.v.a !== undefined) {
		return eqTree.v.a;
	}
	return null;
}


function isVariable(eqTree) {
	if (eqTree.v !== undefined && eqTree.v.f !== undefined) {
		if (eqTree.v.f.arg.length == 0) {
			return eqTree.v.f
		} else {
			return null
		}
	}
	return null
}


function isSingleValue(eqTree) {

	if (eqTree.v !== undefined && eqTree.v.tag !== undefined) {
		return eqTree.v
	}

	return null
}


function bindAll(eqTree, maybe, binds) {
	binds.forEach(function(fn, i) {
		maybeVariable = maybe.bind(isVariable)


		if (!maybe.isNothing()) {
			// console.log(JSON.stringify(maybe.val()));
		}

		if (maybeVariable.isNothing()) {
			maybe = maybe.bind(fn);
		} else {
			maybe = Maybe(eqTree[maybeVariable.val().name])
			maybe = maybe.bind(fn);
		}
	})

	// if (maybe.bind(isSingleValue).isNothing()) {
	//  return Maybe(null);
	//}

	return maybe
}

function isColReadOnly(row, col, eqTree, id) {

	getDisplayItem = Maybe(eqTree.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTableCol = bindAll(eqTree, getDisplayItem, [getFunction("table", 0), getElemOfArray(col)])

	getArrayCol = bindAll(eqTree, getDisplayItem, [getElemOfArray(col)])

	var getElemAtCol
	if (!getTableCol.isNothing()) {
		getElemAtCol = getTableCol
	} else if (!getArrayCol.isNothing()) {
		getElemAtCol = getArrayCol
	} else {
		return true
	}

	validArray = bindAll(eqTree, getElemAtCol, [isArray]);

	if (!validArray.isNothing()) {
		if (validArray.val().length - 1 < row) {
			return false
		} else {
			return bindAll(eqTree, getElemAtCol, [getElemOfArray(row), isSingleValue]).isNothing()
		}

	}

	return true // !m1.isNothing()

}


function changeValue(hook, eqTree, id) {

	getDisplayItem = Maybe(eqTree.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTableCol = bindAll(eqTree, getDisplayItem, [getFunction("table", 0), getElemOfArray(hook.col), isArray])

	getArrayCol = bindAll(eqTree, getDisplayItem, [getElemOfArray(hook.col), isArray])
	if (!getArrayCol.isNothing()) {
		addOrChangeSingleValue(hook, getArrayCol.val(), eqTree)
	} else if (!getTableCol.isNothing()) {
		addOrChangeSingleValue(hook, getTableCol.val(), eqTree)
	}

}



function removeRow(row, eqTree, id) {

	getDisplayItem = Maybe(eqTree.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTable = bindAll(eqTree, getDisplayItem, [getFunction("table", 0), isArray])

	if (!getTable.isNothing()) {

		getTable.val().forEach(function(val, i) {
			valueToDelete = Maybe(val);
			if (!valueToDelete.isNothing()) {
				if (val.v != undefined && val.v.f != undefined && val.v.f.arg.length == 0) {
					var valueToChange = eqTree[val.v.f.name].v;
					removeFromVariable(row, valueToChange, eqTree);
				} else {
					val.v.a.splice(row - 1, 1);
				}
			}
		})

	}

}


function removeFromVariable(hook, subeqTree, eqTree) {
	if (subeqTree.f != undefined && subeqTree.f.arg.length == 0) {
		var valueToChange = eqTree[subeqTree.f.name].v;

		removeFromVariable(hook, valueToChange, eqTree);
	} else {
		subeqTree.a.splice(hook - 1, 1);
	}
}

function addOrChangeSingleValue(hook, subeqTree, eqTree) {
	if (subeqTree.v != undefined && subeqTree.v.f != undefined && subeqTree.v.f.arg == 0) {
		addOrChangeSingleValue(hook, eqTree[subeqTree.v.f.name], eqTree);
	} else {
		if (hook[2] == null) {
			addSingleValue(hook, subeqTree)
		} else {
			if (subeqTree[hook.row] != undefined) {
				if (subeqTree[hook.row].v != undefined && subeqTree[hook.row].v.f != undefined && subeqTree[hook.row].v.f.arg.length == 0) {
					var valueToChange = eqTree[subeqTree[hook[0]].v.f.name].v;
					changeVariable(hook.new, valueToChange, eqTree);
				} else {
					var valueToChange = subeqTree[hook[0]].v
					changeSingleValue(hook.new, valueToChange)
				}
			}
		}
	}
}



function changeVariable(value, subeqTree, eqTree) {
	if (subeqTree.f != undefined && subeqTree.f.arg.length == 0) {
		var valueToChange = eqTree[subeqTree.f.name].v;
		changeVariable(value, valueToChange, eqTree);
	} else {
		changeSingleValue(value, subeqTree)
	}
}

function addSingleValue(hook, subeqTree) {
	var value = {}
	if (hook.new == "false" || hook.new == "true") {
		value = createVal(hook.new, subeqTree, changePbool)
	} else if (hook.new != "" && !isNaN(hook.new)) {
		value = createVal(hook.new, subeqTree, changePnum)
	} else {
		value = createVal(hook.new, subeqTree, changePstring)
	}

	var diff = hook.row - subeqTree.length - 1
	while (diff >= 0) {
		var empty = createVal("", subeqTree, changePstring)
			//  subeqTree.push(empty);
		diff--
	}

	subeqTree.push(value);
}



function changeSingleValue(newValue, subeqTree) {
	var value = {}
	if (newValue == "false" || newValue == "true") {
		value = changePbool(newValue, subeqTree)
	} else if (newValue != "" && !isNaN(newValue)) {
		value = changePnum(newValue, subeqTree);
	} else {
		value = changePstring(newValue, subeqTree);
	}
}

function changePbool(value, subeqTree) {
	subeqTree.tag = 'Pbool'
	if (value == "false")
		subeqTree.contents = false
	else {
		subeqTree.contents = true
	};
}

function changePstring(value, subeqTree) {
	subeqTree.tag = 'Pstring'
	subeqTree.contents = value
}

function changePnum(value, subeqTree) {
	subeqTree.tag = 'Pnum'
	subeqTree.contents = Number(value)
}

function createVal(hook, subeqTree, fn) {
	var value = {}
	value.v = {};
	fn(hook, value.v)
	value.s1 = ""
	value.s2 = ""
	return value
}


function addFunctionTable(name) {
	maybe(eqTreeJSON).bind()
}

function addTable(param) {
	var id = $(".table-container").length + 1
	var nbCol = Number(param["nb-col"])
	var arr = [];
	for (var i = 0; i < nbCol; ++i) {
		arr.push(null);
	}
	for (var a = []; a.length < 1; a.push(arr.slice(0)));
	displayOneTable(eqTreeJSON, validateTableWithArray(a), id)
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