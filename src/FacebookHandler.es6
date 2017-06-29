var DomUtils = require('domutils');
let ElementType = require('domelementtype');
let util = require('util');

import {AbstractHandler} from './AbstractHandler.es6';
import {Expression} from './expression.es6';
import {CustomEntities} from './CustomEntities.es6';

// Top-level abstract class that all Facebook scraper handlers should extend, for code reuse purposes.
util.inherits(FacebookHandler, AbstractHandler);
FacebookHandler.prototype.init = AbstractHandler;

// PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookHandler() {}

// <elem>	Element to extract text from.
// RETURN 	All text elements from the given element and all children, normalised.
FacebookHandler.prototype.extractText = function(elem) {
	return FacebookHandler.prototype.prettifyText(DomUtils.getText(elem));
}

// Pass this function to DomUtils.findOne to fetch the post parent element.
//
// <elem> Element object to test.
// REUTRN True if this is the post parent of scrapable data, or false otherwise.
FacebookHandler.prototype.findPostParent = function(dom) {

	let isRoot = (elem) => (FacebookHandler.prototype.isDiv(elem) && elem.attribs && elem.attribs.id && 'root' === elem.attribs.id);
	let isSubRoot = (elem) => (FacebookHandler.prototype.isDiv(elem) && elem.attribs && elem.attribs.id && 'm_story_permalink_view' === elem.attribs.id);
	let result = DomUtils.findOne(isRoot, dom);
	let subresult = DomUtils.findOne(isSubRoot, [result]);

	return (subresult ? subresult : result);
}

// General purpose helper function to check if the given element constitutes a HTML anchor element.
//
// <element>	HTML element to examine.
// RETURN 		href property of the given anchor, or false if the given element does not constitute an anchor element.
FacebookHandler.prototype.isAnchor = function(element) {
	return ((element && 'a' === element.name && element.attribs && element.attribs.href) ? element.attribs.href : false);
}

// Helper to determine if the given element is an aria-hidden span, used to divide available actions throughout the Facebook mobile site.
// As of 14/11/16 this check actually tests for visible '.' elements, as the aria-hidden is not used in some circumstances (mostly seen in India).
//
// <elem>	Element to test.
// RETURN 	True if this element is an aria-hidden span, or false otherwise.
FacebookHandler.prototype.isButtonDivider = function(elem) {
	return (FacebookHandler.prototype.isSpan(elem) && String.fromCharCode(183) === DomUtils.getText(elem).trim());
}

// Helper to determine if the given element is an break.
//
// <elem>	Element to test.
// RETURN 	True if this element is a break.
FacebookHandler.prototype.isBreak = function(elem) {
	return (elem && 'br' === elem.name);
}

// Cheeky helper to determine if the given element is a div.
//
// <elem>	Element object under test.
// RETURN 	Boolean indicating whether or not the given element is a div.
FacebookHandler.prototype.isDiv = function(elem) {
	return (elem && 'div' === elem.name);
}

// helper to determine if the given element is a Form.
//
// <elem>	Element object under test.
// RETURN 	Boolean indicating whether or not the given element is a form.
FacebookHandler.prototype.isForm = function(elem) {
	return (elem && 'form' === elem.name);
}

// Helper to find an third-level header element.
// This element is a 
//
// <elem>	Element to examine.
// RETURN	Boolean indicating whether or not this is a header element.
FacebookHandler.prototype.isHeader = function(elem) {
	return (elem && 'h3' === elem.name);
}

// General purpose helper function to check if the given element constitutes an HTML image.
//
// <element>	HTML element to examine.
// RETURN 		True if the given element is an image (with a source) and false otherwise.
FacebookHandler.prototype.isImage = function(element) {
	return (element && 'img' === element.name && element.attribs && element.attribs.src);
}

// General purpose helper function to check if the given element constitutes an HTML input element.
//
// <element>	HTML element to examine.
// RETURN 		True if the given element is an input field (with an attribute name) and false otherwise.
FacebookHandler.prototype.isInput = function(element) {
	return (element && 'input' === element.name && element.attribs && element.attribs.name);
}

