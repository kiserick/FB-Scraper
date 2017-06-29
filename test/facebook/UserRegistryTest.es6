import {Environment} from '../env/testEnv.es6';
import {TestAid, DummyHandlerFactory} from '../env/testAid.es6';
import {User} from '../../src/data/user.es6';
import {UserRegistry} from '../../src/facebook/UserRegistry.es6';

let aid = new TestAid();
let chai = require('chai');
let DomHandler = require('domhandler');
let env = new Environment();
let subject = {};

chai.should();

let setup = (scraped) => (subject = new UserRegistry(new DummyHandlerFactory(scraped), env.http));

describe('Facebook UserRegistry tests:', function() {

	beforeEach(() => env.http.setupForSuccess('<html></html>'));

	let successData = new User({
		id: '123_432',
		name: 'Hayley (from the Jezabels)',
		photoUrl: 'https://scontent.fper1-1.fna.fbcdn.net/hprofile-xaf1/v/t1.0-1/cp0/e15/q65/c0.14.130.130/p130x130/25197_403386690742_3766018_n.jpg?efg=eyJpIjoiYiJ9&oh=805e832b39c500dd1edf43f56f559238&oe=5734A7DD',
		vendor: 'facebook'
	});

	it('Failure case should return an empty User', function(done) {

		setup({});

		env.http.setupForError({ message: 'What. A. Failure' });
		subject.requestUser('/imamnotarealuser.php?tokenstupidly.php/rediculousfknfacebookfaceheadstring', (user) => {
			user.id.should.equal('');
			user.name.should.equal('');
			user.photoUrl.should.equal('');
			user.vendor.should.equal('facebook');

			done();
		});
	});

	it('Test HTTP request properties...', function() {
		let path = '/noveltypath.jks';

		env.http.checkHttpRequest('m.facebook.com', path, (options) => {
			options.method.should.equal('GET');
			options.headers.cookie.should.equal('bananaman!');
		});
		setup({ user: successData });
		subject.cookie = 'bananaman!'

		subject.requestUser(path, () => {});
	});

	it('Basic success case should create a fully-sick bro User...', function(done) {

		setup({ user: successData });
		subject.requestUser('imamnotarealusereither.php?justsayingbro', (user) => {
			aid.validate(successData, user);
			done();
		});
	});

	it('Second successful call should not use a scraper...', function(done) {
		let request = '/cantbebotheredthinkingofwittyurl.fb';
		subject = new UserRegistry(new FailSecondTimeHandlerFactory({ user: successData }), env.http);
		subject.requestUser(request, (user) => aid.validate(successData, user));
		subject.requestUser(request, (user) => {
			aid.validate(successData, user);
			done();
		});
	});

	it('Second call before first has finished resolving should call both callbacks...', function(done) {
		let callbacks = 0;
		let rCallbacks = (user) => {
			aid.validate(successData, user);
			if (++callbacks === 2) {
				done();
			}
		};
		let request = '/wittieststupidlylongstringonthispage.barnone';
		let bloodyFancyFactory = new SucceedSecondTimeHandlerFactory({ user: successData });

		subject = new UserRegistry(bloodyFancyFactory, env.http);
		subject.requestUser(request, rCallbacks);
		subject.requestUser(request, rCallbacks);
		bloodyFancyFactory.executeCallback();
	});

});

describe('Facebook UserRegistry edge cases:', function() {

	beforeEach(() => env.http.setupForSuccess('<html></html>', { status: { code: 200 }}));

	it('Two different users should return two differents Users...', function(done) {
		let firstUser = { id: '123', name: '123' };
		let firstUrl = '/first.jk.bugger';
		let secondUser = { id: '321', name: '321' };
		let secondUrl = '/srcond.bugger.just.bugger';

		setup([ { user: firstUser }, { user: secondUser } ]);

		subject.requestUser(firstUrl, (user) => {
			aid.validate(firstUser, user)
		});
		subject.requestUser(secondUrl, (user) => {
			aid.validate(secondUser, user);
			done();
		});
	});

	it('profile.php? URLs should be treated correctly...', function(done) {
		let firstUser = { id: '123', name: '123' };
		let firstUrl = '/profile.php?id=100009834785112&refid=18';
		let secondUser = { id: '321', name: '321' };
		let secondUrl = '/profile.php?id=100004768265160&rc=p&_ft_=qid.6264379848356304461%3Amf_story_key.869605278376294982';

		setup([ { user: firstUser }, { user: secondUser } ]);

		subject.requestUser(firstUrl, (user) => {
			aid.validate(firstUser, user)
		});
		subject.requestUser(secondUrl, (user) => {
			aid.validate(secondUser, user);
			done();
		});
	});

});

describe('Facebook UserRegistry cached requests:', function() {
  
  let path = '/test.user'
  let loadedUser = new User({id: 'TEST'})
  beforeEach(() => setup({user: loadedUser}) )
  
  it('obtain cached immediately user', function() {
    // Load the user first
    subject.requestUser(path + '?cached=false', (user) => {
    })
    
    // Request cached user (query string different to request)
    let isUserLoaded = 'Cached user should be available'
    subject.requestCachedUser(path + '/?cached=true', (user) => {
      aid.validate(loadedUser, user)
      isUserLoaded = true
    })
    isUserLoaded.should.equal(true)
  })

  it('obtain cached user at later time when requested', function() {
    // Attempt to obtain cached user before loaded
    let isUserLoaded = 'Cached user should be available'
    subject.requestCachedUser(path + '?cached=true', (user) => {
      aid.validate(loadedUser, user)
      isUserLoaded = true
    })
    
    // Load the user after cache request
    subject.requestUser(path + '?cached=false', (user) => {
    })

    // Cached user should be loaded
    isUserLoaded.should.equal(true)
  })

  it('cached user not available', function() {
    let isUserLoaded = false
    subject.requestCachedUser(path, (user) => {
      isUserLoaded = true
    })
    isUserLoaded.should.equal(false)
  })
  
})


// Custom HtmlHandlerFactory that will cause a test failure on the second call.
class FailSecondTimeHandlerFactory {

	constructor(result) {
		this.count = 0;
		this.result = result;
	}

	create(host, path, descriptor, callback) {
		if (this.count++ === 1) {
			aid.fail('Incorrect attempt to scrape resolved User');
		} else {
			return new DomHandler((error, data) => callback(error, this.result));
		}
	}
}

// Custom HtmlHandlerFactory that will only issue a callback on the second call.
class SucceedSecondTimeHandlerFactory {
	constructor(result) {
		this.result = result;
	}

	create(host, path, descriptor, callback) {
		return new DomHandler((error, data) => {
			this.callback = callback;
		});
	}

	executeCallback() {
		this.callback(this.error, this.result);
	}

}