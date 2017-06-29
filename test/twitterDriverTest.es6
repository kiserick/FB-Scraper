import {Action} from '../src/data/action'
import {Comment} from '../src/data/comment'
import {Configuration} from '../src/data/configuration'
import {Environment} from './env/testEnv'
import {Identity} from '../src/data/identity'
import {Media} from '../src/data/media'
import {Post} from '../src/data/post'
import {TestAid} from './env/testAid.es6'
import {TwitterDriver} from '../src/twitterDriver'
import {User} from '../src/data/user'

let chai = require('chai');
chai.should();

/******************* TWITTERDRIVER SPECIFIC HELPER FUNCTIONS *****************/
let aid = new TestAid();
let subject = undefined
let oauthToken = 'OAUTH'
let oauthSecret = 'SECRET'
let userId = 'USER_ID'

// Shortcut to check a 'api.twitter.com' HTTP request.
let __checkTwitRequest = (expectedPath, response, expectedExtra) => subject.http.checkHttpRequest('api.twitter.com', expectedPath, response, expectedExtra);

// Create fake response
let fakeResponseBatch = 1
let createFakeResponse = (tweetIds) => {
	let entries = []
	tweetIds.forEach(function(tweetId) {
		entries.push({
			id_str: String(tweetId),
			id: tweetId,
			fakeBatch: fakeResponseBatch
		})
	})
	fakeResponseBatch += 1
	return entries
}

// Attach media to the fake response
let addFakeAttachments = (fakeResponse, mediaSrcUrls) => {
	
	let items = [];
	let index = 1;
	
	mediaSrcUrls.forEach((src) => {
		let item = {
			media_url: src.replace('https://', 'http://'),
			media_url_https: src.replace('http://', 'https://'),
			sizes: {
				large: {
					w: index,
					h: index
				}
			},
			type: 'photo'
		}

		index++;
		items.push(item)
	});

	fakeResponse.entities = {
		media: items
	};

	return items;
}

// Attach user to the fake response
let addFakeUser = (fakeResponse, screenName, name, photoUrl) => {
	let user = {
		name: name,
		profile_image_url: photoUrl.replace('https://', 'http://'),
		profile_image_url_https: photoUrl.replace('http://', 'https://'),
		screen_name: screenName
	}
	fakeResponse.user = user
	return user
}

// Create expected posts
let createPosts = (fakeResponse, tweetIds) => {
	let posts = []
	tweetIds.forEach(function(tweetId) {
		let post = new Post({
			identity: new Identity({
				vendor: 'twitter',
				oauthToken: oauthToken,
				oauthSecret: oauthSecret,
				userId: userId
			}),
			type: 'tweet',
			id: String(tweetId),
			actions: [
				new Action({
					type: 'Like'
				}),
				new Action({
					type: 'Share'
				}),
				new Action({
					type: 'Comment'
				})
			],
			raw: fakeResponse[fakeResponse.length - tweetId]
		})
		post.property = 'postlikeupdatedkey'
		posts.push(post)
	})
	return posts
}

// Helper for the loadPosts tests to configure and execute the test run.
//
// <response>	JSON data mimicking response data from Twitter.
// <test>		Optional function used to examine the received post.
// <done>		Optional done function. If this is provided it is called when the first post is received. To manually call done() ignore this parameter. 
function _postLoadedHelper(response, test, done) {

	subject.http.setupForSuccess(response);
	subject.resolveImageLinks = () => {};
	subject.resolveMessageLinks = () => {};

	subject.on('postLoaded', (driver, post) => {

		if (test) {
			test(post);
		}

		if (done) {
			done();
		}
	});

	subject.loadPosts();
}

