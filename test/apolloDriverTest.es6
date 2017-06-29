import {Action} from '../src/data/action'
import {ApolloDriver} from '../src/apolloDriver'
import {Comment} from '../src/data/comment'
import {DummyHandlerFactory, DummyUserRegistry, TestAid} from './env/testAid'
import {Environment} from './env/testEnv'
import {Identity} from '../src/data/identity'
import {Media} from '../src/data/media'
import {Notification} from '../src/data/notification'
import {Post} from '../src/data/post'
import {User} from '../src/data/user'

/*************** GLOBALS ******************/
let chai = require('chai');
chai.should();
let aid = new TestAid();
let identity = undefined;
let subject = undefined;

/***************************** TESTS *****************************/
describe("ApolloDriver", function() {

	beforeEach(() => {
		identity = new Identity({
			vendor: 'apollo',
			oauthToken: 'apollo',
			oauthSecret: 'apollo',
			userId: 'apollo'
		});
		subject = new ApolloDriver(identity, {}, {}, {});
		subject.http = new Environment().http;
	});

	describe("#constructor", function() {

		it('should remember its identity', function() {
			let driver = new ApolloDriver(identity);
			driver.identity.oauthSecret.should.equal('apollo');
			driver.identity.oauthToken.should.equal('apollo');
			driver.identity.userId.should.equal('apollo');
		})

		it('should complain vociferously if an identity is not supplied', function() {
			chai.expect(ApolloDriver).to.throw(Error);
		});
	});

	describe("#load", function() {

		let counter = false;
		let posts = false;

		beforeEach(() => {
			counter = 0;
			posts = [
				new Post({
					id: '1'
				}),
				new Post({
					id: '2'
				}),
				new Post({
					id: '3'
				})
			];
		});

		it('data', function(done) {

			// Undertake test
			subject.http.checkGetUrl('https://mighty-spire-2048.herokuapp.com/v1/posts', { posts: posts });
			subject.on('postLoaded', (driver, post) => aid.validate(posts[counter++], post));
			subject.on('pageComplete', () => done());

			subject.loadPosts();
		});

		it('should not return all data on second call to loadPosts...', (done) => {

			let postCount = 0;

			subject.http.setupForSuccess({ posts: posts });

			subject.on('postLoaded', (driver, post) => postCount++);
			subject.on('pageComplete', () => {
				if (counter++) {
					postCount.should.equal(3);
					done();
				} else {
					subject.loadPosts();
				}
			});

			subject.loadPosts();
		});

		it('error in request', function(done) {
			subject.http.checkGetUrl('https://mighty-spire-2048.herokuapp.com/v1/posts', null, {
				status: {
					code: 404
				}
			});
			subject.on('postLoaded', (driver, post) => Assert.fail(false, true, 'Incorrectly received postLoaded event in ApolloDriver.'));
			subject.on('pageComplete', () => done());

			subject.loadPosts();
		});
	});
});