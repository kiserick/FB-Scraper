import {Expression} from '../expression.es6';
import {FacebookHandler} from '../FacebookHandler.es6';
import {Notification} from '../data/notification.es6';
// import {Origin} from '../data/origin.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');
let uriparser = require('url');

util.inherits(FacebookNotificationsHandler, FacebookHandler);
FacebookNotificationsHandler.prototype.init = DomHandler;

//Implementation of DomParser specifically for the Facebook noscript mobile site.
//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookNotificationsHandler(callback, source) {
	this.init(callback);
	this.source = (source || '');
}

FacebookNotificationsHandler.prototype.onend = function() {

	let notifications = [];
	let notification = false;

	// Find the root (as parent of time section headers)
	let firstSectionHeader = (DomUtils.findOne((element) => ('notifications_list' === element.attribs.id), this.dom) || this.dom[0]);
	// Find each notification (table entries that do not contain an image)
	let data = DomUtils.findAll((element) => ('td' === element.name), [firstSectionHeader]).filter((element) => ((DomUtils.findOne(this.isImage, [element]) === null)));

	// Create the listing of notifications
	notifications = data.map((entry) => {

		notification = false;

		// Obtain the URL
		let urlLink = DomUtils.findOne(this.isAnchor, [entry]);
		let url = this.readyUrl(urlLink.attribs.href);

		// Obtain the redirect URL for the notification
		let uri = uriparser.parse(url, true);
		let birthday = (uri.query ? uri.query.birthdays : false);
		let redirectUrl = (uri.query ? uri.query.redir || '' : '');
		
		if (birthday || (redirectUrl && redirectUrl.match(Expression.NOTIFICATION_REDIRECTURL_VALID))) {
			
			url = uri.search;
			
			if (url) {
				url = this.readyUrl(this.readyUrlParameter(url));
				url = url.substring(url.indexOf('/'));
			}

			// Extract the identifier 
			let id = uri.query.seennotification;

			// Extract the timestamp
			let timestampElement = DomUtils.findOne((element) => ('abbr' === element.name), [entry]);
			let timestamp = (timestampElement ? this.extractText(timestampElement) : 'Today');

			// Extract the message (removing the trailing timestamp)
			let message = this.extractText(entry);
			message = message.substring(0, (message.length - ('Today' === timestamp ? 0 : timestamp.length))).trim();

			// Return the notification
			notification = new Notification({
				id: id,
				message: message,
				rawTimestamp: timestamp,
				creator: url,
				vendor: 'facebook'
			});
		}

		return notification;

	}).filter((notification) => (notification));

	// Return the notifications
	this.dom = {
		notifications: notifications
	}

	this._handleCallback();
}