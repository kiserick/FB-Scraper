import {TopCommentsTransform} from '../../../../src/instagram/transform/comments/TopCommentsTransform.es6';
import {Environment} from '../../../env/testEnv.es6';
import {TestAid} from '../../../env/testAid.es6';

let aid = new TestAid();
let chai = require('chai');
let env = new Environment();
let sut = new TopCommentsTransform();

chai.should();

describe('TopCommentsTransform', () => {

	beforeEach(() => {
		sut = new TopCommentsTransform();
	});

	describe('#comments', () => {

		it('should be able to gracefully parse no comments...', () => {
			let data = '{"edge_media_to_comment":{"count":0,"edges":[],"page_info":{"has_next_page":false, "end_cursor": null}}}';
			let expected = { comments: [] };

			aid.validate(expected, sut.transform(data));
		});

		it('should be able to parse comments for a post...', () => {
			let data = '{"edge_media_to_comment":{"count":197,"edges":[{"node":{"created_at":1488415835,"text":"bananaheid!!!!","id":"17873028631008998","owner":{"profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16788609_1813262872273241_1642417114855768064_a.jpg","id":"4704476591","username":"daboogiedownbomber"}}}],"page_info":{"has_next_page":true,"end_cursor":"AQBluccCZd6cQczf05tfcSQTnkv015h1rbVLRuQR84NTYML7kMgeSed5DpCLa5sKv_tcBxoIBbGEV6atxSJX1-YvCrmFEU7UNlu_9KlQ01JQRQ"}}}';
			let expected = { comments: [{
				creator: {
					photoUrl: 'https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16788609_1813262872273241_1642417114855768064_a.jpg',
					name: 'daboogiedownbomber'
				},
				message: 'bananaheid!!!!',
				rawTimestamp: '1488415835',
				vendor: 'instagram'
			}]};

			aid.validate(expected, sut.transform(data));
		});

		it('should be able to parse multiple comments for a post...', () => {
			let data = '{"edge_media_to_comment":{"count":111,"edges":[{"node":{"created_at":1488508065,"id":"17874453256057170","owner":{"id":"214482721","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/13408739_1736424953309424_1203983127_a.jpg","username":"kasher_katana"},"text":"That\'s the old @lupefiasco ?"}},{"node":{"created_at":1488510175,"id":"17852481718142237","owner":{"id":"237514216","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/15057267_214805288958244_4963173424533864448_a.jpg","username":"sheesuchafreakinlady"},"text":"#TheLittleThings #Humbling"}}],"page_info":{"end_cursor":"AQClSumooqsnBXDrn3uquZXEwQMq12ye1feJiElDvMQzTXNB_LxcQCUcy316J5ea_T4sVeqNm7d0Pz7KB7SIZk9losldx1B3mvxLG14oUOwm84sa5g0-08LXS3x7tELsedo","has_next_page":true}}}';
			let result = sut.transform(data);

			result.comments.length.should.equal(2);
			result.comments[0].message.should.not.equal(result.comments[1].message);
		});
	});

	describe('#next page cursor', () => {

		it('should return the lack of next page cursor...', () => {
			let data = '{"edge_media_to_comment":{"count":0,"edges":[],"page_info":{"has_next_page":false, "end_cursor": null}}}';
			let expected = { cursor: false };

			aid.validate(expected, sut.transform(data));
		});

		it('should be able to parse next page cursor...', () => {
			let data = '{"edge_media_to_comment":{"count":0,"edges":[],"page_info":{"has_next_page":true, "end_cursor": "IAmAnneFranksDiary"}}}';
			let expected = { cursor: 'IAmAnneFranksDiary' };

			aid.validate(expected, sut.transform(data));
		});
	});

	describe('#comment count', () => {
		
		it('should be able to parse the comment count...', () => {
			let data = '{"edge_media_to_comment":{"count":127,"edges":[],"page_info":{"has_next_page":true, "end_cursor": "IAmAnneFranksDiary"}}}';
			let expected = { count: 127 };

			aid.validate(expected, sut.transform(data));
		});
	});
});