// General purpose helper function to check if the given element constitutes a paragraph break.
//
// <element>	HTML element to examine.
// RETURN 		True if the given element is a paragraph and false otherwise.
FacebookHandler.prototype.isParagraph = function(element) {
	return (element && 'p' === element.name);
}

// Checks if the URL is a photo URL
FacebookHandler.prototype.isPhotoUrl = function(url) {
	return url.search(Expression.PHOTO_URL_REGEX) === 0 || url.search(Expression.DYNAMIC_PHOTO_URL_REGEX) === 0
}

// Checks if the given element is a link to a Photo page (to scrape the photo from)
FacebookHandler.prototype.isPhotoLink = function(element) {
	return (FacebookHandler.prototype.isAnchor(element) && FacebookHandler.prototype.isPhotoUrl(element.attribs.href) && FacebookHandler.prototype.hasFirstChild(element) && FacebookHandler.prototype.isImage(element.children[0]));
}

// RETURN 	True if the given element is a span element, and false otherwise.
FacebookHandler.prototype.isSpan = function(elem) {
	return (elem && 'span' === elem.name);
}

// Helper to check if an element is a text-element
//
// <elem> Element to check the type of.
// RETURN boolean indicating whether or not this is a text element.
FacebookHandler.prototype.isText = function(elem) {
	return (elem ? (ElementType.Text === elem.type || FacebookHandler.prototype.isBreak(elem)) : false);
}

// General purpose helper function to check if the given element constitutes an HTML textarea element.
//
// <element>    HTML element to examine.
// RETURN       True if the given element is an textarea field (with an attribute name) and false otherwise.
FacebookHandler.prototype.isTextArea = function(element) {
    return (element && 'textarea' === element.name && element.attribs && element.attribs.name);
}

//Determines if the given element has at least on child element.
//
// <elem> Element object to check for descendents.
// RETURN Boolean indicating whether or not the given element has at least one descendent.
FacebookHandler.prototype.hasFirstChild = function(elem) {
	return (elem && elem.children && elem.children.length > 0);
}

// Helper to trim unnecessary whitespace from the text.
// Whitespace is trimmed from both the start and the end of the text, and multiple spaces inside the text is converted to a single space character.
//
// <text>	Assumed to be a string value.
// RETURN 	Original string with unnecessary whitespace stripped.
FacebookHandler.prototype.prettifyText = function(text) {

	var result = text;

	if (text) {
		let htmlutil = new CustomEntities();
		result = (htmlutil.decode(text).replace(/[ \t\f\v\u200E\u202A\u202C]+/g, ' ').trim().replace(/(?:([a-zA-Z0-9]) ([!?',.:])|(#) ([a-zA-Z0-9])|( *)(\n)( *))/g, '$1$2$3$4$6'));
	}
	return result;
}

// <url>	URL text from HTML to decode.
// RETURN 	Normalised, decoded URL.
FacebookHandler.prototype.readyUrl = function(url) {
	if (!url) return null
	let htmlutil = new CustomEntities()
	url = htmlutil.decode(url) // just remove HTML encoding as needs to keep URL exact (particularly for Facebook images)
	return url
}

// <parameterValue>   URL parameter value to decode.
// RETURN             Decoded parameter value for use.
FacebookHandler.prototype.readyUrlParameter = function(parameterValue) {
	if (!parameterValue) return '';
	return decodeURIComponent(parameterValue);
}

// <imageUrl>	URL of image
// RETURN     	Full image URL (stripped of cropping parameters)
FacebookHandler.prototype.readyFullImageUrl = function(imageUrl) {

	imageUrl = (imageUrl || '');

	// Determine if a Facebook safe image
	if (imageUrl.contains('/safe_image.php?')) {
		// Obtain the URL directly to image
		let parts = imageUrl.match(/\&url=(https[^&]+)/);

		if (parts && parts.length > 0) {
			imageUrl = parts[1];
		}

		imageUrl = FacebookHandler.prototype.readyUrlParameter(imageUrl);
	}

	return imageUrl;
}