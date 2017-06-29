import {Action} from './data/action.es6';
import {FormDataSender} from './formData.es6';
import {Media} from './data/media.es6';
import {NetworkDriver} from './NetworkDriver.es6';
import {Notification} from './data/notification.es6';
import {OAuthHttp} from './oauthHttp.es6';
import {Origin} from './data/origin.es6';
import {Post} from './data/post.es6';
import {User} from './data/user.es6';
import {CustomEntities} from './CustomEntities.es6';

// Regular expression for detecting the advertising string.
const REGEX_APOLLO_ADVERTISING_TEXT = /^(.*)(\n*[TUadeloptw]+ with http[://a-zA-Z0-9. ]+)$/;
// Maximum length of a Tweet.
const LENGTH_TWEET_ADAPPENDABLE = 140;
// Regular expression for checking if a link is valid.
const URL_RESOLVABLE_LINK = /\s(?:http(?:s|):\/\/|www)[^\s]+/g

export class TwitterDriver extends NetworkDriver {

	constructor(identity, loadParameters) {

		super();

		if (!identity) throw new Error('Must provide credentials for Twitter');
		if (!identity.oauthToken) throw new Error('Must provide oauthToken for Twitter');
		if (!identity.oauthSecret) throw new Error('Must provide oauthTokenSecret for Twitter');
		if (!identity.userId) throw new Error('Must provide userId (screenName) for Twitter');

		this.notifications = [];
		this.identity = identity;
		this.htmlparser = new CustomEntities();
		this.loadParameters = loadParameters;
		this.oauthToken = identity.oauthToken;
		this.oauthTokenSecret = identity.oauthSecret;

		this._createOAuthHttp = () => new OAuthHttp('b5KrEGuLlTRfKel2KnmLOeeNT', '50PyjdoQKq2rr3A3m519JjqPi7JPulEOOZBrWCDp8uWOGPJy31', this.http);
		this._origin = (cBlock, pBlock) => { return new Origin(cBlock, 'TwitterDriver', pBlock) };
		this._error = (data, block, publicBlock) => {
			if (data.errors) {
				(data.errors.forEach((error) => this.broadcastError(error.message, this._origin(block, publicBlock))));
			} else if (data.message) {
				this.broadcastError(data.message, this._origin(block, publicBlock));
			} else if (Array.isArray(data)) {
				(data.forEach((error) => this.broadcastError(error.message, this._origin(block, publicBlock))));
			} else {
				// Ensure error is being sent
				this.broadcastError(data, this._origin(block, publicBlock));
			}
		};
		this._extractLink = (tweet) => {
			// Determine via URL
			if (tweet.entities && tweet.entities.urls && tweet.entities.urls[0] && tweet.entities.urls[0].expanded_url) {
				return tweet.entities.urls[0].expanded_url
			}

			// No link
			return false
		}
	}

	// Helper function to generate a User from a received tweet object.
	//
	// <tweet> entry within the received Twitter data to parse User data from.
	// RETURN Fully-formed User object suitable for assigning to the generated Post object.
	_generateUser(tweet, callback) {
        if(typeof (callback) === 'function'){

			if (tweet.user.screen_name === undefined ||
				tweet.user.name === undefined ||
				tweet.user.profile_image_url_https === undefined)
			{
					callback({error:"Not found tweet.user info", tweet:tweet});
					return new User();
			}
        }
		return new User({
			id: tweet.user.screen_name,
			name: tweet.user.name,
			photoUrl: tweet.user.profile_image_url_https,
			vendor: 'twitter'
		});
	}

	// Helper function to fetchTweetSuccess to parse one entry within the received data array.
	//
	// <tweet> single entry within the received data array.
	// RETURN Fully-formed Post object
	_parseTweet(tweet, callback) {

		var actions = [
			new Action({
				type: 'Like'
			}),
			new Action({
				type: 'Share'
			}),
			new Action({
				type: 'Comment'
			})
		];
		var creator = null;
		var creationEpochTime = 0;
		var mediaItems = [];
		var post = null;
		var type = 'tweet';

		var httpLink = this._extractLink(tweet);
		var stringify = (data) => (this.sMemento(data));
		let text = (tweet.text ? this.htmlparser.decode(tweet.text) : '');

		text = (this._removeAdvertising({ message: text })).message;

		if (this.identity.userId && tweet.user && this.identity.userId === tweet.user.screen_name) {
			actions.push(new Action({
				type: 'Delete'
			}));
		}

		// Links are a fallback type.
		if (httpLink) {
			type = 'link';
			httpLink = this._extractLink(tweet);
		}
		// Determine the creation epoch time
		if (tweet.created_at) {
			creationEpochTime = new Date(tweet.created_at).getTime();
		}else{
			callback({error: "Not found tweet.created_at", tweet:tweet});
		}


		if (tweet.user) {
			creator = this._generateUser(tweet, callback);
		}else{
            callback({error: "Not found tweet.user", tweet:tweet});
		}

		// Obtain the possible media video
		if (tweet.extended_entities && tweet.extended_entities.media) {
			tweet.extended_entities.media.forEach((media) => {

				// Load as video (if has variants)
				if (tweet.extended_entities.media[0].media_url.contains('video_thumb')) {

					let duration = 0;
					let maxBitRate = 0;
					let mediaVariant = '';

					// checking media json
                    if (tweet.extended_entities.media[0].video_info === undefined ||
                        tweet.extended_entities.media[0].video_info.variants === undefined){
                        callback({error: "Not found tweet.extended_entities.media[0].video_info.variants", tweet:tweet});
                        return false;
                    }

                    let isMp4 = ((varient) => 'video/mp4' === varient.content_type);
					let update = ((varient) => {
						if (varient.bitrate > maxBitRate || varient.bitrate === 0) {
							maxBitRate = varient.bitrate;
							mediaVariant = varient.url;
						}
					});

					duration = (tweet.extended_entities.media[0].video_info.duration_millis || -1);
					tweet.extended_entities.media[0].video_info.variants.filter(isMp4).forEach(update);

					type = 'video'

					mediaItems.push(new Media({
						type: type,
						imageUrl: tweet.extended_entities.media[0].media_url,
						srcUrl: mediaVariant,
						duration: duration,
						width: -1,
						memento: stringify(media)
					}));
					// Tweet has video, so now video type
				} else {
					// Load as photo (note video overrides photo)
					if (type !== 'video') {
						type = 'photo';
					}
					// checking photo json format
                    if (media.media_url_https === undefined ||
                        media.sizes === undefined ||
                        media.sizes.large === undefined ||
						media.sizes.large.w === undefined ||
                        media.sizes.large.h === undefined)
                    {
                        callback({error: "Not found tweet.extended_entities.media Infor", tweet:tweet});
                        return false;
                    }
                    // Load the photo media
					mediaItems.push(new Media({
						type: type,
						imageUrl: media.media_url_https,
						srcUrl: media.media_url_https,
						width: media.sizes.large.w,
						height: media.sizes.large.h,
						memento: stringify(media)
					}));
				}
			});
		}

		// Obtain the possible media images (as no extended videos or photos)
		if (type == 'tweet' && tweet.entities && tweet.entities.media) {
			tweet.entities.media.forEach((media) => {

                // checking tweet json format
                if (media.media_url === undefined ||
                    media.sizes === undefined ||
                    media.sizes.large === undefined ||
                    media.sizes.large.w === undefined ||
                    media.sizes.large.h === undefined)
                {
                    callback({error: "Not found tweet.entities.media Infor", tweet:tweet});
                    return false;
                }

				// Flag as photo (if have photo)
				type = media.type;

				// Add the media
				mediaItems.push(new Media({
					type: tweet.entities.media.type,
					imageUrl: media.media_url,
					srcUrl: media.media_url,
					width: media.sizes.large.w,
					height: media.sizes.large.h,
					memento: stringify(media)
				}));
			})
		}

		// Determine if the tweet is liked
		let likeStatus = Post.LikeStatusNone
		if (tweet.favorited) {
			likeStatus = Post.LikeStatusLike
		}

        // checking tweet json format
        if (tweet.id_str === undefined ||
            tweet.in_reply_to_status_id === undefined ||
            tweet.in_reply_to_status_id_str === undefined )
        {
            callback({error: "Not found tweet.id_str, in_reply_to_status_id, in_reply_to_status_id_str", tweet:tweet});
        }

        // create the Post
		post = new Post({
			actions: actions,
			creator: creator,
			id: String(tweet.id_str),
			identity: this.identity,
			likeStatus: likeStatus,
			link: (httpLink ? httpLink : ''),
			media: mediaItems,
			message: text,
			memento: stringify(tweet),
			rawTimestamp: tweet.created_at,
			timestamp: creationEpochTime,
			type: type
		});

		// update with Twitter-specific information.
		post.in_reply_to_status_id = tweet.in_reply_to_status_id;
		post.in_reply_to_status_id_str = tweet.in_reply_to_status_id_str;

		return post;
	}

	// Helper function to check whether any of the orphan comments (in this.comments) should be associated with the given (potential) parent.
	// Each orphan comment found in the is added to the parent (as a comment), and removed from the global orphan store.
	//
	// <parent> parent tweet to test for parenting to each orphan in the this.comments array.
	_extractComments(parent) {

		let findComments = (comment) => (comment.in_reply_to_status_id_str === parent.id);
		let excludeComments = (comment) => (!findComments(comment));

		parent.comments = parent.comments.concat(this.comments.filter(findComments).reverse());
		this.comments = this.comments.filter(excludeComments);
	}

	// Handle successful response of tweets
	fetchTweetSuccess(data) {

        let post;
		let items = [];
		let associated = [];
		// Parse data (if necessary)
		data = this.jResponse(data);

		//catch twitter response data
        this.broadcast('htmlCatehed', {htmlEnv:this, response:JSON.stringify(data)});

        // Handle possible error
		if (data.errors) {
			this._error(data, 'fetchTweetSuccess', 'loadPosts');
            logger.warn(new ApolloError('Received invalid JSON in TwitterDriver' + JSON.stringify(data)), this._origin('complete', 'loadPosts'));
		} else if (Array.isArray(data)) {
			let unformattedPosts = [];
			// Iterate
			data.forEach((tweet) => {

                post = this._parseTweet(tweet, (item)=>unformattedPosts.push(item));
				if (post === undefined)
					return;
                // Determine if include the tweet
				if (this.loadParameters) {

					// Determine based on media/friends
					if (this.loadParameters.media_friends <= 0) {
						// Include only community (verified) posts
						if ((!tweet.user) || (tweet.user.verified !== true)) {
							return; // must have user and do not include non-verified
						}
					} else if (this.loadParameters.media_friends >= 100) {
						// Include only friends (non-verified) posts
						if (tweet.user && (tweet.user.verified === true)) {
							return; // do not include verified
						}
					}

					// Determine based on popular/most recent
					if (this.loadParameters.popular_mostRecent <= 33) {
						// Include only popular tweets
						if (isNaN(tweet.favorite_count) || tweet.favorite_count < TwitterDriver.TWITTER_POPULAR_MIN_LIKES) {
							return; // do not include non-popular post
						}
					}
				}

				if (post.in_reply_to_status_id_str) {
					associated = items.filter((item) => item.id === post.in_reply_to_status_id_str);

					if (associated.length) {
						associated[0].comments.push(post);
						associated[0].property = 'comments';

						this.broadcast('postUpdated', associated[0]);
					} else {
						this.comments.push(post);
					}
				} else {
					
					// Check if we have a comment already
					this._extractComments(post);

					// Do we want to try for an image?
					if (!post.media || !post.media[0]) {
						this.resolveImageLinks(post);
					}

					// Stash it!
					items.push(post);
					this.broadcast('postLoaded', post);

                    // Notify of like status
					post.property = 'postlikeupdatedkey';
					this.broadcast('postUpdated', post);
				}
			});

			// Treat leftover comments as tweets
			this.comments.forEach((comment) => this.broadcast('postLoaded', comment));

			// report unformatted posts
			if(unformattedPosts.length > 0){
                logger.warn(new ApolloError('Detected Unformatted Post Json in TwitterDriver' + JSON.stringify(unformattedPosts)), this._origin('complete', 'loadPosts'));
            }
		} else {
            this._error(data, 'fetchTweetSuccess', 'loadPosts');
            logger.warn(new ApolloError('Received invalid JSON in TwitterDriver' + JSON.stringify(data)), this._origin('complete', 'loadPosts'));
		}

		this.broadcast('pageComplete');
	}

	// Helper to this.sendPost used to classify the Post object. This object will treat retweets with a single comment as being a
	// Retweet-With-Comment behaviour.
	//
	// <post> Post object for transmissions.
	// RETURN Classification for this Post object.
	_classifyPost(post) {
		var result = TwitterDriver.Post;

		if (post.identity && post.identity.vendor && post.identity.vendor == 'twitter') {
			if (post.comments && post.comments.length === 1) {
				result = TwitterDriver.RetweetWithComment;
			} else {
				result = TwitterDriver.Retweet;
			}
		} else if (post.comments && post.comments.length > 0) {
			result = TwitterDriver.PostWithComment;
		}

		return result;
	}

	// Helper function to this.sendPost to transmit media to the remote server.
	//
	// <media> Media object to upload to Twitter.
	// <getMediaData> callback to the iOS system that provides access to the media files themselves.
	// <mediaIds> cumulative array to be passed to the continueCallback parameter when this procedure has completed.
	// <continueCallback> callback function used to alert the calling code to the completion of the (asynchronous) execution of this function.
	_loadMedia(media, mediaIds, getMediaData, continueCallback) {
		// Obtain the media data
		getMediaData(media, (media.type === 'video' ? 'video/mp4' : 'image/png'), (mediaData) => {

			// Ensure no error in obtaining the data
			if (mediaData.error) {
				this._error(mediaData.error, 'getMediaData', 'loadPosts');
				return;
			}

			// Create the form to submit the data
			let oauthHttp = this._createOAuthHttp();
			let form = new FormDataSender(oauthHttp.createHttp(this.oauthToken, this.oauthTokenSecret));

			// Determine if image or video
			if (media.type != 'video') {

				// Obtain the data
				let iData = new Buffer(mediaData.imageBase64Data, 'base64');

				// Submit form
				let options = {
					method: 'POST',
					host: 'upload.twitter.com',
					path: '/1.1/media/upload.json'
				}

				form.append('media', iData)
				form.submit(options, (data) => {
					data = this.jResponse(data);

					// Handle possible error
					if (data.errors) {
						this._error(data, 'submit', 'loadPosts');
						return // failed
					}

					// Obtain the media identifier
					let mediaId = data.media_id_string
					mediaIds.push(mediaId)

					// Continue processing
					continueCallback(mediaIds)
				}, (error) => {
					this._error(error, 'submit', 'loadPosts');
				})
			} else {
				let vData = new Buffer(mediaData.videoBase64Data, 'base64');
				// Initialise the video upload
				let initUrl = 'https://upload.twitter.com/1.1/media/upload.json?command=INIT&media_type=' + encodeURIComponent('video/mov') + '&total_bytes=' + vData.length;

				oauthHttp.post(initUrl, this.oauthToken, this.oauthTokenSecret, '', (data) => {

					data = this.jResponse(data);

					// Obtain the media identifier
					let videoMediaId = data.media_id_string
						// Now upload the video data
					let options = {
						method: 'POST',
						host: 'upload.twitter.com',
						path: '/1.1/media/upload.json?command=APPEND&media_id=' + videoMediaId + '&segment_index=0'
					}

					form.append('media', vData)
					form.submit(options, (data) => {
						// Finalise the video upload
						let finaliseUrl = 'https://upload.twitter.com/1.1/media/upload.json?command=FINALIZE&media_id=' + videoMediaId

						oauthHttp.post(finaliseUrl, this.oauthToken, this.oauthTokenSecret, '', (data) => {
							// Include the media
							mediaIds.push(videoMediaId);
							// Continue processing
							continueCallback(mediaIds);
						}, (error) => this._error(error, 'post', 'sendPost'));
					}, (error) => this._error(error, 'submit', 'sendPost'));
				}, (error) => this._error(error, 'post', 'sendPost'));
			}
		})
	}

	// Asynchronous helper function to load all the Media from the medias array.
	//
	// <medias> array of Media objects that require transmission to the remote server.
	// <mediaIds> cumulative array to collect the identifiers of the uploaded media objects into.
	// <getMediaData> callback to the iOS system that provides access to the media files themselves.
	// <continueCallback> Callback function to inform the calling code that the media upload has completed.
	//    CALLBACK PARAMETER: <mediaIds> array of identifiers of the uploaded media items.
	_loadAllMedia(medias, mediaIds, getMediaData, continueCallback) {
		if (medias.length === 0) {
			// No further media to obtain
			continueCallback(mediaIds);
		} else {
			// Load the media
			this._loadMedia(medias.pop(), mediaIds, getMediaData, (() => this._loadAllMedia(medias, mediaIds, getMediaData, continueCallback)));
		}
	}

	sendPost(post, getMediaData) {

		let url = '';
		let medias = [];
		var mediaIds = [];
		var sent = new Post({
			actions: [
				new Action({
					type: 'Comment'
				}),
				new Action({
					type: 'Delete'
				}),
				new Action({
					type: 'Like'
				}),
				new Action({
					type: 'Share'
				})
			],
			identity: this.identity,
			link: post.link,
			message: post.message,
			type: post.type
		});
		var oauthHttp = this._createOAuthHttp();

		url = 'https://api.twitter.com/1.1/statuses/update.json?status=' + encodeURIComponent(this._appendAdvertising(post));

		if (this._classifyPost(post) === TwitterDriver.Retweet) {
			url = 'https://api.twitter.com/1.1/statuses/retweet/' + post.id + '.json';
		} else if (this._classifyPost(post) === TwitterDriver.RetweetWithComment) {
			url = ('https://api.twitter.com/1.1/statuses/update.json?status=' + encodeURIComponent(this._appendAdvertising(post.comments[0])));
		}

		if (post.media && (this._classifyPost(post) === TwitterDriver.Post || this._classifyPost(post) === TwitterDriver.PostWithComment)) {
			medias = medias.concat(post.media);
		}

		this._loadAllMedia(medias, mediaIds, getMediaData, () => {
			// Provide the media to the url
			if (mediaIds.length > 0) {
				url = (url + '&media_ids=' + encodeURIComponent(mediaIds.reduce((m1, m2) => (m1 + ', ' + m2))));
			}

			// Create tweet with the media
			oauthHttp.post(url, this.oauthToken, this.oauthTokenSecret, '', (data) => {

				data = this.jResponse(data);

				if (data.errors) {
					this._error(data, 'post', 'sendPost');
				} else {
					// Flag that post retrieved
					sent.id = String(data.id_str);
					sent.postId = String(data.id_str);
					sent.creator = this._generateUser(data);

					// register reshare with comments as a retweet
					if (this._classifyPost(post) === TwitterDriver.RetweetWithComment) {
						oauthHttp.get(('https://api.twitter.com/1.1/statuses/retweet/' + post.id + '.json'), this.oauthToken, this.oauthTokenSecret, () => {
							sent.type = 'link';
							this.resolveMessageLinks(sent);
							this.broadcast('postSent', sent);
						}, (error) => {
							logger.warn(new ApolloError(error, this._origin('get', 'sendPost')));
						});
						// check if a tweet + comment needs to send its comment
					} else if (this._classifyPost(post) === TwitterDriver.PostWithComment) {
						this.on('postCommented', () => this.broadcast('postSent', sent));
						this.commentOnPost(sent, post.comments[0].message);
					} else {
						// And done
						this.broadcast('postSent', sent);
					}
				}
			}, (error) => this._error(error, 'post', 'sendPost'));
		})
	}

	loadPosts() {
		// Fresh load, so reset to no items and first page
		this.comments = [];
		let oauthHttp = this._createOAuthHttp();
		let fetchCallback = (data) => this.fetchTweetSuccess(data);
		let limit = (this.loadParameters && this.loadParameters.load_post_limit ? this.loadParameters.load_post_limit : 50);

		this.loadPosts = () => (this.broadcast('pageComplete'));

		// Load the twitter home feed
		oauthHttp.get(('https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + limit), this.oauthToken, this.oauthTokenSecret, fetchCallback, (error) => this._error(error, 'get', 'loadPosts'));
	}

	loadNotifications() {
		// Fresh load, so reset to no notifications
		this.notifications = [];

		let handleComplete = () => {
			if (isFailureInLoadNotifications) {
				return;
			}
			let isAllReturned = true;
			loadStates.forEach((loadState) => {
				if (!loadState.returned) {
					isAllReturned = false;
				}
			});
			if (isAllReturned) {
				this.broadcast('loadNotificationsComplete');
			}
		}

		// State for managing calls in parallel
		let isFailureInLoadNotifications = false;
		let loadStates = [{
			type: 'mentions',
			returned: false,
			url: 'https://api.twitter.com/1.1/statuses/mentions_timeline.json',
			messagePrefix: '',
			handleResponse: null,
			loadNotification: null,
			filter: null
		}, {
			type: 'retweets',
			returned: false,
			url: 'https://api.twitter.com/1.1/statuses/retweets_of_me.json',
			messagePrefix: '',
			handleResponse: null,
			loadNotification: 'OVERRIDDEN BELOW',
			filter: null
		}, {
			type: 'favourites',
			returned: false,
			url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
			messagePrefix: '',
			handleResponse: 'OVERRIDEN BELOW',
			loadNotifications: null,
			filter: null
		}];

		let loadNotifications = (data, loadState) => {

			// Determine if _failure
			if (isFailureInLoadNotifications) {
				return;
			}

			// Ensure have data in appropriate format
			data = this.jResponse(data);

			// Handle possible error
			if (data.errors || !Array.isArray(data)) {

				isFailureInLoadNotifications = true;
				this._error(data, 'loadNotifications', 'loadNotifications');
				
				return; // failed
			} 

			// Load the notifications
			data.forEach((rawNotification) => {

				// Determine the creation epoch time
				let creationEpochTime = 0;
				if (rawNotification.created_at) {
					creationEpochTime = new Date(rawNotification.created_at).getTime();
				}

				// Obtain the creator
				let creator = null;
				if (rawNotification.user) {
					creator = new User({
						vendor: 'twitter',
						id: rawNotification.user.screen_name,
						name: rawNotification.user.name,
						photoUrl: rawNotification.user.profile_image_url_https
					});
				}

				// Create the notification
				let notification = new Notification({
					vendor: 'twitter',
					id: rawNotification.id_str,
					timestamp: creationEpochTime,
					rawTimestamp: (loadState.messagePrefix ? loadState.messagePrefix : '') + rawNotification.created_at,
					message: rawNotification.text,
					creator: creator,
					memento: this.sMemento(rawNotification)
				});

				// Determine if filter
				if ((loadState.filter) && (loadState.filter(notification))) {
					return; // Do not include
				}

				// Add the notification
				if (loadState.loadNotification) {
					// Custom load the notification
					loadState.loadNotification(notification);
					// Custom load notification determines if complete
				} else {
					// Add the notification
					this.notifications.push(notification);
				}
			});

			// Determine if complete
			handleComplete();
		}

		// Provide custom load notification for retweets
		loadStates[1].loadNotification = (notification) => {

			// Add load state for this notification
			let loadState = {
				type: 'mentioner',
				returned: false,
				url: 'https://api.twitter.com/1.1/statuses/retweets/' + notification.id + '.json',
				messagePrefix: '',
				handleResponse: null,
				loadNotification: null,
				filter: null
			};
			loadStates.push(loadState);

			// Undertake request to obtain who mentioned
			let oauthHttp = this._createOAuthHttp()
			oauthHttp.get(
				loadState.url,
				this.oauthToken,
				this.oauthTokenSecret,
				(data) => {
					loadState.returned = true;
					loadNotifications(data, loadState);
				},
				(error) => {
					loadState.returned = true
					this.broadcastError(error, this._origin('get', 'loadNotifications'));
					handleComplete();
				}
			);
		}

		// Provide custom handle data for favourites
		loadStates[2].handleResponse = (data) => {

			// Determine if _failure
			if (isFailureInLoadNotifications) {
				return;
			}

			// Ensure have data in appropriate format
			data = this.jResponse(data);

			// Handle possible error
			if (data.errors) {
				isFailureInLoadNotifications = true;
				this._error(data, 'handleResponse', 'loadNotifications');
				return; // failed
			}

			// Obtain the logged in user
			let loggedInScreenName = data.screen_name;

			// Maximum number of users to attempt for following
			let maxUserTries = 5;

			// Find the followers of the user
			let followersLoadState = {
				type: 'mentioner',
				returned: false,
				url: 'https://api.twitter.com/1.1/followers/ids.json?stringify_ids=true&count=' + maxUserTries,
				messagePrefix: '',
				handleResponse: null,
				loadNotification: null,
				filter: null
			};
			loadStates.push(followersLoadState);

			// Obtain the followers
			let oauthHttp = this._createOAuthHttp();
			oauthHttp.get(
				followersLoadState.url,
				this.oauthToken,
				this.oauthTokenSecret,
				(data) => {
					followersLoadState.returned = true;

					// Determine if _failure
					if (isFailureInLoadNotifications) {
						return;
					}

					// Ensure have data in appropriate format
					data = this.jResponse(data);

					// Handle possible error
					if (data.errors) {
						isFailureInLoadNotifications = true;
						this._error(data, 'get', 'loadNotifications');
						return; // failed
					}

					// Obtain the favourites from followers
					let userIteration = 0;
					if (data.ids) {
						data.ids.forEach((userId) => {

							// Determine if may try user
							userIteration++
							if (userIteration > maxUserTries) {
								return;
							}

							// Add load state for this user
							let favouritesloadState = {
								type: 'mentioner',
								returned: false,
								url: 'https://api.twitter.com/1.1/favorites/list.json?user_id=' + userId + '&count=200',
								messagePrefix: 'Liked: ',
								handleResponse: null,
								loadNotification: null,
								// Do not include if not authored by logged in user
								filter: (notification) => (notification.creator.id != loggedInScreenName)
							};
							loadStates.push(favouritesloadState);

							// Undertake request to obtain who mentioned
							let oauthHttp = this._createOAuthHttp();
							oauthHttp.get(
								favouritesloadState.url,
								this.oauthToken,
								this.oauthTokenSecret,
								(data) => {
									favouritesloadState.returned = true;
									loadNotifications(data, favouritesloadState);
								},
								(error) => {
									isFailureInLoadNotifications = true;
									this._error(error, 'get', 'loadNotifications');
								}
							);
						});
					}
				},
				(error) => {
					isFailureInLoadNotifications = true;
					this._error(error, 'get', 'loadNotifications');
				}
			);

			// Handle possible complete (if no followers)
			handleComplete();
		}

		// Make all the requests
		loadStates.forEach((loadState) => {
			let oauthHttp = this._createOAuthHttp();
			oauthHttp.get(
				loadState.url,
				this.oauthToken,
				this.oauthTokenSecret,
				(data) => {
					loadState.returned = true;
					if (loadState.handleResponse) {
						// Custom handling of response
						loadState.handleResponse(data);
					} else {
						// Load the notifications
						loadNotifications(data, loadState);
					}
				},
				(error) => {
					isFailureInLoadNotifications = true;
					this._error(error, 'get', 'loadNotifications');
				}
			);
		});
	}

	likePost(post) {
		this._transmit(
			'https://api.twitter.com/1.1/favorites/create.json?id=' + post.id,
			'likePost',
			(data) => this.broadcast('postLiked', {
				postId: post.id,
				success: (data.favorited === 1)
			})
		);
	}

	unlikePost(post) {
		this._transmit(
			'https://api.twitter.com/1.1/favorites/destroy.json?id=' + post.id,
			'unlikePost',
			(data) => this.broadcast('postUnliked', {
				postId: post.id,
				success: (data.favorited === 0)
			})
		);
	}

	deletePost(data) {
		this._transmit(
			'https://api.twitter.com/1.1/statuses/destroy/' + data.id + '.json',
			'deletePost',
			(data) => this.broadcast('postDestroyed', {
				postId: data.id
			}));
	}

	commentOnPost(post, message) {

		let comment = ('@' + post.creator.id + ' ' + message)
		comment = encodeURIComponent(this._appendAdvertising({ message: comment }));

		this._transmit(
			'https://api.twitter.com/1.1/statuses/update.json?status=' + comment + '&in_reply_to_status_id=' + post.id,
			'commentOnPost',
			(data) => this.broadcast('postCommented', {
				postId: post.id,
				commentId: String(data.id_str)
			})
		);
	}

    // Will either generate and append an advertising string to the given Post object, or nothing is the resultant message is too long for Twitter.
	//
	// <post>	Post object to update the message property of, as appropriate to text.
	// RETURN 	Newly-minted message to be used in lieu of the Post's message.
	_appendAdvertising(post) {

		let existing = post.message;
		let limit = LENGTH_TWEET_ADAPPENDABLE;
		let append = ' with www.mysocialstream.com/find-out-more';
		let match = null;

		let convertUrl = (text) => {
			while ((match = URL_RESOLVABLE_LINK.exec(text)) !== null) {
				limit = limit + match[0].length - 23;
			}
		};

		if (post.media && post.media.length) {
			append = ('Uploaded' + append);
		} else {
			append = ('Tweeted' + append);
		}

		if (existing) {

			convertUrl(append);
			convertUrl(existing);

			if (2 + append.length + existing.length <= limit) {
				append = (existing + '\n\n' + append);
			} else {
				append = existing;
			}
		}

		return append;
	}

	// Checks for and removed the advertising string from any posts received from Twitter.
	//
	// <post>	Post object to clean the message property from.
	// RETURN 	Original post object possibly with advertising text removed.
	_removeAdvertising(post) {

		let match = post.message.match(REGEX_APOLLO_ADVERTISING_TEXT);

		if (match) {
			post.message = match[1];
		}

		return post;
	}

	// Helper to the like and unlike posts functions. This function will either broadcast any errors, or call the broadcast callback.
	//
	// <url>			URL to issue the Twitter API request to.
	// <publicBlock>	public API function using this helper function.
	// <success> 		success callback function
	_transmit(url, publicBlock, success) {

		let oauthHttp = this._createOAuthHttp();

		oauthHttp.post(url, this.oauthToken, this.oauthTokenSecret, '', (data) => {

			// Ensure is JSON
			data = this.jResponse(data);
			// Handle possible error
			if (data.errors) {
				this._error(data, 'post', publicBlock);
			} else {
				success(data);
			}
		}, (error) => this._error(error, 'post', publicBlock));
	}
}

// Constants used to classify the type of Post for transmission.
TwitterDriver.Post = 0;
TwitterDriver.PostWithComment = 1;
TwitterDriver.Retweet = 2;
TwitterDriver.RetweetWithComment = 3;

// Specifies the limit of likes that moves a post into a popular post
TwitterDriver.TWITTER_POPULAR_MIN_LIKES = 50
