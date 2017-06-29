import {FacebookHandler} from '../FacebookHandler.es6';
import {FeedTransform} from './transform/FeedTransform.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

// Constant div ID that is always the immediate (earlier) sibling of the div containing the stories.
const NODE_PARENT_STORIES = 'm-top-of-feed';

util.inherits(FacebookFeedHandler, FacebookHandler);
FacebookFeedHandler.prototype.init = DomHandler;

// Implementation of DomParser specifically for the Facebook noscript mobile site.
// PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookFeedHandler(callback, source) {
	this.init(callback);
	this.source = (source || '');
}

FacebookFeedHandler.prototype.onend = function() {

    var errors = [];
    var isTopOfFeed = (elem) => (this.isDiv(elem) && NODE_PARENT_STORIES === elem.attribs.id);
	let isLtrElement = (elem) => (elem && elem.attribs && elem.attribs.dir && 'ltr' === elem.attribs.dir);
    var isMoreResults = (elem) => (this.isAnchor(elem) && elem.attribs.href && (elem.attribs.href.indexOf('/stories.php?aftercursorr=') === 0));

    // Obtain the feed items
    var rtl = !DomUtils.findOne(isLtrElement, this.dom);
    var parent = DomUtils.findOne(isTopOfFeed, this.dom);
    if (parent === undefined){
        errors.push({error:'Not found m-top-of-feed', html:this.source});
    }
    var feedItems = new FeedTransform(rtl, this.source).transform(parent);

    // Obtain the more stories url
    var moreStories = DomUtils.findOne(isMoreResults, this.dom);
    var moreStoriesUrl = (moreStories ? this.readyUrl(moreStories.attribs.href) : false)

    // Load results
	this.dom = {
		nextPageUrl: moreStoriesUrl,
		posts: feedItems
	};

    if(errors.length === 0){
        errors = null;
    }
    this._handleCallback(errors);

}

FacebookFeedHandler.prototype.identifiy = "FacebookFeedHandler";