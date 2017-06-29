import {Origin} from '../data/origin.es6';
import {User} from '../data/user.es6';

// URL to issue Facebook scraper requests to.
const FACEBOOK_MOBILE_HOST = "m.facebook.com";

let htmlparser = require('htmlparser2');

// Shared cache of Users scraped from their Profile pages.
export class UserRegistry {

	// <factory>	HtmlHandlerFactory implementation to use to resolve the scraper handler required to parse the request responses.
	// <http>		Http request issuer implementation.
	constructor(factory, http) {

		this.factory = factory;
		this.http = http;

		this.completed = {};
		this.resolving = {};
		this.caching = {};
	}

	// Request a User object for the given path, but only if available cached.  It will not send a request for the user details.
	requestCachedUser(path, complete) {

		let userIdentifier = this._extractUserIdentifier(path);
		
		if (this.completed[userIdentifier]) {
			// Already have user
			complete(this.completed[userIdentifier])
		} else if (this.resolving[userIdentifier]) {
			// Request underway for user
			this.resolving[userIdentifier].push(complete)
		} else {
			// Cache for potential future request
			if (!this.caching[userIdentifier]) {
				this.caching[userIdentifier] = []
			}
			this.caching[userIdentifier].push(complete)
		}
	}

	// Requests a User object for the given path.
	// This is an asychronous call expecting a success callback. Where a User object has been resolved previously, this success callback
	// will be called immediately.
	//
	// <path>		Relative path (relative to m.facebook.com) of the Profile being requested.
	// <complete>	Callback function that will be called when the path request has finished being resolved. In the event of an error, this function will be called with an empty User object.
	requestUser(path, complete) {

		let handleError = (problem, response) => {
			resolve(new User({
				vendor: 'facebook'
			}));
		};
		let resolve = (user) => {
			try {
				this.resolving[userIdentifier].forEach(((callback) => callback(user)), this);
				delete(this.resolving[userIdentifier]);
			} catch (e) {
				// Looking for data to resolve https://trello.com/c/oT03tHW6
				//logger.error(new ApolloError(user, new Origin('resolve', 'UserRegistry', 'requestUser', 'Facebook')));
			}
		};
		let success = (response) => {

			let scraper = this.factory.create(FACEBOOK_MOBILE_HOST, path, response, (error, data) => {
				if (error) {
					handleError(error, response);
				} else {
					this.completed[userIdentifier] = data.user;
					resolve(data.user);
				}
			});
			let parser = new htmlparser.Parser(scraper, this._generateParserConfig());

			parser.write(response);
			parser.done();
		};
		let userIdentifier = this._extractUserIdentifier(path);

		if (this.completed[userIdentifier]) {
			try {
				// Already have user
				complete(this.completed[userIdentifier]);
			} catch (e) {
				// Looking for data to resolve https://trello.com/c/oT03tHW6
				//logger.error(new ApolloError(user, new Origin('resolve', 'UserRegistry', 'requestUser', 'Facebook')));
			}
		} else if (this.resolving[userIdentifier]) {
			// Request underway for user
			this.resolving[userIdentifier].push(complete);
		} else {
			// Load everything for resolution on requesting user
			this.resolving[userIdentifier] = [complete];

			if (this.caching[userIdentifier]) {

				this.caching[userIdentifier].forEach(((callback) => this.resolving[userIdentifier].push(callback)), this)
				delete(this.caching[userIdentifier])
			}

			// Request the user
			this.http.request(this._generateRequest(path), success, handleError);
		}
	}

	// Helper to generate a set of request options.
	//
	// <path>	Request path to issue the request to.
	// RETURN 	Dictionary of request options.
	_generateRequest(path) {
		return {
			headers: {
				cookie: this.cookie
			},
			host: FACEBOOK_MOBILE_HOST,
			path: path,
			method: 'GET'
		}
	}

	// RETURN 	Dictionary of options suitable for the HTML Parser object.
	_generateParserConfig() {
		return {
			decodeEntities: true,
			ignoreWhitespace: true,
			lowerCaseTags: true,
			recognizeSelfClosing: true,
			verbose: false
		};
	}

	// Extracts the user identifier from the path
	_extractUserIdentifier(path) {

		let extractor = (path.startsWith('/profile.php?') ? /(?:\?id=[0-9]+)/ : /\/([^\/?]+)[\/?]?/);
		let parts = path.match(extractor);

		if (parts && parts.length > 1) {
			return parts[1]
		}
		return path;
	}
}