import {EndPageCursorTransform} from './instagram/transform/EndPageCursorTransform.es6';
import {FormDataSender} from './formData.es6';
import {FrontPageFeedTransform} from './instagram/transform/feed/FrontPageFeedTransform.es6';
import {HtmlEnv} from './env/HtmlEnv.es6';
import {NetworkDriver} from './NetworkDriver.es6';
import {Origin} from './data/origin.es6';
import {PagedCommentsTransform} from './instagram/transform/comments/PagedCommentsTransform.es6';
import {PagedFeedTransform} from './instagram/transform/feed/PagedFeedTransform.es6';
import {TopCommentsTransform} from './instagram/transform/comments/TopCommentsTransform.es6';

let urlparser = require('url');
let crypto = require('crypto');
let moment = require('moment');

// URL to issue Instagram scraper requests to.
const INSTAGRAM_HOST = 'www.instagram.com';

// maximum number of posts in a load
const COUNT_POSTS_MAXIMUM = 50;

// Template of payload for requesting the next page of posts
const NEXT_PAGE_PAYLOAD_TEMPLATE = 'q=ig_me()+%7B%0A++feed+%7B%0A++++media.after(NEXT_PAGE_CURSOR_TAG%2C+12)+%7B%0A++++++nodes+%7B%0A++++++++id%2C%0A++++++++caption%2C%0A++++++++code%2C%0A++++++++comments.last(4)+%7B%0A++++++++++count%2C%0A++++++++++nodes+%7B%0A++++++++++++id%2C%0A++++++++++++created_at%2C%0A++++++++++++text%2C%0A++++++++++++user+%7B%0A++++++++++++++id%2C%0A++++++++++++++profile_pic_url%2C%0A++++++++++++++username%0A++++++++++++%7D%0A++++++++++%7D%2C%0A++++++++++page_info%0A++++++++%7D%2C%0A++++++++date%2C%0A++++++++dimensions+%7B%0A++++++++++height%2C%0A++++++++++width%0A++++++++%7D%2C%0A++++++++display_src%2C%0A++++++++is_video%2C%0A++++++++likes+%7B%0A++++++++++count%2C%0A++++++++++nodes+%7B%0A++++++++++++user+%7B%0A++++++++++++++id%2C%0A++++++++++++++profile_pic_url%2C%0A++++++++++++++username%0A++++++++++++%7D%0A++++++++++%7D%2C%0A++++++++++viewer_has_liked%0A++++++++%7D%2C%0A++++++++location+%7B%0A++++++++++id%2C%0A++++++++++has_public_page%2C%0A++++++++++name%0A++++++++%7D%2C%0A++++++++owner+%7B%0A++++++++++id%2C%0A++++++++++blocked_by_viewer%2C%0A++++++++++followed_by_viewer%2C%0A++++++++++full_name%2C%0A++++++++++has_blocked_viewer%2C%0A++++++++++is_private%2C%0A++++++++++profile_pic_url%2C%0A++++++++++requested_by_viewer%2C%0A++++++++++username%0A++++++++%7D%2C%0A++++++++usertags+%7B%0A++++++++++nodes+%7B%0A++++++++++++user+%7B%0A++++++++++++++username%0A++++++++++++%7D%2C%0A++++++++++++x%2C%0A++++++++++++y%0A++++++++++%7D%0A++++++++%7D%2C%0A++++++++video_url%0A++++++%7D%2C%0A++++++page_info%0A++++%7D%0A++%7D%2C%0A++id%2C%0A++profile_pic_url%2C%0A++username%0A%7D%0A&ref=feed%3A%3Ashow'

// Regular expression for detecting the advertising string.
const REGEX_ADVERTISING_TEXT = /(.*)(\n*Image uploaded with Social Stream\nhttp:\/\/mysocialstream\.com\/find-out-more)$/;

export class InstagramDriver extends NetworkDriver {

