import {Action} from './data/action.es6';
import {Comment} from './data/comment.es6';
import {Media} from './data/media.es6';
import {NetworkDriver} from './NetworkDriver.es6';
import {Origin} from './data/origin.es6';
import {Post} from './data/post.es6';
import {User} from './data/user.es6';
import {CustomEntities} from './CustomEntities.es6';

let moment = require('moment');

const ID_CLIENT = '266551704362-2pgmhubio0dc35to5nhcfu7sq28sus3g.apps.googleusercontent.com';
const LENGTH_CHUNK_UPLOAD = 102400;
const QUERY_HOST = 'www.googleapis.com';
const QUERY_HOST_LENGTH = ('https://www.googleapis.com').length;
const REGEX_ADVERTISING_TEXT = /^(.*)(\\n*Uploaded with Social Stream\.\\nhttp:\/\/mysocialstream\.com\/find-out-more)$/;

export class YouTubeDriver extends NetworkDriver {

	constructor(identity, loadParameters) {
		super();

		if (!identity) throw new Error('Illegal attempt to create YouTubeDriver with no identification.');
		if (!identity.userId) throw new Error('YouTubeDriver user identifier missing from driver initialisation.');
		if (!identity.oauthToken) throw new Error('YouTubeDriver oauth token missing from driver initialisation.');
		if (!identity.oauthSecret) throw new Error('YouTubeDriver oauth refresh token missing from driver initiation');

		this.identity = identity;
		this.auth = identity.oauthToken;
		this.htmlparser = new CustomEntities();
		this.userID = this.identity.userId;
		this.oauthToken = this.identity.oauthToken;
		this.loadParameters = (loadParameters || { load_post_limit: 30 });

		// handy one-liners for when you really need a punch!
		this._epochinator = (timestamp) => (moment(timestamp, 'YYYY-MM-DD hh:mm:ss.SSSZ').unix() * 1000);
		this._execute = (method, path, publicBlock, success, body) => this._issueAuthorisedRequest(this._generateOptionsPath(method, path, body), publicBlock, success);

        // Error reporting convenience block.
        this._origin = (cBlock, pBlock) => new Origin(cBlock, 'YouTubeDriver', pBlock);
    }

	commentOnPost(post, comment) {
		let body = {
			canReply: true,
			isPublic: true,
			kind: 'youtube#commentThread',
			snippet: {
				channelId: post.creator.id,
				topLevelComment: {
					kind: 'youtube#comment',
					snippet: {
						textOriginal: comment
					}
				},
				videoId: post.id
			}
		};

		this._execute('POST', '/youtube/v3/commentThreads?part=snippet', 'commentOnPost', ((result) => this.broadcast('postCommented', { commentId: result.id, postId: post.id })), body);
	}

	deletePost(post) {
		this._execute('DELETE', ('/youtube/v3/videos?id=' + post.id), 'deletePost', ((result) => this.broadcast('postDeleted', { postId: post.id })));
	}

	likePost(post) {
		this._execute('POST', ('/youtube/v3/videos/rate?rating=like&id=' + post.id), 'likePost', ((result) => this.broadcast('postLiked', { postId: post.id })));
	}

	loadNotifications() {
		this.notifications = [];
		this.broadcast('loadNotificationsComplete');
	}

	loadPosts() {

		let items = [];
        var unformattedChannels = [];
        var unformattedPosts = [];

        this.completed = 1;
		let options = this._generateOptions('GET');
		let parseChannel = (item) => new User({
			id: item.snippet.resourceId.channelId,
			name: item.snippet.title,
			photoUrl: item.snippet.thumbnails.default.url,
			vendor: this.identity.vendor
		});

		this.on('error', () => this._complete());
		this.loadPosts = () => this.broadcast('pageComplete');

		options.path = '/youtube/v3/subscriptions?part=id,snippet&mine=true';

		this._issueAuthorisedRequest(options, 'loadPosts', ((response) => {

            this.broadcast('htmlCatehed', {htmlEnv:this, response:JSON.stringify(response)});

            unformattedChannels = this._getUnformattedChannel(response.items);
            if (unformattedChannels.length > 0) {
                logger.warn(new ApolloError('Unformatted Channel in YoutubeDriver : ' + JSON.stringify(unformattedChannels)), this._origin('complete', 'loadPosts'));
            }

            items = response.items.map(parseChannel);

			if (!items.length) {
				this.broadcast('pageComplete');
			} else {
				this.completed = items.length;
				items.forEach((item) => this._fetchSubscription(item, (this.loadParameters.load_post_limit / items.length), (posts) => unformattedPosts = unformattedPosts.concat(posts)));
                if (unformattedPosts.length > 0) {
                    logger.warn(new ApolloError('Unformatted Posts in YoutubeDriver : ' + JSON.stringify(unformattedPosts)), this._origin('complete', 'loadPosts'));
                }

            }

        }));
	}

