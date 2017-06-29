import {Deleting} from './data/deleting.es6';
import {FacebookHandler} from '../FacebookHandler.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

util.inherits(FacebookDeleteHandler, FacebookHandler);
FacebookDeleteHandler.prototype.init = DomHandler;

//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookDeleteHandler(completionCallback) {
    this.init(completionCallback);
}

FacebookDeleteHandler.prototype.onend = function() {

	let form = false;
	let fbDtsg = false;
	let deleting = false;
    let parent = this.findPostParent(this.dom);

    let findFbDtsg = (elem) => (this.isInput(elem) && 'fb_dtsg' === elem.attribs.name);

    if (parent) {
    	form = DomUtils.findOne(this.isForm, [parent]);

    	if (form) {
    		fbDtsg = DomUtils.findOne(findFbDtsg, [form]);

    		if (fbDtsg) {
	    		deleting = new Deleting({
	    			fbDtsg: fbDtsg.attribs.value,
	    			url: form.attribs.action
	    		});
	    	}
    	}
    }

    this.dom = {
    	deleting: deleting
    };

    this._handleCallback();
}