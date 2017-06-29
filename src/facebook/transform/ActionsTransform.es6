import {Action} from '../../data/action.es6';
import {FacebookHandler} from '../../FacebookHandler.es6';
import {Expression} from '../../expression.es6';

let DomUtils = require('domutils');
let util = require('util');

util.inherits(ActionsTransform, FacebookHandler);

export function ActionsTransform(source) {
	this.source = (source || '');
}

ActionsTransform.prototype.transform = function(parent) {

	// Ensure parent is in an array.
	if (!Array.isArray(parent)) {
		parent = [parent];
	}

	// Obtain the like action.
	var isLikeAction = (elem) => (this.isAnchor(elem) && elem.attribs && elem.attribs.href && elem.attribs.href.startsWith('/a/like.php?') && elem.children && elem.children[1] && elem.children[1].name === 'span' && this.extractText(elem.children[1]).length > 0);
	var likeDiv = DomUtils.findOne(isLikeAction, parent);
	var likeActionUrl = (likeDiv ? this.readyUrl(likeDiv.attribs.href) : false);

	// Obtain the comment action.
	var isCommentAction = (elem) => (this.isForm(elem) && elem.attribs.action.lastIndexOf('/a/comment', 0) === 0);
	var commentForm = DomUtils.findOne(isCommentAction, parent);
	var commentActionUrl = (commentForm ? this.readyUrl(commentForm.attribs.action) : false);
	if (commentActionUrl) {
		// Append the fb_dtsg parameter.
		var isFbDtsg = (elem) => (this.isInput(elem) && 'fb_dtsg' === elem.attribs.name);
		var commentFbDtsg = DomUtils.findOne(isFbDtsg, [commentForm]);
		commentActionUrl = commentActionUrl + '&fb_dtsg=' + commentFbDtsg.attribs.value;

		// Append the charset_test parameter.
		var isCharsetTest = (elem) => (this.isInput(elem) && 'charset_test' === elem.attribs.name);
		var commentCharsetTest = DomUtils.findOne(isCharsetTest, [commentForm]);
		commentCharsetTest = (commentCharsetTest ? '&charset_test=' + this.prettifyText(commentCharsetTest.attribs.value) : '');
		commentActionUrl = (commentActionUrl + commentCharsetTest);
	}

	// Obtain the share action.
	var isShareTarget = (elem) => (this.isAnchor(elem) && elem.attribs.href.match(Expression.SHARE_POST_URL_REGEX))
	var shareAnchor = DomUtils.findOne(isShareTarget, parent);
	var shareActionUrl = false;
	if (shareAnchor) {
		shareActionUrl = shareAnchor.attribs.href;
	}

	// Obtain the delete action.
	var isDeleteTarget = (elem) => (this.isAnchor(elem) && elem.attribs.href.match(Expression.DELETE_POST_REGEX));
	var deleteAnchor = DomUtils.findOne(isDeleteTarget, parent);
	var deleteActionUrl = false;
	if (deleteAnchor) {
		deleteActionUrl = deleteAnchor.attribs.href;
	}

	// Load the actions (may always share)
	var actions = [];
	if (shareActionUrl) {
		actions.push(this._generateAction('Share', shareActionUrl));
	}
	if (likeActionUrl) {
		actions.push(this._generateAction('Like', likeActionUrl));
	}
	if (commentActionUrl) {
		actions.push(this._generateAction('Comment', commentActionUrl));
	}
	if (deleteActionUrl) {
		actions.push(this._generateAction('Delete', deleteActionUrl));
	}

	// Return the actions
	return actions
}

ActionsTransform.prototype._generateAction = function(type, target) {
	return new Action({
		type: type,
		target: target
	});
}
