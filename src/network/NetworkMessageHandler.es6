import {AbstractHandler} from '../AbstractHandler.es6';
import {CustomEntities} from '../CustomEntities.es6';

let DomHandler = require('domhandler');
let util = require('util');

// This class is used by the NetworkDriver superclass to resolve message text from the given HTML.
util.inherits(NetworkMessageHandler, AbstractHandler);
NetworkMessageHandler.prototype.init = DomHandler;

export function NetworkMessageHandler(origin, completionCallback) {

	this.init(completionCallback);

	this.post = origin;
	this.message = false;
	this.post.property = 'message';

	// Helper function to check if a tag is the title
	this.isTitle = (name) => (name && 'title' === name.toLowerCase());
}

NetworkMessageHandler.prototype.onopentag = function(tag) {
	this.message = this.isTitle(tag);
}

NetworkMessageHandler.prototype.ontext = function(text) {
	this.message = (this.message ? text : false);
}

NetworkMessageHandler.prototype.onclosetag = function(tag) {
	
	if (this.isTitle(tag) && this.message) {
		this.post.message = (this.post.message + '\n\n' + (new CustomEntities().decode(this.message)));
	}
}