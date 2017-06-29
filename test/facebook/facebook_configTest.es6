import {Environment} from '../env/testEnv'
import {FacebookDriver} from '../../src/facebookDriver'
import {FacebookFeedHandler} from '../../src/facebook/FacebookFeedHandler'
import {Identity} from '../../src/data/identity'
import {Post} from '../../src/data/post'
import {TestAid, DummyHandlerFactory, DummyUserRegistry} from '../env/testAid'
import {User} from '../../src/data/user'

let aid = new TestAid();
let chai = require('chai');
let DomHandler = require('domhandler');
let identity = new Identity({
	name: 'Frank Black',
	oauthSecret: 'c_user=123',
	oauthToken: '123',
	userId: '123'
});
let subject = null;
let util = require('util');

chai.should();

describe('#FacebookDriver Configuration', function() {

	describe('#media_friends', function() {

		let posts = [{
			"id": "1421436971517738_1498814133780021",
			"type": "status",
			"updated_time": "2015-11-05T03:45:59+0000",
			"message": "Who would have thought you could trade so much for beer...",
			"status_type": "mobile_status_update",
			"from": {
				"name": "Teest Devisd",
				"id": "1421436971517738"
			},
			"created_time": "2015-11-05T03:45:59+0000",
			"username": "/banan.jks",
			"comments": [],
			"fullStoryUrl": "/mystory.php"
		}, {
			"story": "Dwayne The Rock Johnson added a new photo to the album: Fan Art.",
			"id": "406433779383_10153927297429384",
			"type": "photo",
			"updated_time": "2015-11-05T03:49:21+0000",
			"message": "Very cool artistry by @artbysilje capturing my #WarriorMana (warrior spirit) at the powerful Akaka Falls in Hawaii earlier this year. #GreatestFansInTheWorld #GratefulMan #EmbraceYourMana",
			"link": "https://www.facebook.com/DwayneJohnson/photos/a.10153890534924384.1073741830.406433779383/10153927297429384/?type=3",
			"full_picture": "https://fbcdn-sphotos-f-a.akamaihd.net/hphotos-ak-xap1/v/t1.0-9/s720x720/12105943_10153927297429384_9021024952741832098_n.jpg?oh=6e751fa45e26759ac64133c2719940c5&oe=56BE7122&__gda__=1454545049_9f4673953dfab3480f82720b443eba3e",
			"name": "Fan Art",
			"status_type": "added_photos",
			"from": {
				"name": "Dwayne The Rock Johnson",
				"category": "Entertainer",
				"id": "406433779383",
				"likes": "123456789"
			},
			"created_time": "2015-11-05T00:14:34+0000",
			"username": "/banan.kps",
			"comments": [],
			"fullStoryUrl": "/mystory.php"
		}, {
			"id": "10153407891973327_1718861241666642",
			"type": "status",
			"updated_time": "2015-11-06T02:47:36+0000",
			"message": "Step right up folks and contain your excitement (particularly you in the front row with the shifty look and the trench coat..) as you lay your eyes upon this amazing... Military Crate! Comes with it's own mild rust and never needs feeding or batteries! It's bold, it's sassy, i honestly don't know what the hell it is but I just want it out of my house! Hide your porn, give grandpa flashbacks, lie to your friends about your budding military career or just plain bask in it's awesomeness! She's approx 60cm long by 25cm high and lives in kenwick. Liberate her for a carton of pineapple cruisers.",
			"from": {
				"name": "Shannon Cooper",
				"id": "10153407891973327"
			},
			"username": "/banan.jpks",
			"comments": [],
			"fullStoryUrl": "/mystory.php"
		}];

		let users = [{
			id: '1',
			type: 'friend'
		}, {
			id: '2',
			type: 'page'
		}, {
			id: '3',
			type: 'person'
		}];

		// Functional Programming attempt
		let loadtest = (config, postCount, done) => {

			let count = 0;

			subject = new FacebookDriver(identity, {
				media_friends: config
			}, new DummyHandlerFactory([{
				posts: posts
			}, {
				post: posts[0]
			}, {
				post: posts[1]
			}, {
				post: posts[2]
			}]), new DummyUserRegistry(users));

			subject.http = new Environment().http;
			subject.http.setupForSuccess("<html></html>");
			
			subject.on('postLoaded', (driver, post) => count++);
			subject.on('pageComplete', (driver) => {
				count.should.equal(postCount);
				done();
			});
			
			subject.loadPosts();
		}

		it('should be both media and friend post', function(done) {
			loadtest(50, 3, () => done());
		});

		it('should be friend post', function(done) {
			loadtest(100, 1, () => done());
		});

		it('should be media post', function(done) {
			loadtest(0, 1, () => done());
		});

		it('should be both media and friend post (edge case)', function(done) {
			loadtest(66, 3, () => done());
		});
	});
});