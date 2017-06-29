import {CustomEntities} from '../src/CustomEntities.es6'

let chai = require('chai')
chai.should()

describe("CustomEntities", function() {

	let subject = undefined

	beforeEach(() => subject = new CustomEntities());

	it("should decode encoded string to original one correctly", () => {
        var value = 'chicken & hamburger.';
		subject.decode(subject.encode(value)).should.equal(value);
	});

    it("should not throw an exception in case of non-string value", () => {
        var value = { value: 'lorem ipsum' };
		subject.decode(value).should.equal('');
	});

});