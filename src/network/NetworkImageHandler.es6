import {AbstractHandler} from '../AbstractHandler.es6';
import {Expression} from '../expression.es6';
import {Media} from '../../src/data/media.es6';
import {CustomEntities} from '../CustomEntities.es6';

let DomHandler = require('domhandler');
let util = require('util');

// This class is used by the NetworkDriver superclass to resolve an image from the given HTML.
util.inherits(NetworkImageHandler, AbstractHandler);
NetworkImageHandler.prototype.init = DomHandler;

export function NetworkImageHandler(origin, completionCallback) {

	this.init(completionCallback);

	this.body = false;
	this.post = origin;
	this.media = new Media();
	this.post.property = 'postimageupdated';

	this.media.alt = '';
}

NetworkImageHandler.prototype.onopentag = function(name, attribs) {

	var alt = '';
	var url = false;
	var temp = false;
	var changed = false; 

	let validFormat = (format) => (url && url.contains(format));
	let isValidImageUrl = () => [ 'bmp', 'gif', 'jpg', 'jpeg', 'png', 'tiff' ].some(validFormat);

	if ('body' === name) {
		this.body = true;
	}

	if (this.body && 'img' === name) {

		Object.keyValues(attribs).forEach((attrib) => {

			attrib.key = attrib.key.toLowerCase();

			if ('data-echo' === attrib.key || 'data-original' === attrib.key || 'src' === attrib.key) {

				url = attrib.value;

			} else if ('alt' === attrib.key && attrib.value.length) {

				alt = attrib.value;
				changed = (attrib.value.length > this.media.alt.length);
			}
		});
	}

	if (changed && isValidImageUrl()) {

		temp = url.match(Expression.REGEX_IMAGEURL_QUERIES);
		url = (temp ? temp[1] : url);

		this.media.alt = alt;
		this.media.imageUrl = new CustomEntities().decode(url);

		this.post.media = [ this.media ];
	}
}

NetworkImageHandler.prototype.onclosetag = function(name, attribs) {
	if ('body' === name) {
		this.body = false;
	}
}