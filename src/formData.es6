import {Origin} from './data/origin.es6';
//-------------- FormData http override -----------

// Active state
var activeState
// FormData
var _FormData = require('form-data')

//Helper function to prepare the state of the {@link #activeHttp} object, ready for executing a request.
var _initState = (http, success, failure) => {
	activeState = {
		http: http,
		success: success,
		failure: failure
	}
};

// FormData overrides for request replacement
exports.request = function(options) {
	return new FormDataRequest(activeState, options);
}

// Override of http/https request objects
export class FormDataRequest {
  
	constructor(activeState, options) {
		this.activeState = activeState;
		this.options = options || {};
		this.options.body = new Buffer(0);

		this.appendBody = (chunk) => {
			if (chunk) {
				if (typeof chunk == 'string') {
					this.options.body = Buffer.concat([this.options.body, new Buffer(chunk)]);
				} else {
					this.options.body = Buffer.concat([this.options.body, chunk]);
				}
			}
		}
	}

	// Necessary methods for FormData submit
	setHeader(name, value) {
		this.options.headers = this.options.headers || {};
		this.options.headers[name] = value;
	}

	on(event, callback) {
		// Do nothing
	}

	removeListener(event) {
		// Do nothing
	}

	emit(event, src) {
		// Load the entity
		src.on('data', (chunk) => {
			this.appendBody(chunk);
		}).on('end', (chunk) => {
			this.appendBody(chunk);
		});
	}

	end() {
		// Undertake the request (with appropriate handling)
		this.activeState.http.request(this.options, this.activeState.success, this.activeState.failure);
	}
}

export class FormDataSender {

	constructor(http) {
		this.http = http;
		this.form = new _FormData();
	}

	append(key, data, options) {
		this.form.append(key, data, options);
	}

	on(event, callback) {
		this.form.on(event, callback);
	}

	submit(options, success, failure) {

		// Setup state
		_initState(this.http, success, failure);

		// Submit the call with the override
		this.form.submit(options, function(err, res) {
			logger.warn(new ApolloError('ERROR: HTTP request not overridden', new Origin('submit', 'FormDataSender', 'initialisation')));
		});
	} 
}

global.formData = module.exports;