// Necessary imports
let ElementType = require('domelementtype');
// Override DomUtil.getText method to handle br for new lines
let DomUtil = require('domutils');

// Left-to-Right/Right-to-Left support function.
//
// This function finds either the first or last child element of the given parent that passes the given test.
// The element determined depends upon the ltr property, which defaults to true.
//
// <test>	Function to apply to every element as test.
// <parent>	Parent element(s) to search through for the required child.
// <ltr>	(Optional) parameter determining whether to search for the first or last successful child.
// RETURN 	Result of the delegate
DomUtil.findLeftOrRight = function(test, parent, ltr) {

	var result = null;
	ltr = (typeof(ltr) === 'undefined' ? true : ltr);
	parent = (Array.isArray(parent) ? parent : [parent]);

	if (ltr) {
		result = DomUtil.findOne(test, parent);
	} else {
		result = DomUtil.findAll(test, parent);
		result = result[result.length - 1];
	}

	return result;
}

DomUtil.getText = function(elem) {
	if (elem.name === 'br') return "\n"

	// Taken from domutils.getText method
	if (Array.isArray(elem)) return elem.map(DomUtil.getText).join("");
	if (ElementType.isTag(elem) || elem.type === ElementType.CDATA) return DomUtil.getText(elem.children);
	if (elem.type === ElementType.Text) return elem.data;

	return "";
}

// Array includes polyfill
if (!Array.prototype.includes) {
	Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
		'use strict';
		var O = Object(this);
		var len = parseInt(O.length) || 0;
		if (len === 0) {
			return false;
		}
		var n = parseInt(arguments[1]) || 0;
		var k;
		if (n >= 0) {
			k = n;
		} else {
			k = len + n;
			if (k < 0) {
				k = 0;
			}
		}
		var currentElement;
		while (k < len) {
			currentElement = O[k];
			if (searchElement === currentElement ||
				(searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
				return true;
			}
			k++;
		}
		return false;
	};
}

// Object.values polyfill
if (typeof(Object.values) !== 'function') {
	Object.values = function(obj) {
		return Object.keyValues(obj).map((pair) => pair.value);
	}
}

// Object keyValues functional implementation
if (typeof(Object.keyValues) !== 'function') {
	Object.keyValues = function(obj) {
		var result = [];
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				result.push({ key: prop, value: obj[prop] });
			}
		}
		return result;
	}
}

// Number between function
if (typeof(Number.prototype.betweenInclusive) !== 'function') {
	Number.prototype.betweenInclusive = function(low, high) {
		return (this >= low && this <= high);
	}
}

// String capitalise function
if (typeof(String.prototype.capitalise) !== 'function') {
	String.prototype.capitalise = function() {
		return (this.charAt(0).toUpperCase() + this.slice(1).toLowerCase());
	}
}

// String contains functions
if (typeof(String.prototype.contains) !== 'function') {
	String.prototype.contains = function(subdata) {
		return (this.lastIndexOf(subdata) != -1);
	}
}

// Setup endsWith prototype function
if (typeof(String.prototype.endsWith) !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	}
}

// Setup the startsWith String prototype functions
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.indexOf(searchString, position) === position;
	};
}