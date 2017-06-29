require('../../src/env/overrides.js');

let uriparser = require('url');

let HEADERS_SUCCESS = { status: { code: 200 } };

class Http4Test {

	constructor() {
		this.requests = 0;
	}

	/*********** FALLBACK FUNCTIONALITY ***********/
	get(url, success, error) {
		this.requests++;
	}

	request(options, success, error) {
		// dummy
	}

	/************** TEST ASSISTANCE ***************/

	// Sets up the environment to expect a GET request, with the expected URL or URL components.
	//
	// <expected>	the URL literal or URL components to expect for the GET request.
	// <response>	well-formatted JSON data to pass to the success callback if the URL test succeeds.
	checkGetUrl(expected, response, headers) {

		headers = headers || HEADERS_SUCCESS;

		this.get = (url, success, error) => {
			this.checkPath(expected, url);
			success(response, headers);
		}
	}

	// Sets up the environment to expect a REQUEST request, with the expected host and path parameters.
	//
	// The last three parameters to this function are optional. The last (whether third or fifth) should be a
	// callback function that is given the HTTP options for examination, allowing custom testing.
	// The first and second optional parameters are related - the response will always be given priority is the meta does not exist, but
	// if the meta is passed-in it will always be the fourth parameter.
	//
	// <expectedHost>	the expected host property of the HTTP request as a String.
	// <expectedPath>	the expected path property of the HTTP request as either a String or an array.
	// <response>		OPTIONAL well-formatted JSON data to pass to the success callback if the options test succeeds.
	//					In order to test error callbacks, TRUE should be passed into this parameter to ensure that the callback is called.
	// <meta>			OPTIONAL well-formed JSON packet representing the metadata passed from the iOS layer. This should include HTTP headers and status codes.
	//					If this parameter is skipped, default success packet will be passed into the system.
	// <expectedExtra>	OPTIONAL callback that will test the extended properties of the HTTP options.
	checkHttpRequest(expectedHost, expectedPath, response, meta, expectedExtra) {

		let doctor = false;
		let attendant = (maybe) => (maybe && typeof(maybe) !== 'function');
		let registrar = (maybe) => (maybe && typeof(maybe) === 'function');

		if (registrar(expectedExtra)) {
			doctor = expectedExtra;
		} else if (registrar(meta)) {
			doctor = meta;
		} else if (registrar(response)) {
			doctor = response;
		}

		this.request = (options, success, error) => {

			// check the host is correct
			options.host.should.equal(expectedHost);
			// the that the path (or its components) are correct
			this.checkPath(expectedPath, options.path);
			// check any other options properties are correct
			if (doctor) {
				doctor(options);
			}
			// callback success
			if (attendant(response)) {
				if (attendant(meta)) {
					success(response, meta);
				} else {
					success(response, HEADERS_SUCCESS);
				}
			}
		}
	}

	// Checks whether the elements within the expectedPath are in the path.
	// As the expectedPath may be an array or a string literal, this function helps to handle both cases.
	//
	// <expectedPath>	the expected property/properties of the URL path.
	// <path> 				HTTP request path property to examine the components of.
	checkPath(expectedPath, path) {
		if (Array.isArray(expectedPath)) {
			expectedPath.forEach((chunk) => this.checkPath(chunk, path));
		} else {
			path.should.contain(expectedPath);
		}
	}

	// Performs a GET-based multiple-request for the test code, asserting that the GET URLs contain the expected literal or components.
	// This function should be used where it is expected that a request operation will take multiple GET stages. As this is a stateful function,
	// it is imperative that this object is recreated at the start of a test using this functionality.
	//
	// Be vary careful mixing this test functionality up with this.multiCheckHttpRequest.
	//
	// <expected>		array of either string literal or multi-part components to ensure that each request URL is correct.
	// <responses>	array of String responses to pass back to the success callback of the GET request. This array should be the same length as the expected array.
	multiCheckGetUrl(expected, responses) {
		this.get = (url, success, error) => {
			this.checkPath(expected[this.requests], url);
			success(responses[this.requests++]);
		}
	}

	// Performs multiple (ordered) requests for the test code, checking that the path provided in the request options is either exactly equal to or
	// contains the given array of URI components.
	// This function should be used where it is expected that a request operation will take multiple REQUEST stages. As this is a stateful function,
	// it is imperative that this object is recreated at the start of a test using this functionality.
	//
	// Be vary careful mixing this test functionality up with this.multiCheckGetUrl. Please use this.multiCheckHttpCommunication instead.
	//
	// <expected>	Array of URI test data. If an element is a string literal the options.path will be directly tested against it, if it is an array each element of the array should be within the options.path.
	// <responses>	Array of responses to pass back to the success callback of the request. This array should be the same length as the expected array.
	// <headers>	Array of well-formed JSON objects containing header properties to pass back to the success callback. If these are skipped, a default success header is used.
	// <extras>		OPTIONAL set of callback functions that will be called with the options object as a parameter for any required detailed testing.
	//          	This object should contain a mapping of (sequential) response indices to callback functions.
	// <isLog>      Logs progress of testing to aid in easier debugging.
	multiCheckHttpRequest(expected, responses, headers, extras, isLog) {

		this.expected = expected;
		this.responses = responses;
		this.resolveExtra = () => (extras ? (extras[this.requests] ? extras[this.requests] : false) : (headers && headers[this.requests] && typeof(headers[this.requests]) === 'function' ? headers[this.requests] : false));
		this.resolveHeader = () => (headers ? (headers[this.requests] && typeof(headers[this.requests]) !== 'function' ? headers[this.requests] : false) : false);

		this.request = (options, success, error) => this._handleCommunication(options, success, error, isLog);
	}

