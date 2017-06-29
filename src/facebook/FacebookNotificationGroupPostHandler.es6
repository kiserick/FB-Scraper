import {FacebookHandler} from '../FacebookHandler.es6';
import {FeedTransform} from './transform/FeedTransform.es6';
import {ProfileUrlTransform} from './transform/ProfileUrlTransform.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

util.inherits(FacebookNotificationGroupPostHandler, FacebookHandler);
FacebookNotificationGroupPostHandler.prototype.init = DomHandler;
  
//Implementation of DomParser specifically for the Facebook noscript mobile site.
//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookNotificationGroupPostHandler(completionCallback, source) {
	this.init(completionCallback);
	this.source = (source || '');
}

FacebookNotificationGroupPostHandler.prototype.onend = function() {

    // Obtain the container div
    let isContainerRoot = (elem) => (this.isDiv(elem) && elem.attribs.id === 'm_group_stories_container')
    let containerDiv = DomUtils.findOne(isContainerRoot, this.dom)

    // Obtain the first actions div
    let feedTransform = new FeedTransform(this.source)
    if (containerDiv) {
        let actionsDiv = DomUtils.findOne(feedTransform.isActionsDiv.bind(feedTransform), [containerDiv])

        // Extract the full story
        let fullStoryUrl = feedTransform.extractFullStoryUrl(actionsDiv)

        // Obtain the identifier
        let id = feedTransform.extractId(actionsDiv)

        // Obtain the user profile URL
        let userProfileUrl = new ProfileUrlTransform().transform(containerDiv)

        this.dom = {
            post: {
                id: id,
                username: userProfileUrl,
                fullStoryUrl: fullStoryUrl
            }
        }
    }
    // Handle completion
    this._handleCallback()

}