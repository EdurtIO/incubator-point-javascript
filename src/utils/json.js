var toString = Object.prototype.toString;
module.exports = ("object" === typeof JSON && toString.call(JSON) === '[object JSON]') ? JSON
	: (function (JSON) {
		"use strict";

		function f(e) {
			return 10 > e ? "0" + e : e
		}

		function quote(e) {
			return point_escapable.lastIndex = 0, point_escapable.test(e) ? '"' + e.replace(point_escapable, function (e) {
				var t = meta[e];
				return "string" == typeof t ? t : "\\u" + ("0000" + e.charCodeAt(0).toString(16)).slice(-4)
			}) + '"' : '"' + e + '"'
		}

		function objectToJSON(e) {
			switch (toString.call(e)) {
				case '[object Date]':
					return isFinite(e.valueOf()) ? e.getUTCFullYear() + "-" + f(e.getUTCMonth() + 1) + "-" + f(e.getUTCDate()) + "T" + f(e.getUTCHours()) + ":" + f(e.getUTCMinutes()) + ":" + f(e.getUTCSeconds()) + "Z" : null;
				case '[object Boolean]':
				case '[object String]':
				case '[object Number]':
					return e.valueOf();
			}
			return e;
		}

		function str(e, t) {
			var r, n, i, o, s, a = gap,
				u = t[e];
			switch (u && "object" == typeof u && (u = objectToJSON(u)), "function" == typeof rep && (u = rep.call(t, e, u)), typeof u) {
				case "string":
					return quote(u);
				case "number":
					return isFinite(u) ? String(u) : "null";
				case "boolean":
				case "null":
					return String(u);
				case "object":
					if (!u) return "null";
					if (gap += indent, s = [], "[object Array]" === toString.call(u)) {
						for (o = u.length, r = 0; o > r; r += 1) s[r] = str(r, u) || "null";
						return i = 0 === s.length ? "[]" : gap ? "[\n" + gap + s.join(",\n" + gap) + "\n" + a + "]" : "[" + s.join(",") + "]", gap = a, i
					}
					if (rep && "object" == typeof rep)
						for (o = rep.length, r = 0; o > r; r += 1) "string" == typeof rep[r] && (n = rep[r], i = str(n, u), i && s.push(quote(n) + (gap ? ": " : ":") + i));
					else
						for (n in u) Object.prototype.hasOwnProperty.call(u, n) && (i = str(n, u), i && s.push(quote(n) + (gap ? ": " : ":") + i));
					return i = 0 === s.length ? "{}" : gap ? "{\n" + gap + s.join(",\n" + gap) + "\n" + a + "}" : "{" + s.join(",") + "}", gap = a, i
			}
		}

		var point_one = /^[\],:{}\s]*$/,
			point_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
			point_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
			point_four = /(?:^|:|,)(?:\s*\[)+/g,
			point_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			point_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

		var gap, indent, meta, rep;
		"function" != typeof JSON.stringify && (meta = {
			"\b": "\\b",
			"	": "\\t",
			"\n": "\\n",
			"\f": "\\f",
			"\r": "\\r",
			'"': '\\"',
			"\\": "\\\\"
		}, JSON.stringify = function (e, t, r) {
			var n;
			if (gap = "", indent = "", "number" == typeof r)
				for (n = 0; r > n; n += 1) indent += " ";
			else "string" == typeof r && (indent = r);
			if (rep = t, t && "function" != typeof t && ("object" != typeof t || "number" != typeof t.length)) throw new Error("JSON.stringify");
			return str("", {
				"": e
			})
		}), "function" != typeof JSON.parse && (JSON.parse = function (text, reviver) {
			function walk(e, t) {
				var r, n, i = e[t];
				if (i && "object" == typeof i)
					for (r in i) Object.prototype.hasOwnProperty.call(i, r) && (n = walk(i, r), void 0 !== n ? i[r] = n : delete i[r]);
				return reviver.call(e, t, i)
			}
			var j;
			if (text = String(text), point_dangerous.lastIndex = 0, point_dangerous.test(text) && (text = text.replace(point_dangerous, function (e) {
				return "\\u" + ("0000" + e.charCodeAt(0).toString(16)).slice(-4)
			})), point_one.test(text.replace(point_two, "@").replace(point_three, "]").replace(point_four, ""))) return j = eval("(" + text + ")"), "function" == typeof reviver ? walk({
				"": j
			}, "") : j;
			throw new SyntaxError("JSON.parse")
		});
		return JSON;
	})({});