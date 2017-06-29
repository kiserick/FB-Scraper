import {Configuration} from '../src/data/configuration.es6';
import {ErrorDriver} from './env/errorDriver.es6';
import {Environment} from './env/testEnv.es6';
import {Identity} from '../src/data/identity.es6';
import {Notification} from '../src/data/notification.es6';
import {Post} from '../src/data/post.es6';
import {Smagger} from '../src/smagger.es6';
import {TestDriver} from './env/TestDriver.es6';
import {TestAid} from './env/testAid.es6';

let chai = require('chai');
let aid = new TestAid();
let subject = false;

chai.should();
let expect = chai.expect;

describe("Smagger", function() {

	// Creates listing of posts
	let createPosts = (postIds, vendor) => {
		if (!vendor) {
			vendor = 'unknown'
		}
		let posts = []
		postIds.forEach(function (postId) {
			posts.push(new Post({
				identity: new Identity({
					vendor: vendor
				}),
				id: String(postId)
			}))
		})
		return posts
	}

	// Creates listing of notifications
	let createNotifications = (notificationIds, vendor) => {

		if (!vendor) {
			vendor = 'unknown';
		}

		let notifications = [];

		notificationIds.forEach((notificationId) => {

			notifications.push(new Notification({
				vendor: vendor,
				id: String(notificationId),
				timestamp: Number(notificationId)
			}));

		});
		return notifications;

	}


	beforeEach(() => {

		subject = new Smagger();
		subject.env = new Environment();
		subject.driverRegistry.test = TestDriver;

	});


	describe("#newDriver", function () {

		beforeEach(function () {
			subject.driverRegistry.test = TestDriver;
		});


		it('Create Identity', () => {

			let identity = subject.createIdentity('test', 'OAUTH', 'SECRET');
			identity.vendor.should.equal('test');
			identity.oauthToken.should.equal('OAUTH');
			identity.oauthSecret.should.equal('SECRET');

		});


		it('should explode if the network type is not registered', () => {

			let bad = () => subject.newDriver(new Identity({
				vendor: 'unknown'
			}));

			bad.should.throw(Error);

		});


		it('should have been constructed with media - friends slider Configuration', () => {

			let loadParameters = new Configuration({
				media_friends: 90
			});

			subject.newDriver(new Identity({
				vendor: 'test'
			}), loadParameters).loadParameters.media_friends.should.equal(90);

		});


		it('should have its network identity injected', () => {

			subject.newDriver(new Identity({
				vendor: 'test'
			})).networkIdentity.vendor.should.equal('test');

		});

	});

	describe("#addDriver", function () {

		beforeEach(() => {

			subject.addDriver(new Identity({
				vendor: 'test'
			}), new Configuration());

		});

		it('should add to its drivers list', () => {

			subject.drivers.length.should.equal(1);

		});

		it('should inject the http service', () => {

			subject.drivers[0].http.should.equal(subject.env.http);

		});
	});

	describe("#load", () => {

		beforeEach(() => {

			let testDriver = subject.addDriver(new Identity({
				vendor: 'test'
			}));

			subject.postMasterGeneral = {
				shouldPostBlocks: (postBlocks) => postBlocks
			};

			testDriver.items = createPosts([1]);
		});


		describe("#posts", () => {


			it('should set smagger state to busy when loading posts...', () => {

				subject.loadPosts();
				subject.busy.should.equal(true);
			});


			it('should continue when PostMasterGeneral returns postBlocks...', (done) => {

				subject.on('postsLoaded', (driver, result) => {
					// Check that the issued posts is correct
					result.length.should.equal(1);
					result[0].id.should.equal('1');
					// Check that the posts have been removed from SmaggerDriver.
					subject.blocks.length.should.equal(1);

					done();
				});

				subject.loadPosts();
			});


			it('should terminate when PostMasterGeneral returns an empty postBlocks array...', (done) => {

				subject.postMasterGeneral = {
					shouldPostBlocks: (postBlocks) => []
				};

				subject.on('postsLoaded', (driver, result) => {
					expect(result).to.be.empty;
					done();
				});

				subject.loadPosts();
			});

			it('should set smagger state to available loading algorithm is complete...', (done) => {

				subject.on('postsLoaded', (driver, result) => {

					if (!result.length) {
						subject.busy.should.equal(false);
						done();
					}
				});

				subject.loadPosts();
			});

			it('should load post...', (done) => {

				subject.on('postsLoaded', (driver, result) => {

					result.length.should.equal(1);
					result[0].id.should.equal('1');
					done();

				});

				subject.loadPosts();
			});

			it('should receive errors in smagger upon page complete...', (done) => {

				subject = new Smagger();
				subject.env = new Environment();
				subject.driverRegistry.error = ErrorDriver;

				subject.addDriver(new Identity({
					vendor: 'error'
				}), 'TEST');

				subject.on('postsLoaded', (driver, result) => {

					subject.errors[0].message.should.equal('TEST');
					subject.errors[0].origin.vendor.should.equal('error');
					done();

				});

				subject.loadPosts();
			});
		});

		describe("#Notifications", () => {

			let testDriver;

			beforeEach(() => {

				testDriver = subject.addDriver(new Identity({
					vendor: 'test'
				}));

				testDriver.notifications = createNotifications([1],[2]);
			});

			it('should set smagger state to busy when loading page...', () => {

				subject.loadNotifications();
				subject.busy.should.equal(true);
			});

			it('should set smagger state to available when a page has loaded...', (done) => {

				subject.on('loadNotificationsComplete', (driver, result) => {

					subject.busy.should.equal(false);
					done();
				});

				subject.loadNotifications();
			});

			it('should load notification...', (done) => {

				subject.on('loadNotificationsComplete', (driver, result) => {

					subject.notifications.length.should.equal(1);
					subject.notifications[0].id.should.equal('1');
					done();
				});

				subject.loadNotifications();
			});
		});
	});

	describe('#send', () => {

		beforeEach(() => {

			subject.addDriver(new Identity({
				vendor: 'test'
			}));
		});

		describe('#post', () => {

			let identity = new Identity({
				vendor: 'test'
			});

			let post = new Post({
				id: 'POST_ID',
				message: 'Should error'
			});

			it('should send post...', (done) => {

				subject.on('postSent', (driver, result) => {

					result.postId.should.equal('POST_ID');
					done();

				});

				subject.sendPost(identity, post);
			});

			it('should receive errors from error vendor...', (done) => {

				subject.driverRegistry.error = ErrorDriver;

				subject.addDriver(new Identity({
					vendor: 'error'
				}), 'TEST');

				identity = new Identity({
					vendor: 'error'
				});

				subject.on('postSent', (driver, result) => {

					subject.errors[0].message.should.equal('TEST');
					subject.errors[0].origin.vendor.should.equal('error');
					done();

				});

				subject.sendPost(identity, post);
			});
		});

		describe('#comment', () => {

			it('should send comment...', (done) => {

				let comment = new Post({
					identity: new Identity({
						vendor: 'test'
					}),
					id: 'POST_ID'
				});

				subject.on('postCommented', (driver, result) => {

					result.commentId.should.equal('COMMENT_1');
					done();

				});

				subject.commentOnPost(comment, 'Should error');
			});

			it('should receive errors from error vendor...', (done) => {

				let comment = new Post({
					identity: new Identity({
						vendor: 'error'
					}),
					id: 'POST_ID'
				});

				subject.driverRegistry.error = ErrorDriver;

				subject.addDriver(new Identity({
					vendor: 'error'
				}), 'TEST');

				subject.on('postCommented', (driver, result) => {

					subject.errors[0].message.should.equal('TEST');
					subject.errors[0].origin.vendor.should.equal('error');
					done();

				});

				subject.commentOnPost(comment, 'Should error');
			});
		});
	});

	describe('#delete', () => {

		let post;

		beforeEach(() => {

			subject.driverRegistry.error = ErrorDriver;

			subject.addDriver(new Identity({
				vendor: 'test'
			}));

			subject.addDriver(new Identity({
				vendor: 'error'
			}), 'Test Error');

			post = new Post({
				identity: new Identity({
					vendor: 'test'
				}),
				id: 'POST_1'
			});
		});

		it('should delete post...', (done) => {

			subject.on('postDeleted', (driver, result) => {

				result.postId.should.equal('POST_1');
				done();

			});

			subject.deletePost(post);
		});

		it('should error deleting post...', (done) => {

			subject.on('postDeleted', (driver, result) => {

				subject.errors[0].origin.vendor.should.equal('error');
				subject.errors[0].message.should.equal('Test Error');
				done();

			});

			post.identity.vendor = 'error';
			subject.deletePost(post);
		});
	});
});
