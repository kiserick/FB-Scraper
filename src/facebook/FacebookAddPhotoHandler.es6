import {FacebookHandler} from '../FacebookHandler.es6';
import {FormTransform} from './transform/FormTransform.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

const REGEX_CSID = /csid=([a-zA-Z0-9-]+)/;

util.inherits(FacebookAddPhotoHandler, FacebookHandler);
FacebookAddPhotoHandler.prototype.init = DomHandler;

//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookAddPhotoHandler(completionCallback) {
    this.init(completionCallback);
}

FacebookAddPhotoHandler.prototype.onend = function() {

	let isPhotoForm = (elem) => (this.isForm(elem) && DomUtils.findOne(isPhotoSubmit, [elem]));
	let isPhotoSubmit = (elem) => (this.isInput(elem) && (('add_photo_done' === elem.attribs.name) || ('view_post' === elem.attribs.name)));

	let parent = this.findPostParent(this.dom);

	if (parent) {

		let form = DomUtils.findOne(isPhotoForm, [parent]);
		
		// Load the inputs of the form
		let upload = new FormTransform().transform(form)
		if (!upload.csid) {
		    upload.form.csid = (this.readyUrl(form.attribs.action)).match(REGEX_CSID)[1] 
		}
		
		this.dom = {
		    upload: upload.form
		}
	}

    this._handleCallback();
}