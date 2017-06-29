import {Action} from '../src/data/action';
import {Comment} from '../src/data/comment';
import {Configuration} from '../src/data/configuration';
import {Environment} from './env/testEnv';
import {Identity} from '../src/data/identity';
import {InstagramDriver} from '../src/instagramDriver';
import {Media} from '../src/data/media';
import {Post} from '../src/data/post';
import {DummyHandlerFactory, TestAid} from './env/testAid';
import {User} from '../src/data/user';

let chai = require('chai');
let env = new Environment();

chai.should();
logger.warn = () => {};
logger.error = () => {};

describe("InstagramDriver", function() {

	describe("#constructor", function() {

		it('should remember its access token and load parameters...', function() {
			let driver = new InstagramDriver(new Identity({
				oauthToken: JSON.stringify({
					csrfToken: 'CSRF_TOKEN',
					deviceId: 'DEVICE_ID',
					uuid: 'UUID',
					cookies: 'API_COOKIES'
				}),
				oauthSecret: 'WEB_COOKIES',
				userId: 'user-id'
			}), new Configuration({
				media_friends: 100
			}))
			driver.csrfToken.should.equal('CSRF_TOKEN')
			driver.deviceId.should.equal('DEVICE_ID')
			driver.uuid.should.equal('UUID')
			driver.cookies.should.equal('API_COOKIES')
			driver.identity.oauthSecret.should.equal('WEB_COOKIES')
			driver.loadParameters.media_friends.should.equal(100)
		});

		it('should complain vociferously if an identity is not supplied...', function() {
			chai.expect(InstagramDriver).to.throw(Error);
		});

		it('should complain vociferously if an access token is not supplied...', function() {
			chai.assert.throws(() => new InstagramDriver(new Identity()));
		});

		it('should complain vociferously if cookies are not supplied', function() {
			chai.assert.throws(() => new FacebookDriver(new Identity({
				oauthToken: 'access-token',
				oauthSecret: null
			})), Error);
		});

		it('should complain vociferously if userId is not supplied...', function() {
			chai.assert.throws(() => new InstagramDriver(new Identity({
				oauthToken: 'access-token',
				oauthSecret: 'cookies'
			})));
		});

		it('can create driver without custom configuration...', function() {
			chai.assert.doesNotThrow(() => new InstagramDriver(new Identity({
				oauthToken: '{}',
				oauthSecret: 'cookies',
				userId: 'user-id'
			})), Error);
		});

	})

	let accessToken = JSON.stringify({
		csrfToken: 'CSRF_TOKEN',
		deviceId: 'DEVICE_ID',
		uuid: 'UUID',
		cookies: 'COOKIES'
	});
	let accessSecret = 'csrftoken=abracadabra;mid=on;sessionid=sessid;'
	let aid = new TestAid();
	let identity = undefined;
	let loadParameters = new Configuration();
	let subject = undefined;
	let userId = 'user-id';
	let testpost = '{"graphql":{"user":{"edge_web_feed_timeline":[]}}}';
	let legacypost = '{"feed":{"media":[]}}';

	beforeEach(() => {
		
		let mCommentTransform = {
			transform: () => {
				return {
					comments: [],
					cursor: false
				}
			}
		}
		let mEndPageTransform = {
			transform: () => {
				return false;
			}
		}
		let mFeedTransform = {
			transform: () => {
				return [];
			},
			getUnformatted: () => {
				return [];
			}
		}

		identity = new Identity({
			vendor: 'instagram',
			oauthToken: accessToken,
			oauthSecret: accessSecret,
			userId: userId
		});

		subject = new InstagramDriver(identity, loadParameters);
		subject.http = new Environment().http;
		subject.feedTransform = mFeedTransform;
		subject.topCommentsTransform = mCommentTransform;
		subject.endPageCursorTransform = mEndPageTransform;
		subject.pagedFeedTransform = mFeedTransform;
		subject.pagedCommentsTransform = mCommentTransform;
	});


	describe("#load", () => {

		it('no data to load...', (done) => {
			subject.http.checkHttpRequest('www.instagram.com', '/?__a=1&hl=en', '{}');

			subject.on('postLoaded', (post) => aid.fail('a post has been loaded from no data'));
			subject.on('pageComplete', (page) => done());

			subject.loadPosts()
		});

		it('failure communicated from Instagram...', (done) => {

			subject.http.setupForSuccess({ meta: { code: 400, error_type: 'Failure to communicate', error_message: 'What we got here...' } });

			subject.on('postLoaded', () => aid.fail('a post has been loaded from a failure.'));
			subject.on('error', (driver, error) => {
				error.message.should.equal('What we got here...');
				done();
			});

			subject.loadPosts();
		});

		it('data to load (with no paged data)...', (done) => {

			subject.feedTransform.transform = () => [
				new Post({
					id: 'mocked posts'
				})
			];
			subject.http.setupForSuccess(testpost);
			subject.on('postLoaded', (driver, post) => {
				post.id.should.equal('mocked posts');
				done();
			});

			subject.loadPosts();
		});

		it('should be able to strip advertising text... ', (done) => {

			subject.http.setupForSuccess(testpost);
			subject.feedTransform.transform = () => [ new Post({ message: 'mocked posts\n\nImage uploaded with Social Stream\nhttp://mysocialstream.com/find-out-more' })];
			
			subject.on('postLoaded', (driver, post) => {
				post.message.should.equal('mocked posts');
				done();
			});

			subject.loadPosts();
		});

		it('should use the FrontPageFeedTransform for the correct JSON...', (done) => {

			subject.http.setupForSuccess(testpost);
			subject.feedTransform.transform = (() => done());

			subject.loadPosts();
		});

		it('should use the PagedFeedTransform for the old JSON...', (done) => {
			subject.http.setupForSuccess(legacypost);
			subject.pagedFeedTransform.transform = (() => done());

			subject.loadPosts();
		});

		it('should set the paging property...', (done) => {

			subject.http.setupForSuccess(testpost);
			subject.endPageCursorTransform.transform = () => 'bananapeel';
			subject.feedTransform.transform = () => [ new Post({ 'id': '1' }) ];

			subject.on('pageComplete', () => {
				subject.nextPageCursor.should.equal('bananapeel');
				done();
			});

			subject.loadPosts();
		});

		it('should call the second page if the paging property is set...', () => {
			
			subject.http.setupForSuccess(testpost);
			subject.nextPageCursor = 'bananapeel';

			subject.http.checkHttpRequest('www.instagram.com', '/query/', testpost, { code: 200 }, (options) => {
				options.body.should.equal('q=ig_me()+%7B%0A++feed+%7B%0A++++media.after(bananapeel%2C+12)+%7B%0A++++++nodes+%7B%0A++++++++id%2C%0A++++++++caption%2C%0A++++++++code%2C%0A++++++++comments.last(4)+%7B%0A++++++++++count%2C%0A++++++++++nodes+%7B%0A++++++++++++id%2C%0A++++++++++++created_at%2C%0A++++++++++++text%2C%0A++++++++++++user+%7B%0A++++++++++++++id%2C%0A++++++++++++++profile_pic_url%2C%0A++++++++++++++username%0A++++++++++++%7D%0A++++++++++%7D%2C%0A++++++++++page_info%0A++++++++%7D%2C%0A++++++++date%2C%0A++++++++dimensions+%7B%0A++++++++++height%2C%0A++++++++++width%0A++++++++%7D%2C%0A++++++++display_src%2C%0A++++++++is_video%2C%0A++++++++likes+%7B%0A++++++++++count%2C%0A++++++++++nodes+%7B%0A++++++++++++user+%7B%0A++++++++++++++id%2C%0A++++++++++++++profile_pic_url%2C%0A++++++++++++++username%0A++++++++++++%7D%0A++++++++++%7D%2C%0A++++++++++viewer_has_liked%0A++++++++%7D%2C%0A++++++++location+%7B%0A++++++++++id%2C%0A++++++++++has_public_page%2C%0A++++++++++name%0A++++++++%7D%2C%0A++++++++owner+%7B%0A++++++++++id%2C%0A++++++++++blocked_by_viewer%2C%0A++++++++++followed_by_viewer%2C%0A++++++++++full_name%2C%0A++++++++++has_blocked_viewer%2C%0A++++++++++is_private%2C%0A++++++++++profile_pic_url%2C%0A++++++++++requested_by_viewer%2C%0A++++++++++username%0A++++++++%7D%2C%0A++++++++usertags+%7B%0A++++++++++nodes+%7B%0A++++++++++++user+%7B%0A++++++++++++++username%0A++++++++++++%7D%2C%0A++++++++++++x%2C%0A++++++++++++y%0A++++++++++%7D%0A++++++++%7D%2C%0A++++++++video_url%0A++++++%7D%2C%0A++++++page_info%0A++++%7D%0A++%7D%2C%0A++id%2C%0A++profile_pic_url%2C%0A++username%0A%7D%0A&ref=feed%3A%3Ashow')
			});

			subject.loadPosts();
		});

		it('should fetch next page of comments for a post...', (done) => {

			subject.http.setupForSuccess(testpost);
			subject.topCommentsTransform.transform = () => {
				return {
					comments: [{
						id: 'update'
					}],
					cursor: false
				}
			};
			subject.pagedCommentsTransform.transform = subject.topCommentsTransform.transform;
			subject.feedTransform.transform = () => [{
				id: 'post',
				comments: [
					new Comment({
						id: 'comment'
					})
				],
				nextCommentPage: 'MOARCOMMENTS!'
			}];
			subject.on('postUpdated', (driver, post) => {
				post.comments.length.should.equal(2);
				done();
			});

			subject.loadPosts();
		});
	});

	describe("notifications", function() {

		it('No notifications are available', function(done) {
			subject.on('loadNotificationsComplete', () => {
				subject.notifications.should.deep.equal([]);
				done();
			});
			subject.loadNotifications();
		});
	});

	describe("on error", function() {

		it('should broadcast error', function(done) {
			subject.http = {
				request(options, success, error) {
					error('TEST error');
				}
			}
			subject.on('error', (source, err) => done());
			subject.loadPosts();
		});
	});

	describe('#like/unlike', function() {

		it('like a post', function(done) {
			let post = {
				actions: [{
					target: 'https://www.instagram.com/web/likes/POST_1/like/',
					type: 'Like'
				}],
				id: 'POST_1'
			}
			let response = {
				"status": "ok"
			};
			subject.http.checkHttpRequest('www.instagram.com', '/web/likes/POST_1/like/', response);
			subject.on('postLiked', function(driver, result) {
				result.postId.should.equal('POST_1');
				done();
			});
			subject.likePost(post);
		})

		it('unlike a post', function(done) {
			let post = {
				actions: [{
					target: 'https://www.instagram.com/web/likes/POST_1/unlike/',
					type: 'Like'
				}],
				id: 'POST_1'
			}
			let response = {
				"status": "ok"
			};
			subject.http.checkHttpRequest('www.instagram.com', '/web/likes/POST_1/unlike/', response);
			subject.on('postUnliked', function(driver, result) {
				result.postId.should.equal('POST_1');
				done();
			});
			subject.unlikePost(post);
		})

	})

	describe('#sendPost', function() {

		it('send photo', function(done) {
			subject.http.multiCheckHttpRequest(
				[
					'/api/v1/upload/photo/',
					'/api/v1/media/configure/'
				], [
					JSON.stringify({
						status: 'ok',
						upload_id: 1
					}),
					JSON.stringify({
						status: 'ok',
						media: {
							id: 2
						}
					})
				]
			)
			subject.on('postSent', (driver, data) => {
				data.postId.should.equal(2);
				done();
			});
			subject.sendPost(new Post({
				media: [new Media({
					type: 'image'
				})]
			}), (media, mimeType, callback) => callback({
				imageBase64Data: ''
			}))
		})


		it('send photo with comment', function(done) {
			subject.http.multiCheckHttpRequest(
				[
					'/api/v1/upload/photo/',
					'/api/v1/media/configure/',
					'/api/v1/media/MEDIA_ID/comment/'
				], [
					JSON.stringify({
						status: 'ok',
						upload_id: 1
					}),
					JSON.stringify({
						status: 'ok',
						media: {
							id: 'MEDIA_ID'
						}
					}),
					JSON.stringify({
						status: 'ok'
					})
				]
			)
			subject.on('postSent', (driver, data) => {
				data.postId.should.equal('MEDIA_ID')
				done()
			})
			subject.sendPost(new Post({
				media: [new Media({
					type: 'image'
				})]
			}), (media, mimeType, callback) => callback({
				imageBase64Data: ''
			}))
		})


		it('send video', function(done) {
			subject.http.multiCheckHttpRequest(
				[
					'/api/v1/upload/video/',
					'/UPLOAD_URL',
					'/api/v1/upload/photo/',
					'/api/v1/media/configure/',
					'/api/v1/media/configure/?video=1'
				], [
					JSON.stringify({
						status: 'ok',
						video_upload_urls: [{
							url: '/UPLOAD_URL',
							job: 'JOB'
						}]
					}),
					JSON.stringify({
						status: 'ok'
					}),
					JSON.stringify({
						status: 'ok',
						upload_id: 1
					}),
					JSON.stringify({
						status: 'ok',
						media: {
							id: 2
						}
					}),
					JSON.stringify({
						status: 'ok',
						media: {
							id: 3
						}
					})
				]
			)
			subject.on('postSent', (driver, data) => {
				data.postId.should.equal(3);
				done();
			})
			subject.sendPost(new Post({
				media: [new Media({
					type: 'video'
				})]
			}), (media, mimeType, callback) => callback({
				imageBase64Data: '',
				videoBase64Data: ''
			}))
		})


		it('send video with comment', function(done) {
			subject.http.multiCheckHttpRequest(
				[
					'/api/v1/upload/video/',
					'/UPLOAD_URL',
					'/api/v1/upload/photo/',
					'/api/v1/media/configure/',
					'/api/v1/media/configure/?video=1',
					'/api/v1/media/MEDIA_ID/comment/'
				], [
					JSON.stringify({
						status: 'ok',
						video_upload_urls: [{
							url: '/UPLOAD_URL',
							job: 'JOB'
						}]
					}),
					JSON.stringify({
						status: 'ok'
					}),
					JSON.stringify({
						status: 'ok',
						upload_id: 1
					}),
					JSON.stringify({
						status: 'ok',
						media: {
							id: 2
						}
					}),
					JSON.stringify({
						status: 'ok',
						media: {
							id: 'MEDIA_ID'
						}
					}),
					JSON.stringify({
						status: 'ok'
					})
				]
			)
			subject.on('postSent', (driver, data) => {
				data.postId.should.equal('MEDIA_ID')
				done()
			})
			subject.sendPost(new Post({
				media: [new Media({
					type: 'video'
				})]
			}), (media, mimeType, callback) => callback({
				imageBase64Data: '',
				videoBase64Data: ''
			}))
		})

	})

	describe('#comment', function() {

		it('on post', function(done) {

			let post = {
				actions: [{
					target: 'https://www.instagram.com/web/comments/1257081558213880511/add/',
					type: 'comment'
				}],
				id: 'POST_1'
			}
			let response = {
				"created_time": 1464160448,
				"text": "I wore these shorts in Bermuda and they were eaten by a triangle.",
				"status": "ok",
				"from": {
					"username": "teestdevisd",
					"profile_picture": "https://scontent-lhr3-1.cdninstagram.com/t51.2885-19/11906329_960233084022564_1448528159_a.jpg",
					"id": "1823927202",
					"full_name": "John Maps"
				},
				"id": "17856962695052474"
			};
			let test = (options) => {
				options.body.should.equal('comment_text=I+wore+these+shorts+in+Bermuda+and+they+were+eaten+by+a+triangle.');
				options.headers['cookie'].should.equal('csrftoken=abracadabra;mid=on;sessionid=sessid;');
				options.headers['x-csrftoken'].should.equal('abracadabra');
			}

			subject.http.checkHttpRequest('www.instagram.com', '/web/comments/1257081558213880511/add/', response);
			subject.on('postCommented', function(driver, result) {
				result.postId.should.equal('POST_1');
				result.commentId.should.equal('17856962695052474');
				done();
			});
			subject.commentOnPost(post, 'I wore these shorts in Bermuda and they were eaten by a triangle.');
		});

	});

})