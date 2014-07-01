function EqWrapper() {
	var eqObj = null

	return {
		toStr: function() {
			return stringifyEqObj()
		},
		setEQ: function(eq) {
			eqObj = eq;
		},
		getEQ: function() {
			return eqObj;
		},
		isColReadOnly: isColReadOnly
	}



	function stringifyEqObj() {
		var text = ""
		for (var eq in eqObj) {
			text += stringifyEquation(eqObj[eq]);
		}
		return text

		function stringifyEquation(eq) {
			return eq[0] + " = " + stringifyVal(eq[1]);
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


function findEQ(name) {
	var eq = eqWrapper.getEQ();
	for (var i = 0; i < eq.length; i++) {
		if (eq[i][0] == name) {
			return eq[i][1]
		}
	}
}


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
			maybe = Maybe(findEQ(maybeVariable.val().name))
			maybe = maybe.bind(fn);
		}
	})

	return maybe
}


function getTableOrArrayCol(eqObj, col, displayItem) {
	getTableCol = manySearch(eqObj, displayItem, [getFunction("table", 0), getElemOfArray(col)])
	getArrayCol = manySearch(eqObj, displayItem, [getElemOfArray(col)])
	return Maybe.orSecond(getArrayCol, getTableCol)
}

function isColReadOnly(row, col, eqObj, id) {

	displayItem = getDisplayItem_(eqObj, id)


	var getElemAtCol = getTableOrArrayCol(eqObj, col, displayItem)
	if (getElemAtCol.isNothing()) {
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
	var displayItem = getDisplayItem_(eqObj, id)
	var getTableCol = manySearch(eqObj, displayItem, [getFunction("table", 0), getElemOfArray(hook.col), isArray])
	var getArrayCol = manySearch(eqObj, displayItem, [getElemOfArray(hook.col), isArray])
	addOrChangeSingleValue(hook, Maybe.orSecond(getTableCol, getArrayCol).val(), eqObj)
}


function getDisplayItem_(eqObj, id) {
	return Maybe(eqObj[0][1])
		.bind(getFunction("show", 0))
		.bind(getElemOfArray(id))
}

function isTableOrArray(eqObj, item) {
	getTableCol = manySearch(eqObj, item, [getFunction("table", 0), isArray])
	getArrayCol = manySearch(eqObj, item, [isArray])
	return Maybe.orSecond(getTableCol, getArrayCol)
}

function removeRow(row, eqObj, id) {
	displayItem = getDisplayItem_(eqObj, id)
	data = isTableOrArray(eqObj, displayItem)
	if (!data.isNothing()) {
		data.val().forEach(function(val, i) {
			valueToDelete = Maybe(val);
			if (!valueToDelete.isNothing()) {
				if (val.v != undefined && val.v.f != undefined && val.v.f.arg.length == 0) {
					var valueToChange = findEQ(val.v.f.name).v;
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
		var valueToChange = findEQ(subeqObj.f.name).v;
		removeFromVariable(hook, valueToChange, eqObj);
	} else {
		subeqObj.a.splice(hook - 1, 1);
	}
}

function addOrChangeSingleValue(hook, subeqObj, eqObj) {
	if (isVariable(subeqObj)) {
		addOrChangeSingleValue(hook, findEQ(subeqObj.v.f.name), eqObj);
	} else {
		if (hook.old == null) {
			addSingleValue(hook, subeqObj)
		} else {
			if (subeqObj[hook.row] != undefined) {
				if (isVariable(subeqObj[hook.row])) {
					var valueToChange = findEQ(subeqObj[hook.row].v.f.name).v;
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
		var valueToChange = findEQ(subeqObj.f.name).v;
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


function addEq(name, value) {
	eqs = eqWrapper.getEQ();
	eqs[eqs.length - 1][1].s2 = "\n";
	eqs.push([name, value])
	return name
}


function createFunction(name, args) {
	var v = {}
	var f = {}
	f = {
		f: {
			name: name,
			arg: args
		}
	}
	v = {
		s1: "",
		v: f,
		s2: ""
	}
	return v
}

function createMatrix(col, row) {
	var arr = []
	for (var i = 0; i < col; i++) {
		arr.push(createArray(row));
	}
	var v = {
		a: arr
	}
	return {
		s1: "",
		v: v,
		s2: ""
	}
}

function createArray(nb) {
	var arr = []
	var v = {
		a: arr
	}
	return {
		s1: "",
		v: v,
		s2: ""
	}
}

function createObject() {
	return {
		s1: "",
		v: {
			o: []
		},
		s2: ""
	}
}

function addShow(eq){
	eqWrapper.getEQ()[0][1].v.f.arg[0].v.a.push(createFunction(eq,[]));
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

Maybe.orSecond = function(m1, m2) {
	if (m1.isNothing()) {
		return m2;
	} else {
		return m1;
	}
}