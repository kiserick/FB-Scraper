import {Action} from '../src/data/action'
import {Comment} from '../src/data/comment'
import {Environment} from './env/testEnv'
import {Identity} from '../src/data/identity'
import {Media} from '../src/data/media'
import {Notification} from '../src/data/notification'
import {Post} from '../src/data/post'
import {TestAid} from './env/testAid'
import {User} from '../src/data/user'
import {YouTubeDriver} from '../src/youtubeDriver'

/******************** YOUTUBE DRIVER HELPER FUNCTIONS *****************/
const DATA_TEST = {"kind":"youtube#video","etag":"etag","id":"youtubespecific","snippet":{"publishedAt":"2015-09-16T15:14:13.5Z","channelId":"GEM","title":"Pony GEM","description":"My First YouTube!","thumbnails":{"default":{"url":"https://imafakegoogle.com.au/fomo/pony.mp4","width":1,"height":1}},"channelTitle":"youre an it","tags":["youreit"],"categoryId":"NOT SURE WHAT THIS SHOULD BE YET","liveBroadcastContent":"none","defaultAudioLanguage":"en_AU"},"contentDetails":{"duration":"PT#5#0","dimension":"2D","definition":"sd","caption":"false","licensedContent":true,"regionRestriction":{"allowed":["en_AU"],"blocked":[]},"contentRating":{"acbRating":"acbC","agcomRating":"T","anatelRating":"anatelA","bbfcRating":"bbfc12","bfvcRating":"bfvc13","bmukkRating":"bmukk10","catvRating":"catv14plus","catvfrRating":"catvfr13plus","cbfcRating":"cbfcA","cccRating":"ccc14","cceRating":"cceM12","chfilmRating":"chfilm0","chvrsRating":"chvrs14a","cicfRating":"cicfE","cnaRating":"cna12","csaRating":"csa10","cscfRating":"cscf12","czfilmRating":"czfilm12","djctqRating":"djctq10","djctqRatingReasons":["I dont know - I dont speak Portuguese!"],"eefilmRating":"eefilmK12","egfilmRating":"egfilm18","eirinRating":"eirinG","fcbmRating":"fcbm18","fcoRating":"fcoI","fmocRating":"fmoc10","fpbRating":"fpb1012Pg","fskRating":"fsk0","grfilmRating":"grfilmE","icaaRating":"icaa12","ifcoRating":"ifco12","ilfilmRating":"ilfilm12","incaaRating":"incaaAtp","kfcbRating":"kfcb16plus","kijkwijzerRating":"kijkwijzer12","kmrbRating":"kmrb12plus","lsfRating":"lsfA","mccaaRating":"mccaa12","mccypRating":"mccyp11","mdaRating":"mdaG","medietilsynetRating":"medietilsynet11","mekuRating":"meku12","mibacRating":"mibacT","mocRating":"moc12","moctwRating":"moctwG","mpaaRating":"mpaaG","mtrcbRating":"mtrcbG","nbcRating":"nbc12plus","nfrcRating":"nfrcA","nfvcbRating":"nfvcb12","nkclvRating":"nkclv12plus","oflcRating":"oflcG","pefilmRating":"pefilm14","resorteviolenciaRating":"resorteviolenciaA","rtcRating":"rtcA","rteRating":"rteCh","russiaRating":"russia0","skfilmRating":"skfilmG","smaisRating":"smais12","smsaRating":"smsa11","tvpgRating":"pg14","ytRating":"ytAgeRestricted"}},"status":{"uploadStatus":"uploaded","privacyStatus":"public","license":"youtube","embeddable":true,"publicStatsViewable":false},"statistics":{"viewCount":1,"likeCount":2,"dislikeCount":3,"favoriteCount":4,"commentCount":5},"player":{"embedHtml":"<iframe>myfakeiframe</iframe>"},"topicDetails":{"topicIds":["topical"],"relevantTopicIds":["tropical"]},"recordingDetails":{"locationDescription":"myhouse","location":{"latitude":-31.9144848,"longitude":116.0983428,"altitude":17},"recordingDate":"2015-10-19T16:16:16.000Z"},"processingDetails":{"processingStatus":"succeeded","processingProgress":{"partsTotal":10,"partsProcessed":6,"timeLeftMs":10000},"thumbnailsAvailability":"sure, why not?"}};

let chai = require('chai');
chai.should();

let aid = new TestAid();
let identity = new Identity({ oauthSecret: 'secret', oauthToken: 'token', userId: '12345', vendor: 'youtube' });
let subject = {};

// custom YouTube request helper
let _aidPosterChild = (expected, response, meta, test) => {
	let authExpected = '/oauth2/v3/token';
	let authResponse = { access_token: '1234' };
	let defaultTest = (options) => {
		options.method.should.equal('POST');
		options.headers['Content-Type'].should.equal('application/json');
	};

	if (!meta) {
		test = defaultTest;
		meta = _generateSuccessHeaderArray(typeof(expected) === 'Array' ? (expected.length + 1) : 2);
	} else if (typeof(meta) === 'function') {
		test = meta;
		meta = _generateSuccessHeaderArray(typeof(expected) === 'Array' ? (expected.length + 1) : 2);
	}

	subject.http.multiCheckHttpRequest([ authExpected, expected ], [ authResponse, response ], meta, test);
}

let _generateSuccessHeaderArray = (size) => {
	size = size || 1;
	return Array.apply(null, Array(size)).map(aid.generateSuccessHeaders);
}

// Helper to execute an illegal sendPost test.
let _illegalSendPost = (post, type, done) => {
	post.type = type;
	subject.on('error', done());
	subject.on('postSend', aid.fail('Illegal attempt to send ' + type + ' Post.'));

	subject.sendPost(post, (media, callback) => {
		media.imageBase64Data = media.base64Data;
		media.videoBase64Data = media.base64Data;
		callback(media);
	});
}

