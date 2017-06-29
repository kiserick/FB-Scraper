import {Eventable} from '../src/eventable.es6'

let chai = require('chai')
chai.should()

describe("Eventable", function() {

	let subject = undefined

	beforeEach(() => subject = new Eventable());

	it("should be possible to register listeners and trigger events", (done) => {
		subject.on('hello', () => {
			done();
		});
		subject.broadcast('hello');
	});

	it("should include event source in all broadcasts", (done) => {
		subject.on('hello', (source) => {
			source.should.equal(subject);
			done();
		});
		subject.broadcast('hello');
	});

	it("should include arguments in all broadcasts", (done) => {
		subject.on('hello', (source, arg) => {
			arg.should.equal('world');
			done();
		});
		subject.broadcast('hello', 'world');
	});
});