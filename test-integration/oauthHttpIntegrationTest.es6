import {OAuthHttp} from '../src/oauthHttp'
import {Environment} from '../src/env/node'

let chai = require('chai')
chai.should()

// Try with Twitter
let clientKey = 'b5KrEGuLlTRfKel2KnmLOeeNT'
let clientSecret = '50PyjdoQKq2rr3A3m519JjqPi7JPulEOOZBrWCDp8uWOGPJy31'
let oauthToken = '2457457339-ItU2EEOYVRIb2NNdI1Fr8krZrySDU3A3A1TEz5s'
let oauthTokenSecret = '6rRAvsi5VwsGmkSKupaN9pVpxddfUsI7FsiZrhryDbnSs'

describe("OAuthHttp", function() {

  let environment = new Environment()
  var subject = new OAuthHttp(clientKey, clientSecret, environment.http)
  /*
  it("#load", function(done) {
    this.timeout(10000)
    subject.get('https://api.twitter.com/1.1/statuses/home_timeline.json',
        oauthToken, oauthTokenSecret,
        function(data) {
          let entries = JSON.parse(data)
          logger.debug('Successful in loading ' + entries.length + ' posts from Twitter')
          done()
        }, function(error) {
          logger.warn(error)
          throw new Error(error)
          done()
        })
    });
    */

  it('Test POST to Twitter via OAuth', function(done) {
    this.timeout(10000)
    subject.post('https://api.twitter.com/1.1/favorites/favorite.json?id=601196588514549800',
        oauthToken, oauthTokenSecret, '', 'application/json',
        function(data) {
          let entries = JSON.parse(data);
          logger.debug('** DATA: '+data);
          logger.debug('Successful in loading ' + entries.length + ' posts from Twitter');
          done()
        }, function(error) {
          logger.info(error)
          throw new Error(error)
          done()
      });
  });
  
})