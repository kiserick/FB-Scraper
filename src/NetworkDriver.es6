import {Eventable} from './eventable.es6';
import {HtmlEnv} from './env/HtmlEnv.es6';
import {NetworkImageHandler} from './network/NetworkImageHandler.es6';
import {NetworkMessageHandler} from './network/NetworkMessageHandler.es6';
import {Origin} from './data/origin.es6';

let url = require('url');

export class NetworkDriver extends Eventable {

	// Shared error messaging reporting for all NetworkDrivers.
	// This function will broadcast an 'error' message with an ApolloError packet.
	//
	// <error>	String error message to broadcast.
	// <origin>	Origin object for error-reporting. The vendor property of this will be populated here for code brevity,
	broadcastError(error, origin) {

		let feedback = {};

		// clean errors coming from http response e.g. errors = { message = "No Internet connection available" }
		if (error.message) {
			error = error.message;
		} else if (Object.prototype.toString.call( error ) === '[object Array]') {
			// Stringify uncaught error types so that we don't loose errors.
			error = JSON.stringify(error);
		}
		
		origin.vendor = this.identity.vendor;
		feedback = new ApolloError(error, origin);

		this.broadcast('error', feedback);
	}

	// Helper function to check if the given Post object has the given Action as one of its actions.
	// This function operates case-insensitively to the type of the Action.
	//
	// <post>	Post object to check the actions property within.
	// <action>	String representing the Action#type property to look for.
	// RETURN 	Action object if it exists, or falsy otherwise.
	hasAction(post, action) {

		let actions = (post.actions || []);
		let upperer = ((act) => act.type = act.type.toUpperCase());
		let capitaliser = ((act) => act.type = act.type.capitalise());

		actions.forEach(upperer);
		action = action.toUpperCase();
		action = actions.find((indice) => indice.type === action, this);
		actions.forEach(capitaliser);

		return action;
	}

	// Determines whether the given headers represent the response to a successful HTTP request.
	// This function checks for the existence of a status code and returns true if that status code is between 200 and 399 (i.e. success or redirection).
	//
	// <headers>	Dictionary of HTTP headers received from the remote server.
	// RETURN 		Boolean indicating whether or not the received headers contains a status code between 200 and 399.
	isSuccessfulRequest(headers) {
		return ((headers && headers.status && headers.status.code) ? headers.status.code.betweenInclusive(200, 399) : false);
	}

	// Helper to convert String responses to JSON.
	jResponse(response) {
		try {
			return (typeof(response) === 'undefined' ? {} : (typeof(response) === 'string' ? (response === '' ? {} : JSON.parse(response)) : response));
		} catch (err) {
			logger.error(new ApolloError('Failed to parse "' + response + '" to JSON with error "' + err + '"', new Origin('jResponse', 'NetworkDriver')));
		}
		return {};
	}

	resolveImageLinks(post) {

		let mLink = false;
		let rHeaders = false;
		let link = url.parse(post.link);
		let html = new HtmlEnv(this, this.http);

		post = Object.assign({}, post);

		if ((!post.media || !post.media.length) && post.link && 'https:' === link.protocol) {

			let update = (() => {

				if (post.media && post.media[0] && post.media[0].imageUrl) {

					mLink = url.parse(post.media[0].imageUrl);

					if (rHeaders['x-redirect-locations'] && rHeaders['x-redirect-locations'][post.link]) {
						link = url.parse(rHeaders['x-redirect-locations'][post.link]);
					}

					mLink.host = (mLink.host || link.host);
					mLink.hostname = (mLink.hostname || link.hostname);
					mLink.protocol = 'https';

					if (this._isValidImage(mLink)) {

						mLink = url.format(mLink);

						this.http.get(mLink, (data, headers) => {

							rHeaders = headers['Content-Type'];
							if (rHeaders && rHeaders.startsWith('image/')) {

								post.media[0].imageUrl = mLink;
								this.broadcast('postUpdated', post);
							}
						}, () => {});
					}
				}
			});

			this.http.get(url.format(link), (data, headers) => {

				rHeaders = headers;
				html.parse(data, new NetworkImageHandler(post, update));
			
			}, () => {});
		}
	}

	// Function for use by extending classes.
	//
	// This function will determine whether there is sufficient message body in the post to all the post to
	// be represented as-is, or whether it needs to have its remote data collected.
	//
	// This function should be called by the implementing Driver before returning posts to the Smagger class to resolve the message body of links.
	resolveMessageLinks(post) {

		let html = new HtmlEnv(this, this.http);

		post = Object.assign({}, post);

		if ('link' === post.type && post.link && post.link.startsWith('https://')) {

			let rCallback = (data, headers) => {
				if (this.isSuccessfulRequest(headers)) {
					html.parse(data, new NetworkMessageHandler(post, pCallback));
				}
			};
			let pCallback = () => {
				if (post.message) {
					this.broadcast('postUpdated', post);
				}
			};
			
			this.http.get(post.link, rCallback, () => {});
		}
	}

	// Helper to store JSON raw data as a String object
	sMemento(memento) {
		return (typeof(memento) === 'undefined' ? '' : typeof(memento) === 'string' ? memento : JSON.stringify(memento));
	}

	/********************* HELPER FUNCTIONS *******************/
	_isValidImage(link) {
		return (link.hostname && ('ow.ly' !== link.hostname && 'bit.ly' !== link.hostname));
	}
}