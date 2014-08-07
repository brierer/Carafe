define([], function() {


	M = function(tree) {
		if (!(this instanceof M)) {
			return new M(tree);
		}

		if (tree instanceof Maybe) {
			this.back = Maybe(tree.val())
			this.m = this.back
		} else {
			var back = Maybe(tree)
			this.back = back
			this.m = back
		}
	}

	M.prototype.many_binds = function(exps) {
		var maybe = this.m
		exps.forEach(function(exp, i) {
			maybe = maybe.bind(function(tree) {
				return tree[exp]
			});
		})

		return maybe
	}

	M.prototype.fwd = function(exp, callback) {
		maybe_back = this
		maybe = this.many_binds(exp)
		if (callback === undefined) {
			this.m = maybe
		} else {
			this.m = maybe_back.many_binds(callback)
		}
		return this
	}

	M.prototype.copy = function(){
		return M(this.val())
	}

	M.prototype.compare = function(cmp, elem) {
		var maybe = this.m
		maybe = maybe.bind(function(tree) {
			if (tree[cmp] === elem) {
				return tree
			} else {
				return undefined
			}

		})
		if (maybe.isNothing()) {
			this.m = maybe
		}
		return this
	}
	M.prototype.log = function() {
		console.log(JSON.stringify(this.val()))
	}


	M.prototype.app = function(fn) {
		this.m = this.m.bind(fn)
		return this
	}

	M.prototype.isNothing = function(fn) {
		return this.m.isNothing()
	}

	M.prototype.val = function() {
		if (this.m.isNothing()) return null
		return this.m.val()
	}

	M.prototype.maybe = function() {
		return this.m
	}

	M.prototype.select = function(i) {
		var maybe = this.m
		this.m = maybe.bind(function(tree) {
			if (tree instanceof Array) {
				return tree[i]
			} else {
				return null
			}

		})

		return this
	}

	M.or = function(m1, m2) {
		if (Maybe.orSecond(m1.m, m2.m).isNothing)
			return new M(null)
		return new M(Maybe.orSecond(m1.m, m2.m).val())
	}


	M.prototype.getFunction = function(name, i) {
		return this.fwd(["v", "f"]).compare("name", name).fwd(["arg"]).select(i)
	}

	M.prototype.getAtomic = function(name, i) {
		return this.fwd(["v", "tag"], ["v"])
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

	Maybe.prototype.orSecond = function(m1, m2) {
		if (m1.isNothing()) {
			return m2;
		} else {
			return m1;
		}
	}

	m = new M({
		a: {
			v: {
				f: {
					name: "show",
					arg: [1]
				}
			}
		}
	});


	console.log(m.fwd(["a"]).getFunction("show", 0).val())


	return {
		M: M
	}

})