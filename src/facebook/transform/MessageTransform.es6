import {Expression} from '../../expression.es6';
import {FacebookHandler} from '../../FacebookHandler.es6';

let DomUtils = require('domutils');
let util = require('util');

const REGEX_APOLLO_ADVERTISING_TEXT = /^[\S\s]*?(\n*[a-zA-Z ]+with Social Stream)/;

util.inherits(MessageTransform, FacebookHandler);
export function MessageTransform() {}

// Determines the parent div that encapsulates the Post object.
// Please note that this function is unsuitable for use by the FacebookAlbumHandler and FacebookPhotoHandler.
//
// <parent>		Top-level element to find the Post parent div within.
MessageTransform.prototype.findMessageDiv = function(parent) {
	
	var isPostParent = (elem) => (this.isDiv(elem) && elem.attribs && elem.attribs.class && elem.attribs.id);
	let messageDiv = DomUtils.findOne(isPostParent, MessageTransform.prototype._getParent(parent));
	
	return (messageDiv && this.hasFirstChild(messageDiv) ? messageDiv.children[0] : false);
}

// Determines the form used to create posts in Facebook.
//
// <parent>		Top-level element to find the Post parent div within.
MessageTransform.prototype.findShareForm = function(parent) {

	var isShareFormParent = (elem) => (this.isForm(elem) && elem.attribs && elem.attribs.action && elem.attribs.action.match(Expression.REGEX_COMPOSE_FORM));
	let form = DomUtils.findOne(isShareFormParent, MessageTransform.prototype._getParent(parent));
	
	return form;
}

MessageTransform.prototype.findSendPostForm = function(parent) {
	
	var isFormParent = (elem) => (this.isDiv(elem) && elem.attribs && elem.attribs.id && elem.attribs.id.match(Expression.REGEX_URL_SENDPOST));
	let formParent = DomUtils.findOne(isFormParent, MessageTransform.prototype._getParent(parent));
	
	return DomUtils.findOne(this.isForm, [formParent]);
}

// Transforms messageDiv to the message
MessageTransform.prototype.transform = function(messageDiv) {

	let adText = '';
	let message = '';
	let aggregator = [];

	MessageTransform.prototype.extractPostBody(messageDiv, aggregator, {});
	
	message = this.prettifyText(aggregator.join(' '));
	adText = message.match(REGEX_APOLLO_ADVERTISING_TEXT);
	if (adText) {
		message = message.slice(0, message.indexOf(adText[1]));
	}

	// Return the message
	return message;
}

// Generates the Post message property from the given parent element.
//
// This function recursively extracts text and fills it into the aggregating array. It operates upon a depth-first search, terminating
// the aggregation as soon as a paragraph element is found - this is assumed to be the last element from which Post message text
// is to be determined.
//
// <elem>       Parent element to begin iteration from.
// <aggregator> Array to collect text into as determined.
// <state>      Object for maintaining the state of the extraction between recursive calls.
// RETURN       Boolean indicating whether or not the aggregation should continue.
MessageTransform.prototype.extractPostBody = function(elem, aggregator, state) {

	let continuing = true;
	let anchorTextOrElse = (child) => (this.isAnchor(child) ? child.children.map(DomUtils.getText).join('') : DomUtils.getText(child));
	let isUnwantedDiv = (element) => ((this.isDiv(element) && this.hasFirstChild(element) && (elem.children.length < 3) && (element.children.filter(this.isHeader).length > 0)) || this.isHeader(elem));

	// Step 1: Resolve and remove weird edge case HTML blocks.
	if (MessageTransform.prototype.isSpannedUrl(elem)) {
		aggregator.push(elem.children.map(anchorTextOrElse).join(''));
	// Step 2; terminate on nested posts.
	} else if (elem && 'table' === elem.name) {
		continuing = false;
	// Step 3: Iterate through children
	} else if (elem.children && !isUnwantedDiv(elem)) {
		elem.children.every((child) => {
			continuing &= MessageTransform.prototype.extractPostBody(child, aggregator, state);
			return continuing;
		});
	}

	// Step 4: Parse text as appropriate to element.
	if (this.isDiv(elem)) {
		if (state.isParagraphExtracted) {
			continuing = false // do not include content after paragraphs of message text
		} else {
			aggregator.push('\n\n');
		}
	} else if (this.isText(elem)) {
		aggregator.push(DomUtils.getText(elem));
	} else if (this.isParagraph(elem)) {
		aggregator.push('\n')
		state.isParagraphExtracted = true
	}

	return continuing;
}

// Determines whether or not the given element represents a block in the message body containing (error-causing) HTML formatted
//	<a>
//		<span>
//		<wbr/>some text
//		...
//	</a>
//
// <element>	Element to test for word broken blocks.
// RETURN 		Boolean indicating whether or not the given block fulfills this structure.
MessageTransform.prototype.isSpannedUrl = function(element) {

	let exemptYoungestChild = (child, index, arr) => (index < arr.length - 1);
	let getAnchoredKids = (element) => (element.children.filter(exemptYoungestChild));
	let isSpannedChild = (child) => (this.isSpan(child) || 'wbr' === child.name);

	return (this.isAnchor(element) && getAnchoredKids(element).length && getAnchoredKids(element).every(isSpannedChild));
}

MessageTransform.prototype._getParent = (parent) => (Array.isArray(parent) ? [parent[parent.length - 1]] : [parent]);