    _getUnformattedChannel(channels) {
		var unformattedChannel = [];
		channels.forEach(function (item) {
			if (item.snippet === undefined ||
				item.snippet.resourceId === undefined ||
				item.snippet.resourceId.channelId === undefined ||
				item.snippet.title === undefined ||
				item.snippet.thumbnails === undefined ||
				item.snippet.thumbnails.default === undefined ||
				item.snippet.thumbnails.default.url === undefined) {
				unformattedChannel.push(item);
			}
		});

		return unformattedChannel;
	}
    _complete() {
		if (--this.completed === 0) {
			this.broadcast('pageComplete');
		}
	}

	// Helper to fetch the videos from the given channel.
	// Videos retrieved will be added to the this.items data object before the callback is called.
	//
	// <channel> User object encapsulating the channel information to request videos from.
	// <max> The maximum number of results to fetch from this query.
	// <done> no-argument function to alert the loadPosts function that this subroutine has finished.
	_fetchSubscription(channel, max, unformatcallback) {

        //declare available actions
        var actions = [
            new Action({type: 'Comment'}),
            new Action({type: 'Like'}),
            new Action({type: 'Share'})
        ];
        let options = this._generateOptionsPath('GET', ('/youtube/v3/search?type=video&videoEmbeddable=true&videoSyndicated=true&order=date&part=id,snippet&channelId=' + channel.id + '&maxResults=' + (max | 0)));

        let parseMedia = (item) => new Media({
            imageUrl: (item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url),
            srcUrl: ('https://www.youtube.com/watch?v=' + item.id.videoId),
            type: 'video'
        });

        var unformattedPosts = [];
        let parsePost = (item) => {
            if (!item || typeof item !== 'object' || item.id === undefined || item.id.videoId === undefined || item.snippet === undefined || item.snippet.publishedAt === undefined) {
                unformattedPosts.push(item);
                return null;
            }
            return new Post({
				actions: actions,
				creator: channel,
				id: item.id.videoId,
				identity: this.identity,
				media: [parseMedia(item)],
				memento: this.sMemento(item.snippet),
				message: this._stripSignature(item.snippet.title ? this.htmlparser.decode(item.snippet.title) : (item.snippet.description ? this.htmlparser.decode(item.snippet.description) : '')),
				rawTimestamp: item.snippet.publishedAt,
				timestamp: this._epochinator(item.snippet.publishedAt),
				type: 'video'
			});
		};
		let done = (post) => {
			if(post){
				this.broadcast('postLoaded', post);
				this._fetchComments(post, (item)=>unformattedPosts.push(item));
			}
		}

		this._issueRequest(options, 'loadPosts', (response) => {
			if (response.items) {
				response.items.map(parsePost).forEach(done);
                unformatcallback(unformattedPosts);
			}
			this._complete();
		});
	}

	_stripSignature(message) {

		let signature = (message ? message.match(REGEX_ADVERTISING_TEXT) : false);
		
		return (signature ? signature[1] : message);
	}

	// Fetch the comments for each given post and fire off comments as a post update.
	//
	// <post> Post object to request top-level comments for.
	_fetchComments(post, callback) {

        let comments = [];
        var isFormattedComment = true;

        // textFormat=plainText required due to http://stackoverflow.com/questions/35281771/youtube-api-textdisplay-is-blank-for-all-comments (once resolved by Google may remove)
        let options = this._generateOptionsPath('GET', ('/youtube/v3/commentThreads?part=snippet&videoId=' + post.id + '&order=time&textFormat=plainText'));

        let commentFilter = (item) => (item.kind === 'youtube#commentThread');
        let parseUser = (item) => {
            if (item.authorDisplayName === undefined || item.authorProfileImageUrl === undefined) {
                isFormattedComment = false;
                return false;
            }
            return new User({
                id: (item.authorChannelId ? item.authorChannelId.value : (item.channelId ? item.channelId : 'ERROR')),
                name: item.authorDisplayName,
                photoUrl: item.authorProfileImageUrl,
                vendor: this.identity.vendor
            });
        };
        let parseComment = (item) => {
            if (!item || typeof item !== 'object' || item.id === undefined ||
				item.snippet === undefined ||
				item.snippet.topLevelComment === undefined ||
				item.snippet.topLevelComment.snippet === undefined ||
				item.snippet.topLevelComment.snippet.updatedAt === undefined) {
                isFormattedComment = false;
				return null;
            } 
			return new Comment({
				creator: (parseUser(item.snippet.topLevelComment.snippet) ? parseUser(item.snippet.topLevelComment.snippet) : new User()),
				id: item.id,
				message: (item.snippet.topLevelComment.snippet.textDisplay ? this.htmlparser.decode(item.snippet.topLevelComment.snippet.textDisplay) : ''),
				rawTimestamp: item.snippet.topLevelComment.snippet.updatedAt,
				timestamp: this._epochinator(item.snippet.topLevelComment.snippet.updatedAt),
				vendor: this.identity.vendor,
			});
			
		};

		this._issueRequest(options, 'loadPosts', (response, headers) => {
				comments = response.items.filter(commentFilter).map(parseComment).filter(item => !!item);
                if (isFormattedComment === false) {
                    callback(response.items);
                }

				if (comments.length > 0) {
					this.broadcast('postUpdated', {
						comments: comments,
						id: post.id,
						identity: this.identity
					});
				} else {
					this.broadcast('postFailed',{
						id: post.id
					})
				}
			},
			(response) => {
				if (response.error) {
					if (response.error.errors[0].reason === "commentsDisabled") {
						var actions = [
							new Action({
								type: 'Like'
							}),
							new Action({
								type: 'Share'
							})
						];
						this.broadcast('postUpdated', {
							actions: actions,
							id: post.id,
							identity: this.identity,
							property: 'actions'
						});
					}
				}
			}
		);
	}