	constructor(identity, loadParameters) {

		super();
		if (!identity) throw new Error('Must provide Identity for Instagram');
		if (!identity.oauthToken) throw new Error('Must provide Token for Instagram');
		if (!identity.oauthSecret) throw new Error('Must provide Cookies for Instagram');
		if (!identity.userId) throw new Error('Must provide userId for Instagram');

		let token = JSON.parse(identity.oauthToken)

		this.items = [];
		this.uuid = token.uuid;
		this.notifications = [];
		this.identity = identity;
		this.nextPageCursor = false;
		this.cookies = token.cookies;
		this.deviceId = token.deviceId;
		this.csrfToken = token.csrfToken;
		this.loadParameters = loadParameters;
		this.accessToken = identity.oauthToken;

		// These transformer properties are mocked in unit tests. Please ensure that they remain instance properties.
		this.topCommentsTransform = new TopCommentsTransform();
		this.endPageCursorTransform = new EndPageCursorTransform();
		this.pagedCommentsTransform = new PagedCommentsTransform();
		this.feedTransform = new FrontPageFeedTransform(this.topCommentsTransform);
		this.pagedFeedTransform = new PagedFeedTransform(this.topCommentsTransform);

		// Error reporting convenience block.
		this._origin = (cBlock, pBlock) => new Origin(cBlock, 'InstagramDriver', pBlock);
	}

