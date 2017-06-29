import {ApolloDriver} from '../ApolloDriver.es6';
import {FacebookDriver} from '../facebookDriver.es6';
import {InstagramDriver} from '../instagramDriver.es6';
import {Smagger} from '../smagger.es6';
import {TwitterDriver} from '../twitterDriver.es6';
import {YouTubeDriver} from '../youtubeDriver.es6';


// Configure environmental prototype overrides
require('./overrides.js')

class Http4IOS {

	get(url, success, error) {
		let options = {
			url: url,
			success: success,
			error: error
		}
		HttpRequest.create(options).get()
	}

	request(options, success, error) {
		if (!options.url) {
			if (options.insecure) {
				options.url = 'http://' + options.host + options.path
			} else if (options.protocol) {
				options.url = options.protocol + '//' + options.host + options.path;
			} else {
				options.url = 'https://' + options.host + options.path
			}
		}
		options.success = success
		options.error = error

		// Setup body with binary data
		if ((options.body) && (typeof options.body != 'string')) {
			options.bodyBase64 = options.body.toString('base64')
			options.body = null
		}

		HttpRequest.create(options).request(options.method)
	}

}

export class Environment {
	constructor() {
		this.http = new Http4IOS();
	}
}


// Create a new instance of smagger
window.createSmagger = function() {

	var smagger = new Smagger();
	smagger.env = new Environment();
	
	smagger.driverRegistry.facebook = FacebookDriver;
	smagger.driverRegistry.twitter = TwitterDriver;
	smagger.driverRegistry.instagram = InstagramDriver;
	smagger.driverRegistry.apollo = ApolloDriver;
	smagger.driverRegistry.youtube = YouTubeDriver;
	
	return smagger;
}

// Undertake login of instagram
window.loginInstagramApi = function(username, password, callback) {
	InstagramDriver.loginInstagramApi(username, password, new Environment(), callback)
}