	sendPost(post, getMediaData) {

	    let options = this._generateOptions('PUT');
		let detailsUrl = '/upload/youtube/v3/videos?part=status,snippet&uploadType=resumable';

		let generateAction = (name) => (new Action({ type: name }));
		let successCallback = (response, headers) => {
			this.broadcast('postSent', {
				actions: [
					generateAction('Comment'),
					generateAction('Delete'),
					generateAction('Like'),
					generateAction('Share')
				],
				postId: response.id
			});
		};
		let detailsCallback = (response, headers) => {

			if (this._headerErrorCheck(response, headers, 'sendPost')) {
				if (headers.location) {
					options.path = headers.location.substring(QUERY_HOST_LENGTH);
				} else if (headers.Location) {
					options.path = headers.Location.substring(QUERY_HOST_LENGTH);
				}

				options.headers['Content-Type'] = 'video/*';
				options.headers['X-Upload-Content-Type'] = 'video/*';
				
				getMediaData(post.media[0], 'video/mp4', (completed) => {
				    if (completed.error) {
				        this.broadcastError(completed.error, new Origin('getMediaData', 'YouTubeDriver', 'sendPost'));
				        return;
				    }
				    let buffer = new Buffer(completed.videoBase64Data, 'base64')
			        let end = Math.min(LENGTH_CHUNK_UPLOAD, buffer.length) // video may be smaller than chunk size
				    this._sendVideo(options, buffer, 0, end, successCallback)
				});
			}
		};

		if (post.media && post.media.length === 1 && post.media[0].type === 'video') {
			this._execute('POST', detailsUrl, 'sendPost', detailsCallback, this._ensnip(post));
		} else {
			this.broadcastError('Attempting to send a non-video post to YouTube.', new Origin('sendPost', 'YouTubeDriver', 'sendPost'));
		}
	}

	// Helper to SendPost to upload video files in a chunked manner.
	// This is a recursive call that will loop until the entire file is uploaded to YouTube.
	// The start and end parameters are used to measure the progress of the upload.
	//
	// This is required to facilitate large file uploading.
	// <options> Request options.
	// <data> Buffer object containing the data to be uploaded.
	// <start> Index of the first byte of this chunk upload.
	// <end> Index of the last byte of this chunk upload.
	// <done> callback function to call when all uploaded chunks are completed.
	_sendVideo(options, data, start, end, done) {
		let temp;
		let callback = done;

		if (start < data.length) {
			temp = data.slice(start, end);
			
			options.body = temp;
			options.headers['Content-Length'] = options.body.length;
			options.headers['Content-Range'] = ('bytes ' + start + '-' + (end - 1) + '/' + data.length);

			start = end;
			end = (end + temp.length < data.length ? end + temp.length : data.length);
			callback = () => this._sendVideo(options, data, start, end, done);
		}

		this._issueRequest(options, 'sendPost', callback);
	}

	// Helper function to convert a Post object to the body of the request required for the first part of the video upload.
	//
	// <post> Post object to convert to a valid video upload body details.
	// RETURN JSON object with the snippet (and status) fields set as required for the given Post.
	_ensnip(post) {
		return {
			snippet: {
				description: 'Uploaded with Social Stream.\nhttp://mysocialstream.com/find-out-more',
				tags: [ 'socialstream', 'Social Stream', 'SocialStream', 'social stream' ],
				title: post.message
			},
			status: {
				embeddable: true
			}
		};
	}

