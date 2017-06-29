let htmlparser = require('htmlparser2');
let uriparser = require('url');

// Decorator for the ios/nodejs environments to add HTTP -> HTML functionality.
//
// To ensure that the decorated Environment is correctly initialised, this object should not
// be created when its using driver is created, but when required.
export class HtmlEnv {

	// Prepares this decorator.
	//
	// <driver>	Utilising NetworkDriver. Error callbacks are issued on this object to ensure correctness of reporting.
	// <env>	Environment that this object will decorate.
	// <host>	Constant value representing the host that this environment will contact.
	constructor(driver, env, host) {
		this.driver = driver;
		this.http = env;
		this.host = host;
	    this.parserConfig = {
	        decodeEntities: true,
	        ignoreWhitespace: true,
	        lowerCaseTags: true,
	        recognizeSelfClosing: true,
	        verbose: false
	    };
	}
	  
    // This function expects the path to be a HTTP GET request URL, and the response to be HTML. The headers are used to determine success.
    //
    // @deprecated	Please migrate away from using this function as it prevents us from capturing user HTML data (where required) for debugging.
    //
    // <options>    Dictionary of request parameters.
	// <origin>		Origin object for error-reporting.
	// <handler>	DomHandler implementation to be given to the HtmlParser for parsing the HTML received.
    issueParsedGet(options, origin, handler) {
        this.issueGet(options, origin, (data) => this.parse(data, handler));
    }

    // This function issues a GET request.
    //
    // <options> 	Dictionary of request parameters.
	// <origin>		Origin object for error-reporting.
    // <success> 	Callback with successful data and headers.
    issueGet(options, origin, success) {
        let clone = Object.assign({}, options);
        clone.method = 'GET';
        this._issueHtmlRequest(clone, origin, success);
    }

    // This function expects the path to be a HTTP POST request URL, and the response to be HTML. The headers are used to determine success.
    //
    // @deprecated	Please migrate away from using this function as it prevents us from capturing user HTML data (where required) for debugging.
    //
    // <options>	Dictionary of request parameters.
	// <origin>		Origin object for error-reporting.
	// <handler>	DomHandler implementation to be given to the HtmlParser for parsing the HTML received.
    issueParsedPost(options, origin, handler) {
        this.issuePost(options, origin, (data) => this.parse(data, handler));
    }
    
    // This function issues a POST request.
    //
    // <options> Dictionary of request parameters.
	// <origin>		Origin object for error-reporting.
    // <success> Callback with successful data and headers.
    issuePost(options, origin, success) {
        let clone = Object.assign({}, options);
        clone.method = 'POST';
        this._issueHtmlRequest(clone, origin, success);
    }

    // Helper to the to issue the actual request.
    _issueHtmlRequest(options, origin, success) {
        
        options.headers = (options.headers || {});
        options.host = (options.host || this.host);
        options.protocol = (options.protocol || 'https:');

        options.headers.cookie = this.driver.identity.oauthSecret;

        this.http.request(options, (data, headers) => {

        	headers = this.driver.jResponse(headers);

            if (this._isSuccessfulRequest(headers)) {
                success(data, headers)
		    } else if (headers && headers.status) {
                this.driver.broadcastError(('URL ' + options.host + options.path + ' Failed with error: ' + headers.status.code + ', ' + headers.status.reason), origin);
            } else {
                this.driver.broadcastError('Unknown error', origin);
            }
        }, (error) => {
            this.driver.broadcastError(error, origin);
        });
    }
    
    // Helper to parse successful response data using the handler
    parse(data, handler) {
        let parser = new htmlparser.Parser(handler, this.parserConfig);
        parser.write(data);
        parser.done();
    }

    // Helper to follow possible redirect
    //
    // <data> 					Data of response.
    // <headers> 				Headers of response.
    // <options> 				Base options should a redirect be required (typically containing cookies)
    // <origin>					Origin object containing error data.
    // <handler(data, headers)> to handle the data (either original of request or resulting redirect data)
    handlePossibleRedirect(data, headers, options, origin, handler) {
        
        let doRedirection = (location) => {
            options.uri = location
            options.path = uriparser.parse(options.uri).path // provided, as scraper factories often require it
            this.issueGet(options, origin, handler)
        }

        // Determine redirect
        if ((headers && headers.status && headers.status.code && headers.status.code.betweenInclusive(300, 399))) {
            doRedirection(headers.location)
            return
        }
            
        // Determine if x-redirect
        let originalUrl = options.uri
        if (!originalUrl) {
            originalUrl = 'https://' + options.host + options.path
        }
        if (headers['x-redirect-locations'] && headers['x-redirect-locations'][originalUrl]) {
            // Undertake redirection
            doRedirection(headers['x-redirect-locations'][originalUrl])
            return
        }
        
        // No redirect, handle input data
        handler(data, headers)
    }

    // Determines whether the given headers represent the response to a successful HTTP request.
	// This function checks for the existence of a status code and returns true if that status code is between 200 and 399 (i.e. success or redirection).
	//
	// <headers>	Dictionary of HTTP headers received from the remote server.
	// RETURN 		Boolean indicating whether or not the received headers contains a status code between 200 and 399.
	_isSuccessfulRequest(headers) {
		return ((headers && headers.status && headers.status.code) ? headers.status.code.betweenInclusive(200, 399) : false);
	}	
}