	loadPosts() {

		let html = new HtmlEnv(this, this.http, INSTAGRAM_HOST);
		let complete = (data, headers) => {

			let posts = [];

			data = this.jResponse(data);

            this.broadcast('htmlCatehed', {htmlEnv:this, response:JSON.stringify(data)});

			this.feedTransform.commentsTransform = this._getCommentTransform(data);

			if (!data) {

				this.broadcast('pageComplete');

			} else if (data.meta && 200 !== data.meta.code) {

				this.broadcastError(data.meta.error_message, this._origin('loadPosts', 'loadPosts'));

			// New GraphQL based JSON.
			} else if (data.graphql && data.graphql.user && data.graphql.user.edge_web_feed_timeline) {

				posts = this.feedTransform.transform(data.graphql.user.edge_web_feed_timeline);
				this.nextPageCursor = this.endPageCursorTransform.transform(data.graphql.user.edge_web_feed_timeline);

				// catches UnKnown posts
				let unformated = this.feedTransform.getUnformatted(data.graphql.user.edge_web_feed_timeline);
                if( unformated.length > 0 ){
                    logger.warn(new ApolloError('Some data have structure issue : ' + JSON.stringify(unformated)), this._origin('loadPosts', 'loadPosts'));
                }

			// Legacy JSON, still used in the secondary pages.
			} else if (data.feed && data.feed.media) {

				posts = this.pagedFeedTransform.transform(data.feed.media);
				this.nextPageCursor = this.endPageCursorTransform.transform(data.feed.media);

                // catches UnKnown posts
                let unformated = this.pagedFeedTransform.getUnformatted(data.feed.media);
                if( unformated.length > 0 ){
                    logger.warn(new ApolloError('Some data have structure issue : ' + JSON.stringify(unformated)), this._origin('loadPosts', 'loadPosts'));
                }

            } else {

				logger.warn(new ApolloError('Received invalid JSON in InstagramDriver: ' + JSON.stringify(data)), this._origin('complete', 'loadPosts'));

			}

			// Filter out posts based on load parameter values
			posts.forEach((post) => {

				if (this.items.indexOf(post.id) !== -1 || this.items.length >= COUNT_POSTS_MAXIMUM) {
					return false;
				}

				// Load the identity onto the post
				post.identity = this.identity;

				// Remove signature from posts originating from socialstream
				post.message = this._stripSignature(post.message);

				// Determine if include the post
				if (this.loadParameters) {

					// Retrieve only friends' posts. Friends are expected not to comment too much on each others' posts.
					if (this.loadParameters.media_friends <= 33 && post.commentsCount < InstagramDriver.INSTAGRAM_COMMUNITY_MIN_COMMENTS) {
						return;
					// Retrieve only public posts. Public posts are expected to generate a lot of chatter.
					} else if (this.loadParameters.media_friends > 66 && post.commentsCount >= InstagramDriver.INSTAGRAM_COMMUNITY_MIN_COMMENTS) {
						return;
					// Retrieve only popular posts - those with a large number of likes.
					} else if (this.loadParameters.popular_mostRecent <= 33 && post.likeCount < InstagramDriver.INSTAGRAM_POPULAR_MIN_LIKES) {
						return;
					// Retrieve only recent posts - those that are too new to have garnered too many likes.
					} else if (this.loadParameters.popular_mostRecent > 66 && post.likeCount > InstagramDriver.INSTAGRAM_POPULAR_MIN_LIKES) {
						return;
					}
				}

				if (post.comments && post.comments.length && post.nextCommentPage) {
					this._pageComments(post, post.comments[post.comments.length - 1].id);
				}

				this.items.push(post.id);
				this.broadcast('postLoaded', post);
			});

			this.broadcast('pageComplete');

		};

		if (this.nextPageCursor) {

			let payload = NEXT_PAGE_PAYLOAD_TEMPLATE.replace('NEXT_PAGE_CURSOR_TAG', encodeURIComponent(this.nextPageCursor));
			let nextPageOptions = this._generateScraperRequest('POST', 'https://' + INSTAGRAM_HOST + '/query/');
			nextPageOptions.headers['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
			nextPageOptions.body = payload;

			// Now parsing the old datum.
			this.feedTransform = this.pagedFeedTransform;

			html.issuePost(nextPageOptions, this._origin('issuePost', 'loadPosts'), complete);

		} else if (this.items.length === 0) {

			html.issueGet({ path: '/?__a=1&hl=en' }, this._origin('issueGet', 'loadPosts'), complete);

		} else {
			// just return if it is not a first page request but we have no page cursor
			this.broadcast('pageComplete');
		}
	}



    /**
	 * Fetches the appropriate comment transform for the given JSON data.
	 */
	_getCommentTransform(data) {
		let sData = this.sMemento(data);
		return (sData.contains('edge_media_to_comment') ? this.topCommentsTransform : this.pagedCommentsTransform);
	}



	_stripSignature(message) {

		let signature = (message ? message.match(REGEX_ADVERTISING_TEXT) : false);

		return (signature ? signature[1] : message);
	}

	loadNotifications() {
		// No notifications available for Instagram
		this.notifications = []
		this.broadcast('loadNotificationsComplete')
	}

	likePost(post) {
		this._likePostDelegate(post, true);
	}

	unlikePost(post) {
		this._likePostDelegate(post, false);
	}

	_likePostDelegate(post, isLike) {

		let options = false;
		let like = this.hasAction(post, 'Like');
		let action = isLike ? '/like/' : '/unlike/';
		let notification = isLike ? 'postLiked' : 'postUnliked';
		let eLike = () => (isLike ? 'likePost' : 'unlikePost');

		let success = (data, headers) => {

			if (!this.isSuccessfulRequest(headers)) {
				let reason = (headers.status.reason || headers.status.code || 'Failed to successfully transmit like');
				this.broadcastError(reason, this._origin('success', eLike()));
			} else {

				data = this.jResponse(data);

				this.broadcast(notification, {
					commentId: data.id,
					postId: post.id
				});
			}
		};

		if (like && like.target) {

			options = this._generateScraperRequest('POST', like.target + action);
			this.http.request(options, success, (error) => this.broadcastError(error, this._origin('request', eLike())));

		} else {
			this.broadcastError('No like target available', this._origin('_likePostDelegate', eLike()));
		}

	}

	_pageComments(post, startCommentId) {

		let page = false;
		let options = this._generateScraperRequest('POST', 'https://www.instagram.com/query/');

		options.body = 'q=ig_shortcode(' + post.memento + ')+%7B%0A++comments.before(%0A++++++++++++' + startCommentId + '%2C%0A++++++++++++8%0A++++++++++)+%7B%0A++++count%2C%0A++++nodes+%7B%0A++++++id%2C%0A++++++created_at%2C%0A++++++text%2C%0A++++++user+%7B%0A++++++++id%2C%0A++++++++profile_pic_url%2C%0A++++++++username%0A++++++%7D%0A++++%7D%2C%0A++++page_info%0A++%7D%0A%7D%0A&ref=media%3A%3Ashow';
		
		let success = (data, headers) => {

			data = this.jResponse(data);

			if (!this.isSuccessfulRequest(headers)) {

				let reason = (headers.status.reason || headers.status.code || 'Failed to successfully transmit like');
				this.broadcastError(reason, this._origin('success', 'loadPosts'));
			
			} else {

				page = this.pagedCommentsTransform.transform(data);
				post.comments = post.comments.concat(page.comments);
				post.property = 'comments';

				this.broadcast('postUpdated', post);
			}
		};

		this.http.request(options, success, (error) => this.broadcastError(error, this._origin('request', 'loadPosts')));
	}

    deletePost(postId) {
		// do absolutely nothing because this should never get called
		// if it is called, broadcast the message
		this.broadcastError('Instagram post deleting is not supported.', new Origin('deletePost', 'InstagramDriver', 'deletePost'));
	}

	sendPost(post, getMediaData) {

		let completion = false;

		// Complete
		let postSent = (mediaId) => {
			this.broadcast('postSent', {
				postId: mediaId,
				actions: []
			});
		};

		// Determine if comment on post
		if (post.comments && post.comments.length > 0) {
			completion = (mediaId) => this.apiCommentOnPost({ id: mediaId }, post.comments[0].message, 'sendPost', () => postSent(mediaId));
		} else {
			completion = postSent;
		}

		if (post.media[0].type === 'video') {
			// Upload video
			this.uploadVideo(post, post.media[0], getMediaData, completion);

		} else {
			// Upload photo
			this.uploadPhoto(post, post.media[0], getMediaData, null, completion);
		}
	}

	_formatAdText(noun, message) {
		let adCommentText = (noun + ' uploaded with Social Stream\nhttp://mysocialstream.com/find-out-more');
		adCommentText = (message ? (message + '\n\n' + adCommentText) : adCommentText);

		return adCommentText;
	}

	// Uploads a video
	// <post> Post
	// <media> Media containing the video
	// <data> Data of the video
	// <completion> Completion function provided the created media Id
	uploadVideo(post, media, getMediaData, completion) {
		getMediaData(media, 'video/mp4', (data) => {

			// Determine if error in obtaining data
			if (data.error) {
				this.broadcastError(data.error, new Origin('getMediaData', 'InstagramDriver', 'sendPost'));
				return
			}

			// Obtain the video data
			var videoData = new Buffer(data.videoBase64Data, 'base64')

			// Generate an upload id
			let upload_id = String(new Date().getTime());

			// Initiate video upload to Instagram
			var init_options = {
				url: 'https://i.instagram.com/api/v1/upload/video/',
				method: 'POST',
				headers: {
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate',
					accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'User-Agent': InstagramDriver.USER_AGENT,
					connection: 'keep-alive',
					Cookie: this.cookies
				}
			}
			let form = new FormDataSender(this.http)
			form.append('_csrftoken', this.csrfToken)
			form.append('_uuid', this.uuid)
			form.append('upload_id', upload_id)
			form.append('media_type', 2)
			form.submit(init_options, (data, headers) => {

				// Ensure no error in upload
				data = JSON.parse(data)
				if (data.status !== 'ok') {
					this.broadcastError('Failed to initiate video upload: ' + data.message, new Origin('submit', 'InstagramDriver', 'sendPost'));
					return
				}

				// Obtain the video upload details
				let uploadChunkCount = data.video_upload_urls.length
				let uploadUrl = data.video_upload_urls[uploadChunkCount - 1].url
				let job = data.video_upload_urls[uploadChunkCount - 1].job

				// Split the data into upload chunks
				let dataLength = videoData.length
				let requestLength = Math.round(dataLength / uploadChunkCount)
				let lastRequestExtraLength = dataLength - (requestLength * uploadChunkCount)

				// Upload each chunk of the video
				let uploadChunkIndexes = []
				for (let i = 0; i < uploadChunkCount; i++) {
					uploadChunkIndexes.push(i)
				}
				uploadChunkIndexes.forEach((i) => {

					// Create the chunk
					let startIndex = i * requestLength
					let endIndex = ((i + 1) * requestLength) + (i === (uploadChunkCount - 1) ? lastRequestExtraLength : 0)
					let chunk = videoData.slice(startIndex, endIndex)

					// Upload the chunk
					let upload_options = {
						url: uploadUrl,
						method: 'POST',
						headers: {
							Connection: 'keep-alive',
							Accept: '*/*',
							Host: 'upload.instagram.com',
							'Accept-Encoding': 'gzip, deflate',
							'Content-Type': 'application/octet-stream',
							'Session-ID': upload_id,
							'Accept-Language': 'en-en',
							'Content-Disposition': 'attachment; filename="video.mov"',
							'Content-Length': (endIndex - startIndex),
							'Content-Range': 'bytes ' + startIndex + '-' + (endIndex - 1) + '/' + dataLength,
							Cookie: this.cookies,
							job: job
						},
						body: chunk
					}
					this.http.request(upload_options, (data, headers) => {

						// Determine if final response
						if (!data.startsWith('{')) {
							return // not last response
						}

						// Ensure no error in upload
						data = JSON.parse(data)
						if (data.status !== 'ok') {
							this.broadcastError('Failed to upload video: ' + status.message, this._origin('request', 'sendPost'));
							return
						}

						// Upload the photo
						this.uploadPhoto(post, {
							type: 'photo',
							srcUrl: media.imageUrl
						}, getMediaData, upload_id, () => {

							// Confirm the video upload
							let confirmJSON = {
								upload_id: upload_id,
								source_type: '3',
								poster_frame_index: 0,
								length: 0.00,
								audio_muted: false,
								filter_type: '0',
								video_result: 'deprecated',
								clips: {
									length: (media.duration / 1000),
									source_type: '3',
									camera_position: 'back'
								},
								extra: {
									source_width: 960,
									source_height: 1280
								},
								device: {
									manufacturer: 'Xiaomi',
									model: 'HM 1SW',
									android_version: 18,
									android_release: '4.3',
								},
								_csrftoken: this.csrfToken,
								_uuid: this.uuid,
								_uid: this.identity.userId,
								caption: this._formatAdText('Video', post.message)
							}
							this.doApiRequest('/api/v1/media/configure/?video=1', confirmJSON, 'sendPost', (data) => {

								// Obtain the identifier
								let mediaId = data.media.id

								// Successfully uploaded
								completion(mediaId)
							})
						})
					}, (error) => {
						this.broadcastError(error, this._origin('request', 'sendPost'));
					});
				})
			}, (error) => {
				this.broadcastError(error, this._origin('submit', 'sendPost'));
			});
		})
	}

	// Uploads a photo
	// <post> Post
	// <media> Media containing the photo
	// <upload_id> Upload Id if uploading the photo for video (otherwise undefined)
	// <completion> Completion function provided the created media Id
	uploadPhoto(post, media, getMediaData, upload_id, completion) {
		getMediaData(media, 'image/jpeg', (data) => {

			// Determine if error in obtaining data
			if (data.error) {
				this.error(data.error)
				return
			}

			// Obtain the image data
			var imageData = new Buffer(data.imageBase64Data, 'base64')
			var imageWidth = data.imageWidth
			var imageHeight = data.imageHeight

			// Generate an upload id (if just uploading photo)
			if (!upload_id) {
				upload_id = String(new Date().getTime());
			}

			// Upload photo to instagram
			var post_options = {
				url: 'https://i.instagram.com/api/v1/upload/photo/',
				method: 'POST',
				headers: {
					'Accept-Language': 'en-US,en;q=0.5',
					'Accept-Encoding': 'gzip, deflate',
					accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'User-Agent': InstagramDriver.USER_AGENT,
					connection: 'keep-alive',
					Cookie: this.cookies
				}
			}
			let form = new FormDataSender(this.http)
			form.append('_csrftoken', this.csrfToken)
			form.append('_uuid', this.uuid)
			form.append('upload_id', upload_id)
			form.append('photo', imageData, {
				filename: 'test.jpg',
				'Content-Type': 'image/jpeg'
			})
			form.submit(post_options, (data, headers) => {

				// Ensure no error in upload
				data = JSON.parse(data)
				if (data.status !== 'ok') {
					this.error('Failed to upload photo: ' + data.message)
					return
				}

				// Obtain the upload id
				let uploadId = data.upload_id

				// Confirm the post
				var confirmJSON = {
					'upload_id': uploadId,
					'camera_model': 'HM1S',
					'source_type': 3,
					'date_time_original': moment().format('Y:MM:DD HH:mm:ss'),
					'camera_make': 'XIAOMI',
					'edits': {
						'crop_original_size': [imageWidth, imageHeight],
						'crop_zoom': 1.3333334,
						'crop_center': [0.0, -0.0]
					},
					'extra': {
						'source_width': imageWidth,
						'source_height': imageHeight
					},
					'device': {
						'manufacturer': 'Xiaomi',
						'model': 'HM 1SW',
						'android_version': 18,
						'android_release': '4.3'
					},
					'_csrftoken': this.csrfToken,
					'_uuid': this.uuid,
					'_uid': this.identity.userId,
					'caption': this._formatAdText('Image', post.message)
				}
				this.doApiRequest('/api/v1/media/configure/', confirmJSON, 'sendPost', (data) => {

					// Obtain the identifier
					let mediaId = data.media.id

					// Successfully uploaded
					completion(mediaId)

				})
			}, (error) => {
				this.broadcastError(error, new Origin('submit', 'InstagramDriver', 'sendPost'));
			});
		})
	}

	// Creates a comment on the post
	// <post>			Post to comment on.
	// <message>		Message of the comment.
	// <publicBlock>	public API method that delegates to this function.
	// <completion> 	Completion method.
	apiCommentOnPost(post, message, publicBlock, completion) {

		// Must delay comments, so does not consider us a spammer by commenting too fast
		let humanWaitTime = 1000 + (Math.random() * 1000)
		setTimeout(() => {

			// Comment on the post
			let commentJSON = {
				'_csrftoken': this.csrfToken,
				'_uuid': this.uuid,
				'_uid': this.identity.userId,
				'comment_text': message
			}
			this.doApiRequest('/api/v1/media/' + post.id + '/comment/', commentJSON, publicBlock, (data) => {

				// Complete
				completion()
			})
		}, humanWaitTime)
	}

	// Undertakes a request to the API
	// <path>			Path to make the request.
	// <json>			JSON payload data
	// <publicBlock>	public API method that delegates to this function.
	// <success>		Completion function with parameters of the JSON parsed data and headers
	doApiRequest(path, json, publicBlock, success) {

		// Undertake the API request
		var signedBody = InstagramDriver.createSignedBody(json)
		var igSigKeyVersion = 'ig_sig_key_version=4'
		var options = {
			url: 'https://i.instagram.com' + path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': InstagramDriver.USER_AGENT,
				Cookie: this.cookies
			},
			body: signedBody + '&' + igSigKeyVersion
		};
		this.http.request(options, (data, headers) => {

			// Ensure no error in upload
			data = JSON.parse(data)
			if (data.status !== 'ok') {
				this.broadcastError(data.message, this._origin('request', publicBlock));
				return
			}

			// Successful
			success(data, headers)

		}, (error) => {
			this.broadcastError(error, this._origin('request', publicBlock));
		})
	}

