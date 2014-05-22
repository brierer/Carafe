function stringifyEqTree(parse) {
	var text = ""
	for (var val in parse) {
		text += stringifyEquation(parse, val);
	}
	return text

	function stringifyEquation(parse, val) {
		return val + " = " + stringifyVal(parse[val]);
	}

	function stringifyVal(parse) {
		var s1, v, s2 = ""
		s1 = parse.s1
		s2 = parse.s2
		var value = parse.v
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

function getElemOfArray(i) {
	return function(parse) {
		if (parse.v !== undefined && parse.v.a !== undefined) {
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
	if (parse.v !== undefined && parse.v.f !== undefined) {
		if (parse.v.f.arg.length == 0) {
			return parse.v.f
		} else {
			return null
		}
	}
	return null
}


function isSingleValue(parse) {

	if (parse.v !== undefined && parse.v.tag !== undefined) {
		return parse.v
	}

	return null
}


function bindAll(parse, maybe, binds) {
	binds.forEach(function(fn, i) {
		maybeVariable = maybe.bind(isVariable)


		if (!maybe.isNothing()) {
			// console.log(JSON.stringify(maybe.val()));
		}

		if (maybeVariable.isNothing()) {
			maybe = maybe.bind(fn);
		} else {
			maybe = Maybe(parse[maybeVariable.val().name])
			maybe = maybe.bind(fn);
		}
	})

	// if (maybe.bind(isSingleValue).isNothing()) {
	//  return Maybe(null);
	//}

	return maybe
}

function isColReadOnly(row, col, parse, id) {

	getDisplayItem = Maybe(parse.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTableCol = bindAll(parse, getDisplayItem, [getFunction("table", 0), getElemOfArray(col)])

	getArrayCol = bindAll(parse, getDisplayItem, [getElemOfArray(col)])

	var getElemAtCol
	if (!getTableCol.isNothing()) {
		getElemAtCol = getTableCol
	} else if (!getArrayCol.isNothing()) {
		getElemAtCol = getArrayCol
	} else {
		return true
	}

	validArray = bindAll(parse, getElemAtCol, [isArray]);

	if (!validArray.isNothing()) {
		if (validArray.val().length - 1 < row) {
			return false
		} else {
			return bindAll(parse, getElemAtCol, [getElemOfArray(row), isSingleValue]).isNothing()
		}

	}

	return true // !m1.isNothing()

}


function changeValue(hook, parse, id) {

	getDisplayItem = Maybe(parse.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTableCol = bindAll(parse, getDisplayItem, [getFunction("table", 0), getElemOfArray(hook.col), isArray])

	getArrayCol = bindAll(parse, getDisplayItem, [getElemOfArray(hook.col), isArray])
	if (!getArrayCol.isNothing()) {
		addOrChangeSingleValue(hook, getArrayCol.val(), parse)
	} else if (!getTableCol.isNothing()) {
		addOrChangeSingleValue(hook, getTableCol.val(), parse)
	}

}



function removeRow(row, parse, id) {

	getDisplayItem = Maybe(parse.show)
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))

	getTable = bindAll(parse, getDisplayItem, [getFunction("table", 0), isArray])

	if (!getTable.isNothing()) {

		getTable.val().forEach(function(val, i) {
			valueToDelete = Maybe(val);
			if (!valueToDelete.isNothing()) {
				if (val.v != undefined && val.v.f != undefined && val.v.f.arg.length == 0) {
					var valueToChange = parse[val.v.f.name].v;
					removeFromVariable(row, valueToChange, parse);
				} else {
					val.v.a.splice(row - 1, 1);
				}
			}
		})

	}

}


function removeFromVariable(hook, subParse, parse) {
	if (subParse.f != undefined && subParse.f.arg.length == 0) {
		var valueToChange = parse[subParse.f.name].v;

		removeFromVariable(hook, valueToChange, parse);
	} else {
		subParse.a.splice(hook - 1, 1);
	}
}

function addOrChangeSingleValue(hook, subParse, parse) {
	if (subParse.v != undefined && subParse.v.f != undefined && subParse.v.f.arg == 0) {
		addOrChangeSingleValue(hook, parse[subParse.v.f.name], parse);
	} else {
		if (hook[2] == null) {
			addSingleValue(hook, subParse)
		} else {
			if (subParse[hook.row] != undefined) {
				if (subParse[hook.row].v != undefined && subParse[hook.row].v.f != undefined && subParse[hook.row].v.f.arg.length == 0) {
					var valueToChange = parse[subParse[hook[0]].v.f.name].v;
					changeVariable(hook.new, valueToChange, parse);
				} else {
					var valueToChange = subParse[hook[0]].v
					changeSingleValue(hook.new, valueToChange)
				}
			}
		}
	}
}



function changeVariable(value, subParse, parse) {
	if (subParse.f != undefined && subParse.f.arg.length == 0) {
		var valueToChange = parse[subParse.f.name].v;
		changeVariable(value, valueToChange, parse);
	} else {
		changeSingleValue(value, subParse)
	}
}

function addSingleValue(hook, subParse) {
	var value = {}
	if (hook.new == "false" || hook.new == "true") {
		value = createVal(hook.new, subParse, changePbool)
	} else if (hook.new != "" && !isNaN(hook.new)) {
		value = createVal(hook.new, subParse, changePnum)
	} else {
		value = createVal(hook.new, subParse, changePstring)
	}

	var diff = hook.row - subParse.length - 1
	while (diff >= 0) {
		var empty = createVal("", subParse, changePstring)
			//  subParse.push(empty);
		diff--
	}

	subParse.push(value);
}



function changeSingleValue(newValue, subParse) {
	var value = {}
	if (newValue == "false" || newValue == "true") {
		value = changePbool(newValue, subParse)
	} else if (newValue != "" && !isNaN(newValue)) {
		value = changePnum(newValue, subParse);
	} else {
		value = changePstring(newValue, subParse);
	}
}

function changePbool(value, subParse) {
	subParse.tag = 'Pbool'
	if (value == "false")
		subParse.contents = false
	else {
		subParse.contents = true
	};
}

function changePstring(value, subParse) {
	subParse.tag = 'Pstring'
	subParse.contents = value
}

function changePnum(value, subParse) {
	subParse.tag = 'Pnum'
	subParse.contents = Number(value)
}

function createVal(hook, subParse, fn) {
	var value = {}
	value.v = {};
	fn(hook, value.v)
	value.s1 = ""
	value.s2 = ""
	return value
}


function addFunctionTable(name) {
	maybe(parseJSON).bind()
}

function addTable(param) {
	var id = $(".table-container").length + 1
	var nbCol = Number(param["nb-col"])
	var arr = [];
	for (var i = 0; i < nbCol; ++i) {
		arr.push(null);
	}
	for (var a = []; a.length < 1; a.push(arr.slice(0)));
	displayOneTable(parseJSON, validateTableWithArray(a), id)
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