import {TestAid} from '../../TestAid.es6';

let aid = new TestAid();
let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let htmlparser = require('htmlparser2');

// Commmon code test class for Facebook transformers.
//
// This class should be used by passing the appropriate transformer function into the constructor,
// then calling doTest with the success function, the test data, and the expected result data package as a dictionary.
//
// It is best to use this class with the optional third parameter to avoid the vagarities of the DomUtils packages. Be use to include the XML version and HTML DocType headers.
export class ScrapeTestAid {

	// Prepares this test aid for execution.
	//
	// <subject>	Transformer implementation under test.
	// <execution>	String representation of the subject function to call for testing.
	// <parent>		OPTIONAL String indicating that this test aid should search in the dom for the given element (by id or name in that order) to pass to the test subject's called function.
	constructor(subject, execution, parent) {
		this.aid = new TestAid();
		this.subject = subject;
		this.execution = execution;
		this.parent = parent;
	}

	// Entry-level function. This function delegates its functionality to the two helper functions, depending upon the type of the test parameter
	//
	// <done>	Success callback function, expected to be the Mocha done() callback.
	// <html>	Test data, expected to be a Facebook HTML page.
	// <test>	Testing object or function.
	doTest(done, html, test) {
		if (typeof(test) === 'function') {
			this._doCallbackTest(done, html, test);
		} else {
			this._doDictionaryTest(done, html, test);
		}
	}

	// Helper function to execute the given test against the given condition against the given HTML, calling the given done function upon completion.
	//
	// <done>	Success callback function, expected to be the Mocha done() callback.
	// <html>	Test data, expected to be a Facebook HTML page.
	// <test>	Callback function passed the result of the test execution.
	_doCallbackTest(done, html, test) {

		let temp = false;
		let handler = new DomHandler((error, data) => {
			if (error) {
				this.aid.fail('Received error');
			}

			if (this.parent) {
				data = Array.isArray(data) ? data : [data];
				temp = DomUtils.findOne((elem) => elem && elem.attribs && this.parent === elem.attribs.id, data);

				if (!temp) {
					temp = DomUtils.findOne((elem) => elem && this.parent === elem.name, data);
				}
			}
			data = (temp || data);

			test(this.subject[this.execution](data));
			done();
		});
		let parser = new htmlparser.Parser(handler, {
			recognizeSelfClosing: true
		});

		parser.write(html);
		parser.done();
	}

	// Helper function that validates that parsing the given HTML creates the given dictionary object. 
	//
	// <done>		Success callback function, expected to be the Mocha done() callback.
	// <html>		Test data, expected to be a Facebook HTML page.
	// <expected>	Dictionary representing the expected parsed data packet.
	_doDictionaryTest(done, html, expected) {
		this._doCallbackTest(done, html, (data) => {
			this.aid.validate(expected, data);
		});
	}
}