	commentOnPost(post, message) {

		let options = false;
		let comment = this.hasAction(post, 'comment');

		let success = (data, headers) => {

			if (!this.isSuccessfulRequest(headers)) {
				let reason = (headers.status.reason || headers.status.code || 'Failed to successfully transmit comment');
				this.broadcastError(reason, new Origin('success', 'InstagramDriver', 'commentOnPost'));
			} else {

				data = this.jResponse(data);

				this.broadcast('postCommented', {
					commentId: data.id,
					postId: post.id
				});
			}
		};

		if (comment && comment.target) {

			options = this._generateScraperRequest('POST', comment.target);
			options.body = ('comment_text=' + message);

			this.http.request(options, success, (error) => this.broadcastError(error, this._origin('request', 'commentOnPost')));
		} else {
			this.broadcastError('No commenting target available.', this._origin('commentOnPost', 'commentOnPost'));
		}
	}

	_generateScraperRequest(method, url) {

		let parsed = urlparser.parse(url);
		let token = this.identity.oauthSecret.match(/csrftoken=([a-zA-Z0-9]+)/)[1];

		return {
			headers: {
				cookie: this.identity.oauthSecret,
				origin: 'https://www.instagram.com',
				referer: 'https://www.instagram.com',
				'x-csrftoken': token
			},
			protocol: parsed.protocol,
			host: parsed.hostname,
			method: method,
			path: parsed.pathname
		}
	}
}

