import {FacebookHandler} from '../../FacebookHandler.es6';

let DomUtils = require('domutils');
let util = require('util');

util.inherits(ProfileUrlTransform, FacebookHandler);

// Creates a ProfileUrlTransform handler.
//
// The ProfileUrlTransform handler is stateful, handling both left-to-right and right-to-left layout, depending upon the
// language of the page being scraped. Left-to-Right layout (representing Latinate languages) is the default behaviour - this class
// is expected to operate left-to-right unless FALSE is passed into the constructor.
//
// <ltr>	Boolean indicating whether or not the handler should be operating in Left-To-Right mode. This defaults to TRUE.
export function ProfileUrlTransform(ltr) {
	this.ltr = (typeof(ltr) === 'undefined' ? true : ltr);
}

ProfileUrlTransform.prototype.transform = function(parent) {

	let aHeader = false;
    let header = DomUtils.findLeftOrRight(this.isHeader, parent);
	let isActionedName = (element) => (this.isAnchor(element) && element.parent && 'strong' === element.parent.name);

    if (header && header.children && header.children.length === 1) {
    	aHeader = DomUtils.findOne(this.isAnchor, header.children);
    } else if (header) {
    	aHeader = DomUtils.findLeftOrRight(isActionedName, header, this.ltr);
    }
    
    return (aHeader ? this.readyUrl(aHeader.attribs.href) : false);
}