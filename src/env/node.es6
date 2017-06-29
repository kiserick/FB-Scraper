require('./overrides.js')

let nodeRequest = require("request")
let moment = require('moment')
let fs = require('fs')

class Http4Node {

	constructor() {
		let requestsDirectory = __dirname + '/../../requests/'
		if (!fs.existsSync(requestsDirectory)) {
			fs.mkdirSync(requestsDirectory)
		}

		this.logDirectory = requestsDirectory + moment().format('YYYY-MM-DD--HH-mm-ss') + '/'

		// Ensure log directory exists
		//logger.info('------------- Http4Node -----------------------')
		//logger.info('Log Directory: ' + this.logDirectory)
		fs.mkdirSync(this.logDirectory)
		//logger.info('-----------------------------------------------')
	}

	get(url, success, error) {
		nodeRequest(url, (err, response, body) => {
			if (err) {
				error(err);
			} else {
				success(body);
			}
		});
	}

	request(options, success, error) {

		if (options.protocol === 'https') {
			options.protocol = 'https:'
		}

		if (!options.uri) {
			options.uri = 'https://' + options.host + options.path
		}

		// Obtain the time prefix to order and group files
		let timestampPrefix = moment().format('YYYY-MM-DD--HH-mm-ss-SSSS')
		let fileUrlSuffix = options.uri.replace(/\//g, '_').replace(/:/g, '_').substring(0, Math.min(options.uri.length, 60)) + '.txt'

		// Write out the request to file
		let req = ''
		for (var property in options) {
			if ((property == 'body') || (property == 'headers')) {
				continue; // write out headers and body afterwards
			}
			req += property + "=" + options[property] + "\n"
		}
		req += "\n\n" + options.method + " " + options.uri + "\n"
		if ('headers' in options) {
			for (var header in options.headers) {
				req += header + ': ' + options.headers[header] + "\n"
			}
		}
		req += "\n"
		if ('body' in options) {
			if (typeof options.body == 'string') {
				req += options.body
			} else if ('toString' in options.body) {
				req += options.body.toString()
			} else {
				req += '... (unknown body type)'
			}
		}
		fs.writeFileSync(this.logDirectory + '/' + timestampPrefix + '-request-' + fileUrlSuffix, req)


		// Undertake the request
		//logger.info(options.method + ': ' + options.uri)
		nodeRequest(options, (err, response, body) => {
			let resp = ''
			if (err) {

				// Write the error to file
				resp += JSON.stringify(err)
				fs.writeFileSync(this.logDirectory + '/' + timestampPrefix + '-response_error-' + fileUrlSuffix, resp)

				// Handle error
				error(err)

			} else {

				// Write the response to file
				resp += response.statusCode + "\n"
				if ('headers' in response) {
					for (var header in response.headers) {
						resp += header + ': ' + response.headers[header] + "\n"
					}
				}
				resp += "\n" + (body ? body : "")
				fs.writeFileSync(this.logDirectory + '/' + timestampPrefix + '-response-' + fileUrlSuffix, resp)

				// Transform response into headers
				let headers = response.headers
				headers.status = {
					code: response.statusCode
				}

				// Handle success
				success(body, headers)
			}
		})
	}

}

export class Environment {

	constructor() {
		this.http = new Http4Node();
	}

}