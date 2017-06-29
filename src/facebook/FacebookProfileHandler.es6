import {FacebookHandler} from '../FacebookHandler.es6';
import {User} from '../../src/data/user.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

const REGEX_USERID_FROM_USER = /(?:(?:&id=|&amp;id=)|(?:\?profile_id=)|groups\/)(\d+)/;
const REGEX_USERID_FROM_USERLINK = /thid\.([0-9]+)%3A/;

util.inherits(FacebookProfileHandler, FacebookHandler);
FacebookProfileHandler.prototype.init = DomHandler;

// Implementation of DomParser specifically for the Facebook noscript mobile site.
// PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookProfileHandler(callback, source) {
	this.init(callback, source);
	this.source = (source || '');
}

FacebookProfileHandler.prototype.onend = function() {

	let name = false;
	let photoUrl = false;
	let title = false;
	let type = 'person';
	let userId = false;

	var isAvatar = (elem) => (this.isAnchor(elem) && this.hasFirstChild(elem) && elem.children[0].attribs && elem.children[0].attribs.alt);
	var isCoverSection = (elem) => (this.isDiv(elem) && elem.attribs.id === 'root');
	var isGroup = (elem) => (this.isAnchor(elem) && '#groupMenuBottom' === elem.attribs.href);
	var isGroupPhoto = (elem) => (this.isImage(elem));
	var isGroupSearch = (elem) => (this.isAnchor(elem) && elem.attribs.href.startsWith('/groups/members/search/'));
	var isId = (elem) => (this.isAnchor(elem) && DomUtils.getText(elem) === name);
	var isNonAnchorAvatar = (elem) => (this.isImage(elem) && elem.attribs.width == 50);
	var isPage = (elem) => (this.isDiv(elem) && elem.attribs && elem.attribs.id && 'pages_mbasic_context_items_id' === elem.attribs.id);
	var isPerson = (elem) => (this.isAnchor(elem) && elem.attribs.href.contains('/profile_add_friend.php?'));
	var isTimelineCover = (elem) => (this.isDiv(elem) && 'm-timeline-cover-section' === elem.attribs.id);
	let isTitle = (elem) => (elem && 'title' === elem.name);
	var sequencer = (node, sequence) => (sequence.length === 0 ? node : (node && node.children && node.children[sequence[0]] ? sequencer(node.children[sequence[0]], sequence.slice(1)) : false));

	// Determine if a group
	var parent = DomUtils.findOne(isGroup, this.dom, true);

	// Obtain name, which for a page is the title
	title = DomUtils.findOne(isTitle, this.dom);
	name = (title ? this.extractText(title) : false);
	
	if (parent) {
		// Obtain the group id
		var groupSearch = DomUtils.findOne(isGroupSearch, this.dom);
		var groupSearchUrl = groupSearch.attribs.href;
		userId = groupSearchUrl.match(/group_id=(\d+)\&/)[1];

		// Obtain the photo URL
		var groupPhoto = DomUtils.findOne(isGroupPhoto, [parent]);
		if (groupPhoto) {
			photoUrl = groupPhoto.attribs.src;
		}

		// Group
		type = 'group';

	} else {
		// Obtain the lowest-level common div
		parent = DomUtils.findOne(isTimelineCover, this.dom, true);
		if (!parent) {
			parent = DomUtils.findOne(isCoverSection, this.dom, true);
			parent = sequencer(parent, [0, 0, 1, 0]);
		}

		if (parent) {
			// Obtain the User ID
			var avatarElement = DomUtils.findOne(isAvatar, [parent]);
			var pageElement = DomUtils.findOne(isPage, this.dom);

			if (avatarElement) {

				// Extract the image
				var imageElement = DomUtils.findOne(this.isImage, [avatarElement]);

				photoUrl = (imageElement ? this.readyUrl(imageElement.attribs.src) : false);
				userId = (avatarElement ? avatarElement.attribs.href.match(REGEX_USERID_FROM_USER) : false);
				userId = (userId ? userId[1] : false);

			} else {
				avatarElement = DomUtils.findOne(isNonAnchorAvatar, [parent]);
				photoUrl = (avatarElement ? this.readyUrl(avatarElement.attribs.src) : false);
			}

			// Determine if a page
			if (pageElement) {
				// Is a page
				type = 'page';
			} else if (!DomUtils.findOne(isPerson, this.dom)) {
				type = 'friend' // not friend, as add friend button available
			}
		}

		if (!userId) {
			userId = DomUtils.findOne(isId, this.dom);
			if (this.isAnchor(userId)) {
				userId = userId.attribs.href.match(REGEX_USERID_FROM_USERLINK);

				if (userId && Array.isArray(userId)) {
					userId = userId[1];
				}
			} else {
				userId = name;
			}
		}
	}

	// Load results
	let user = new User({
		id: userId,
		name: name,
		photoUrl: photoUrl,
		vendor: 'facebook'
	})
	user.type = type
	this.dom = {
		user: user
	}

	this._handleCallback();
}