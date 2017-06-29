import {ActionsTransform} from './transform/ActionsTransform.es6';
import {CommentsTransform} from './transform/CommentsTransform.es6';
import {LikesTransform} from './transform/LikesTransform.es6';
import {FacebookHandler} from '../FacebookHandler.es6';
import {Media} from '../data/media.es6';
import {MessageTransform} from './transform/MessageTransform.es6';
import {Post} from '../data/post.es6';
import {TimestampTransform} from './transform/TimestampTransform.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

util.inherits(FacebookPhotoHandler, FacebookHandler);
FacebookPhotoHandler.prototype.init = DomHandler;

//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookPhotoHandler(completionCallback, source) {
	this.init(completionCallback);
	this.source = (source || '');
}

FacebookPhotoHandler.prototype.onend = function() {

	let imageUrl = false;
	let actionsDiv = false;
	var errors = [];

	let isFullSizedUrl = (href) => (href.startsWith('https://scontent'));

	this.dom = this.dom[this.dom.length - 1];
	actionsDiv = ((DomUtils.findOne((elem) => this._isActionsDiv(elem, this), [this.dom])) || this.dom);

	imageUrl = actionsDiv.children.map(this.isAnchor).filter((elem) => elem).filter(isFullSizedUrl);
	imageUrl = (imageUrl.length ? this.readyFullImageUrl(this.readyUrl(imageUrl[0])) : false);

	// Obtain the post details
	let message = '';
	let rawTimestamp = '';
	let messageTransform = new MessageTransform();
	let parent = this.findPostParent([this.dom]);
	if (parent) {

		// Obtain the message
		let messageDiv = DomUtils.findOne((elem) => this._isMessageDiv(elem, this), [parent]);
		if (messageDiv) {
			message = messageTransform.transform(messageDiv);
		}

		// Obtain the timestamp
		rawTimestamp = new TimestampTransform().transform(parent);
	}else{
    	errors.push({error:"Not found FacebookPhotoHandler root OR m_story_permalink_view", html : this.source});
	}


// Obtain the comments
	let comments = new CommentsTransform().transform(this.dom);

	// Obtain the actions
	let actions = new ActionsTransform().transform(this.dom);

	// Determine liked and likeCount
	var likesStruct = new LikesTransform({
		actions: actions
	}).transform(this.dom, actions);

	// Load results
	let post = new Post({
		id: '',
		comments: comments,
		actions: actions,
		likeStatus: likesStruct.likeStatus,
		media: [new Media({
			imageUrl: imageUrl,
			mimeType: 'image/jpeg',
			srcUrl: imageUrl,
			type: 'photo',
		})],
		message: message,
		rawTimestamp: rawTimestamp
	});
	post.likeCount = likesStruct.likeCount;
	this.dom = {
			post: post
		}

	if(!imageUrl){
		errors.push({error:"Not found photo post imageurl", html : this.source});
	}
    if(!rawTimestamp || rawTimestamp.length === 0){
        errors.push({error:"Not found photo post timestamp", html : this.source});
    }
	if(errors.length === 0){
		errors = null;
	}
	this._handleCallback(errors);
}

// Helper to determine if the given div is the div that contains the View Full Posts action (and other actions).
//
// <elem>			Element under examination.
// <thisArg>	Object to use for this-scoping. This should be passed in as the DomUtils deregisters the this scope.
// RETURN 		Boolean indicating whether or not this current element is the actions div.
FacebookPhotoHandler.prototype._isActionsDiv = function(elem, thisArg) {

	let isValidAnchor = (child, index, arr) => (this.isAnchor(child) && (index === 0 || this.isButtonDivider(arr[index - 1])));
	let test = (child, index, arr) => (isValidAnchor(child, index, arr) || this.isButtonDivider(child));

	thisArg = (thisArg || this);
	return (thisArg.isSpan(elem) && thisArg.hasFirstChild(elem) && (elem.children.length > 1) && elem.children.every(test, thisArg));
}

// Helper to determine if the given div is the div that contains the Post message (if one exists).
// The message div is considered to be the immediately prior sibling to the actions div.
// 
// <elem>			Element under examination.
// <thisArg>	Object to use for this-scoping. This should be passed in as the DomUtils deregisters the this scope.
// RETURN 		Boolean indicating whether or not this current element is the message div.
FacebookPhotoHandler.prototype._isMessageDiv = function(elem, thisArg) {

	let hasActionChild = (element) => (DomUtils.findOne((subelem) => thisArg._isActionsDiv(subelem, thisArg), [element]));
	let isActionCousin = (element) => (element.parent && DomUtils.getSiblings(element.parent).filter((sibling) => sibling !== element.parent).filter(hasActionChild).length === 1);
	let isAfterBreak = (element) => {
		let result = element.parent;
		if (result) {
			let filtered = DomUtils.getSiblings(element).filter((sibling) => sibling !== element);
			result = (filtered.length > 1) && thisArg.isBreak(filtered.pop());
		}
		return result;
	}

	return (isActionCousin(elem) && isAfterBreak(elem));
}