// -------------- OAuth override -----------

// Active OAuthHttp
var activeOAuthHttp
// Helper function to prepare the state of the {@link #activeOAuthHttp} object, ready for executing a request.
var _initState = (oauth, success, failure) => {
  activeOAuthHttp = oauth;
  activeOAuthHttp.success = success;
  activeOAuthHttp.failure = failure;
}

var _tightlyEncode = (loose) => {
  return loose.replace(/\!/g, "%21").replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
}

// http/https override for oauth (ties in with grunt replace)
exports.request = function(options) {
  // Return the override request
  return new OAuthRequest(activeOAuthHttp, options)
}

// -------------- OAuth functionality -----------

let OAuth = require('oauth');

// Provides means to make the OAuth request
export class OAuthHttp {
  
  constructor(clientKey, clientSecret, http) {
    this.http = http
    this.oauth = new OAuth.OAuth(
        null, null,
        clientKey,
        clientSecret,
        '1.0A',
        null,
        'HMAC-SHA1'
      );
  }
  
  get(url, oauthToken, oauthTokenSecret, success, failure) {
    
    _initState(this, success, failure);
    this.oauth.get(_tightlyEncode(url), oauthToken, oauthTokenSecret, () => {})
  }
  
  post(url, oauthToken, oauthTokenSecret, body, success, failure) {
    _initState(this, success, failure);
    this.oauth.post(_tightlyEncode(url), oauthToken, oauthTokenSecret, body, 'application/json', () => {})
  }
  
  createHttp(oauthToken, oauthTokenSecret) {
    return new OAuthHttpWrapper(this, oauthToken, oauthTokenSecret)
  }
}

class OAuthHttpWrapper {
  
  constructor(oauthHttp, oauthToken, oauthTokenSecret) {
    this.oauthHttp = oauthHttp
    this.oauthToken = oauthToken
    this.oauthTokenSecret = oauthTokenSecret
  }
  
  get(url, success, failure) {
    this.oauthHttp.get(url, this.oauthToken, this.oauthTokenSecret, success, failure)
  }
  
  request(options, success, failure) {
    _initState(this.oauthHttp, success, failure)
    
    // Construct URL (if not provided)
    if (!options.url) {
      options.url = 'https://' + options.host + options.path
    }
    
    // Load custom headers if available
    let contentType = null
    if (options.headers) {
      let headers = {}
      for (var headerName in options.headers) {
        if (headerName.toLowerCase() == 'content-type') {
          // Must provide content type explicitly
          contentType = options.headers[headerName]
          
        } else if (headerName.toLowerCase() != 'content-length') {
          // Include the header (content-length will be determined)
          headers[headerName] = options.headers[headerName]
        }
      }
      this.oauthHttp.oauth._headers = headers
    }
    
    // Default to POST
    if ((!options.method) || (options.method.toLowerCase() == 'post')) {
      this.oauthHttp.oauth._performSecureRequest(this.oauthToken, this.oauthTokenSecret, "POST", _tightlyEncode(options.url), {}, options.body, contentType, () => {});
    } else {
      throw new Error('Unknown HTTP method ' + options.method)
    }
  }
}

// Use environment to make the request
class OAuthRequest {
  
  constructor(oauthHttp, options) {
    this.oauthHttp = oauthHttp
    this.options = options
  }
  
  // Necessary methods for OAuth
  
  on(event, callback) {
    // Do nothing as request already fired with appropriate handling
  }
  
  write(entity) {
    // Capture potential entity
    this.options.body = entity
  }
  
  end() {
    // Undertake the request (with appropriate handling)
    this.oauthHttp.http.request(this.options, this.oauthHttp.success, this.oauthHttp.failure)
  }
}

// Lastly configure this module as global
global.http = module.exports;
global.https = module.exports;