// Specifies the limit of comments that moves a post into a popular post
InstagramDriver.INSTAGRAM_COMMUNITY_MIN_COMMENTS = 20

// Specifies the limit of comments that moves a post into community post
InstagramDriver.INSTAGRAM_POPULAR_MIN_LIKES = 1000

// Specifies the SuggestedUser Posts Field
InstagramDriver.INSTAGRAM_GRAPH_SUGGESTED_USER = 'GraphSuggestedUserFeedUnit'

// Private key and User-Agent obtained from: https://github.com/mgp25/Instagram-API/blob/master/src/Constants.php
InstagramDriver.USER_AGENT = 'Instagram 8.2.0 Android (18/4.3; 320dpi; 720x1280; Xiaomi; HM 1SW; armani; qcom; en_US)'
InstagramDriver.createSignedBody = function(json) {
	var jsonText = JSON.stringify(json)
	let hmac = crypto.createHmac('sha256', '55e91155636eaa89ba5ed619eb4645a4daf1103f2161dbfe6fd94d5ea7716095')
	hmac.update(jsonText);
	var signedJson = hmac.digest('hex')
	return 'signed_body=' + signedJson + '.' + encodeURIComponent(jsonText)
}

// Login Instagram API
InstagramDriver.loginInstagramApi = function(username, password, environment, callback) {

	// Generate the unique device ID to use
	let hash = crypto.createHash('md5')
	hash.update(username + password)
	let seed = hash.digest('hex')
	let deviceId = 'android-' + (seed.substring(0, 16))

	// Generate the UUID to use
	let s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
	let uuid = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()

	// Undertake login
	var loginJSON = {
		_uuid: uuid,
		device_id: deviceId,
		username: username,
		password: password,
		_csrftoken: 'missing'
	}
	var signedBody = InstagramDriver.createSignedBody(loginJSON)
	var igSigKeyVersion = 'ig_sig_key_version=4'
	var loginOptions = {
		url: 'https://i.instagram.com/api/v1/accounts/login/',
		host: 'i.instagram.com',
		path: '/api/v1/accounts/login/',
		method: 'POST',
		headers: {
			origin: 'qrc://',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': InstagramDriver.USER_AGENT,
		},
		body: signedBody + '&' + igSigKeyVersion
	}
	environment.http.request(loginOptions, (data, headers) => {

		var instaValidErrors = [
			"The username you entered doesn't appear to belong to an account. Please check your username and try again.",
			"The password you entered is incorrect. Please try again.",
			"Please use your username to login"
		];
		var instaHidenErrros = [
			["Invalid Parameters", "Missing username or password. Please try again."],
			["The password you entered is incorrect. Please try again or log in with Facebook.", "The password you entered is incorrect. Please try again."],
			["checkpoint_required", "Instagram requires you to verify your account before proceeding. To do so login to the Instagram website or Instagram app, verify your account and then proceed to add your account to Social Stream again."]
		]

		var isValidInstaError = (error) => (instaValidErrors.filter((validError) => (error === validError)).map((validError) => callback({
			error: {
				error: error,
				code: 3
			}
		})));
		var isHiddenInstaError = (error) => (instaHidenErrros.filter((hiddenError) => (hiddenError[0] === error)).map((hiddenError) => callback({
			error: {
				error: hiddenError[1],
				code: 4
			}
		})));

		// Obtain details from login
		data = JSON.parse(data)

		if (data.logged_in_user) {
			let userId = data.logged_in_user.pk

			// Obtain the login cookies
			var cookieString = headers['Set-Cookie']
			let cookies = InstagramDriver.getCookies(cookieString, ['ds_user', 'mid', 'ds_user_id', 'sessionid', 'csrftoken', 's_network'])

			// Return the login information
			callback({
				userId: userId,
				token: JSON.stringify({
					deviceId: deviceId,
					uuid: uuid,
					csrfToken: cookies.csrftoken,
					cookies: InstagramDriver.getCookieString(cookies)
				})
			})

		} else if (isValidInstaError(data.message).length === 0 && isHiddenInstaError(data.message).length === 0) {
			callback({
				error: {
					error: "Error with Instagram, please try again soon.",
					code: 5
				}
			});
		}

	}, (error) => {
		callback({
			error: error
		})
	})
}


// Helper functions
InstagramDriver.getCookieValue = function(cookieString, cookieName) {
	let regex = new RegExp(cookieName + '=([^;]+);')
	let matches = cookieString.match(regex)
	return (matches && (matches.length > 1)) ? matches[1] : ''
}
InstagramDriver.getCookies = function(cookieString, cookieNames, existing) {
	let cookies = existing || {}
	cookieNames.forEach((cookieName) => {
		let cookieValue = InstagramDriver.getCookieValue(cookieString, cookieName)
		cookies[cookieName] = cookieValue
	})
	return cookies
}
InstagramDriver.getCookieString = function(cookies) {
	let result = ''
	for (var name in cookies) {
		result = result + name + '=' + cookies[name] + '; '
	}
	return result
}