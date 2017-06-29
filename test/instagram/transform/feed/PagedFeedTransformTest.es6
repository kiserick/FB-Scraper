import {Environment} from '../../../env/testEnv.es6';
import {PagedFeedTransform} from '../../../../src/instagram/transform/feed/PagedFeedTransform.es6';
import {Post} from '../../../../src/data/post.es6';
import {TestAid} from '../../../env/testAid.es6';

let chai = require('chai');
let env = new Environment();
let sut = new PagedFeedTransform();

chai.should();

describe('PagedFeedTransform', () => {

	beforeEach(() => {
		sut = new PagedFeedTransform({
			transform: () => {
				return [];
			}
		});
	});

	describe('#parse', () => {

		it('should be able to parse paged feed data...', () => {
			let data = '{"nodes":[{"caption":"#highponies #sideprofile #silouette #captainobvioushashtagscheckingin #allaboutthelighting","code":"BRDAuwThkd5","comments":{"count":283,"nodes":[{"created_at":1488483918,"id":"17874008512057194","text":"Are there black shorts in your line? @unfilterednikkib @nikkiblackketter","user":{"id":"279723296","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16464403_700554076771377_7983342097199529984_a.jpg","username":"rachaelwiseley"}},{"created_at":1488484654,"id":"17867616886068130","text":"Nice shape,nice shadow -Very","user":{"id":"445311386","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16906478_194233744393884_8611331964449849344_a.jpg","username":"czerni23"}},{"created_at":1488498333,"id":"17862622018107742","text":"LOVE IT !","user":{"id":"2936385179","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/14350556_117518688710450_7096708642254094336_a.jpg","username":"madamcosmeticsofficial"}}],"page_info":{"end_cursor":null,"has_next_page":false,"has_previous_page":true,"start_cursor":"AQBph4A5FTZ8YWi-2BOdXV1z0PyGGCE5uKx1SeBCzN8UD_TA5kHTgNOT1gUDBmTZFTN0Bq4eytzP2_7FCiY2R9wcVm9vTS2GebMXCEbandxYGw"}},"date":1488267243,"dimensions":{"height":784,"width":1080},"display_src":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-15/e35/17076827_1145060942271648_5745167079418363904_n.jpg","id":"1460013917161277305","is_video":false,"likes":{"count":47161,"nodes":[{"user":{"id":"1798245045","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16790295_292193611184080_8966171957603074048_a.jpg","username":"ricardonuga"}},{"user":{"id":"1470371047","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16789200_764694380346156_130847587421913088_a.jpg","username":"lnbnx"}},{"user":{"id":"588219735","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16585675_1193996617364615_7438497217637253120_a.jpg","username":"keepgoingkat"}},{"user":{"id":"15014515","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16122912_1826000417688443_6551509346285518848_a.jpg","username":"chrssy_hrrck"}},{"user":{"id":"2060543810","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/15535480_212887455835293_1246574683835334656_a.jpg","username":"josh_sherwin69"}},{"user":{"id":"18192235","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/13562100_1291023324249171_1834873115_a.jpg","username":"vernushy221b"}},{"user":{"id":"3144212102","profile_pic_url":"https://scontent-lga3-1.cdninstagram.com/t51.2885-19/11906329_960233084022564_1448528159_a.jpg","username":"___a_n_s___"}},{"user":{"id":"1433364527","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/14134826_995105423935296_1448876397_a.jpg","username":"lilasan7"}},{"user":{"id":"4213439236","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/15258826_1825389137779270_1702373294939832320_a.jpg","username":"lukewillamwesley"}},{"user":{"id":"1576052036","profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16583893_387472671609868_5040078937137348608_a.jpg","username":"gurkan_tuc"}}],"viewer_has_liked":true},"location":null,"owner":{"blocked_by_viewer":false,"followed_by_viewer":true,"full_name":"Nikki Blackketter","has_blocked_viewer":false,"id":"1011593","is_private":false,"profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16585033_966992290098572_7105433838251147264_a.jpg","requested_by_viewer":false,"username":"nikkiblackketter"},"usertags":{"nodes":[{"user":{"username":"gymshark"},"x":0.445249585137851,"y":0.5412599484055255}]}}],"page_info":{"end_cursor":"KLgBARIAAAJAACgAIAAQABAACAAIAAgA__e____2______-_87v__7__v_v__7___3__P99_9_____8__f9___f___6_______v-_____-____O_79d_7-e3bEc_a_2vDV1eweZnpyT3YvDy-Duv__P_v____7__9vf__9__37_9__P77__7_73__-_XXl3v_f_39___f_-7__u___-n_7f3_X6-_v-v7vdf___118CjZrN-ShyEJ1BIIBbawrWf0lYA","has_next_page":true,"has_previous_page":false,"start_cursor":"KKwBARIAAAIoABgAEAAIAAgACAAIAAgA__f____3______-_-_v_____v_v__7___3__v99_______8__f9___f___7________-_____-____f__9d_7-N_EO--279tsq89Ro_f__P_3____-___b3___3__f3_7_-f33__3_3v__-_rry7__v_7-___v__d__7v___s__b-_6_X39_7f7vdf___svsjswBgxkCABbawrWf0lYA"}}';
			let posts = sut.transform(data);

			posts.length.should.equal(1);
			posts[0].likeCount.should.equal(47161);
			posts[0].memento.should.equal('BRDAuwThkd5');
			posts[0].id.should.equal('1460013917161277305');
			posts[0].likeStatus.should.equal(Post.LikeStatusLike);
			posts[0].message.should.equal('#highponies #sideprofile #silouette #captainobvioushashtagscheckingin #allaboutthelighting');

			posts[0].media.length.should.equal(1);
			posts[0].media[0].height.should.equal(784);
			posts[0].media[0].width.should.equal(1080);
			posts[0].media[0].type.should.equal('photo');
			posts[0].media[0].imageUrl.should.equal('https://instagram.fper1-1.fna.fbcdn.net/t51.2885-15/e35/17076827_1145060942271648_5745167079418363904_n.jpg');

			posts[0].creator.id.should.equal('1011593');
			posts[0].creator.name.should.equal('nikkiblackketter');
			posts[0].creator.photoUrl.should.equal('https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/16585033_966992290098572_7105433838251147264_a.jpg');
		});

		it('should be able to parse a video post...', () => {
			let data = '{"nodes":[{"caption":"Aloha from Honolulu, Hawaii! Watch our Instagram story to head to the island of Oahu where Bretman Rock (@bretmanrock) takes us on a tour of some of his favorite local spots in his hometown. ","code":"BRERtS-BguS","comments":{"count":0,"nodes":[],"page_info":{"end_cursor":null,"has_next_page":false,"has_previous_page":true,"start_cursor":"AQBEOnxeuHKgpADXlYpPmEoBCsRwfMi7h_oaqWsPCw4MQsDIZlHoiXo4q7CMU1oH7vL1Ugz3oFZ_AsCSIptlvqbCn6tANw6mHBJt0e6UOlfQrA"}},"date":1488309698,"dimensions":{"height":640,"width":640},"display_src":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-15/e15/17075864_1866713073598857_3102577747772309504_n.jpg","id":"1460370058709961618","is_video":true,"likes":{"count":0,"nodes":[],"viewer_has_liked":false},"location":null,"owner":{"blocked_by_viewer":false,"followed_by_viewer":true,"full_name":"Instagram","has_blocked_viewer":false,"id":"25025320","is_private":false,"profile_pic_url":"https://instagram.fper1-1.fna.fbcdn.net/t51.2885-19/s150x150/14719833_310540259320655_1605122788543168512_a.jpg","requested_by_viewer":false,"username":"instagram"},"usertags":{"nodes":[]},"video_url":"https://instagram.fper1-1.fna.fbcdn.net/t50.2886-16/17014749_1830034310586410_1671985220204625920_n.mp4"}],"page_info":{"end_cursor":"KLgBARAAAAJQACgAIAAYABAACAAIAN9-23_-__7-v_____9_d___956_-v_____3_v___3_293_p_v_3e_f7_____p_P___________9__83_v__f__XjW75GThb_72uyOJL-Lxl3LFNHvH1z_vv_9_9___3-8_-_f__7___8___3_______9f9___37v_____f_9v_f-_f5---_f9__9______v___3339QCc7L_7f_lvwKRApaFCqqQBaImviv0lYA","has_next_page":true,"has_previous_page":false,"start_cursor":"KLEBARAAAAJAACgAGAAIAAgACAAIAN9-23____7-v_____9_d___996_-v_____3_v___3_393_p_v_3f_f7_____9_P___________9__-3____f_9YPje9Xl1_rdT_dfi3f4q_tb37_9_9___7_ef_fv__9___-___9________X_f__9-9_____7__2_9_79_5_--_f9__9______v___999_0E3zXbv86tnGTETzkACAFoia-K_SVgA="}}';
			let posts = sut.transform(data);

			posts[0].type.should.equal('video');
			posts[0].message.should.equal('Aloha from Honolulu, Hawaii! Watch our Instagram story to head to the island of Oahu where Bretman Rock (@bretmanrock) takes us on a tour of some of his favorite local spots in his hometown. ');
			
			posts[0].media[0].type.should.equal('video');
			posts[0].media[0].srcUrl.should.equal('https://instagram.fper1-1.fna.fbcdn.net/t50.2886-16/17014749_1830034310586410_1671985220204625920_n.mp4');
			posts[0].media[0].imageUrl.should.equal('https://instagram.fper1-1.fna.fbcdn.net/t51.2885-15/e15/17075864_1866713073598857_3102577747772309504_n.jpg');
		});
	});
});