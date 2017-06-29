import {Expression} from './expression.es6';
import {FacebookAddPhotoHandler} from './facebook/FacebookAddPhotoHandler.es6';
import {FacebookAlbumHandler} from './facebook/FacebookAlbumHandler.es6';
import {FacebookDeleteHandler} from './facebook/FacebookDeleteHandler.es6';
import {FacebookFeedHandler} from './facebook/FacebookFeedHandler.es6';
import {FacebookNotificationGroupPostHandler} from './facebook/FacebookNotificationGroupPostHandler.es6';
import {FacebookNotificationsHandler} from './facebook/FacebookNotificationsHandler.es6';
import {FacebookPhotoHandler} from './facebook/FacebookPhotoHandler.es6';
import {FacebookPostHandler} from './facebook/FacebookPostHandler.es6';
import {FacebookProfileHandler} from './facebook/FacebookProfileHandler.es6';
import {FacebookSendPostHandler} from './facebook/FacebookSendPostHandler.es6';
import {FacebookShareHandler} from './facebook/FacebookShareHandler.es6';

let DomHandler = require('domhandler');
let uriparser = require('url');


// Functional class for use in a live system.
export class HtmlHandlerFactory {

    create(host, path, descriptor, callback) {
        
        let handler = new DomHandler(callback);
        let uri = uriparser.parse(host + '/' + path, true);
        
        if ((uri.hostname === 'm.facebook.com') || (uri.hostname === 'mbasic.facebook.com') || host === 'm.facebook.com' || host === 'mbasic.facebook.com') {

			if (path.match(Expression.NOTIFICATION_PATH_REGEX)) {
				handler = new FacebookNotificationsHandler(callback, descriptor);
            } else if (path.match(Expression.FEED_URL_REGEX)) {
				handler = new FacebookFeedHandler(callback, descriptor);
				// Photo album handling paths.
			} else if (path.match(Expression.ALBUM_URL_REGEX)) {
				handler = new FacebookAlbumHandler(callback, descriptor);
				// Photo handling paths
			} else if (path.match(Expression.PHOTO_URL_REGEX)) {
				handler = new FacebookPhotoHandler(callback, descriptor);
			} else if (path.match(Expression.DYNAMIC_PHOTO_URL_REGEX)) {
				handler = new FacebookPhotoHandler(callback, descriptor);
				// Post handling paths
			} else if (path.match(Expression.GROUP_POST_URL_REGEX)) {
				handler = new FacebookPostHandler(callback, descriptor);
			} else if (path.match(Expression.POST_URL_REGEX)) {
				handler = new FacebookPostHandler(callback, descriptor);
			} else if (path.match(Expression.COMMENT_POST_URL_REGEX)) {
				handler = new FacebookPostHandler(callback, descriptor);
			} else if (path.match(Expression.SHARE_POST_URL_REGEX)) {
				handler = new FacebookShareHandler(callback, descriptor);
			} else if (path.match(Expression.REGEX_URL_SENDPOST)) {
				handler = new FacebookSendPostHandler(callback, descriptor);
			} else if (path.match(Expression.DELETE_POST_REGEX)) {
				handler = new FacebookDeleteHandler(callback, descriptor);
			} else if (path.match(Expression.NOTIFICATION_GROUP_POST_REGEX)) {
          		handler = new FacebookNotificationGroupPostHandler(callback, descriptor);
				// Default to Profile (as title is name and URL is username based so can not effectively determine)
			} else if (path.match(Expression.REGEX_COMPOSE_FORM)) {
				handler = new FacebookAddPhotoHandler(callback, descriptor);
			} else {
				handler = new FacebookProfileHandler(callback, descriptor);
            }
			
		}

        return handler;
    }
}

// Default handler, for use in test class or as a fallback factory,
export class DefaultHandlerFactory {
	
	constructor() {}

	create(host, path, descriptor, callback) {
		return new DomHandler(callback);
	}
}