import {Environment} from './env/testEnv';
import {Identity} from '../src/data/identity';
import {NetworkDriver} from '../src/NetworkDriver.es6';
import {Origin} from '../src/data/origin.es6';
import {Post} from '../src/data/post.es6';

let chai = require('chai');
chai.should();

let subject = null;

describe("NetworkDriver superclass tests", function() {

	beforeEach(() => {
		subject = new NetworkDriver();
		subject.http = new Environment().http;
		subject.identity = new Identity({ vendor: 'The Gigaweb' });
	});

	describe('#error handling', function() {

		it('should broadcast string errors...', function(done) {

			subject.on('error', (driver, error) => {
				error.message.should.equal('well that\'s fucked!');
				error.origin.codeBlock = 'error test';
				error.origin.domain = 'NetworkDriverTest';
				error.origin.publicCodeBlock = 'it';
				error.origin.vendor = 'The Gigaweb';
				
				done();
			});

			subject.broadcastError('well that\'s fucked!', new Origin('error test', 'NetworkDriverTest', 'it'));
		});
	});

	describe('#resolveMessageLinks', function() {

		describe('#handle HTTP results', function() {
			
			let response = '<html><head><title>My New Website</title></head><body></body></html>';
			let post = new Post({ id:'1', link: 'https://www.theinternet.net/home.php', message: 'Default message', type: 'link' });
			let headers = (value) => {
				return {"headers":{"Content-Encoding":"gzip","X-UA-Compatible":"IE=edge,chrome=1","Last-Modified":"Tue, 19 Jan 2016 05:45:56 GMT","Server":"Apache/2.4.7 (Ubuntu)","Link":"</node/14115>; rel=\"shortlink\",</skyworks>; rel=\"canonical\"","Cache-Control":"public, max-age=3600","Accept-Ranges":"bytes","X-Drupal-Cache":"MISS","X-Generator":"Drupal 7 (http://drupal.org)","Content-Length":"7466","Via":"1.1 varnish","Vary":"Cookie,Accept-Encoding","Date":"Tue, 19 Jan 2016 06:18:48 GMT","Connection":"keep-alive","Expires":"Sun, 19 Nov 1978 05:00:00 GMT","Age":"1971","Content-Type":"text/html; charset=utf-8","Etag":"\"1453182356-1\"","X-Varnish":"1473722136 1473708897","Content-Language":"en","X-Powered-By":"PHP/5.5.9-1ubuntu4.14"},"status":{"reason":"no error","code":value}};
			}

			let okTests = (httpSuccess, doneFunction) => {
				
				subject.http.setupForSuccess(response, headers(httpSuccess));
				subject.on('postUpdated', (driver, update) => {
					update.message.should.contain('Default message');
					update.message.should.contain('My New Website');
					doneFunction();
				});

				subject.resolveMessageLinks(post);
			};

			let failTests = (httpFail) => {
				subject.http.setupForSuccess(response, headers(httpFail));
				subject.on('postUpdated', (driver, update) => chai.assert.fail());

				subject.resolveMessageLinks(post);
			}

			// Success values.
			it('200 OK...', (done) => okTests(200, done));
			it('201 OK...', (done) => okTests(201, done));
			it('299 OK...', (done) => okTests(299, done));
			it('300 OK...', (done) => okTests(300, done));
			it('399 OK...', (done) => okTests(399, done));
			// Fail values.
			it('400 FAIL...', () => failTests(400));
			it('499 FAIL...', () => failTests(499));
			it('500 FAIL...', () => failTests(500));
			it('599 FAIL...', () => failTests(599));
		});
	});

	describe('#resolveImageLinks', function() {

		it('should successfully fetch an image...', (done) => {
			
			let html = '<html><head></head><body><img src="http://www.mypotato.whatkindofsourceryisthis.png" alt="32"/></body></html>';
			let post = { link: 'https://www.theinternet.net/home.php' };

			subject.http.setupForSuccess(html, {"Content-Type":"image/png", "status":{"reason":"no error","code":200}});
			subject.on('postUpdated', (driver, update) => {
				update.media.length.should.equal(1);
				update.media[0].imageUrl.should.equal('https://www.mypotato.whatkindofsourceryisthis.png/');
				done();
			});

			subject.resolveImageLinks(post);
		});

		it('should successfully fill in the image hostname...', (done) => {
			
			let html = '<html><head></head><body><img src="/-/whatkindofsourceryisthis.png" alt="32"/></body></html>';
			let post = { link: 'https://www.theinternet.net/home.php' };

			subject.http.setupForSuccess(html, {"Content-Type":"image/png", "status":{"reason":"no error","code":200}});
			subject.on('postUpdated', (driver, update) => {
				update.media.length.should.equal(1);
				update.media[0].imageUrl.should.equal('https://www.theinternet.net/-/whatkindofsourceryisthis.png');
				done();
			});

			subject.resolveImageLinks(post);
		});

		it('should ignore incorrect mimetypes...', () => {
			
			let html = '<html><head></head><body><img src="/-/whatkindofsourceryisthis.png" alt="32"/></body></html>';
			let post = { link: 'https://www.theinternet.net/home.php' };

			subject.http.setupForSuccess(html, {"Content-Type":"audio/mp3", "status":{"reason":"no error","code":200}});
			subject.on('postUpdated', (driver, update) => chai.assert.fail());

			subject.resolveImageLinks(post);
		});

		it('should not call post updated if no image is retrieved...', () => {

			let html = '<html><head></head><body><img src="/-/whatkindofsourceryisthis.png" width="23"/></body></html>';
			let post = { link: 'https://thewest.com.au/news/wa/former-afl-star-cousins-fined-2000-for-vro-breach-drugs-ng-b88328376z' };

			subject.http.setupForSuccess(html);
			subject.on('postUpdated', () => chai.fail());

			subject.resolveImageLinks(post);
		});
	});
});