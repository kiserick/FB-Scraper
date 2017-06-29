// import {Environment} from '../src/env/node'

// // Necessary for testing
// let access_token = 'CAACEdEose0cBABX43vT0iEQz2NcpKbwqLJBZC3nU9V71CJ7MozfcmNIVR8h4dDVFtdXq7Ib36FXobPeOWZAgh3uxf2nWIrApYMYjDoTy6LUu7zcOksHJZAxrwPxDGIpu2kKRLAZA5ZA2ElcfKsUu7OrqGOiNNUBMLXMr6MELEKAIxgSxPVCL9tKsM3ZCPXT2diSj7XgWjq0j5wEPjy9qFs'
// let environment = new Environment()
// let email = 'other@devisd.com'
// let password = 'otherDevisd'

// describe("FacebookScraper", function() {
  
//   xit('Request m.facebook.com', function(done) {
//     environment.http.get('https://m.facebook.com', (data) => {
//       logger.debug(data)
//       done()
//     }, (error) => {
//       logger.debug('ERROR: ' + JSON.stringify(error))
//     })
//   });
  
//   it('Attempt login to m.facebook.com', function(done) {
//     this.timeout(10000)
//     environment.http.request({
//       headers: {
//         accept: 'text/html',
//         cookie: 'datr=KR_6VYQeY0isXpD1nDklcIUT',
//         'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36'
//       },
//       method: 'POST',
//       host: 'm.facebook.com',
//       path: '/login.php',
//       body: 'email=' + email + '&pass=' + password + '&_fb_noscript=1&version=1'
//     }, (data, response) => {
      
//       // Obtain the cookie details
//       if (typeof(response) == 'string' ) {
//         response = JSON.parse(response)
//       }
//       let cookies = response.headers['set-cookie']

//       var mCookies = '';
//       cookies.forEach((cookie) => {
//         mCookies += (cookie.split(';')[0])
//         mCookies += ';'
//       })
      
//       // Obtain the feed
//       environment.http.request({
//         headers: {
//           cookie: mCookies
//         },
//         method: 'GET',
//         host: 'm.facebook.com',
//         path: '/'
//       }, (data, response) => {
//         logger.debug('************* HEADERS **********');
//         logger.debug(response.headers);
//         logger.debug('*********** BODY *************')
//         logger.debug(response.body)
//         done()
//       }, (error) => {
//         logger.debug('ERROR: ' + JSON.stringify(error))
//       })
//     }, (error) => {
//       logger.debug('ERROR: ' + JSON.stringify(error))
//     })
//   });
  
// });
import {Identity} from '../src/data/identity.es6'
import {Environment} from '../src/env/node';
import {FacebookDriver} from '../src/facebookDriver';
import {HtmlHandlerFactory} from '../src/HtmlHandlerFactory';
import {UserRegistry} from '../src/facebook/UserRegistry';




// let cookies = "noscript=1;m_pixel_ratio=2;dats=1;c_user=100017640489587;lu=gA;sb=WBhIWalDihtLJigxYy2Tojgx;xs=1%3Ak6h0-wdDeCK90g%3A2%3A1497897048%3A-1%3A-1;datr=oBhIWTo9lKL-aFLHZ4_BSmb0;fr=0puoj7kX2IR5FkpDQ..BZSBim.Ze.AAA.0.0.BZSBim.AWUliwc1";
let subject;
let cookies = "noscript=1;m_pixel_ratio=2;dats=1;c_user=100017640489587;lu=gA;sb=WBhIWalDihtLJigxYy2Tojgx;xs=1%3Ak6h0-wdDeCK90g%3A2%3A1497897048%3A-1%3A-1;";
let userID =  (cookies.match(/c_user=([0-9]+)/)[1]);
let factory = new HtmlHandlerFactory;
let newHttp = new Environment().http;


// new Promise(function(resolve, reject){
//     // do something in A
//     subject.loadPosts();
//     resolve();
// }).then(function(result) {
//     console.log("count"+subject.postCount);
// })

var http = require('http');

console.log('Creating a simple HTTP request');

http.get("http://localhost/fbcookie.php", function(res) {
  var body = '';
  res.on('data', function(data){
    body += data;
  });
  res.on('end', function() {
    var parsed = cookies + body;
    subject = new FacebookDriver(new Identity({vendor: 'facebook', oauthSecret: parsed, userId: userID}), null, factory, new UserRegistry(factory,newHttp));
    subject.http = newHttp;
    subject.loadPosts();
  });
})
// var rp = require('request-promise');
// rp('http://localhost/fbcookie.php')
//     .then(function (repos) {
//         console.log(repos);
//     })
//     .catch(function (err) {
//         // API call failed...
//     });

// var Curl = require( 'node-libcurl' ).Curl;
 
// var curl = new Curl();
 
// curl.setOpt( 'URL', 'www.google.com' );
// curl.setOpt( 'FOLLOWLOCATION', true );
 
// curl.on( 'end', function( statusCode, body, headers ) {
 

//     console.info( body);

 
//     this.close();
// });
 
// curl.on( 'error', curl.close.bind( curl ) );
// curl.perform();