import {Action} from '../../../../src/data/action.es6';
import {Environment} from '../../../env/testEnv.es6';
import {FrontPageFeedTransform} from '../../../../src/instagram/transform/feed/FrontPageFeedTransform.es6';
import {Post} from '../../../../src/data/post.es6';
import {TestAid} from '../../../env/testAid.es6';

let aid = new TestAid();
let env = new Environment();
let chai = require('chai');
let feedTranform = false;

chai.should();

describe('FrontPageFeedTransform', function() {

	let testMedia = {
		"page_info": {
			"end_cursor": "KGQBEgDwACAAEAAQAAgACAAIAAgACAD_97_y_-v____f233_v_____9____1_-3_______n3pthZdMO0z0rM8_3_f_v9b-f___1-_9f_______-______t_9f7P__Tb_JgHEaAQIFvKWrfrQVgA=",
			"has_next_page": true
		},
		"edges": [{
			"node": {
				"location": null,
				"edge_media_to_tagged_user": {
					"edges": [

					]
				},
				"id": "1459967806972105324",
				"taken_at_timestamp": 1488261746,
				"display_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-15/e15/p640x640/16789753_487737861615977_1151757383786037248_n.jpg",
				"__typename": "GraphVideo",
				"edge_media_to_caption": {
					"edges": [{
						"node": {
							"text": "\uae30\ubd84\uc774 \uc88b\uc73c\uc2dc\ub2e4 \ud83d\udc6f @bssazzzn"
						}
					}]
				},
				"shortcode": "BRC2Pw2FBJs",
				"edge_media_preview_like": {
					"count": 10315,
					"edges": [{
						"node": {
							"id": "1738016081",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/15338376_219594235153823_1576391759435399168_a.jpg",
							"username": "mgh86332"
						}
					}, {
						"node": {
							"id": "2987242014",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/16110896_1887044038197345_6843411296705052672_a.jpg",
							"username": "_geunhyung"
						}
					}, {
						"node": {
							"id": "4055604652",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/14487273_134348670364524_1584317219637035008_a.jpg",
							"username": "duyeong.yang"
						}
					}, {
						"node": {
							"id": "1439348423",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/16228617_1724455411201085_2074827756427804672_a.jpg",
							"username": "nu_hee"
						}
					}, {
						"node": {
							"id": "207023086",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/15403393_346549619054679_2859600783433793536_a.jpg",
							"username": "jiheonlee_"
						}
					}, {
						"node": {
							"id": "3952842474",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/14295322_1790754451171237_254964173_a.jpg",
							"username": "bbg4_msyh"
						}
					}, {
						"node": {
							"id": "711946897",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/11123795_857766160931620_2087092975_a.jpg",
							"username": "sim_boooooooo"
						}
					}, {
						"node": {
							"id": "4246351849",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/15337083_2048730712020082_7383545254273613824_a.jpg",
							"username": "gim_jseong"
						}
					}, {
						"node": {
							"id": "1711013737",
							"profile_pic_url": "https://instagram.fgru3-2.fna.fbcdn.net/t51.2885-19/11906329_960233084022564_1448528159_a.jpg",
							"username": "herns6.hhhh"
						}
					}, {
						"node": {
							"id": "2125689259",
							"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/14294997_543804345811732_1021905891_a.jpg",
							"username": "dong_jin2_"
						}
					}]
				},
				"viewer_has_liked": true,
				"attribution": "Boomerang",
				"dimensions": {
					"height": 799,
					"width": 640
				},
				"is_video": true,
				"edge_media_to_comment": {
					"page_info": {
						"end_cursor": "AQBKBw9CUUfki1hIp10yJZRAhe-t1qZ43Uve4pbmcF6VECaMqPTOzl1sCiGe571IkAyaQV9cvWxyktF4kgy15Z53JLm2_6541dcmPx3Uo-4A6g",
						"has_next_page": true
					},
					"count": 208,
					"edges": [{
						"node": {
							"id": "17850247327186317",
							"owner": {
								"id": "3729894458",
								"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/16464196_1640972126209898_7604281632412925952_a.jpg",
								"username": "lsu.jin"
							},
							"text": "\uc5b8\ub2c8\uc5b8\ub2c8!! \uc624\ub298 \uc624\ud2f0\ub54c \ub108\ubb34 \uc88b\uc558\uc5b4\uc694~",
							"created_at": 1488306283
						}
					}, {
						"node": {
							"id": "17867915161067691",
							"owner": {
								"id": "18563562",
								"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/14474291_512616578939280_7461822656740851712_a.jpg",
								"username": "ps_imissu"
							},
							"text": "@jj_minute",
							"created_at": 1488307770
						}
					}, {
						"node": {
							"id": "17864871103072704",
							"owner": {
								"id": "1669875157",
								"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/15803215_147113659112689_4814631598349615104_a.jpg",
								"username": "ssua_01_"
							},
							"text": "\u3134\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b\u314b",
							"created_at": 1488310123
						}
					}, {
						"node": {
							"id": "17873623243048313",
							"owner": {
								"id": "2540141399",
								"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/12940856_1740111979568288_1249329603_a.jpg",
								"username": "su5686"
							},
							"text": "\uc544 \ub118 \uae30\uc57c\uc6cc\u315c\u3160\u3160\u315c\u315c",
							"created_at": 1488334068
						}
					}]
				},
				"owner": {
					"full_name": "\ubcfc\ube68\uac04 \uc0ac\ucd98\uae30 \uc548\uc9c0\uc601",
					"requested_by_viewer": false,
					"profile_pic_url": "https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/11378157_1567599906866329_1109031020_a.jpg",
					"has_blocked_viewer": false,
					"id": "730742524",
					"blocked_by_viewer": false,
					"username": "hey_miss_true",
					"is_private": false,
					"followed_by_viewer": true
				},
				"video_url": "https://instagram.fkul4-1.fna.fbcdn.net/t50.2886-16/17012968_1123275981134972_6560586106830585856_n.mp4",
				"video_view_count": 48741,
				"comments_disabled": false
			}
		},
		{
	    "node":{
	       "taken_at_timestamp":1488510138,
	       "location":null,
	       "edge_media_to_caption":{
	          "edges":[
	             {
	                "node":{
	                   "text":"\uc0ac\ub791\ud574\uc8fc\uc138\uc694!\u2764\n#\uae40\uc9c0\uc218 #A_dream #Dream_All_Day"
	                }
	             }
	          ]
	       },
	       "owner":{
	          "is_private":false,
	          "username":"hey_miss_true",
	          "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/11378157_1567599906866329_1109031020_a.jpg",
	          "followed_by_viewer":true,
	          "blocked_by_viewer":false,
	          "id":"730742524",
	          "has_blocked_viewer":false,
	          "full_name":"\ubcfc\ube68\uac04 \uc0ac\ucd98\uae30 \uc548\uc9c0\uc601",
	          "requested_by_viewer":false
	       },
	       "id":"1462051466517004593",
	       "comments_disabled":true,
	       "edge_media_to_comment":{
	          "page_info":{
	             "has_next_page":true,
	             "end_cursor":"AQBdZ3FEsOc-fxUWrr5uqqEKbZdMrilHplUEdAvtISxwFzpnxO0HTZ673sY9Sqhv09lZlqGJBQqhDez6RgckHgEWH3rFTbfFpzLtTkkwWJQ0o41-1QW3F8Pnv2811YaKrK0"
	          },
	          "edges":[
	             {
	                "node":{
	                   "text":"\ub178\ub798 \ub118\ub098 \uc88b\uc544\uc694!!\u314e\u314e",
	                   "id":"17872962610012443",
	                   "created_at":1488525520,
	                   "owner":{
	                      "id":"3578978757",
	                      "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/13741427_1759539124329163_2060530280_a.jpg",
	                      "username":"cycler1022"
	                   }
	                }
	             },
	             {
	                "node":{
	                   "text":"\ub178\ub798\ub3c4\uc88b\uace0 \ubba4\ube44\ub3c4 \ub9d8\uc5d0\ub4dc\ub124\uc694\u314e\u314e",
	                   "id":"17872740442000469",
	                   "created_at":1488525691,
	                   "owner":{
	                      "id":"2961918379",
	                      "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/12724614_200411530338032_2031634582_a.jpg",
	                      "username":"junpyo_g"
	                   }
	                }
	             },
	             {
	                "node":{
	                   "text":"\ub178\ub798\uc88b\uc544\uc694\u2605\u2665\ub204\ub098\u2665\u2665",
	                   "id":"17851320928150228",
	                   "created_at":1488525935,
	                   "owner":{
	                      "id":"4287734332",
	                      "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/17076570_1314343345271220_9028075265405747200_a.jpg",
	                      "username":"hunseob.gim"
	                   }
	                }
	             },
	             {
	                "node":{
	                   "text":"\ubba4\ube44 \ub108\ubb34 \uc88b\uc544\uc694!",
	                   "id":"17873799769039510",
	                   "created_at":1488526564,
	                   "owner":{
	                      "id":"3573627734",
	                      "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/16230650_180617152421948_3092655870807375872_a.jpg",
	                      "username":"hmc1009"
	                   }
	                }
	             }
	          ],
	          "count":29
	       },
	       "display_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-15/s320x320/e35/17077277_145803869272952_3282185540559962112_n.jpg",
	       "shortcode":"BRKQBABFcEx",
	       "edge_media_to_tagged_user":{
	          "edges":[
	             {
	                "node":{
	                   "x":0.4546666666666667,
	                   "y":0.6746666666666666,
	                   "user":{
	                      "username":"jisooage"
	                   }
	                }
	             }
	          ]
	       },
	       "is_video":false,
	       "edge_media_preview_like":{
	          "edges":[
	             {
	                "node":{
	                   "id":"1692719441",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/16229486_1053855968076568_1238407489989378048_a.jpg",
	                   "username":"2_0_jun_"
	                }
	             },
	             {
	                "node":{
	                   "id":"4305075953",
	                   "profile_pic_url":"https://scontent-lht6-1.cdninstagram.com/t51.2885-19/11906329_960233084022564_1448528159_a.jpg",
	                   "username":"161220_"
	                }
	             },
	             {
	                "node":{
	                   "id":"3973663151",
	                   "profile_pic_url":"https://scontent-lht6-1.cdninstagram.com/t51.2885-19/11906329_960233084022564_1448528159_a.jpg",
	                   "username":"min_2241"
	                }
	             },
	             {
	                "node":{
	                   "id":"1671130153",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/16585275_159233411251173_6322780871526973440_a.jpg",
	                   "username":"ji.won_ss"
	                }
	             },
	             {
	                "node":{
	                   "id":"1579615571",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/14717346_1660805070878329_4541894075472674816_a.jpg",
	                   "username":"han45699"
	                }
	             },
	             {
	                "node":{
	                   "id":"1478476981",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/14128651_1704862536422276_149031787463442432_a.jpg",
	                   "username":"hi.bin_"
	                }
	             },
	             {
	                "node":{
	                   "id":"3060096330",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/12407181_576835585804978_40026749_a.jpg",
	                   "username":"mdiumrare"
	                }
	             },
	             {
	                "node":{
	                   "id":"1990019830",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/15043949_614702915399123_6052624473671073792_a.jpg",
	                   "username":"jha_prisk"
	                }
	             },
	             {
	                "node":{
	                   "id":"1147041645",
	                   "profile_pic_url":"https://instagram.fkul4-1.fna.fbcdn.net/t51.2885-19/s150x150/12523711_1558043101184669_1112176853_a.jpg",
	                   "username":"the_mayten"
	                }
	             },
	             {
	                "node":{
	                   "id":"3203361740",
	                   "profile_pic_url":"https://scontent-lht6-1.cdninstagram.com/t51.2885-19/11906329_960233084022564_1448528159_a.jpg",
	                   "username":"wvwvwwvw"
	                }
	             }
	          ],
	          "count":2845
	       },
	       "attribution":null,
	       "dimensions":{
	          "height":320,
	          "width":320
	       },
	       "__typename":"GraphImage",
	       "viewer_has_liked":false
	    }
	 	}]
	}

	describe('#Parse', function() {

		beforeEach(() => {
			feedTranform = new FrontPageFeedTransform({
				transform: () => {
					return {
						comments: [],
						cursor: false
					}
				}
			});
		});

		it('parse posts', (done) => {
			let posts = feedTranform.transform(testMedia);

			chai.expect(posts).to.exist;
			chai.expect(posts).to.be.instanceof(Array);

			let postOne = posts[0];
			postOne.id.should.equal('1459967806972105324');
			postOne.type.should.equal('video');
			postOne.timestamp.should.equal(1488261746000);
			postOne.rawTimestamp.should.equal('1488261746');
			postOne.message.should.equal('\uae30\ubd84\uc774 \uc88b\uc73c\uc2dc\ub2e4 \ud83d\udc6f @bssazzzn');
			postOne.link.should.equal('');
			postOne.likeCount.should.equal(10315);
			aid.testBasicActions(postOne.actions);
			chai.expect(postOne.likeStatus).to.equal(Post.LikeStatusLike);
			postOne.memento.should.equal('BRC2Pw2FBJs');

			let postTwo = posts[1];
			postTwo.id.should.equal('1462051466517004593');
			postTwo.type.should.equal('photo');
			postTwo.timestamp.should.equal(1488510138000);
			postTwo.rawTimestamp.should.equal('1488510138');
			postTwo.message.should.equal('\uc0ac\ub791\ud574\uc8fc\uc138\uc694!\u2764\n#\uae40\uc9c0\uc218 #A_dream #Dream_All_Day');
			postTwo.link.should.equal('');
			postTwo.likeCount.should.equal(2845);
			aid.testTwoActions(postTwo.actions, [ 'Share', 'Like' ]);
			chai.expect(postTwo.likeStatus).to.equal(Post.LikeStatusNone);
			postTwo.memento.should.equal('BRKQBABFcEx');

			done();
		});

		it('should be able to correctly assign comments from CommentTransform', () => {
			feedTranform.commentsTransform.transform = (() => {
				return {
					comments:[{ id: '1' }],
					cursor: 'n__jgjhdsf'
				}
			});
			feedTranform.transform(testMedia)[0].comments.length.should.equal(1);
		});
	});
});
