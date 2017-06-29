import {Environment} from '../../../env/testEnv.es6';
import {PagedCommentsTransform} from '../../../../src/instagram/transform/comments/PagedCommentsTransform.es6';
import {TestAid} from '../../../env/testAid.es6';

let chai = require('chai');
let env = new Environment();
let sut = new PagedCommentsTransform();

chai.should();

describe('PagedCommentsTransform', () => {

	beforeEach(() => {
		sut = new PagedCommentsTransform();
	});

	describe('#parse', () => {

		it('should be able to parse paged comment data...', () => {
			let data = '{"comments":{"count":226,"nodes":[{"created_at":1488432623,"id":"17851176253147653","text":"@diplo #DanceShowWithMJR mixcloud.com/michaeljohn-roach","user":{"id":"44763354","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16230983_100500300468954_3834996081217765376_a.jpg","username":"michaeljohnroachradio"}}],"page_info":{"end_cursor":null,"has_next_page":false,"has_previous_page":true,"start_cursor":"AQCIsbAIx0FrAqgAaPCU7r_z4VCO88ccRXQ0GFzmXpuyS2BMPpEIgblPAn1hSkGIC2C65uPNDP3MDfsDsU2xM_fpBQCJWfcv54Mtd_0C5NFXcw"}},"status":"ok"}';
			let comments = sut.transform(data);

			comments.comments[0].message.should.equal('@diplo #DanceShowWithMJR mixcloud.com/michaeljohn-roach');
			comments.comments[0].id.should.equal('17851176253147653');
			comments.comments.length.should.equal(1);
			comments.cursor.should.equal(false);
			comments.count.should.equal(226);
		});
	});
});