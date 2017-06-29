import {EndPageCursorTransform} from '../../../src/instagram/transform/EndPageCursorTransform.es6';
import {Environment} from '../../env/testEnv.es6';
import {TestAid} from '../../env/testAid.es6';

let aid = new TestAid();
let chai = require('chai');
let env = new Environment();
let sut = new EndPageCursorTransform();

describe('EndPageCursorTransform', () => {

	describe('#parse', () => {

		it('should be able to correctly parse the end page cursor...', () => {
			let data = '{"page_info":{"end_cursor":"IllGiveYouACursor","has_next_page":true}}';
			sut.transform(data).should.equal('IllGiveYouACursor');
		});

		it('should be able to correctly parse no further pages...', () => {
			let data = '{"page_info":{"end_cursor":null,"has_next_page":false}}';
			sut.transform(data).should.equal(false);
		});
	});
});