	// Helper to mock the actual communication for the more complicated multi-request tests.
	_handleCommunication(options, success, error, isLog) {

		let callback = this.resolveExtra();
		let header = this.resolveHeader();

		// Obtain the path
        let path = options.path
		if (options.uri) {
		    // Override with uri path (as takes precedence)
		    path = uriparser.parse(options.uri).path

		} else if (!path) {
		    // Extract from URL
		    let parts = uriparser.parse(options.url)
		    path = parts.path
		}

		// Obtain the expected path
		let expectedPath = this.expected[this.requests]
		if (isLog) {
		    logger.debug('REQUEST: ' + path + (expectedPath === path ? ' (exact match path)' : ' (with expectation of path ' + expectedPath + ')'))
		}

		this.checkPath(expectedPath, path);
		if (callback) {
			callback(options);
		}
		if (header) {
			success(this.responses[this.requests++], header)
		} else {
			success(this.responses[this.requests++], HEADERS_SUCCESS);
		}
	}

	// Shortcut function to execute multiple HTTP requests (of either GET or other type) without checking the options.path.
	//
	// <responses>	Array of responses to pass back to the success callback of the request. This array should be the same length as the expected array.
	// <headers>		Array of well-formed JSON objects containing header properties to pass back to the success callback. These will only be passed in if they exist.
	// <extras>			OPTIONAL set of callback functions that will be called with the options object as a parameter for any required detailed testing.
	//          		This object should contain a mapping of (sequential) response indices to callback functions.
	multiHttpCommunication(responses, headers, extras) {
		this.multiCheckHttpCommunication(Array.apply(null, Array(responses.length)).map(() => ''), responses, headers, extras);
	}

 	// Works similar to get/request except that handles calls to both intermixed (e.g. necessary in Facebook paging communication)
 	multiCheckHttpCommunication(expected, responses, headers, extras) {
		// Setup environment and handling request
		this.multiCheckHttpRequest(expected, responses, headers, extras);
   		// Setup handling get
		this.get = (url, success, error) => this._handleCommunication({ path: url }, success, error);
  }

	// Basic setup function that will call the error callback with the given response data.
	//
	// <response> JSON-formatted error message to be returned via either the GET or REQUEST calls to this HTTP implementation.
	setupForError(response) {
		this.get = (url, success, error) => error(response);
	  	this.request = (options, success, error) => error(response);
	}

	// Prepares the test environment for multiple GET requests to different URLs.
	// Each URL is prepared with its own response, allowing greater flexibility in the test code - this function should be used in
	// preference to the multiCheckGetUrl function if possible. The response resolution works on a String#contains function, allowing
	// a host to be specified only if desired.
	//
	// <responses>	Dictionary mapping URI hosts to their responses.
	setupForMultiGet(responses) {
		this.get = (url, success, error) => {
			for (var response in responses) {
				if (url.contains(response)) {
					success(response);
				}
			}
		}
	}

	// Prepares the test environment for multiple requests to different hosts.
	// Each host is prepared with its own response, allowing greater flexibility in the test code - this function should be used in
	// preference to the multiCheckHttpRequest function if possible.
	//
	// <responses>	Dictionary mapping options.hosts to their responses.
	setupForMultiRequest(responses) {
		this.request = (options, success, error) => {
			for (var response in responses) {
				if (options.host === response) {
					success(responses[response]);
				}
			}
		}
	}

	// Basic setup function that will call the success callback with the given response data.
	//
	// <response>	JSON-formatted response to be returned via either the GET or REQUEST calls to this HTTP implementation.
	// <headers> OPTIONAL headers property to pass to the success/fail functions.
	setupForSuccess(response, headers) {
		var executeHeaders = (exe) => exe(response, headers);
		var executeVanilla = (exe) => exe(response, HEADERS_SUCCESS);
		var execute = (exe) => (headers ? executeHeaders(exe) : executeVanilla(exe));

		this.get = (url, success, error) => execute(success);
		this.request = (options, success, error) => execute(success);
	}
}

// Test environment for reuse throughout the Smagger layer.
//
// This Environment implementation contains a number of reusable helper functions
// for configuring the environment. They should be accessed via the 'subject-dot' notation common throughout the Smagger testing code.
export class Environment {
	constructor() {

		global.ApolloError = (message, origin) => {
			return {
				message: message,
				origin: origin
			}
		};

		global.logger = console;
		global.logger.debug = console.log;
		global.logger.error = console.error;
		global.logger.info = console.log;
		global.logger.warn = console.error;

		this.http = new Http4Test();
	}
}