/********************************** TESTS ******************************/
describe('YouTubeDriver', function() {

	beforeEach(() => {
		subject = new YouTubeDriver(identity);
		subject.http = new Environment().http;
	});

	describe('#constructor', function() {

		it('should remember its access token', function() {
			let driver = new YouTubeDriver(new Identity({ oauthSecret: 'access-secret', oauthToken: 'access-token', userId: 'user-id' }));
			driver.identity.oauthSecret.should.equal('access-secret');
			driver.identity.oauthToken.should.equal('access-token');
			driver.identity.userId.should.equal('user-id');
		});

		it('driver should have a writable authorisation property', function() {
			let driver = new YouTubeDriver(new Identity({ oauthSecret: 'access-secret', oauthToken: 'access-token', userId: 'user-id' }));
			driver.auth.should.equal('access-token');
		});

		it('should complain vociferously if an identity is not supplied', function() {
			chai.expect(YouTubeDriver).to.throw(Error);
		});

		it('should complain vociferously if an access token is not supplied', function() {
			chai.assert.throws(() => new YouTubeDriver(new Identity({ oauthToken: null })), Error);
		});

		it('should complain vociferously if secret token is not supplied', function() {
			chai.assert.throws(() => new YouTubeDriver(new Identity({ oauthToken: 'access-token', userId: 'userId'})), Error);
		});

		it('should complain vociferously if userId is not supplied', function() {
			chai.assert.throws(() => new YouTubeDriver(new Identity({ oauthToken: 'access-token', oauthSecret: 'secret', userId: null})), Error);
		});

	});

	describe('#commentOnPost', function() {

		it('should be able to comment on a video...', (done) => {
			let creator = new User({ id: 'UCb5hy6OYL1JlkhparvdFADQ', name:'skooter Martin' });
			let expected = '/youtube/v3/commentThreads?part=snippet';
			let post = new Post({ id: 'x_m2VwCZ5wk', creator: creator });
			let response = {"snippet":{"isPublic":true,"channelId":"UCb5hy6OYL1JlkhparvdFADQ","videoId":"x_m2VwCZ5wk","canReply":true,"totalReplyCount":0,"topLevelComment":{"snippet":{"authorChannelUrl":"http://www.youtube.com/channel/UCkIC7zYq5suqM8HQyFR58Lg","authorDisplayName":"skooter Workin","channelId":"UCb5hy6OYL1JlkhparvdFADQ","videoId":"x_m2VwCZ5wk","publishedAt":"2015-10-20T07:16:59.204Z","viewerRating":"none","authorChannelId":{"value":"UCkIC7zYq5suqM8HQyFR58Lg"},"canRate":true,"textOriginal":"TEST MESSAGE FIRE!","likeCount":0,"updatedAt":"2015-10-20T07:16:59.204Z","authorProfileImageUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","authorGoogleplusProfileUrl":"https://plus.google.com/113479743949058820801","textDisplay":""},"kind":"youtube#comment","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/5DI31uyejhMamyPVEr5Ui5_nLWY\"","id":"z120x1gh3nrjippv522usfz4zrbhth0v5"}},"kind":"youtube#commentThread","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/4ccpzDb4cGE0ki7L6THcW-aY-kI\"","id":"z120x1gh3nrjippv522usfz4zrbhth0v5"};
			
			subject.on('postCommented', (driver, reply) => {
				reply.postId.should.equal('x_m2VwCZ5wk');
				reply.commentId.should.equal('z120x1gh3nrjippv522usfz4zrbhth0v5');
				done();
			});
			_aidPosterChild(expected, response);

			subject.commentOnPost(post, 'TEST MESSAGE - FIRE!');
		});

	});

	describe('#delete', function() {

		it('should be able to delete our own videos...', (done) => {
			let creator = new User({ id: 12345 });
			
			_aidPosterChild('/youtube/v3/videos?id=12345', {}, (options) => options.method.should.equal('DELETE'));
			subject.on('error', aid.fail('Attempt to delete own video failed.'));
			subject.on('postDeleted', (driver, deleted) => {
				deleted.postId.should.equal(12345);
				done();
			});

			subject.deletePost(new Post({ id: 12345, creator: creator, identity: identity }))
		});

	});

	describe('#like', function() {

		it('should be able to like a video...', (done) => {
			let expected = [ '/youtube/v3/videos/rate', 'hsvWyBSmr9o', 'rating=like' ];
            let post = {"id":"hsvWyBSmr9o","comments":[{"vendor":"youtube","id":"z13pefezymf3s105y04cdfvwtrumfdzxwfg","message":"damn I missed IFL science on youtube﻿","rawTimestamp":"2014-03-01T14:47:03.000Z","timestamp":1393685223000,"creator":{"vendor":"youtube","id":"UCv6cYBowLu1VYESyIr34Vlw","photoUrl":"https://lh6.googleusercontent.com/-vajsx8DnqDE/AAAAAAAAAAI/AAAAAAAAAD4/OG80NJA0jX8/photo.jpg?sz=50","name":"Prasun Jajodia"}},{"vendor":"youtube","id":"z12depxr4tymcvoct22vivcbezzwd1fhe04","message":"I missed you, I thought this channel died﻿","rawTimestamp":"2014-04-01T07:06:51.000Z","timestamp":1396336011000,"creator":{"vendor":"youtube","id":"UCXYwxz5wCNy4Br2_LwWrVPQ","photoUrl":"https://lh4.googleusercontent.com/-aniCSso1OKM/AAAAAAAAAAI/AAAAAAAAALE/jVfX3g6PDm4/photo.jpg?sz=50","name":"Dublin Zombi"}},{"vendor":"youtube","id":"z12gdhsaxsyhgxwpq04cgzdi4mazsdaowk40k","message":"SPACE WEATHER!!﻿","rawTimestamp":"2014-03-01T23:58:08.000Z","timestamp":1393718288000,"creator":{"vendor":"youtube","id":"UCinvwm4Zv91AhO5DVAhU4fA","photoUrl":"https://lh3.googleusercontent.com/-x5D-9xVpZio/AAAAAAAAAAI/AAAAAAAAAvE/AbWDj4v6c2w/photo.jpg?sz=50","name":"Nicholas Bernard Callistus Borelli"}},{"vendor":"youtube","id":"z121i3dgnpjexdyjq04ce54j3ki3xvf54hk","message":"cute dress, would love to open it... hehe﻿","rawTimestamp":"2014-03-01T03:10:54.000Z","timestamp":1393643454000,"creator":{"vendor":"youtube","id":"UClRKrOPzrY-qmpUMrqQDCUQ","photoUrl":"https://lh3.googleusercontent.com/-Rg5RySS0jkM/AAAAAAAAAAI/AAAAAAAAAA8/9brVmwYVBcs/photo.jpg?sz=50","name":"Goth108"}},{"vendor":"youtube","id":"z12sifxwgkzjztnbe04cf1ualynicjkzw5k","message":"i watch a lot of BBC shows/her accent is about impossible on many of these \n'scientific' terms and new items of interest... i turned on the CC; OMG - \nit was worse than what i was hearing... what's the deal?﻿","rawTimestamp":"2014-03-01T15:36:17.000Z","timestamp":1393688177000,"creator":{"vendor":"youtube","id":"UCff1NFQrOTCgYNZfgZoVfQQ","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"willowspain"}},{"vendor":"youtube","id":"z13sdt5hmwf2fze0v224j53wpyu5vtbba04","message":"i love the show, hate this fat ugly stupid bitch.﻿","rawTimestamp":"2014-03-21T17:55:43.000Z","timestamp":1395424543000,"creator":{"vendor":"youtube","id":"UCIKfHBZGHGZW0Ft-R252ggA","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"tyson wojtowicz"}},{"vendor":"youtube","id":"z13hwnzzilaydhmjj04cchw51s2wzplxywo0k","message":"I find that perky elevator music in the background of IFLScience videos \ndistracting to the point of annoyance.﻿","rawTimestamp":"2014-03-01T16:40:36.000Z","timestamp":1393692036000,"creator":{"vendor":"youtube","id":"UCju7F95rBqstKjuCWUz1icA","photoUrl":"https://lh5.googleusercontent.com/-7TVyox3kOUo/AAAAAAAAAAI/AAAAAAAAAD0/lhstX28Yo38/photo.jpg?sz=50","name":"calineophyte"}},{"vendor":"youtube","id":"z12csxs4knepctt4n04ccf3q4wrqxbqxwsk0k","message":"Tried mating when I had a headache once; wouldn't do it again.﻿","rawTimestamp":"2014-04-04T19:20:28.000Z","timestamp":1396639228000,"creator":{"vendor":"youtube","id":"UCWOKt4NGE3icrHliVud51pQ","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"Dean Hallett"}},{"vendor":"youtube","id":"z12zuv2gxrqkt5a1n22rv5gqonbxyxek3","message":"Welcome back!﻿","rawTimestamp":"2014-03-09T05:35:37.000Z","timestamp":1394343337000,"creator":{"vendor":"youtube","id":"UCfg-5y30oxu-TGckYXwIrZQ","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"1moreastronaut"}},{"vendor":"youtube","id":"z12rzzngesbyxhwns22bt5hwhrrsw3uqz04","message":"I can't hold it in anymore. Is it just me, or does her intelligence just \nmake her so freaking attractive?﻿","rawTimestamp":"2014-03-03T20:09:42.000Z","timestamp":1393877382000,"creator":{"vendor":"youtube","id":"UCWWHM87iCOExxArlrkoW5nQ","photoUrl":"https://lh5.googleusercontent.com/-KvLa8uji5o4/AAAAAAAAAAI/AAAAAAAABMw/ZbkONvCdwrs/photo.jpg?sz=50","name":"Fasullo Daniel"}},{"vendor":"youtube","id":"z12xdxtjkn3mtlfd523ghxxbpzy1ixkdh","message":"YAAY!! Science :D﻿","rawTimestamp":"2014-03-01T12:20:40.000Z","timestamp":1393676440000,"creator":{"vendor":"youtube","id":"UCIO1NsEwJtN4uGCl4dVXTqA","photoUrl":"https://lh3.googleusercontent.com/-VojZQQffIEg/AAAAAAAAAAI/AAAAAAAAADQ/amgCbYBsXY8/photo.jpg?sz=50","name":"MagpieSparkles"}},{"vendor":"youtube","id":"z131i3hz3vixvbat422yd12r3lzffp4ry04","message":"","rawTimestamp":"2014-04-09T16:19:28.000Z","timestamp":1397060368000,"creator":{"vendor":"youtube","id":"UCa9j2PQdzyxT9nJi5UlpUcQ","photoUrl":"https://lh5.googleusercontent.com/-rfh_r55ixKw/AAAAAAAAAAI/AAAAAAAAcP4/3EBLwge_9jw/photo.jpg?sz=50","name":"arissa ikeda"}},{"vendor":"youtube","id":"z12iuvwzroq3yjthn04cdr14aznfypvaaco","message":"The background music is louder than your voice...﻿","rawTimestamp":"2014-03-01T13:00:13.000Z","timestamp":1393678813000,"creator":{"vendor":"youtube","id":"UC7a7BcUKNoxwbwdoPz9nXEw","photoUrl":"https://lh5.googleusercontent.com/-kWtlTfozDTM/AAAAAAAAAAI/AAAAAAAAA8M/UDZ_0EOKQ4s/photo.jpg?sz=50","name":"César Brie"}},{"vendor":"youtube","id":"z124uzp52rnbzdoej23litso4lybdjvl2","message":"She's kind of annoying to watch... if you watch just her hands. It makes it \nhard to keep your attention...﻿","rawTimestamp":"2014-04-03T12:13:11.000Z","timestamp":1396527191000,"creator":{"vendor":"youtube","id":"UCqkEmdxsJ0xrv0zMxUjcpOA","photoUrl":"https://lh4.googleusercontent.com/-XjjjLP0qyAA/AAAAAAAAAAI/AAAAAAAAAB8/3fSV25tufI8/photo.jpg?sz=50","name":"Ciro Shetta"}},{"vendor":"youtube","id":"z13lwj4qsxjeudbzv04cc1qypuzacjqgpfs","message":"I love how you talk with your hands. Also, I really like your dress.﻿","rawTimestamp":"2014-03-23T18:50:57.000Z","timestamp":1395600657000,"creator":{"vendor":"youtube","id":"UCW9fbB9LOQL1Mrn4DhhhQHA","photoUrl":"https://lh5.googleusercontent.com/-saNhpUkMGdU/AAAAAAAAAAI/AAAAAAAAAo0/XY-ofy8NWUA/photo.jpg?sz=50","name":"Aradia Farmer"}},{"vendor":"youtube","id":"z13ucrjy5rbxxrqoc04cjz54llrtj30xzz40k","message":"Stop reading big checks.﻿","rawTimestamp":"2014-03-01T05:58:15.000Z","timestamp":1393653495000,"creator":{"vendor":"youtube","id":"UCDoEee7pCaCcn-lS1TuMhJA","photoUrl":"https://lh4.googleusercontent.com/-xVDwoZZZPSQ/AAAAAAAAAAI/AAAAAAAAAEY/bHWT6GeHK6I/photo.jpg?sz=50","name":"Adam Myers"}},{"vendor":"youtube","id":"z12zwxr53wyxebgms230itd5wmuyznnfl","message":"I want to send you Love Mail. You are amazing. Thank you for being awesome. \nI love you!!﻿","rawTimestamp":"2014-03-02T00:20:29.000Z","timestamp":1393719629000,"creator":{"vendor":"youtube","id":"UCDY6EGGs_nqaYRhf0jxAUoA","photoUrl":"https://lh6.googleusercontent.com/-5W0u3fxAPoU/AAAAAAAAAAI/AAAAAAAAAAA/GegMAesi1aM/photo.jpg?sz=50","name":"Jason Ballard"}},{"vendor":"youtube","id":"z13ivdxgpljtvptc523ithqqitrxf3lzd04","message":"1:54 '...even though the heavier elephants...' lol﻿","rawTimestamp":"2014-03-07T16:23:35.000Z","timestamp":1394209415000,"creator":{"vendor":"youtube","id":"UCqe3sl3F5hIVZyG62w1CYGQ","photoUrl":"https://lh5.googleusercontent.com/-mem_HiVf83s/AAAAAAAAAAI/AAAAAAAAADU/e23M_k9nTbI/photo.jpg?sz=50","name":"Khyral Rap"}},{"vendor":"youtube","id":"z12tut4yxr34epcjn04cdndgrtite3kx30g","message":"\"You've seen the movie Avatar, right?\"\n\nYes, unfortunately.﻿","rawTimestamp":"2014-03-01T21:57:08.000Z","timestamp":1393711028000,"creator":{"vendor":"youtube","id":"UC1tR4sUY5rb9yoIpcGWYPVw","photoUrl":"https://lh3.googleusercontent.com/-G_gEiy7Lbb0/AAAAAAAAAAI/AAAAAAAAABA/p-gpTcV8Bhs/photo.jpg?sz=50","name":"Firebert"}}],"actions":[{"type":"Share","target":"","enabled":true},{"type":"Like","target":"","enabled":true},{"type":"Comment","target":"","enabled":true}],"memento":"{\"publishedAt\":\"2014-02-26T20:00:04.000Z\",\"channelId\":\"UCvOTgnW7oj9ZWDd2y5TEApw\",\"title\":\"Artificial Organs, Marsupials That Mate Until They're Dead, and More!\",\"description\":\"This week on IFLS, learn about transplantation science, crazy sex-obsessed marsupials, and more! Lungs: http://bit.ly/1h2GnQD Electron: http://bit.ly/1k3Ms2v ...\",\"thumbnails\":{\"default\":{\"url\":\"https://i.ytimg.com/vi/hsvWyBSmr9o/default.jpg\",\"width\":120,\"height\":90},\"medium\":{\"url\":\"https://i.ytimg.com/vi/hsvWyBSmr9o/mqdefault.jpg\",\"width\":320,\"height\":180},\"high\":{\"url\":\"https://i.ytimg.com/vi/hsvWyBSmr9o/hqdefault.jpg\",\"width\":480,\"height\":360}},\"channelTitle\":\"IFLScience\",\"liveBroadcastContent\":\"none\"}","message":"Artificial Organs, Marsupials That Mate Until They're Dead, and More!","read":0,"timestamp":1458280428519,"link":"","generation":5,"identity":{"expiry":1458280580657,"avatar":"https://lh3.googleusercontent.com/-AqYAl9tu54k/AAAAAAAAAAI/AAAAAAAAAAA/S54-m5hejkE/photo.jpg","userId":"107094867568885284307","vendor":"youtube","lastname":"Maps","firstname":"John","oauthToken":"ya29.qQIUBUbZzciXbw6pjcuTFEvGrROyIcJbfa6pJ1ce34frhl9Vkz0RYfwFDTcquiCGbw","oauthSecret":"1/NFl2eFB93GXndTaXNOjk2WtbG11pdDKEDQw8JWXz9PsMEudVrK5jSpoR30zcRFq6","name":"John Maps"},"type":"video","creator":{"vendor":"youtube","id":"UCvOTgnW7oj9ZWDd2y5TEApw","photoUrl":"https://yt3.ggpht.com/-HqRJtCAWVm0/AAAAAAAAAAI/AAAAAAAAAAA/YNdPo-dhgak/s88-c-k-no/photo.jpg","name":"IFLScience"},"media":[{"height":-1,"srcUrl":"https://www.youtube.com/watch?v=hsvWyBSmr9o","width":-1,"imageUrl":"https://i.ytimg.com/vi/hsvWyBSmr9o/hqdefault.jpg","duration":-1,"type":"video","description":""}],"likeStatus":1,"rawTimestamp":"2014-02-26T20:00:04.000Z"};

			_aidPosterChild(expected, {});
			subject.on('error', aid.fail('Incorrectly failed to like a video.'));
			subject.on('postLiked', (driver, result) => {
				result.postId.should.equal('hsvWyBSmr9o');
				done();
			});

			subject.likePost(post);
		});

		it('should be able to unlike a video...', (done) => {
			let expected = [ '/youtube/v3/videos/rate', 'hsvWyBSmr9o', 'rating=none' ];
            let post = {"id":"hsvWyBSmr9o","comments":[{"vendor":"youtube","id":"z13pefezymf3s105y04cdfvwtrumfdzxwfg","message":"damn I missed IFL science on youtube﻿","rawTimestamp":"2014-03-01T14:47:03.000Z","timestamp":1393685223000,"creator":{"vendor":"youtube","id":"UCv6cYBowLu1VYESyIr34Vlw","photoUrl":"https://lh6.googleusercontent.com/-vajsx8DnqDE/AAAAAAAAAAI/AAAAAAAAAD4/OG80NJA0jX8/photo.jpg?sz=50","name":"Prasun Jajodia"}},{"vendor":"youtube","id":"z12depxr4tymcvoct22vivcbezzwd1fhe04","message":"I missed you, I thought this channel died﻿","rawTimestamp":"2014-04-01T07:06:51.000Z","timestamp":1396336011000,"creator":{"vendor":"youtube","id":"UCXYwxz5wCNy4Br2_LwWrVPQ","photoUrl":"https://lh4.googleusercontent.com/-aniCSso1OKM/AAAAAAAAAAI/AAAAAAAAALE/jVfX3g6PDm4/photo.jpg?sz=50","name":"Dublin Zombi"}},{"vendor":"youtube","id":"z12gdhsaxsyhgxwpq04cgzdi4mazsdaowk40k","message":"SPACE WEATHER!!﻿","rawTimestamp":"2014-03-01T23:58:08.000Z","timestamp":1393718288000,"creator":{"vendor":"youtube","id":"UCinvwm4Zv91AhO5DVAhU4fA","photoUrl":"https://lh3.googleusercontent.com/-x5D-9xVpZio/AAAAAAAAAAI/AAAAAAAAAvE/AbWDj4v6c2w/photo.jpg?sz=50","name":"Nicholas Bernard Callistus Borelli"}},{"vendor":"youtube","id":"z121i3dgnpjexdyjq04ce54j3ki3xvf54hk","message":"cute dress, would love to open it... hehe﻿","rawTimestamp":"2014-03-01T03:10:54.000Z","timestamp":1393643454000,"creator":{"vendor":"youtube","id":"UClRKrOPzrY-qmpUMrqQDCUQ","photoUrl":"https://lh3.googleusercontent.com/-Rg5RySS0jkM/AAAAAAAAAAI/AAAAAAAAAA8/9brVmwYVBcs/photo.jpg?sz=50","name":"Goth108"}},{"vendor":"youtube","id":"z12sifxwgkzjztnbe04cf1ualynicjkzw5k","message":"i watch a lot of BBC shows/her accent is about impossible on many of these \n'scientific' terms and new items of interest... i turned on the CC; OMG - \nit was worse than what i was hearing... what's the deal?﻿","rawTimestamp":"2014-03-01T15:36:17.000Z","timestamp":1393688177000,"creator":{"vendor":"youtube","id":"UCff1NFQrOTCgYNZfgZoVfQQ","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"willowspain"}},{"vendor":"youtube","id":"z13sdt5hmwf2fze0v224j53wpyu5vtbba04","message":"i love the show, hate this fat ugly stupid bitch.﻿","rawTimestamp":"2014-03-21T17:55:43.000Z","timestamp":1395424543000,"creator":{"vendor":"youtube","id":"UCIKfHBZGHGZW0Ft-R252ggA","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"tyson wojtowicz"}},{"vendor":"youtube","id":"z13hwnzzilaydhmjj04cchw51s2wzplxywo0k","message":"I find that perky elevator music in the background of IFLScience videos \ndistracting to the point of annoyance.﻿","rawTimestamp":"2014-03-01T16:40:36.000Z","timestamp":1393692036000,"creator":{"vendor":"youtube","id":"UCju7F95rBqstKjuCWUz1icA","photoUrl":"https://lh5.googleusercontent.com/-7TVyox3kOUo/AAAAAAAAAAI/AAAAAAAAAD0/lhstX28Yo38/photo.jpg?sz=50","name":"calineophyte"}},{"vendor":"youtube","id":"z12csxs4knepctt4n04ccf3q4wrqxbqxwsk0k","message":"Tried mating when I had a headache once; wouldn't do it again.﻿","rawTimestamp":"2014-04-04T19:20:28.000Z","timestamp":1396639228000,"creator":{"vendor":"youtube","id":"UCWOKt4NGE3icrHliVud51pQ","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"Dean Hallett"}},{"vendor":"youtube","id":"z12zuv2gxrqkt5a1n22rv5gqonbxyxek3","message":"Welcome back!﻿","rawTimestamp":"2014-03-09T05:35:37.000Z","timestamp":1394343337000,"creator":{"vendor":"youtube","id":"UCfg-5y30oxu-TGckYXwIrZQ","photoUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","name":"1moreastronaut"}},{"vendor":"youtube","id":"z12rzzngesbyxhwns22bt5hwhrrsw3uqz04","message":"I can't hold it in anymore. Is it just me, or does her intelligence just \nmake her so freaking attractive?﻿","rawTimestamp":"2014-03-03T20:09:42.000Z","timestamp":1393877382000,"creator":{"vendor":"youtube","id":"UCWWHM87iCOExxArlrkoW5nQ","photoUrl":"https://lh5.googleusercontent.com/-KvLa8uji5o4/AAAAAAAAAAI/AAAAAAAABMw/ZbkONvCdwrs/photo.jpg?sz=50","name":"Fasullo Daniel"}},{"vendor":"youtube","id":"z12xdxtjkn3mtlfd523ghxxbpzy1ixkdh","message":"YAAY!! Science :D﻿","rawTimestamp":"2014-03-01T12:20:40.000Z","timestamp":1393676440000,"creator":{"vendor":"youtube","id":"UCIO1NsEwJtN4uGCl4dVXTqA","photoUrl":"https://lh3.googleusercontent.com/-VojZQQffIEg/AAAAAAAAAAI/AAAAAAAAADQ/amgCbYBsXY8/photo.jpg?sz=50","name":"MagpieSparkles"}},{"vendor":"youtube","id":"z131i3hz3vixvbat422yd12r3lzffp4ry04","message":"","rawTimestamp":"2014-04-09T16:19:28.000Z","timestamp":1397060368000,"creator":{"vendor":"youtube","id":"UCa9j2PQdzyxT9nJi5UlpUcQ","photoUrl":"https://lh5.googleusercontent.com/-rfh_r55ixKw/AAAAAAAAAAI/AAAAAAAAcP4/3EBLwge_9jw/photo.jpg?sz=50","name":"arissa ikeda"}},{"vendor":"youtube","id":"z12iuvwzroq3yjthn04cdr14aznfypvaaco","message":"The background music is louder than your voice...﻿","rawTimestamp":"2014-03-01T13:00:13.000Z","timestamp":1393678813000,"creator":{"vendor":"youtube","id":"UC7a7BcUKNoxwbwdoPz9nXEw","photoUrl":"https://lh5.googleusercontent.com/-kWtlTfozDTM/AAAAAAAAAAI/AAAAAAAAA8M/UDZ_0EOKQ4s/photo.jpg?sz=50","name":"César Brie"}},{"vendor":"youtube","id":"z124uzp52rnbzdoej23litso4lybdjvl2","message":"She's kind of annoying to watch... if you watch just her hands. It makes it \nhard to keep your attention...﻿","rawTimestamp":"2014-04-03T12:13:11.000Z","timestamp":1396527191000,"creator":{"vendor":"youtube","id":"UCqkEmdxsJ0xrv0zMxUjcpOA","photoUrl":"https://lh4.googleusercontent.com/-XjjjLP0qyAA/AAAAAAAAAAI/AAAAAAAAAB8/3fSV25tufI8/photo.jpg?sz=50","name":"Ciro Shetta"}},{"vendor":"youtube","id":"z13lwj4qsxjeudbzv04cc1qypuzacjqgpfs","message":"I love how you talk with your hands. Also, I really like your dress.﻿","rawTimestamp":"2014-03-23T18:50:57.000Z","timestamp":1395600657000,"creator":{"vendor":"youtube","id":"UCW9fbB9LOQL1Mrn4DhhhQHA","photoUrl":"https://lh5.googleusercontent.com/-saNhpUkMGdU/AAAAAAAAAAI/AAAAAAAAAo0/XY-ofy8NWUA/photo.jpg?sz=50","name":"Aradia Farmer"}},{"vendor":"youtube","id":"z13ucrjy5rbxxrqoc04cjz54llrtj30xzz40k","message":"Stop reading big checks.﻿","rawTimestamp":"2014-03-01T05:58:15.000Z","timestamp":1393653495000,"creator":{"vendor":"youtube","id":"UCDoEee7pCaCcn-lS1TuMhJA","photoUrl":"https://lh4.googleusercontent.com/-xVDwoZZZPSQ/AAAAAAAAAAI/AAAAAAAAAEY/bHWT6GeHK6I/photo.jpg?sz=50","name":"Adam Myers"}},{"vendor":"youtube","id":"z12zwxr53wyxebgms230itd5wmuyznnfl","message":"I want to send you Love Mail. You are amazing. Thank you for being awesome. \nI love you!!﻿","rawTimestamp":"2014-03-02T00:20:29.000Z","timestamp":1393719629000,"creator":{"vendor":"youtube","id":"UCDY6EGGs_nqaYRhf0jxAUoA","photoUrl":"https://lh6.googleusercontent.com/-5W0u3fxAPoU/AAAAAAAAAAI/AAAAAAAAAAA/GegMAesi1aM/photo.jpg?sz=50","name":"Jason Ballard"}},{"vendor":"youtube","id":"z13ivdxgpljtvptc523ithqqitrxf3lzd04","message":"1:54 '...even though the heavier elephants...' lol﻿","rawTimestamp":"2014-03-07T16:23:35.000Z","timestamp":1394209415000,"creator":{"vendor":"youtube","id":"UCqe3sl3F5hIVZyG62w1CYGQ","photoUrl":"https://lh5.googleusercontent.com/-mem_HiVf83s/AAAAAAAAAAI/AAAAAAAAADU/e23M_k9nTbI/photo.jpg?sz=50","name":"Khyral Rap"}},{"vendor":"youtube","id":"z12tut4yxr34epcjn04cdndgrtite3kx30g","message":"\"You've seen the movie Avatar, right?\"\n\nYes, unfortunately.﻿","rawTimestamp":"2014-03-01T21:57:08.000Z","timestamp":1393711028000,"creator":{"vendor":"youtube","id":"UC1tR4sUY5rb9yoIpcGWYPVw","photoUrl":"https://lh3.googleusercontent.com/-G_gEiy7Lbb0/AAAAAAAAAAI/AAAAAAAAABA/p-gpTcV8Bhs/photo.jpg?sz=50","name":"Firebert"}}],"actions":[{"type":"Share","target":"","enabled":true},{"type":"Like","target":"","enabled":true},{"type":"Comment","target":"","enabled":true}],"memento":"{\"publishedAt\":\"2014-02-26T20:00:04.000Z\",\"channelId\":\"UCvOTgnW7oj9ZWDd2y5TEApw\",\"title\":\"Artificial Organs, Marsupials That Mate Until They're Dead, and More!\",\"description\":\"This week on IFLS, learn about transplantation science, crazy sex-obsessed marsupials, and more! Lungs: http://bit.ly/1h2GnQD Electron: http://bit.ly/1k3Ms2v ...\",\"thumbnails\":{\"default\":{\"url\":\"https://i.ytimg.com/vi/hsvWyBSmr9o/default.jpg\",\"width\":120,\"height\":90},\"medium\":{\"url\":\"https://i.ytimg.com/vi/hsvWyBSmr9o/mqdefault.jpg\",\"width\":320,\"height\":180},\"high\":{\"url\":\"https://i.ytimg.com/vi/hsvWyBSmr9o/hqdefault.jpg\",\"width\":480,\"height\":360}},\"channelTitle\":\"IFLScience\",\"liveBroadcastContent\":\"none\"}","message":"Artificial Organs, Marsupials That Mate Until They're Dead, and More!","read":0,"timestamp":1458280428519,"link":"","generation":5,"identity":{"expiry":1458280580657,"avatar":"https://lh3.googleusercontent.com/-AqYAl9tu54k/AAAAAAAAAAI/AAAAAAAAAAA/S54-m5hejkE/photo.jpg","userId":"107094867568885284307","vendor":"youtube","lastname":"Maps","firstname":"John","oauthToken":"ya29.qQIUBUbZzciXbw6pjcuTFEvGrROyIcJbfa6pJ1ce34frhl9Vkz0RYfwFDTcquiCGbw","oauthSecret":"1/NFl2eFB93GXndTaXNOjk2WtbG11pdDKEDQw8JWXz9PsMEudVrK5jSpoR30zcRFq6","name":"John Maps"},"type":"video","creator":{"vendor":"youtube","id":"UCvOTgnW7oj9ZWDd2y5TEApw","photoUrl":"https://yt3.ggpht.com/-HqRJtCAWVm0/AAAAAAAAAAI/AAAAAAAAAAA/YNdPo-dhgak/s88-c-k-no/photo.jpg","name":"IFLScience"},"media":[{"height":-1,"srcUrl":"https://www.youtube.com/watch?v=hsvWyBSmr9o","width":-1,"imageUrl":"https://i.ytimg.com/vi/hsvWyBSmr9o/hqdefault.jpg","duration":-1,"type":"video","description":""}],"likeStatus":1,"rawTimestamp":"2014-02-26T20:00:04.000Z"};

            _aidPosterChild(expected, {});
			subject.on('error', aid.fail('Incorrectly failed to unlike a video.'));
			subject.on('postUnliked', (driver, result) => {
				result.postId.should.equal('hsvWyBSmr9o');
				done();
			});

			subject.unlikePost(post);
		});

	});

	describe('#loadPosts', function() {

		// reusable test data values
		let respSubscriptions = {"items":[{"snippet":{"thumbnails":{"default":{"url":"https://yt3.ggpht.com/-bonZt347bMc/AAAAAAAAAAI/AAAAAAAAAAA/lR8QEKnqqHk/s88-c-k-no/photo.jpg"},"high":{"url":"https://yt3.ggpht.com/-bonZt347bMc/AAAAAAAAAAI/AAAAAAAAAAA/lR8QEKnqqHk/s240-c-k-no/photo.jpg"}},"title":"TED","resourceId":{"kind":"youtube#channel","channelId":"UCAuUUnT6oDeKwE6v1NGQxug"},"channelId":"UCkIC7zYq5suqM8HQyFR58Lg","publishedAt":"2015-10-19T09:22:59.000Z","description":"http://www.ted.com TEDTalks shares the best ideas from the TED Conference with the world, for free: trusted voices and convention-breaking mavericks, icons and geniuses, all giving the talk of their lives in 18 minutes. We post a fresh TEDTalk every weekday. TEDTalks are licensed under Creative Commons, so you're welcome to link to or embed these videos, forward them to others and share these ideas with the people you know. To join the conversation, comment here or join our online community at TED.com. Any questions? Email contact@ted.com."},"kind":"youtube#subscription","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/Xx13O5hxYXM7_YUYBVqitnA_KWs\"","id":"p6SA54SQp7du2revg_EkMhHZ-G8cmvvoEbsuhQ-fFHo"}],"kind":"youtube#subscriptionListResponse","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/jKoMXuvvtJBkE00WIfgg5jApiTM\"","pageInfo":{"resultsPerPage":5,"totalResults":2}};
			
		it('should correctly call the API and parse video Post...', (done) => {

			let respOAuth = { "access_token": "123" };
			let respVideos = {"nextPageToken":"CB4QAA","items":[{"snippet":{"thumbnails":{"default":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/default.jpg"},"high":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/hqdefault.jpg"},"medium":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/mqdefault.jpg"}},"title":"Alzheimer’s Is Not Normal Aging — And We Can Cure It | Samuel Cohen | TED Talks","channelId":"UCAuUUnT6oDeKwE6v1NGQxug","publishedAt":"2015-10-16T16:19:43.000Z","liveBroadcastContent":"none","channelTitle":"TEDtalksDirector","description":"More than 40 million people worldwide suffer from Alzheimer's disease, and that number is expected to increase drastically in the coming years. But no real ..."},"kind":"youtube#searchResult","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/MQjcir8SmKXPG6O9rPI7knNnt0k\"","id":{"kind":"youtube#video","videoId":"tkIg-SxPzTA"}}],"kind":"youtube#searchListResponse","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/KZSHERC750ZnoTHj_fwwadmx6Tg\"","pageInfo":{"resultsPerPage":30,"totalResults":2121}};
			let urlOAuth = '/oauth2/v3/token';
			let urlSubscriptions = [ 'mine=true', 'part=id,snippet', '/youtube/v3/subscriptions' ];
			let urlVideos = [ 'channelId=UCAuUUnT6oDeKwE6v1NGQxug', 'maxResults=30', 'order=date', 'part=id,snippet', '/youtube/v3/search' ];

			subject.http.multiCheckHttpRequest([ urlOAuth, urlSubscriptions, urlVideos, '' ], [ respOAuth, respSubscriptions, respVideos, { items: [] } ], _generateSuccessHeaderArray(5));

			subject.on('postLoaded', (driver, post) => {
				post.creator.name.should.equal('TED');
				post.creator.id.should.equal('UCAuUUnT6oDeKwE6v1NGQxug');
				post.creator.photoUrl.should.equal('https://yt3.ggpht.com/-bonZt347bMc/AAAAAAAAAAI/AAAAAAAAAAA/lR8QEKnqqHk/s88-c-k-no/photo.jpg');
				post.media.length.should.equal(1);
				post.media[0].imageUrl.should.equal('https://i.ytimg.com/vi/tkIg-SxPzTA/hqdefault.jpg');
				post.media[0].srcUrl.should.equal('https://www.youtube.com/watch?v=tkIg-SxPzTA');
				post.message.should.equal('Alzheimer’s Is Not Normal Aging — And We Can Cure It | Samuel Cohen | TED Talks');
				post.rawTimestamp.should.equal('2015-10-16T16:19:43.000Z');
				post.timestamp.should.equal(1445012383000);
				post.type.should.equal('video');

				aid.testBasicActions(post.actions);
				done();
			});

			subject.on('error', aid.fail('Incorrectly failed to parse post data.'));

			subject.loadPosts();
		});

		it('should recognise that pageComplete has already been issued...', (done) => {

			let postCounter = 0;
			let pageCounter = 0;

			let respOAuth = { "access_token": "123" };
			let respVideos = {"nextPageToken":"CB4QAA","items":[{"snippet":{"thumbnails":{"default":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/default.jpg"},"high":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/hqdefault.jpg"},"medium":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/mqdefault.jpg"}},"title":"Alzheimer’s Is Not Normal Aging — And We Can Cure It | Samuel Cohen | TED Talks","channelId":"UCAuUUnT6oDeKwE6v1NGQxug","publishedAt":"2015-10-16T16:19:43.000Z","liveBroadcastContent":"none","channelTitle":"TEDtalksDirector","description":"More than 40 million people worldwide suffer from Alzheimer's disease, and that number is expected to increase drastically in the coming years. But no real ..."},"kind":"youtube#searchResult","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/MQjcir8SmKXPG6O9rPI7knNnt0k\"","id":{"kind":"youtube#video","videoId":"tkIg-SxPzTA"}}],"kind":"youtube#searchListResponse","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/KZSHERC750ZnoTHj_fwwadmx6Tg\"","pageInfo":{"resultsPerPage":30,"totalResults":2121}};
			let urlOAuth = '/oauth2/v3/token';
			let urlSubscriptions = [ 'mine=true', 'part=id,snippet', '/youtube/v3/subscriptions' ];
			let urlVideos = [ 'channelId=UCAuUUnT6oDeKwE6v1NGQxug', 'maxResults=30', 'order=date', 'part=id,snippet', '/youtube/v3/search' ];
			
			subject.http.multiCheckHttpRequest([ urlOAuth, urlSubscriptions, urlVideos, '' ], [ respOAuth, respSubscriptions, respVideos, { items: [] } ], _generateSuccessHeaderArray(5));

			subject.on('postLoaded', () => postCounter++);
			subject.on('pageComplete', () => {
				if (pageCounter++) {
					postCounter.should.equal(1);
					done();
				} else {
					subject.loadPosts();
				}
			});

			subject.loadPosts();
		});

		it('should correctly handle subscriptionless accounts...', (done) => {

			let respOAuth = { "access_token": "123" };
			let respNoSub = { "kind":"youtube#subscriptionListResponse","etag":"\"5g01s4-wS2b4VpScndqCYc5Y-8k/FqxoewrbGqQzAlCk2f0ia01WopM\"","pageInfo":{"totalResults":0,"resultsPerPage":5},"items":[] };
			let urlOAuth = '/oauth2/v3/token';
			let urlSubscriptions = [ 'mine=true', 'part=id,snippet', '/youtube/v3/subscriptions' ];
			
			subject.http.multiCheckHttpRequest([ urlOAuth, urlSubscriptions ], [ respOAuth, respNoSub ], _generateSuccessHeaderArray());
			subject.on('error', aid.fail('Incorrectly reported a lack of subscriptions as an error.'));

			subject.on('postLoaded', (driver, post) => {
				aid.fail('Loaded a post when there are no subscriptions to provide any!')
			});

			subject.on('pageComplete', () => {
				done();
			});

			subject.loadPosts();
		});

		it('should be able to correctly parse a token refresh error...', (done) => {

			let respOAuth = { "error": { "error": "Gone dun broke da thing" } };
			
			subject.http.setupForError(respOAuth);

			let hasError = false;
			let hasComplete = false;
			let isSuccess = () => {
				if (hasError && hasComplete) {
					done();
				}
			}

			subject.on('error', () => {
				hasError = true;
				isSuccess();
			});

			subject.on('pageComplete', () => {
				hasComplete = true;
				isSuccess();
			});

			subject.loadPosts();
		});

		it('should be able to correctly parse an internal YouTube error...', (done) => {

			let respOAuth = { "access_token": "123" };
			let error = {"error":{"code":401,"message":"Invalid Credentials","errors":[{"locationType":"header","domain":"global","message":"Invalid Credentials","reason":"authError","location":"Authorization"}]}};
			
			subject.http.multiCheckHttpRequest([ '', '' ], [ respOAuth, error], _generateSuccessHeaderArray(3));

			let hasError = false;
			let hasComplete = false;
			let isSuccess = () => {
				if (hasError && hasComplete) {
					done();
				}
			}

			subject.on('error', () => {
				hasError = true;
				isSuccess();
			});

			subject.on('pageComplete', () => {
				hasComplete = true;
				isSuccess();
			});

			subject.loadPosts();
		});

		it('should load comments for the post after the post...', (done) => {

			let commentUrl = [ 'order=time', 'part=snippet', 'videoId=tkIg-SxPzTA', 'youtube/v3/commentThreads?' ];
			let commentResp = {"items":[{"snippet":{"isPublic":true,"channelId":"UC3XTzVzaHQEd30rQbuvCtTQ","videoId":"_tyszHg96KI","canReply":true,"totalReplyCount":0,"topLevelComment":{"snippet":{"authorChannelUrl":"http://www.youtube.com/channel/UCciy7NbRtEPUM6X2VjH4R1A","authorDisplayName":"Zaking Gaming","channelId":"UC3XTzVzaHQEd30rQbuvCtTQ","videoId":"_tyszHg96KI","publishedAt":"2015-11-25T06:51:24.063Z","viewerRating":"none","authorChannelId":{"value":"UCciy7NbRtEPUM6X2VjH4R1A"},"canRate":true,"likeCount":0,"updatedAt":"2015-11-25T06:51:24.063Z","authorProfileImageUrl":"https://lh5.googleusercontent.com/-K_Dm0r9N65E/AAAAAAAAAAI/AAAAAAAAACw/WJHXY04ZFcw/photo.jpg?sz=50","authorGoogleplusProfileUrl":"https://plus.google.com/107491410562575421388","textDisplay":"Scared of the moon and wiped their a**es on rocks? Im not sure thats historically accurate...."},"kind":"youtube#comment","etag":"\"mPrpS7Nrk6Ggi_P7VJ8-KsEOiIw/mST763CjbCZFCSZi7Ete4TyDy5Y\"","id":"z13cxdv5qkmgtzytf22it1ijrzmncnbko"}},"kind":"youtube#commentThread","etag":"\"mPrpS7Nrk6Ggi_P7VJ8-KsEOiIw/KoR9Fs4GbzU13GFBcjf43pN1eRc\"","id":"z13cxdv5qkmgtzytf22it1ijrzmncnbko"}],"kind":"youtube#commentThreadListResponse","etag":"\"mPrpS7Nrk6Ggi_P7VJ8-KsEOiIw/A0n88fEmOWCZn7aYEDK-I7ijulM\"","pageInfo":{"resultsPerPage":20,"totalResults":20}};
			let respOAuth = { "access_token": "123" };
			let respVideos = {"nextPageToken":"CB4QAA","items":[{"snippet":{"thumbnails":{"default":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/default.jpg"},"high":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/hqdefault.jpg"},"medium":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/mqdefault.jpg"}},"title":"Alzheimer’s Is Not Normal Aging — And We Can Cure It | Samuel Cohen | TED Talks","channelId":"UCAuUUnT6oDeKwE6v1NGQxug","publishedAt":"2015-10-16T16:19:43.000Z","liveBroadcastContent":"none","channelTitle":"TEDtalksDirector","description":"More than 40 million people worldwide suffer from Alzheimer's disease, and that number is expected to increase drastically in the coming years. But no real ..."},"kind":"youtube#searchResult","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/MQjcir8SmKXPG6O9rPI7knNnt0k\"","id":{"kind":"youtube#video","videoId":"tkIg-SxPzTA"}}],"kind":"youtube#searchListResponse","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/KZSHERC750ZnoTHj_fwwadmx6Tg\"","pageInfo":{"resultsPerPage":30,"totalResults":2121}};
		
			subject.http.multiCheckHttpRequest([ '', '', '', commentUrl ], [ respOAuth, respSubscriptions, respVideos, commentResp ], _generateSuccessHeaderArray(5));
			subject.on('postUpdated', (driver, postUpdate) => {
				postUpdate.comments.length.should.equal(1);
				postUpdate.comments[0].creator.id.should.equal('UCciy7NbRtEPUM6X2VjH4R1A');
				postUpdate.comments[0].creator.name.should.equal('Zaking Gaming');
				postUpdate.comments[0].creator.photoUrl.should.equal('https://lh5.googleusercontent.com/-K_Dm0r9N65E/AAAAAAAAAAI/AAAAAAAAACw/WJHXY04ZFcw/photo.jpg?sz=50');
				postUpdate.comments[0].id.should.equal('z13cxdv5qkmgtzytf22it1ijrzmncnbko');
				postUpdate.comments[0].message.should.equal('Scared of the moon and wiped their a**es on rocks? Im not sure thats historically accurate....');
				postUpdate.comments[0].rawTimestamp.should.equal('2015-11-25T06:51:24.063Z');
				postUpdate.comments[0].timestamp.should.equal(1448434284000);
				postUpdate.identity.userId.should.equal('12345');
				postUpdate.identity.vendor.should.equal('youtube');
				postUpdate.id.should.equal('tkIg-SxPzTA');

				done();
			});

			subject.on('postFailed',()=>{
				done();
			});

			subject.loadPosts();
		});

		it('should load comments for the post after the post (type II)...', (done) => {

			let commentUrl = [ 'order=time', 'part=snippet', 'videoId=tkIg-SxPzTA', 'youtube/v3/commentThreads?' ];
			let commentResp = {"items":[{"kind":"youtube#commentThread","etag":"\"3WIcRE7IJ70nCYemJJIi1L7dYAg/cey0TaZulk6dwULb2AkOf5HfFa4\"","id":"z12mvnhzeti3yvb1d232vbyqblethjhlb","snippet":{"channelId":"UCvOTgnW7oj9ZWDd2y5TEApw","videoId":"ZUYgbCAsDgo","topLevelComment":{"kind":"youtube#comment","etag":"\"3WIcRE7IJ70nCYemJJIi1L7dYAg/HT5hHjtBMfehoNfvOUqRBCwsi0M\"","id":"z12mvnhzeti3yvb1d232vbyqblethjhlb","snippet":{"channelId":"UCvOTgnW7oj9ZWDd2y5TEApw","videoId":"ZUYgbCAsDgo","textDisplay":"The funny thing is that they blocked me from their facebook page because I explain the fallacy of the vaccination argument. ﻿","authorDisplayName":"Gregory Ross","authorProfileImageUrl":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50","authorChannelUrl":"https://plus.google.com/107956003427823983682","authorGoogleplusProfileUrl":"https://plus.google.com/107956003427823983682","canRate":true,"viewerRating":"none","likeCount":0,"publishedAt":"2014-11-16T15:06:57.427Z","updatedAt":"2014-11-16T15:06:57.427Z"}},"canReply":true,"totalReplyCount":0,"isPublic":true}}]};
			let respOAuth = { "access_token": "123" };
			let respVideos = {"nextPageToken":"CB4QAA","items":[{"snippet":{"thumbnails":{"default":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/default.jpg"},"high":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/hqdefault.jpg"},"medium":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/mqdefault.jpg"}},"title":"Alzheimer’s Is Not Normal Aging — And We Can Cure It | Samuel Cohen | TED Talks","channelId":"UCAuUUnT6oDeKwE6v1NGQxug","publishedAt":"2015-10-16T16:19:43.000Z","liveBroadcastContent":"none","channelTitle":"TEDtalksDirector","description":"More than 40 million people worldwide suffer from Alzheimer's disease, and that number is expected to increase drastically in the coming years. But no real ..."},"kind":"youtube#searchResult","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/MQjcir8SmKXPG6O9rPI7knNnt0k\"","id":{"kind":"youtube#video","videoId":"tkIg-SxPzTA"}}],"kind":"youtube#searchListResponse","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/KZSHERC750ZnoTHj_fwwadmx6Tg\"","pageInfo":{"resultsPerPage":30,"totalResults":2121}};
		
			subject.http.multiCheckHttpRequest([ '', '', '', commentUrl ], [ respOAuth, respSubscriptions, respVideos, commentResp ], _generateSuccessHeaderArray(5));
			subject.on('postUpdated', (driver, postUpdate) => {
				postUpdate.comments.length.should.equal(1);
				postUpdate.comments[0].creator.id.should.equal('UCvOTgnW7oj9ZWDd2y5TEApw');
				postUpdate.comments[0].creator.name.should.equal('Gregory Ross');
				postUpdate.comments[0].id.should.equal('z12mvnhzeti3yvb1d232vbyqblethjhlb');

				done();
			});

			subject.loadPosts();
		});

		it('Should not allow commenting action if comments are disabled', (done) => {

      		let commentUrl = [ 'order=time', 'part=snippet', 'videoId=tkIg-SxPzTA', 'youtube/v3/commentThreads?' ];
      		let commentResp = {"error":{"errors":[{"domain":"youtube.commentThread","reason":"commentsDisabled","message":"The video identified by the <code><a href=\"/youtube/v3/docs/commentThreads/list#videoId\">videoId</a></code> parameter has disabled comments.","locationType":"parameter","location":"videoId"}],"code":403,"message":"The video identified by the <code><a href=\"/youtube/v3/docs/commentThreads/list#videoId\">videoId</a></code> parameter has disabled comments."}}
      		let respOAuth = { "access_token": "123" };
      		let respVideos = {"nextPageToken":"CB4QAA","items":[{"snippet":{"thumbnails":{"default":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/default.jpg"},"high":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/hqdefault.jpg"},"medium":{"url":"https://i.ytimg.com/vi/tkIg-SxPzTA/mqdefault.jpg"}},"title":"Alzheimer’s Is Not Normal Aging — And We Can Cure It | Samuel Cohen | TED Talks","channelId":"UCAuUUnT6oDeKwE6v1NGQxug","publishedAt":"2015-10-16T16:19:43.000Z","liveBroadcastContent":"none","channelTitle":"TEDtalksDirector","description":"More than 40 million people worldwide suffer from Alzheimer's disease, and that number is expected to increase drastically in the coming years. But no real ..."},"kind":"youtube#searchResult","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/MQjcir8SmKXPG6O9rPI7knNnt0k\"","id":{"kind":"youtube#video","videoId":"tkIg-SxPzTA"}}],"kind":"youtube#searchListResponse","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/KZSHERC750ZnoTHj_fwwadmx6Tg\"","pageInfo":{"resultsPerPage":30,"totalResults":2121}};

      		let successHeaders = _generateSuccessHeaderArray(3);
      		successHeaders.push(commentResp);

      		subject.http.multiCheckHttpRequest([ '', '', '', commentUrl ], [ respOAuth, respSubscriptions, respVideos, commentResp ], successHeaders);
      		subject.on('postUpdated', (driver, postUpdate) => {
        		aid.testTwoActions(postUpdate.actions, [ 'Like', 'Share' ]); // make sure that the comment action is disabled
        		done();
      		});

	     	subject.loadPosts();
	    });

	});

	describe('#sendPost', function() {

		let media = new Media({ base64Data: 'ABCD', type: 'video' });
		let post = new Post({ id: 'foo', identity: identity, media: [ media ], message: 'FIR THE TREES!' });

		media.videoBase64Data = 'ABCD';

		beforeEach(() => post.type = 'video');

		it('upload video to youtube...', (done) => {
			let urlOAuth = '/oauth2/v3/token';
			let respOAuth = { "access_token": "123" };
			let resumeUrl = '/upload/youtube/v3/videos?part=status,snippet&uploadType=resumable&upload_id=AEnB2UpfEf8SmnogtLcx-t-n80C9ajRQNLO1CgfUCpvTrHvwNbyoWjNuGyZTBr3wC6DXBD47vhWfsXX6sDj4WlCE--D0Ijj1_A';
			let firstExpected = [ 'part=status,snippet', '/upload/youtube/v3/videos', 'uploadType=resumable' ];
			let successResponse = {"snippet":{"thumbnails":{"default":{"url":"https://i.ytimg.com/vi/G4XWU0Cus2U/default.jpg","width":120,"height":90},"high":{"url":"https://i.ytimg.com/vi/G4XWU0Cus2U/hqdefault.jpg","width":480,"height":360},"medium":{"url":"https://i.ytimg.com/vi/G4XWU0Cus2U/mqdefault.jpg","width":320,"height":180}},"title":"FIR THE TREES!","localized":{"description":"","title":"FIR THE TREES!"},"channelId":"UCkIC7zYq5suqM8HQyFR58Lg","publishedAt":"2015-10-21T06:31:47.000Z","liveBroadcastContent":"none","channelTitle":"skooter Workin","categoryId":"22","tags":["socialstream","Social Stream"],"description":""},"status":{"publicStatsViewable":true,"privacyStatus":"public","uploadStatus":"uploaded","license":"youtube","embeddable":true},"kind":"youtube#video","etag":"\"fpJ9onbY0Rl_LqYLG6rOCJ9h9N8/Jrb37us-rbBmGyk9Vcf8GLPVcvo\"","id":"G4XWU0Cus2U"};
			let firstHeader = {"status":{"code":200}, "location": "https://www.googleapis.com/upload/youtube/v3/videos?part=status,snippet&uploadType=resumable&upload_id=AEnB2UpfEf8SmnogtLcx-t-n80C9ajRQNLO1CgfUCpvTrHvwNbyoWjNuGyZTBr3wC6DXBD47vhWfsXX6sDj4WlCE--D0Ijj1_A"};
			let resumeHeader = {"status":{"code":308,"reason":"redirected"},"alt-svc":"quic=\":443\"; ma=604800; v=\"30,29,28,27,26,25\"","x-range-md5":"c58c828e02d69598c3ee3361da47eefb","Range":"bytes=0-102399","Server":"UploadServer","Content-Type":"text/html; charset=UTF-8","Content-Length":"0","x-guploader-uploadid":"AEnB2UrGbsGOtQc-RI0uJGh-QtR51Zw15qtBaNtmhlQQbBCmxsH9UHvZupBhza_WeAvZfuImy84aupVjpusie9IqQagCk8vQzA","Date":"Thu, 03 Dec 2015 02:57:04 GMT","alternate-protocol":"443:quic,p=1"};
			let successHeader = {"status":{"code":200,"reason":"no error"},"Cache-Control":"no-cache, no-store, max-age=0, must-revalidate","Pragma":"no-cache","x-goog-correlation-id":"2un__StOjho","Etag":"\"_rQsnFL0n3xM37VznkSq3DdQMwY/vqiEcw1ljuALlBDuAdZ6EG94A7s\"","Vary":"Origin, X-Origin","alt-svc":"quic=\":443\"; ma=604800; v=\"30,29,28,27,26,25\"","Content-Type":"application/json; charset=UTF-8","Expires":"Fri, 01 Jan 1990 00:00:00 GMT","Server":"UploadServer","alternate-protocol":"443:quic,p=1","Content-Length":"1054","Date":"Thu, 03 Dec 2015 02:57:06 GMT","x-guploader-uploadid":"AEnB2UrGbsGOtQc-RI0uJGh-QtR51Zw15qtBaNtmhlQQbBCmxsH9UHvZupBhza_WeAvZfuImy84aupVjpusie9IqQagCk8vQzA"};
			let tests =  (request, options) => {
				if (request === 0) {
					let jBody = JSON.parse(options.body);

					jBody.snippet.channelId.should.equal('12345');
					jBody.snippet.description.should.equal('Uploaded using Social Stream.\nhttp://mysocialstream.com/find-out-more');
					jBody.snippet.tags.should.include('socialstream');
					jBody.snippet.tags.should.include('Social Stream');
					jBody.snippet.title.should.equal('FIR THE TREES!');
					jBody.status.embeddable.should.equal(true);
					options.method.should.equal('POST');
				} else {
					options.method.should.equal('PUT');
				}
			};

			subject.http.multiCheckHttpRequest([ urlOAuth, firstExpected, resumeUrl, resumeUrl ], [ respOAuth, '', '', successResponse ], [ successHeader, firstHeader, resumeHeader, successHeader, successHeader ], tests);
			subject.on('postSent', (driver, result) => {
				result.postId.should.equal('G4XWU0Cus2U');
				done();
			});

			subject.sendPost(post, (medium, mimeType, callback) => callback(media));
		});

		it('should not be able to upload ad...', (done) => _illegalSendPost(post, 'offer', done));

		it('should not be able to upload hyperlink...', (done) => _illegalSendPost(post, 'link', done));

		it('should not be able to upload photo...', (done) => _illegalSendPost(post, 'photo', done));

		it('should not be able to upload status update...', (done) => _illegalSendPost(post, 'status', done));

		it('should be able to handle internal YouTube errors...', (done) => {
			let error = {"error":{"code":401,"message":"Invalid Credentials","errors":[{"locationType":"header","domain":"global","message":"Invalid Credentials","reason":"authError","location":"Authorization"}]}};
			
			subject.http.setupForError(error);
			subject.on('error', () => done());
			subject.on('postSent', aid.fail('Incorrectly succeeded in uploading a video.'));

			subject.sendPost(post, (media, callback) => callback(media));
		});

		it('should be able to handle network errors...', (done) => {
			let headers = { status: { code: 404, reason: 'Cloak of Invisibility' }};
			_aidPosterChild([ 'part=status,snippet', '/upload/youtube/v3/videos', 'uploadType=resumable' ], true, [ headers, headers, headers ]);

			subject.on('error', () => done());
			subject.on('postSent', aid.fail('Incorrectly succeeded at failing wrong.'))

			subject.sendPost(post, (media, callback) => callback(media));
		});

	});

});