/********************** TESTS *************************/
describe("TwitterDriver", function() {

	beforeEach(() => {
		subject = new TwitterDriver(new Identity({
			vendor: 'twitter',
			oauthToken: oauthToken,
			oauthSecret: oauthSecret,
			userId: userId
		}));
		subject.http = new Environment().http;
	});

	describe("#constructor", function() {

		it('should remember its credentials and configuration', () => {
			let driver = new TwitterDriver(new Identity({
				vendor: 'twitter',
				oauthToken: 'OAUTH',
				oauthSecret: 'SECRET',
				userId: 'USER_ID'
			}), new Configuration({
				media_friends: 100
			}))
			driver.oauthToken.should.equal('OAUTH');
			driver.oauthTokenSecret.should.equal('SECRET');
			driver.loadParameters.media_friends.should.equal(100)
		})

		it('should complain vociferously if credentials are not supplied', () => {
			let doIncorrectInstantiation = (message, credentials) => {
				var instantiate = () => new TwitterDriver(credentials);
				chai.assert.throws(instantiate, Error);
			};
			doIncorrectInstantiation('Must provide credentials for Twitter', undefined);
			doIncorrectInstantiation('Must provide oauthToken for Twitter', {});
			doIncorrectInstantiation('Must provide oauthTokenSecret for Twitter', {
				oauthToken: 'TOKEN'
			});
			doIncorrectInstantiation('Must provide userId (screenName) for Twitter', {
				oauthToken: 'TOKEN',
				oauthSecret: 'SECRET'
			});
		})

		it('can create driver without custom configuration...', () => {
			chai.assert.doesNotThrow(() => new TwitterDriver(new Identity({
				oauthToken: 'TOKEN',
				oauthSecret: 'SECRET',
				userId: 'user-id'
			})), Error);
		});

	});

	describe("#load", function() {

		it('should call http get with an appropriate URL', () => {
			subject.http.checkHttpRequest('api.twitter.com', '/1.1/statuses/home_timeline.json?count=50');
			subject.loadPosts();
		});

		it('should recognise that pageComplete has been sent previously...', (done) => {
			let postCount = 0;
			let pageCount = 0;

			subject.http.setupForSuccess(createFakeResponse([1]));

			subject.on('postLoaded', () => postCount++);
			subject.on('pageComplete', () => {
				if (pageCount++) {
					postCount.should.equal(1);
					done();
				} else {
					subject.loadPosts();
				}
			});

			subject.loadPosts();
		});

		describe("items", function() {

			it('should set its feed items to be the data field of the response...', (done) => {
				let count = 3;
				let fakeResponse = createFakeResponse([3, 2, 1]);
				let test = (post) => {
					post.id.should.equal(String(count--));
					if (!count) {
						done();
					}
				};

				_postLoadedHelper(fakeResponse, test);
			});

			it('should call pageComplete to indicate that loading is complete...', (done) => {
				let fakeResponse = createFakeResponse([]);
				subject.on('pageComplete', () => done());

				_postLoadedHelper(fakeResponse);
			});

			it('ensure epoch updated time provided', (done) => {
				let fakeResponse = [{id_str:'1',id:2,created_at:'Wed May 06 06:27:31 +0000 2015'}];
				let test = (post) => {
					post.rawTimestamp.should.equal('Wed May 06 06:27:31 +0000 2015');
					post.timestamp.should.equal(1430893651000);
				};

				_postLoadedHelper(fakeResponse, test, done);
			});

			it('ensure status photo if has a photo...', (done) => {
				let fakeResponse = [{"id":1,"id_str":"11","entities":{"media":[{"media_url":"http://example.com/image.png","type":"photo","sizes":{"large":{"w":1,"h":1}}}]}}];
				let test = (post) => {
					post.type.should.equal('photo');
					post.media.length.should.equal(1);
					post.media[0].srcUrl.should.equal('http://example.com/image.png');
					post.media[0].imageUrl.should.equal('http://example.com/image.png');
				};

				_postLoadedHelper(fakeResponse, test, done);
			});

			//testing if video or not
			it('vine videos should be treated as links...', (done) => {
				let fakeResponse = [{"created_at":"Mon Sep 07 02:20:59 +0000 2015","id":640711331050557400,"id_str":"640711331050557440","text":"When ball is not life  https://t.co/zLPOdbmVsc","source":"<a href=\"http://www.tweetcaster.com\" rel=\"nofollow\">TweetCaster for Android</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":498177610,"id_str":"498177610","name":"Best Vines","screen_name":"TheFunnyVine","location":"","description":"We post all the best Vines. Not Affiliated With Vine! Facebook: http://t.co/RdTIDwlngb Instagram:  http://t.co/kZnK0Cga3z Contact: thefunnyvine@gmail.com","url":null,"entities":{"description":{"urls":[{"url":"http://t.co/RdTIDwlngb","expanded_url":"http://ow.ly/3xTCzD","display_url":"ow.ly/3xTCzD","indices":[64,86]},{"url":"http://t.co/kZnK0Cga3z","expanded_url":"http://ow.ly/3y78qi","display_url":"ow.ly/3y78qi","indices":[99,121]}]}},"protected":false,"followers_count":1063604,"friends_count":16,"listed_count":955,"created_at":"Mon Feb 20 19:31:53 +0000 2012","favourites_count":4,"utc_offset":-14400,"time_zone":"Eastern Time (US & Canada)","geo_enabled":false,"verified":false,"statuses_count":6162,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"1A1B1F","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/863599808/8409a6c3f97da1e08d2c670b2e83331f.jpeg","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/863599808/8409a6c3f97da1e08d2c670b2e83331f.jpeg","profile_background_tile":true,"profile_image_url":"http://pbs.twimg.com/profile_images/597184401873772544/lc28AVX7_normal.png","profile_image_url_https":"https://pbs.twimg.com/profile_images/597184401873772544/lc28AVX7_normal.png","profile_banner_url":"https://pbs.twimg.com/profile_banners/498177610/1431213460","profile_link_color":"2FC2EF","profile_sidebar_border_color":"FFFFFF","profile_sidebar_fill_color":"252429","profile_text_color":"666666","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":true,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"is_quote_status":false,"retweet_count":853,"favorite_count":868,"entities":{"hashtags":[],"symbols":[],"user_mentions":[],"urls":[{"url":"https://t.co/zLPOdbmVsc","expanded_url":"https://vine.co/v/etulmVM9zr9","display_url":"vine.co/v/etulmVM9zr9","indices":[24,47]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"}];
				let test = (post) => {
					post.type.should.equal('link');
					post.media.length.should.equal(0);
				};

				_postLoadedHelper(fakeResponse, test, done);
			});

			it('media...', (done) => {
				let loadResponse = createFakeResponse([1]);
				let media = addFakeAttachments(loadResponse[0], ['http://example.com/image1.png', 'http://example.com/image2.png']);
				let test = (post) => {
					post.media[0].srcUrl.should.equal('http://example.com/image1.png');
					post.media[1].srcUrl.should.equal('http://example.com/image2.png');
					post.media[0].imageUrl.should.equal('http://example.com/image1.png');
					post.media[1].imageUrl.should.equal('http://example.com/image2.png');
				};

				_postLoadedHelper(loadResponse, test, done);
			});

			it('video...', (done) => {
				let loadResponse = createFakeResponse([1]);
				let test = (post) => {
					post.media.length.should.equal(1);
					post.media[0].duration.should.equal(7928);
					post.media[0].imageUrl.should.equal('http://pbs.twimg.com/ext_tw_video_thumb/639636530772860928/pu/img/hwKPz59DVZxs_xev.jpg');
					post.media[0].srcUrl.should.equal('https://video.twimg.com/ext_tw_video/639636530772860928/pu/vid/1280x720/0FJudwAk9qh0r_W1.mp4');
				};

				loadResponse[0].extended_entities = {"media":[{"media_url":"http://pbs.twimg.com/ext_tw_video_thumb/639636530772860928/pu/img/hwKPz59DVZxs_xev.jpg","media_url_https":"https://pbs.twimg.com/ext_tw_video_thumb/639636530772860928/pu/img/hwKPz59DVZxs_xev.jpg","url":"http://t.co/QpXDpIdBsC","display_url":"pic.twitter.com/QpXDpIdBsC","expanded_url":"http://twitter.com/SameNameSean/status/639636641796087809/video/1","type":"video","sizes":{"thumb":{"w":150,"h":150,"resize":"crop"},"medium":{"w":600,"h":338,"resize":"fit"},"small":{"w":340,"h":191,"resize":"fit"},"large":{"w":1024,"h":576,"resize":"fit"}},"video_info":{"aspect_ratio":[16,9],"duration_millis":7928,"variants":[{"bitrate":832000,"content_type":"video/mp4","url":"https://video.twimg.com/ext_tw_video/639636530772860928/pu/vid/640x360/NFiMlurFQ5ZggnkE.mp4"},{"bitrate":832000,"content_type":"video/webm","url":"https://video.twimg.com/ext_tw_video/639636530772860928/pu/vid/640x360/NFiMlurFQ5ZggnkE.webm"},{"content_type":"application/dash+xml","url":"https://video.twimg.com/ext_tw_video/639636530772860928/pu/pl/cwf8fF29C9-ESi1P.mpd"},{"bitrate":2176000,"content_type":"video/mp4","url":"https://video.twimg.com/ext_tw_video/639636530772860928/pu/vid/1280x720/0FJudwAk9qh0r_W1.mp4"},{"content_type":"application/x-mpegURL","url":"https://video.twimg.com/ext_tw_video/639636530772860928/pu/pl/cwf8fF29C9-ESi1P.m3u8"},{"bitrate":320000,"content_type":"video/mp4","url":"https://video.twimg.com/ext_tw_video/639636530772860928/pu/vid/320x180/RUwoS8RQeWOX5pHS.mp4"}]}}]};

				_postLoadedHelper(loadResponse, test, done);
			});

			it('link...', (done) => {
				let api = [{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891700,"id_str":"644338432571891712","text":"RT @abcnewsMelb: Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","source":"<a href=\"https://about.twitter.com/products/tweetdeck\" rel=\"nofollow\">TweetDeck</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}},"protected":false,"followers_count":816970,"friends_count":1159,"listed_count":9374,"created_at":"Thu Mar 29 02:15:36 +0000 2007","favourites_count":1708,"utc_offset":36000,"time_zone":"Sydney","geo_enabled":true,"verified":true,"statuses_count":176964,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"000000","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/384697135/News_Twitter-background.jpg","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/384697135/News_Twitter-background.jpg","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/2926053458/8447650cdcc90a0dfdc522b8f6f06173_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/2926053458/8447650cdcc90a0dfdc522b8f6f06173_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/2768501/1439986442","profile_link_color":"0000FF","profile_sidebar_border_color":"CCCCCC","profile_sidebar_fill_color":"C8C8C8","profile_text_color":"000000","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":true,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweeted_status":{"created_at":"Thu Sep 17 02:04:57 +0000 2015","id":644331173297000400,"id_str":"644331173297000448","text":"Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","source":"<a href=\"https://about.twitter.com/products/tweetdeck\" rel=\"nofollow\">TweetDeck</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":16216152,"id_str":"16216152","name":"ABC News Melbourne","screen_name":"abcnewsMelb","location":"Melbourne, Australia","description":"ABC News from Melbourne. This account is staffed 6am-9.30pm Mon-Fri & 8am-3.30pm Sat-Sun. This is an official @ABCaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}},"protected":false,"followers_count":41074,"friends_count":679,"listed_count":855,"created_at":"Wed Sep 10 03:31:16 +0000 2008","favourites_count":121,"utc_offset":36000,"time_zone":"Melbourne","geo_enabled":false,"verified":true,"statuses_count":32132,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"D9DDE1","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/399244267/News_local-Twitter-background.JPG","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/399244267/News_local-Twitter-background.JPG","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/517164610973990913/bbQdJdlr_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/517164610973990913/bbQdJdlr_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/16216152/1437702468","profile_link_color":"0034DE","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"is_quote_status":false,"retweet_count":9,"favorite_count":8,"entities":{"hashtags":[],"symbols":[],"user_mentions":[],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[91,113]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"},"is_quote_status":false,"retweet_count":9,"favorite_count":0,"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnewsMelb","name":"ABC News Melbourne","id":16216152,"id_str":"16216152","indices":[3,15]}],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[108,130]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"}];
				let html = "<!DOCTYPE html><head><title>Happy country: Australians generally satisfied with life, Institute of Family Studies says - ABC News (Australian Broadcasting Corporation)</title><meta http-equiv=\"Content-Type\" content=\"text/html;charset=UTF-8\"/></head><body class=\"platform-standard news story_page\"></body></html>"

				subject.resolveImageLinks = () => {};
				subject.http.multiCheckHttpRequest(['', ''], [api, html]);
				subject.on('postLoaded', (driver, post) => {
					post.type.should.equal('link');
					post.link.should.equal('http://ab.co/1iQraan');

					done();
				});

				subject.loadPosts();
			});

			it('link should have HTML encoding stripped...', (done) => {
				let api = [{"created_at":"Thu Jan 07 23:08:33 +0000 2016","id":685236611257253900,"id_str":"685236611257253888","text":"RT @abcgrandstand: Central Coast Mariners will appeal the eight-game ban handed down to Roy O'Donovan for his headbutt: https://t.co/Iodo90…","source":"<a href=\"https://about.twitter.com/products/tweetdeck\" rel=\"nofollow\">TweetDeck</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}},"protected":false,"followers_count":941887,"friends_count":1157,"listed_count":9743,"created_at":"Thu Mar 29 02:15:36 +0000 2007","favourites_count":2003,"utc_offset":39600,"time_zone":"Sydney","geo_enabled":true,"verified":true,"statuses_count":193823,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"000000","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/384697135/News_Twitter-background.jpg","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/384697135/News_Twitter-background.jpg","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/2926053458/8447650cdcc90a0dfdc522b8f6f06173_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/2926053458/8447650cdcc90a0dfdc522b8f6f06173_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/2768501/1439986442","profile_link_color":"0000FF","profile_sidebar_border_color":"CCCCCC","profile_sidebar_fill_color":"C8C8C8","profile_text_color":"000000","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":true,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweeted_status":{"created_at":"Thu Jan 07 22:35:25 +0000 2016","id":685228272779567100,"id_str":"685228272779567104","text":"Central Coast Mariners will appeal the eight-game ban handed down to Roy O'Donovan for his headbutt: https://t.co/Iodo90q66S #ALeague","source":"<a href=\"https://about.twitter.com/products/tweetdeck\" rel=\"nofollow\">TweetDeck</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":17331252,"id_str":"17331252","name":"ABC Grandstand","screen_name":"abcgrandstand","location":"Australia","description":"ABC's expert commentary and coverage of Australian and international sport.","url":"http://t.co/9oMTOUndHY","entities":{"url":{"urls":[{"url":"http://t.co/9oMTOUndHY","expanded_url":"http://www.abc.net.au/grandstand","display_url":"abc.net.au/grandstand","indices":[0,22]}]},"description":{"urls":[]}},"protected":false,"followers_count":119155,"friends_count":1091,"listed_count":1392,"created_at":"Wed Nov 12 04:17:19 +0000 2008","favourites_count":701,"utc_offset":36000,"time_zone":"Brisbane","geo_enabled":true,"verified":true,"statuses_count":85990,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"CEDCE3","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/360886349/GrandstandSport_Twitter-background.jpg","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/360886349/GrandstandSport_Twitter-background.jpg","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/1111548000/ABC-LOCAL-VERTICALt3_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/1111548000/ABC-LOCAL-VERTICALt3_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/17331252/1448513354","profile_link_color":"6ABAE6","profile_sidebar_border_color":"000000","profile_sidebar_fill_color":"081F2B","profile_text_color":"007488","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"is_quote_status":false,"retweet_count":6,"favorite_count":3,"entities":{"hashtags":[{"text":"ALeague","indices":[125,133]}],"symbols":[],"user_mentions":[],"urls":[{"url":"https://t.co/Iodo90q66S","expanded_url":"http://ab.co/1OQ7fXr","display_url":"ab.co/1OQ7fXr","indices":[101,124]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"},"is_quote_status":false,"retweet_count":6,"favorite_count":0,"entities":{"hashtags":[{"text":"ALeague","indices":[139,140]}],"symbols":[],"user_mentions":[{"screen_name":"abcgrandstand","name":"ABC Grandstand","id":17331252,"id_str":"17331252","indices":[3,17]}],"urls":[{"url":"https://t.co/Iodo90q66S","expanded_url":"http://ab.co/1OQ7fXr","display_url":"ab.co/1OQ7fXr","indices":[120,140]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"}];
				let html = "<!DOCTYPE html><html lang=\"en-AU\"><head><title>Central Coast &quot;Mariners&quot; to/ appeal  Roy O&#39;Donovan&#39;s &#39;very harsh&#39; ban for A-League headbutt - ABC Grandstand Sport (Australian Broadcasting Corporation</title><meta http-equiv=\"Content-Type\" content=\"text/html;charset=UTF-8\"/><link rel=\"schema.DC\" href=\"http://purl.org/dc/elements/1.1/\"/><link rel=\"schema.DCTERMS\" href=\"http://purl.org/dc/terms/\"/><link rel=\"schema.iptc\" href=\"urn:newsml:iptc.org:20031010:topicset.iptc-genre:8\"/><link rel=\"canonical\" data-abc-platform=\"standard\" href=\"http://www.abc.net.au/news/2016-01-08/mariners-to-appeal-roy-odonovan-very-harsh-headbutt-ban/7075880\"/><meta name=\"title\" content=\"Central Coast Mariners to appeal O&#039;Donovan&#039;s &#039;very harsh&#039; headbutt ban\"/><meta name=\"description\" content=\"Central Coast  Mariners will fight Roy O&#039;Donovan&#039;s eight-match headbutting ban, with coach Tony Walmsley describing it as a very harsh penalty.\"/><meta name=\"keywords\" content=\"central coast mariners, a-league, roy o&#039;donovan, headbutt, appeal, tony walmsley\"/><meta name=\"ICBM\" content=\"-33.4246,151.3441\"/><meta name=\"geo.position\" content=\"-33.4246;151.3441\"/><meta name=\"ContentId\" content=\"7075880\"/><meta name=\"ABC.site\" content=\"ABC News\"/><meta name=\"ABC.editorialGenre\" content=\"News &amp; Current Affairs\"/><meta name=\"ABC.tags\" content=\"a-league;soccer;sport\"/><meta name=\"ABC_WCMS_sitesearch_include\" content=\"true\"/><meta name=\"twitter:card\" content=\"summary\"/><meta name=\"DC.Publisher.CorporateName\" content=\"Australian Broadcasting Corporation\"/><meta name=\"DC.rights\" scheme=\"DCTERMS.URI\" content=\"http://www.abc.net.au/conditions.htm#UseOfContent\"/><meta name=\"DC.rightsHolder\" content=\"AAP\"/><meta name=\"DC.rightsHolder\" content=\"ABC\"/><meta name=\"DC.type\" content=\"Text\"/><meta name=\"DC.type\" scheme=\"iptc-genre\" content=\"Current\"/><meta name=\"DC.title\" content=\"Central Coast Mariners to appeal O&#039;Donovan&#039;s &#039;very harsh&#039; headbutt ban\"/><meta name=\"DC.coverage.postcode\" content=\"2250\"/><meta name=\"DC.creator.CorporateName\" content=\"Australian Broadcasting Corporation\"/><meta name=\"DC.date\" scheme=\"DCTERMS.W3CDTF\" content=\"2016-01-08T09:26:13+1100\"/><meta name=\"DC.format\" scheme=\"DCTERMS.IMT\" content=\"text/html\"/><meta name=\"DC.identifier\" scheme=\"DCTERMS.URI\" content=\"http://www.abc.net.au/news/2016-01-08/mariners-to-appeal-roy-odonovan-very-harsh-headbutt-ban/7075880\"/><meta name=\"DC.language\" scheme=\"DCTERMS.RFC3066\" content=\"en-AU\"/><meta name=\"DC.subject\" scheme=\"ABCTERMS.subject\" content=\"Sport:Soccer:A-League;Sport:Soccer;Sport\"/><meta name=\"DCTERMS.issued\" scheme=\"DCTERMS.W3CDTF\" content=\"2016-01-08T09:26:13+1100\"/><meta name=\"DCTERMS.modified\" scheme=\"DCTERMS.W3CDTF\" content=\"2016-01-08T10:22:43+1100\"/><meta name=\"DCTERMS.spatial\" content=\"Gosford;NSW;Australia\"/><meta name=\"DCTERMS.spatial\" scheme=\"DCTERMS.DCMIPoint\" content=\"east=151.3441;north=-33.4246\"/><meta property=\"og:title\" content=\"Central Coast Mariners to appeal O&#039;Donovan&#039;s &#039;very harsh&#039; headbutt ban\"/><meta property=\"og:description\" content=\"Central Coast  Mariners will fight Roy O&#039;Donovan&#039;s eight-match headbutting ban, with coach Tony Walmsley describing it as a very harsh penalty.\"/><meta property=\"og:url\" content=\"http://www.abc.net.au/news/2016-01-08/mariners-to-appeal-roy-odonovan-very-harsh-headbutt-ban/7075880\"/><meta property=\"og:image\" content=\"http://www.abc.net.au/news/image/7075866-1x1-700x700.jpg\"/><meta property=\"og:image:type\" content=\"image/jpeg\"/><meta property=\"og:image:width\" content=\"700\"/><meta property=\"og:image:height\" content=\"700\"/><meta name=\"twitter:image\" content=\"http://www.abc.net.au/news/image/7075866-1x1-700x700.jpg\"/><meta property=\"og:type\" content=\"Article\"/><meta property=\"og:updated_time\" content=\"2016-01-08T10:22:43+1100\"/><meta property=\"article:published_time\" content=\"2016-01-08T09:26:13+1100\"/><meta property=\"article:modified_time\" content=\"2016-01-08T10:22:43+1100\"/><meta property=\"article:publisher\" content=\"https://www.facebook.com/abcnews.au\"/><meta property=\"article:tag\" content=\"central coast mariners\"/><meta property=\"article:tag\" content=\"a-league\"/><meta property=\"article:tag\" content=\"roy o&#039;donovan\"/><meta property=\"article:tag\" content=\"headbutt\"/><meta property=\"article:tag\" content=\"appeal\"/><meta property=\"article:tag\" content=\"tony walmsley\"/><meta property=\"article:tag\" content=\"Gosford\"/><meta property=\"article:tag\" content=\"NSW\"/><meta property=\"article:tag\" content=\"Australia\"/><meta property=\"article:tag\" content=\"A-League\"/><meta property=\"article:tag\" content=\"Soccer\"/><meta property=\"article:tag\" content=\"Sport\"/><meta property=\"og:site_name\" content=\"ABC Grandstand Sport\"/><meta name=\"twitter:site\" content=\"@abcgrandstand\"/><meta name=\"showNFOS\" content=\"true\"/><meta name=\"DCSext.LocalRegion\" content=\"centralcoast\"/><link rel=\"alternate\" data-abc-platform=\"mobile\" media=\"only screen and (max-width: 640px)\" href=\"http://mobile.abc.net.au/news/2016-01-08/mariners-to-appeal-roy-odonovan-very-harsh-headbutt-ban/7075880?section=sport\"/></head></html>";

				subject.resolveImageLinks = () => {};
				subject.http.multiCheckHttpRequest(['', ''], [api, html]);
				subject.on('postLoaded', (driver, post) => {
					post.link.should.equal('http://ab.co/1OQ7fXr');
					done();
				});

				subject.loadPosts();
			});

			it('two links tweet', (done) => {
				let api = [{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891700,"id_str":"644338432571891712","text":"RT @abcnewsMelb: Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj and http://t.co/4sHkOQ4xJ1","source":"<a href=\"https://about.twitter.com/products/tweetdeck\" rel=\"nofollow\">TweetDeck</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}},"protected":false,"followers_count":816970,"friends_count":1159,"listed_count":9374,"created_at":"Thu Mar 29 02:15:36 +0000 2007","favourites_count":1708,"utc_offset":36000,"time_zone":"Sydney","geo_enabled":true,"verified":true,"statuses_count":176964,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"000000","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/384697135/News_Twitter-background.jpg","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/384697135/News_Twitter-background.jpg","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/2926053458/8447650cdcc90a0dfdc522b8f6f06173_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/2926053458/8447650cdcc90a0dfdc522b8f6f06173_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/2768501/1439986442","profile_link_color":"0000FF","profile_sidebar_border_color":"CCCCCC","profile_sidebar_fill_color":"C8C8C8","profile_text_color":"000000","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":true,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweeted_status":{"created_at":"Thu Sep 17 02:04:57 +0000 2015","id":644331173297000400,"id_str":"644331173297000448","text":"Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","source":"<a href=\"https://about.twitter.com/products/tweetdeck\" rel=\"nofollow\">TweetDeck</a>","truncated":false,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":16216152,"id_str":"16216152","name":"ABC News Melbourne","screen_name":"abcnewsMelb","location":"Melbourne, Australia","description":"ABC News from Melbourne. This account is staffed 6am-9.30pm Mon-Fri & 8am-3.30pm Sat-Sun. This is an official @ABCaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}},"protected":false,"followers_count":41074,"friends_count":679,"listed_count":855,"created_at":"Wed Sep 10 03:31:16 +0000 2008","favourites_count":121,"utc_offset":36000,"time_zone":"Melbourne","geo_enabled":false,"verified":true,"statuses_count":32132,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":false,"profile_background_color":"D9DDE1","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/399244267/News_local-Twitter-background.JPG","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/399244267/News_local-Twitter-background.JPG","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/517164610973990913/bbQdJdlr_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/517164610973990913/bbQdJdlr_normal.jpeg","profile_banner_url":"https://pbs.twimg.com/profile_banners/16216152/1437702468","profile_link_color":"0034DE","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false},"geo":null,"coordinates":null,"place":null,"contributors":null,"is_quote_status":false,"retweet_count":9,"favorite_count":8,"entities":{"hashtags":[],"symbols":[],"user_mentions":[],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[91,113]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"},"is_quote_status":false,"retweet_count":9,"favorite_count":0,"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnewsMelb","name":"ABC News Melbourne","id":16216152,"id_str":"16216152","indices":[3,15]}],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[108,130]}]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"lang":"en"}];
				let html = "<!DOCTYPE html><head><title>Happy country: Australians generally satisfied with life, Institute of Family Studies says - ABC News (Australian Broadcasting Corporation)</title><meta http-equiv=\"Content-Type\" content=\"text/html;charset=UTF-8\"/></head><body class=\"platform-standard news story_page\"></body></html>"

				subject.resolveImageLinks = () => {};
				subject.http.multiCheckHttpRequest(['', ''], [api, html]);
				subject.on('postLoaded', (driver, post) => {
					post.link.should.equal('http://ab.co/1iQraan');
					done();
				});

				subject.loadPosts();
			});

			it('media link (no url but expanded_url on media)', (done) => {
				let api = [{"created_at":"Mon Nov 23 07:11:32 +0000 2015","id":668688314312986600,"id_str":"668688314312986625","text":"Sooooo I got married today! https://t.co/X62ePolv4v","user":{"id":78588562,"id_str":"78588562","name":"Candice Barnes","screen_name":"candice_barnes","url":"http://t.co/frv9K4G7zp","profile_image_url":"http://pbs.twimg.com/profile_images/530274313807470592/kHfIbxqd_normal.jpeg"},"entities":{"hashtags":[],"symbols":[],"user_mentions":[],"urls":[],"media":[{"id":668688303307141100,"id_str":"668688303307141120","media_url":"http://pbs.twimg.com/media/CUeoeBAUsAAh70g.jpg","media_url_https":"https://pbs.twimg.com/media/CUeoeBAUsAAh70g.jpg","url":"https://t.co/X62ePolv4v","display_url":"pic.twitter.com/X62ePolv4v","expanded_url":"http://twitter.com/candice_barnes/status/668688314312986625/photo/1","type":"photo","sizes":{"large":{"w":10,"h":20}}}]}}];
				let test = (post) => {
					post.message.should.equal('Sooooo I got married today! https://t.co/X62ePolv4v');
					post.type.should.equal('photo');
				};

				_postLoadedHelper(api, test, done);
			});

			it('invalid link in message is treated as a part of the message...', (done) => {
				let loadResponse = createFakeResponse([1])
				let test = (post) => post.message.should.equal('Message with invalid link http://e...');

				loadResponse[0].text = 'Message with invalid link http://e...';

				_postLoadedHelper(loadResponse, test, done);
			});

			it('invalid link with … in message is treated as a part of the message...', (done) => {
				let loadResponse = createFakeResponse([1])
				let test = (post) => post.message.should.equal('Another invalid link http://e/t…');

				loadResponse[0].text = 'Another invalid link http://e/t…';

				_postLoadedHelper(loadResponse, test, done);
			});

			it('from (user)', (done) => {
				let loadResponse = createFakeResponse([1]);
				let user = addFakeUser(loadResponse[0], 'TEST_SCREEN_NAME', 'Test User', 'http://example.com/user.png');
				let test = (post) => {
					post.creator.name.should.equal('Test User');
					post.creator.id.should.equal('TEST_SCREEN_NAME');
					post.creator.photoUrl.should.equal('https://example.com/user.png');
				};

				_postLoadedHelper(loadResponse, test, done);
			});

			it('actions', (done) => {
				let loadResponse = createFakeResponse([1]);
				let test = (post) => aid.testBasicActions(post.actions);

				_postLoadedHelper(loadResponse, test, done);
			});

			it('load liked post', (done) => {
				let response = createFakeResponse([1]);
				let test = (post) => post.likeStatus.should.equal(Post.LikeStatusLike);

				response[0].favorited = true;

				_postLoadedHelper(response, test, done);
			});

			it('load unliked post', (done) => {
				let response = createFakeResponse([1]);
				let test = (post) => post.likeStatus.should.equal(Post.LikeStatusNone);

				response[0].favorited = false;

				_postLoadedHelper(response, test, done);
			});

			it('load liked post with update', (done) => {
				let response = createFakeResponse([1]);

				subject.on('postUpdated', (driver, post) => {
					// Ensure correct parameters
					post.property.should.equal('postlikeupdatedkey');
					post.likeStatus.should.equal(Post.LikeStatusLike);
					// Successful
					done();
				});

				response[0].favorited = true;

				_postLoadedHelper(response);
			});

			it('tweet should have a comment....', (done) => {
				let response = [{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891700,"id_str":"644338432571891712","text":"Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}}},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnewsMelb","name":"ABC News Melbourne","id":16216152,"id_str":"16216152","indices":[3,15]}],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[108,130]}]},"favorited":false,"retweeted":false,"lang":"en"},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891701,"id_str":"644338432571891710","text":"Really @abcnews - are they?","in_reply_to_status_id":644338432571891700,"in_reply_to_status_id_str":"644338432571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The ABC News","screen_name":"notabcnews","location":"Westralia","description":"Not the latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}}];
				
				subject.on('postLoaded', (driver, post) => post.comments.length.should.equal(0));
				subject.on('postUpdated', (driver, post) => {
					if ('comments' === post.property) {
						post.comments.length.should.equal(1);
						post.id.should.equal('644338432571891712');
						post.comments[0].id.should.equal('644338432571891710');

						done();
					}
				});

				_postLoadedHelper(response);
			});

			it('tweet should have a comment (inverse)....', (done) => {
				let response = [{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891701,"id_str":"644338432571891710","text":"Really @abcnews - are they?","in_reply_to_status_id":644338432571891700,"in_reply_to_status_id_str":"644338432571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The ABC News","screen_name":"notabcnews","location":"Westralia","description":"Not the latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891700,"id_str":"644338432571891712","text":"Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}}},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnewsMelb","name":"ABC News Melbourne","id":16216152,"id_str":"16216152","indices":[3,15]}],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[108,130]}]},"favorited":false,"retweeted":false,"lang":"en"}];
				
				subject.on('postLoaded', (driver, post) => {
					post.comments.length.should.equal(1);
					post.id.should.equal('644338432571891712');
					post.comments[0].id.should.equal('644338432571891710');

					done();
				});
				subject.on('postUpdated', () => aid.fail('Incorrectly attempting to update post with comment already attached.'));

				_postLoadedHelper(response);
			});

			it('tweet should have two comments....', (done) => {
				let response = [{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891701,"id_str":"644338432571891710","text":"Really @abcnews - are they?","in_reply_to_status_id":644338432571891700,"in_reply_to_status_id_str":"644338432571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The ABC News","screen_name":"notabcnews","location":"Westralia","description":"Not the latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891700,"id_str":"644338432571891712","text":"Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}}},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnewsMelb","name":"ABC News Melbourne","id":16216152,"id_str":"16216152","indices":[3,15]}],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[108,130]}]},"favorited":false,"retweeted":false,"lang":"en"},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571991701,"id_str":"744338432571891710","text":"I'm not - I'm miserable!","in_reply_to_status_id":644338432571891700,"in_reply_to_status_id_str":"644338432571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The WA News","screen_name":"notwanews","location":"Westralia","description":"Not the latest news updates from Western Australia."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}}];
				
				subject.on('postUpdated', (driver, post) => {
					if ('comments' === post.property) {
						post.comments.length.should.equal(2);
						post.comments[0].id.should.equal('644338432571891710');
						post.comments[1].id.should.equal('744338432571891710');
	 
	 					done();
	 				}
				});
				subject.on('postLoaded', (driver, post) => {
					post.comments.length.should.equal(1);
					post.id.should.equal('644338432571891712');
					post.comments[0].id.should.equal('644338432571891710');
				});

				_postLoadedHelper(response);
			});

			it('three posts one comment....', (done) => {
				let received = [];
				let response = [{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891701,"id_str":"644338432571891710","text":"Really @abcnews - are they?","in_reply_to_status_id":644338432572891700,"in_reply_to_status_id_str":"644338232571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The ABC News","screen_name":"notabcnews","location":"Westralia","description":"Not the latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571991701,"id_str":"744338432571891710","text":"I'm not - I'm miserable!","in_reply_to_status_id":644338432571691700,"in_reply_to_status_id_str":"644338422571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The WA News","screen_name":"notwanews","location":"Westralia","description":"Not the latest news updates from Western Australia."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":744338432571991701,"id_str":"754338432571891710","text":"I am - I'm so happy!","in_reply_to_status_id":644338432571891700,"in_reply_to_status_id_str":"644338432571891712","in_reply_to_user_id":2768501,"in_reply_to_user_id_str":"2768501","in_reply_to_screen_name":"abcnews","user":{"id":2768502,"id_str":"2768502","name":"Not The WA News","screen_name":"notwanews","location":"Westralia","description":"Not the latest news updates from Western Australia."},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnews","name":"The ABC News","id":2768501,"id_str":"2768501"}]}},{"created_at":"Thu Sep 17 02:33:48 +0000 2015","id":644338432571891700,"id_str":"644338432571891712","text":"Happy country: Australians generally satisfied with life, Institute of Family Studies says http://t.co/mwD0NcIWKj","in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":2768501,"id_str":"2768501","name":"ABC News","screen_name":"abcnews","location":"Australia","description":"Latest news updates from the Australian Broadcasting Corp. This is an official @abcaustralia account.","url":"http://t.co/knlFvfwxkf","entities":{"url":{"urls":[{"url":"http://t.co/knlFvfwxkf","expanded_url":"http://www.abc.net.au/news","display_url":"abc.net.au/news","indices":[0,22]}]},"description":{"urls":[]}}},"entities":{"hashtags":[],"symbols":[],"user_mentions":[{"screen_name":"abcnewsMelb","name":"ABC News Melbourne","id":16216152,"id_str":"16216152","indices":[3,15]}],"urls":[{"url":"http://t.co/mwD0NcIWKj","expanded_url":"http://ab.co/1iQraan","display_url":"ab.co/1iQraan","indices":[108,130]}]},"favorited":false,"retweeted":false,"lang":"en"}];
				let test = (post) => {
					received.push(post);

					if (received.length === 3) {
						received.map((post) => post.id).filter((id) => id === '644338432571891710').length.should.equal(1);
						received.map((post) => post.id).filter((id) => id === '744338432571891710').length.should.equal(1);
						received.map((post) => post.id).filter((id) => id === '644338432571891712').length.should.equal(1);
						received.filter((post) => (post.id === '644338432571891712'))[0].comments[0].id.should.equal('754338432571891710');

						done();
					}
				};

				_postLoadedHelper(response, test);
			});

			it('Apollo advertising test should be stripped from tweet...', (done) => {
				let response = '[{"contributors":null,"coordinates":null,"created_at":"Mon Dec 12 05:42:08 +0000 2016","entities":{"hashtags":[],"symbols":[],"urls":[{"display_url":"mysocialstream.com/find-out-more","expanded_url":"http://www.mysocialstream.com/find-out-more","indices":[42,65],"url":"https://t.co/PraflGjQn8"}],"user_mentions":[]},"favorite_count":0,"favorited":false,"geo":null,"id":808185145358368800,"id_str":"808185145358368769","in_reply_to_screen_name":null,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"is_quote_status":false,"lang":"en","place":null,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"retweet_count":0,"retweeted":false,"source":"<a href=\\"http://www.devisd.com\\" rel=\\"nofollow\\">Devisd Social Stream</a>","text":"Next twitter stripping test\\n\\nTweeted with https://t.co/PraflGjQn8","truncated":false,"user":{"contributors_enabled":false,"created_at":"Fri Feb 19 07:58:08 +0000 2010","default_profile":true,"default_profile_image":false,"description":"","entities":{"description":{"urls":[]}},"favourites_count":1297,"follow_request_sent":false,"followers_count":64,"following":true,"friends_count":81,"geo_enabled":false,"has_extended_profile":false,"id":115610291,"id_str":"115610291","is_translation_enabled":false,"is_translator":false,"lang":"en","listed_count":3,"location":"","name":"skootertweetin","notifications":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/478344152334102528/Wr38iI7a_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/478344152334102528/Wr38iI7a_normal.jpeg","profile_link_color":"1DA1F2","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"protected":false,"screen_name":"skooterTwitten","statuses_count":1720,"time_zone":"Pacific Time (US & Canada)","translator_type":"none","url":null,"utc_offset":-28800,"verified":false}}]';
				let test = (post) => post.message.should.equal('Next twitter stripping test');

				_postLoadedHelper(response, test, done);
			});

			it('Apollo advertising text should be stripped from image upload...', (done) => {
				let response = '[{"contributors":null,"coordinates":null,"created_at":"Mon Dec 12 04:29:14 +0000 2016","entities":{"hashtags":[],"media":[{"display_url":"pic.twitter.com/PFag4xZVF6","expanded_url":"https://twitter.com/skooterTwitten/status/808166798260453376/photo/1","id":808166790714925000,"id_str":"808166790714925056","indices":[58,81],"media_url":"http://pbs.twimg.com/media/Czcvag_UoAApdsq.jpg","media_url_https":"https://pbs.twimg.com/media/Czcvag_UoAApdsq.jpg","sizes":{"large":{"h":750,"resize":"fit","w":750},"medium":{"h":750,"resize":"fit","w":750},"small":{"h":680,"resize":"fit","w":680},"thumb":{"h":150,"resize":"crop","w":150}},"type":"photo","url":"https://t.co/PFag4xZVF6"}],"symbols":[],"urls":[{"display_url":"mysocialstream.com/find-out-more","expanded_url":"http://www.mysocialstream.com/find-out-more","indices":[34,57],"url":"https://t.co/PraflGjQn8"}],"user_mentions":[]},"extended_entities":{"media":[{"display_url":"pic.twitter.com/PFag4xZVF6","expanded_url":"https://twitter.com/skooterTwitten/status/808166798260453376/photo/1","id":808166790714925000,"id_str":"808166790714925056","indices":[58,81],"media_url":"http://pbs.twimg.com/media/Czcvag_UoAApdsq.jpg","media_url_https":"https://pbs.twimg.com/media/Czcvag_UoAApdsq.jpg","sizes":{"large":{"h":750,"resize":"fit","w":750},"medium":{"h":750,"resize":"fit","w":750},"small":{"h":680,"resize":"fit","w":680},"thumb":{"h":150,"resize":"crop","w":150}},"type":"photo","url":"https://t.co/PFag4xZVF6"}]},"favorite_count":0,"favorited":false,"geo":null,"id":808166798260453400,"id_str":"808166798260453376","in_reply_to_screen_name":null,"in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"is_quote_status":false,"lang":"en","place":null,"possibly_sensitive":false,"possibly_sensitive_appealable":false,"retweet_count":0,"retweeted":false,"text":"Testing messaging.\\n\\nUploaded with https://t.co/PraflGjQn8 https://t.co/PFag4xZVF6","truncated":false,"user":{"contributors_enabled":false,"created_at":"Fri Feb 19 07:58:08 +0000 2010","default_profile":true,"default_profile_image":false,"description":"","entities":{"description":{"urls":[]}},"favourites_count":1297,"follow_request_sent":false,"followers_count":63,"following":false,"friends_count":81,"geo_enabled":false,"has_extended_profile":false,"id":115610291,"id_str":"115610291","is_translation_enabled":false,"is_translator":false,"lang":"en","listed_count":3,"location":"","name":"skootertweetin","notifications":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_image_url":"http://pbs.twimg.com/profile_images/478344152334102528/Wr38iI7a_normal.jpeg","profile_image_url_https":"https://pbs.twimg.com/profile_images/478344152334102528/Wr38iI7a_normal.jpeg","profile_link_color":"1DA1F2","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"protected":false,"screen_name":"skooterTwitten","statuses_count":1718,"time_zone":"Pacific Time (US & Canada)","translator_type":"none","url":null,"utc_offset":-28800,"verified":false}}]';
				let test = (post) => post.message.should.equal('Testing messaging.');

				_postLoadedHelper(response, test, done);
			});
		});

		describe('Filtering loaded posts', () => {

			let testFilteringPosts = (expected, data, done) => {
				let counter = 0;
				let test = (post) => post.id.should.equal(expected[counter++]);
				
				subject.on('pageComplete', () => {
					counter.should.equal(expected.length);
					done();
				});

				_postLoadedHelper(data, test);
			}

			it('filtering by community/friend - community boundary edge case...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				addFakeUser(fakeResponse[1], 'test', 'test', 'http://example.com/photo.jpg').verified = true;
				
				subject.loadParameters = new Configuration({
					media_friends: 1
				});
				testFilteringPosts(['3', '2', '1'], fakeResponse, done);
			});

			it('filtering by community/friend - friend boundary edge case...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				addFakeUser(fakeResponse[1], 'test', 'test', 'http://example.com/photo.jpg').verified = true;
				
				subject.loadParameters = new Configuration({
					media_friends: 99
				});
				testFilteringPosts(['3', '2', '1'], fakeResponse, done);
			});

			it('filtering by community posts...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				addFakeUser(fakeResponse[1], 'test', 'test', 'http://example.com/photo.jpg').verified = true;

				subject.loadParameters = new Configuration({
					media_friends: 0
				});
				testFilteringPosts(['2'], fakeResponse, done);
			})

			it('filtering by community posts - multiple data elements...', (done) => {
				let fakeResponse = createFakeResponse([5, 4, 3, 2, 1]);
				addFakeUser(fakeResponse[0], 'test', 'test', 'http://example.com/photo.jpg').verified = 'true';
				addFakeUser(fakeResponse[1], 'test', 'test', 'http://example.com/photo.jpg').verified = 1;
				addFakeUser(fakeResponse[2], 'test', 'test', 'http://example.com/photo.jpg').verified = {};
				addFakeUser(fakeResponse[3], 'test', 'test', 'http://example.com/photo.jpg').verified = true;
				addFakeUser(fakeResponse[4], 'test', 'test', 'http://example.com/photo.jpg').verified = false;

				subject.loadParameters = new Configuration({
					media_friends: 0
				});
				testFilteringPosts(['2'], fakeResponse, done);
			})

			it('filtering by friends posts...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				addFakeUser(fakeResponse[1], 'test', 'test', 'http://example.com/photo.jpg').verified = true;

				subject.loadParameters = new Configuration({
					media_friends: 100
				});
				testFilteringPosts(['3', '1'], fakeResponse, done);
			})

			it('filtering by friends posts - multiple data elements...', (done) => {
				let fakeResponse = createFakeResponse([5, 4, 3, 2, 1]);
				addFakeUser(fakeResponse[0], 'test', 'test', 'http://example.com/photo.jpg').verified = 'false';
				addFakeUser(fakeResponse[1], 'test', 'test', 'http://example.com/photo.jpg').verified = 0;
				addFakeUser(fakeResponse[2], 'test', 'test', 'http://example.com/photo.jpg').verified = undefined;
				addFakeUser(fakeResponse[3], 'test', 'test', 'http://example.com/photo.jpg').verified = true; // only one should be ignored
				addFakeUser(fakeResponse[4], 'test', 'test', 'http://example.com/photo.jpg').verified = false;

				subject.loadParameters = new Configuration({
					media_friends: 100
				});
				testFilteringPosts(['5', '4', '3', '1'], fakeResponse, done);
			})

			it('filtering by popular/most recent - popular boundary edge case...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				fakeResponse[1].favorite_count = (TwitterDriver.TWITTER_POPULAR_MIN_LIKES + 1);

				subject.loadParameters = new Configuration({
					popular_mostRecent: 34
				});
				testFilteringPosts(['3', '2', '1'], fakeResponse, done);
			})

			it('filtering by popular/most recent - recent boundary edge case...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				fakeResponse[1].favorite_count = (TwitterDriver.TWITTER_POPULAR_MIN_LIKES + 1);

				subject.loadParameters = new Configuration({
					popular_mostRecent: 65
				});
				testFilteringPosts(['3', '2', '1'], fakeResponse, done);
			})

			it('filtering by popular/recent - popular posts only...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				fakeResponse[1].favorite_count = (TwitterDriver.TWITTER_POPULAR_MIN_LIKES + 1);

				subject.loadParameters = new Configuration({
					popular_mostRecent: 33
				});
				testFilteringPosts(['2'], fakeResponse, done);
			});

			it('filtering by popular/recent - popular posts only - extended dataset...', (done) => {
				let fakeResponse = createFakeResponse([5, 4, 3, 2, 1]);
				fakeResponse[0].favorite_count = 0;
				fakeResponse[1].favorite_count = (TwitterDriver.TWITTER_POPULAR_MIN_LIKES + 1); // only one to be included
				fakeResponse[2].favorite_count = undefined;
				fakeResponse[3].favorite_count = {};
				fakeResponse[4].favorite_count = true;

				subject.loadParameters = new Configuration({
					popular_mostRecent: 33
				});
				testFilteringPosts(['4'], fakeResponse, done);
			});

			it('filtering by popular/recent - recent posts only...', (done) => {
				let fakeResponse = createFakeResponse([3, 2, 1]);
				fakeResponse[1].favorite_count = (TwitterDriver.TWITTER_POPULAR_MIN_LIKES + 1);

				subject.loadParameters = new Configuration({
					popular_mostRecent: 66
				});
				testFilteringPosts(['3', '2', '1'], fakeResponse, done);
			});

		});

		describe("delete post", function() {

			it('Should delete post appropriately', function(done) {
				let data = {
					"id_str": "123456789",
					"id": 123456789,
					"user": {
						"name": "Jack Daniels"
					}
				};
				__checkTwitRequest('/1.1/statuses/destroy/123456789.json', {
					id: 123456789,
					id_str: '123456789'
				});
				subject.on('postDestroyed', (driver, result) => {
					result.postId.should.equal(123456789);
					done();
				});
				subject.deletePost(data);
			});

		});

		describe("notifications", function() {

			it('No notifications are available', function(done) {
				subject.http.setupForSuccess([]);
				subject.on('loadNotificationsComplete', () => {
					subject.notifications.should.deep.equal([])
					done()
				})
				subject.on('error', () => {
					chai.assert.fail('Should not fail')
				})
				subject.loadNotifications()
			})
		})

		describe("on error", function() {

			it('should broadcast error', function(done) {
				subject.http.setupForError('The Internet connection seems to appear offline');
				subject.on('error', (source, err) => {
					err.message.should.equal('The Internet connection seems to appear offline');
					err.origin.codeBlock.should.equal('get');
					err.origin.domain.should.equal('TwitterDriver');
					err.origin.publicCodeBlock.should.equal('loadPosts');
					err.origin.vendor.should.equal('twitter');
					done();
				});
				subject.loadPosts();
			});

		})

		describe('Like (favourite) Tweets', function() {

			let data = new Post({
				id: '123456789'
			});

			it('should be able to issue request to favour tweet', function(done) {
				var response = {
					favorited: 1,
					id: 123456789,
					id_str: "123456789"
				};
				subject.http.setupForSuccess(response);
				subject.on('postLiked', (driver, result) => {
					result.postId.should.equal('123456789')
					result.success.should.equal(true)
					done()
				})
				subject.likePost(data);
			})

			it('should be able to issue request to unfavour tweet', function(done) {
				var response = {
					favorited: 0,
					id: 123456789,
					id_str: "123456789"
				};
				subject.http.setupForSuccess(response);
				subject.on('postUnliked', (driver, result) => {
					result.postId.should.equal('123456789')
					result.success.should.equal(true)
					done();
				})
				subject.unlikePost(data);
			})
		})

		describe('Tweet like a tweety bird!', function() {

			it('should be able to tweet...', function(done) {
				__checkTwitRequest('/1.1/statuses/update.json?status=Chirp%20chirp%20chirp...%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more', {
					id_str: '1234567',
					id: 334455,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}, (options) => options.method.should.equal('POST'));
				subject.on('postSent', (driver, result) => {
					result.postId.should.equal('1234567');
					aid.testAllActions(result.actions);
					done();
				})
				subject.sendPost(new Post({
					identity: new Identity({
						vendor: 'facebook'
					}),
					id: 223344,
					message: 'Chirp chirp chirp...'
				}));
			});

			it('should be able to tweet and comment on tweet...', function(done) {
				let requests = [
					'/1.1/statuses/update.json?status=errant%20message%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more',
					'/1.1/statuses/update.json?status=%40justfrank%20errant%20comment%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more&in_reply_to_status_id=123'
				];
				let responses = [{
					id: 123,
					id_str: '123',
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}, {
					id: 321,
					id_str: '321',
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}];
				let post = new Post({
					comments: [new Comment({
						message: 'errant comment'
					})],
					message: 'errant message',
					type: 'status'
				});
				subject.http.multiCheckHttpRequest(requests, responses);
				subject.on('postSent', (driver, result) => {
					result.postId.should.equal('123');
					done();
				})

				subject.sendPost(post);
			});

			it('should be able to upload a snap and comment on upload...', function(done) {
				let media = new Media({
					imgUrl: 'iTag',
					srcUrl: 'special'
				});
				let requests = [
					'/1.1/media/upload.json',
					'/1.1/statuses/update.json?status=errant%20message%0A%0AUploaded%20with%20www.mysocialstream.com%2Ffind-out-more',
					'/1.1/statuses/update.json?status=%40justfrank%20errant%20comment%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more&in_reply_to_status_id=123'
				];
				let responses = [{
					media_id: 12356,
					media_id_string: '12356'
				}, {
					id: 123,
					id_str: '123',
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}, {
					id: 321,
					id_str: '321',
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}];
				let post = new Post({
					comments: [new Comment({
						message: 'errant comment'
					})],
					media: [media],
					message: 'errant message',
					type: 'status'
				});
				subject.http.multiCheckHttpRequest(requests, responses);
				subject.on('postSent', (driver, result) => {
					result.postId.should.equal('123');
					done();
				});

				media.imageBase64Data = '';

				subject.sendPost(post, (mRequest, mimeType, mCallback) => mCallback(media));
			});

			it('should be able to retweet a tweet...', function(done) {
				__checkTwitRequest('/1.1/statuses/retweet/223344.json', {
					id_str: '12345657',
					id: 335544,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}, (options) => options.method.should.equal('POST'));
				subject.on('postSent', (driver, result) => {
					result.postId.should.equal('12345657');
					done();
				});
				subject.sendPost(new Post({
					identity: new Identity({
						vendor: 'twitter'
					}),
					id: 223344
				}));
			});

			it('should be able to retweet and comment on original tweet...', function(done) {
				let reqReshare = '/1.1/statuses/update.json?status=ImaCommenting%20https%3A%2F%2Fwww.twitter.com%2F123321%2Fstatus%2F223344%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more';
				let reqRetweet = '/1.1/statuses/retweet/223344.json';
				let reqStatus = '/123321/status/223344';
				let response = {
					id_str: '12345657',
					id: 335544,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				};

				subject.http.multiCheckHttpRequest([reqReshare, reqRetweet, reqStatus], [response, response, response]);
				subject.on('postSent', (driver, result) => {
					result.postId.should.equal('12345657');
					subject.http.requests.should.equal(3);
					done();
				});

				subject.sendPost(new Post({
					creator: new User({
						id: 123321,
						name: 'Minnie Mouse'
					}),
					comments: [new Comment({
						message: 'ImaCommenting https://www.twitter.com/123321/status/223344'
					})],
					identity: new Identity({
						vendor: 'twitter'
					}),
					id: 223344,
					link: 'https://www.twitter.com/123321/status/223344'
				}));
			});

			it('should be able to tweet censored curse words... ', function(done) {
				__checkTwitRequest('/1.1/statuses/update.json?status=%28%21%29%20%2A%2A%2A%2A%20%28%21%29%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more', {
					id_str: '1234567',
					id: 334455,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				}, (options) => options.method.should.equal('POST'));
				subject.on('postSent', (driver, result) => {
					result.postId.should.equal('1234567');
					done();
				})
				subject.sendPost(new Post({
					id: 223344,
					message: '(!) **** (!)'
				}));
			});

			it('Should upload a video with only advertising text, \'cause... NO TEXT!', function(done) {
				var reqCounter = 0;
				var media = new Media({
					base64Data: 'ABCD',
					type: 'video'
				});

				let reqInit = '/1.1/media/upload.json?command=INIT&media_type=video%2Fmov&total_bytes=3';
				let reqAppend = '/1.1/media/upload.json?command=APPEND&media_id=601413451156586496&segment_index=0';
				let reqFinal = '/1.1/media/upload.json?command=FINALIZE&media_id=601413451156586496';
				let reqTweet = ['&media_ids=601413451156586496', 'Uploaded%20with%20www.mysocialstream.com%2Ffind-out-more']

				let response = {
					media_id_string: '601413451156586496',
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				};

				media.videoBase64Data = 'ABCD';
				subject.http.multiCheckHttpRequest([reqInit, reqAppend, reqFinal, reqTweet], [response, response, response, response]);
				subject.on('postSent', () => done());

				subject.sendPost(new Post({
					media: [media]
				}), (media, mimeType, callback) => callback(media));
			});

			it('posts with an image and no text should have only advertising text...', function(done) {
				let mRequest = true;
				let media = new Media({
					base64Data: 'ABCD',
					type: 'photo'
				});
				let response = {
					media_id_string: 'banananman',
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				};

				media.imageBase64Data = 'ABCD';
				subject.http = {
					request(options, success, error) {
						if (mRequest) {
							mRequest = false;
							success(response);
						} else {
							options.path.should.equal('/1.1/statuses/update.json?status=Uploaded%20with%20www.mysocialstream.com%2Ffind-out-more&media_ids=banananman');
							success(response);
						}
					}
				}

				subject.on('postSent', () => done());
				subject.sendPost({
					media: [media]
				}, (media, mimeType, callback) => callback(media));
			});

			it('should not append advertising text if too many characters...', (done) => {
				__checkTwitRequest('/1.1/statuses/update.json?status=count%20how%20many%20characters%20are%20in%20this%20text%2C%20lookin%20for..', {
					id_str: '1234567',
					id: 334455,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				});
				subject.on('postSent', () => done());

				subject.sendPost(new Post({
					identity: new Identity({
						vendor: 'facebook'
					}),
					id: 223344,
					message: 'count how many characters are in this text, lookin for..'
				}));
			});

			it('should be able to append advertising if some characters are hyperlinks...', (done) => {
				__checkTwitRequest('/1.1/statuses/update.json?status=This%20is%20a%20test%20tweet%2C%20tested%20to%20tweet%20https%3A%2F%2Fhardware.slashdot.org%2Fstory%2F16%2F12%2F01%2F212237%2Fmotorola-has-no-plans-for-a-new-smartwatch%20with%20a%20long%20URL%20shortened%20to%20a%20short%20url%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more', {
					id_str: '1234567',
					id: 334455,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				});
				subject.on('postSent', (driver, result) => done());

				subject.sendPost(new Post({
					identity: new Identity({
						vendor: 'facebook'
					}),
					id: 223344,
					message: 'This is a test tweet, tested to tweet https://hardware.slashdot.org/story/16/12/01/212237/motorola-has-no-plans-for-a-new-smartwatch with a long URL shortened to a short url'
				}));
			});

			it('should not append advertising text is hyperlink is not preceeded by a space...', (done) => {
				__checkTwitRequest('/1.1/statuses/update.json?status=This%20is%20a%20test%20tweet%2C%20tested%20to%20tweethttps%3A%2F%2Fhardware.slashdot.org%2Fstory%2F16%2F12%2F01%2F212237%2Fmotorola-has-no-plans-for-a-new-smartwatch%20with%20a%20long%20URL%20shortened%20to%20a%20short%20url', {
					id_str: '1234567',
					id: 334455,
					user: {
						id: 555,
						id_str: '555',
						name: 'frank',
						screen_name: 'justfrank'
					}
				});
				subject.on('postSent', (driver, result) => done());
				
				subject.sendPost(new Post({
					identity: new Identity({
						vendor: 'facebook'
					}),
					id: 223344,
					message: 'This is a test tweet, tested to tweethttps://hardware.slashdot.org/story/16/12/01/212237/motorola-has-no-plans-for-a-new-smartwatch with a long URL shortened to a short url'
				}));
			});
		});

		describe('#comment', function() {

			it('on tweet', function(done) {
				__checkTwitRequest('/1.1/statuses/update.json?status=%40TestUser%20Comment%20Message%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more&in_reply_to_status_id=123456789', {
					id_str: 'COMMENT_ID'
				}, (options) => options.method.should.equal('POST'));
				subject.on('postCommented', (driver, result) => {
					result.postId.should.equal('123456789');
					result.commentId.should.equal('COMMENT_ID');
					done();
				});
				subject.commentOnPost(new Post({
					id: '123456789',
					creator: new User({
						id: 'TestUser'
					})
				}), 'Comment Message');
			});

			it('on ios tweet error', function(done) {
				__checkTwitRequest('/1.1/statuses/update.json?status=%40TestUser%20Comment%20Message%0A%0ATweeted%20with%20www.mysocialstream.com%2Ffind-out-more&in_reply_to_status_id=123456789', {
					errors: [{
						code: 144,
						message: "No status found with that ID."
					}]
				});
				subject.on('error', (source, error) => {
					error.message.should.equal('No status found with that ID.');
					error.origin.codeBlock.should.equal('post');
					error.origin.domain.should.equal('TwitterDriver');
					error.origin.publicCodeBlock.should.equal('commentOnPost');
					error.origin.vendor.should.equal('twitter');
					done();
				})
				subject.commentOnPost(new Post({
					id: '123456789',
					creator: new User({
						id: 'TestUser'
					})
				}), 'Comment Message');
			});
		});
	});
});