	unlikePost(post) {
		this._execute('POST', ('/youtube/v3/videos/rate?rating=none&id=' + post.id), 'unlikePost', ((result) => this.broadcast('postUnliked', { postId: post.id })));
	}

  // Helper method to issue a request for the given options object.
  // This function provides the callback to parse the data, check (and handle) errors and then return
  //
  // <options>		request options
  // <publicBlock>	Public API function using this helper function.
  // <success>		Success callback function.
  // <error>		Optional failure callback function.
  _issueRequest(options, publicBlock, success, error) {

  	options.headers.Authorization = ('Bearer ' + this.auth);
  	error = error || ((error) => this.broadcastError(this.sMemento(error.error), new Origin('_issueRequest', 'YouTubeDriver', publicBlock)));

    this.http.request(options, (data, headers) => {
        
      // Ensure is JSON
      data = this.jResponse(data);
      headers = this.jResponse(headers);
    	
    	if (this._headerErrorCheck(data, headers, publicBlock, error)) {
    		success(data, headers);
    	}
    }, error);
  }

  // Helper method to issue an OAuth access token refresh then the required <options> request.
  //
  // <options>		request options
  // <publicBlock>	public API access function using this helper function.
  // <success>		success callback function.
  _issueAuthorisedRequest(options, publicBlock, success, error) {

  	var refresh = {
  		body: ('grant_type=refresh_token&refresh_token=' + this.identity.oauthSecret + '&client_id=' + ID_CLIENT),
  		headers: {
  			'Content-Type': 'application/x-www-form-urlencoded'
  		},
  		host: QUERY_HOST,
  		method: 'POST',
  		path: '/oauth2/v3/token'
  	};
  	// stupid "this" binding errors in HTTP4Node library.
  	error = error || ((error) => this.broadcastError(this.sMemento(error.error), new Origin('_issueAuthorisedRequest', 'YouTubeDriver', publicBlock)));
  	//var error = (fault) => this.broadcastError(this.sMemento(fault.error), new Origin('request', 'YouTubeDriver', publicBlock));
  	
  	// Firstly fetch a fresh access token
  	this.http.request(refresh, (oaData, oaHeaders) => {

  		oaData = this.jResponse(oaData);
  		oaHeaders = this.jResponse(oaHeaders);

  		if (this._headerErrorCheck(oaData, oaHeaders, publicBlock)) {
  			this.auth = oaData.access_token;
  			this._issueRequest(options, publicBlock, success);
  		}
  	}, error);

  }

  // Handy helper method to generate HTTP options for a YouTube request to the Google API.
  //
  // <method> - DELETE, GET or POST request type.
  // <bodyMessage> - OPTIONAL message= HTTP body property.
  // RETURN generated options object suitable for passing to a http.request call.
  _generateOptions(method, bodyMessage) {
    
    var options = {
    	headers: {
    		'Content-Type': 'application/json; charset=UTF-8'
    	},
      host: QUERY_HOST,
      method: method
    };
    if (bodyMessage) {
    	options.body = JSON.stringify(bodyMessage);
    	options.headers['Content-Length'] = options.body.length;
    }

    return options;
  }

  // Handy helper to generate the HTTP options for the with the options.path value set.
  //
  // <method> DELETE, GET, or POST request type.
  // <path> URI to assign to the options.path property.
  // <bodyMessage> - OPTIONAL message= HTTP body property.
  // RETURN options object ready for transmission.
  _generateOptionsPath(method, path, bodyMessage) {
  	let options = this._generateOptions(method, bodyMessage);
  	options.path = path;

  	return options;
  }

  // YouTube specific error checking. This will test the received values for an error and call the error callback if necessary.
  //
  // Checks the headers and bodies for errors before calling the success callback.
  // <response>		response body to check for error messages. Often this will be empty, as the Google APIs use HTTP error codes to communicate errors.
  // <headers>		headers property to check for error codes.
  // <error>		the option to overided the error callback with paramaters response and error message.
  // <publicBlock>	Public API function call that resulted in this error check being executed.
  // RETURN boolean indicating whether or not an error was detected.
  _headerErrorCheck(response, headers, publicBlock, error) {

  	let reason = false;
  	error = error || ((error) => this.broadcastError(this.sMemento(error.error), new Origin('_headerErrorCheck', 'YouTubeDriver', publicBlock)));

		// Determine if error in transmission
    if (!this.isSuccessfulRequest(headers)) {
        if (!headers.status) {
        	reason = response.error.errors[0].reason; 
        } else {
        	reason = headers.status.reason;
        }
        error(response, reason);
    // HTTP ok - parsing error
  	} else if (response.error) {
  		reason = response.error;
        error(response, response.error);
    }

    return !reason;
  }
}