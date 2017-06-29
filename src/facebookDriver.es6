import {DefaultHandlerFactory} from './HtmlHandlerFactory.es6';
import {Expression} from './expression.es6';
import {FormDataSender} from './formData.es6';
import {FormTransform} from './facebook/transform/FormTransform.es6';
import {HtmlEnv} from './env/HtmlEnv.es6';
import {NetworkDriver} from './NetworkDriver.es6';
import {Origin} from './data/origin.es6';
import {Post} from './data/post.es6';
import {FuzzyTimestamp} from './fuzzyTimestamp.es6';

let htmlparser = require('htmlparser2');
let querystring = require('querystring');
let urlparser = require('url');

// Maximum number of Facebook Posts to parse before alerting the outside world to the loading.
const COUNT_POSTS_MAXIMUM = 50;
// URL to issue Facebook scraper requests to.
const FACEBOOK_MOBILE_HOST = "mbasic.facebook.com";

export class FacebookDriver extends NetworkDriver {

	constructor(identity, config, scraperFactory, userRegistry) {

		super();

		if (!identity) throw new Error('Must provide Identity for Facebook');
		if (!identity.oauthSecret) throw new Error('Must provide Cookies (oauthSecret) for Facebook');
		if (!identity.userId) throw new Error('Must provide Facebook userId');

		this.items = [];
		this.postCount =0;
		this.postData = [];
		this.config = config;
		this.notifications = [];
		this.identity = identity;
		this.users = userRegistry;
		this.nextExtractsPageUrl = null;
		this.scraperFactory = scraperFactory;
		this.fuzzyTimestamp = new FuzzyTimestamp();
		this.scrapeUserId = (this.identity.oauthSecret.match(/c_user=([0-9]+)/)[1]);

		if (!this.scraperFactory) {
			this.scraperFactory = new DefaultHandlerFactory();
		}

		// Single-line reusable functions for instant punch!
		this._origin = (cBlock, pBlock) => { return new Origin(cBlock, 'FacebookDriver', pBlock) };
		
		// Obtains the redirect location from headers
		this._getRedirectLocation = (headers, originalUrl, data) => {
		    let location = headers.location
		    if (originalUrl) {
	            if (headers['x-redirect-locations'] && headers['x-redirect-locations'][originalUrl]) {
	                location = headers['x-redirect-locations'][originalUrl];
	            }
		    }
		    return location
		}
	}

	// Success callback for the loading of (HTML-based) screen scraping.
	//
	// This function will set the (stateful) variable (this.items) with Post data, using data from a batched Graph API call.
	// As this call is asynchronous, this function takes a callback function from its calling code to execute when
	// all Post data has finished loading.
	//
	// <response> raw response received from call to m.facebook.com from which to derive Post data.
	// <callback> function used to indicate to the parent function that all Post data has been determined.
	__successScrapedPosts(response, callback) {

        let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);
        this.broadcast('htmlCatehed', {htmlEnv:this, response:response.toString()});

		var onEndFilter = (error, data) => {

			if (error) {
				// Stop as error
				callback();

				// reporting error
                logger.warn(new ApolloError('Cannot read Html in facebookDriver: ' + JSON.stringify(error)), this._origin('complete', 'loadPosts'));
                return;
			}

			// Obtain next page URL
			this.nextExtractsPageUrl = data.nextPageUrl;
			// Determine if have identifiers
			if (data.posts && data.posts.length > 0) {
				return onEndRequester(data.posts);
			} else {
				// No identifiers, so end
				callback();
            }
		}

		var onEndRequester = (posts) => {

			// Number of Post objects with outstanding requests
			let numberOfItemsWaitingOn = posts.length;
            var unformatedPosts = [];

			let handleCompletion = (post) => {

				post.outstanding--;

				if (post.outstanding === 0) {

					if (!this.items.includes(post.id) && (this.config.media_friends === 100) ? post.media_friends === 'friend' : ((this.config.media_friends === 0) ? post.media_friends === 'media' : true) ) {
						this.items.push(post.id);
						this.broadcast('postLoaded', post);
						this.resolveMessageLinks(post);
                    }else{
                        unformatedPosts.push(post);
                    }
					numberOfItemsWaitingOn--;
				}

				// Handle completion when done
				if (this.items.length >= COUNT_POSTS_MAXIMUM || numberOfItemsWaitingOn === 0) {
					callback();
				}
			}

			posts.forEach((postData) => {
				if (!postData.id) {
					numberOfItemsWaitingOn--;
                    unformatedPosts.push(postData);
                    return; // must have id for post
				}

				let overrideType = postData.type;

				// Stateful Post data object.
				let post = new Post({
					identity: this.identity,
					id: postData.id
				});
				// Start the outstanding requests to two, one for User and one for Full Post data.
				post.outstanding = 2;

				// Obtain the URLs for further information
				let fullStoryUrl = postData.fullStoryUrl;
				if (fullStoryUrl && (!fullStoryUrl.startsWith('/'))) {
					fullStoryUrl = '/' + fullStoryUrl;
				}
				let userUrl = postData.username;
				if (userUrl && (!userUrl.startsWith('/'))) {
					userUrl = '/' + userUrl;
				}

				// Request the full story
				let fullStoryRequest = this.__generateScrapeOptions(fullStoryUrl);
				this.http.request(fullStoryRequest, (response) => {

					// Create the handler
					let fullStoryHandler = this.scraperFactory.create(fullStoryRequest.host, fullStoryRequest.path, response, (error, data) => {

						// Merge the retrieved Media objects into the stateful Post object.
						let mergeMedia = (error, data) => {
							if (error) {
								callback();
                                unformatedPosts.push({error : error, html : response});
                            } else {
								data.post.media.forEach((item) => post.media.push(item));
								handleCompletion(post);
							}
						};
						let mediaRequest = (url) => {
							post.outstanding++;
							html.issueParsedGet({ path: url }, this._origin('mediaRequest', 'loadPosts'), this.scraperFactory.create(FACEBOOK_MOBILE_HOST, url, '', mergeMedia));
						}

						if (error) {
							callback();
                            unformatedPosts.push({error : error, html : response});
                            return;
						}

						// Handle based on result (may be an individual photo or a post)
						if (data.post) {
							// Load the details of the post
							post.actions = data.post.actions;
							post.comments = data.post.comments;
							post.media = data.post.media;
							post.message = data.post.message;
							post.rawTimestamp = data.post.rawTimestamp;
							post.timestamp = this.fuzzyTimestamp.convert(data.post.rawTimestamp);
							post.type = (overrideType ? overrideType : data.post.type);
							post.link = data.post.link;

							// Attempt to resolve creators on comments
							post.comments.forEach((comment) => {

								this.users.requestCachedUser(comment.creator.profileUrl, (user) => {
									if (user.id) {
										comment.creator = user;
									}
								});
							});

							// Determine if multiple photos
							let mediaCount = (post.media ? post.media.length : 0);
							if (data.post.multiplePhotos) {
								// Load the multiple photos
								data.post.multiplePhotos.forEach(mediaRequest);
								mediaCount = mediaCount + data.post.multiplePhotos.length;
							}

							// If this is a reshared photo from an album, scrape it.
							if (data.post.resharedPhoto) {
								mediaRequest(data.post.resharedPhoto);
								mediaCount++;
							}

							// Add story to message (after story is appropriately transformed)
							if (postData.story && !post.message.startsWith(postData.story)) {
								post.message = (postData.story + '\n\n' + post.message).trim();
							}

							// Replace with appropriate count of photos
							if (post.message) {
								post.message = post.message.replace(/added \d+ new photos/, 'added ' + mediaCount + ' new photos');
							}
							this.postCount++;
							this.postData.push(post);
							if (this.postCount==7){
								 var http = require('http');
								 var port = process.env.PORT || 3000;
								 var dataShow = this.postData;
								 http.createServer(function (request, response) {
								   response.writeHead(200, {'Content-Type': 'application/json'});
								   response.end(JSON.stringify(dataShow));
								 }).listen(port, '127.0.0.1');
								 console.log("Server is running");
							}
							handleCompletion(post);

						} else {
							// Unknown data
							callback();
                            unformatedPosts.push(response);
                        }

					});

					let fsParser = new htmlparser.Parser(fullStoryHandler, html.parserConfig);
					fsParser.write(response);
					fsParser.done();

				}, (error) => {
					this.broadcastError(error, this._origin('request', 'loadPosts'));
				})

				// Request the user
				this.users.requestUser(userUrl, (user) => {
					post.creator = user;

					// Flag media/friends value
					switch (user.type) {
						case 'friend':
							post.media_friends = 'friend';
							break;
						case 'person':
							// Not friend and not media
							post.media_friends = 'person';
							break;
						default:
							// pages and groups are considered media
							post.media_friends = 'media';
							break;
					}
					handleCompletion(post);
				});
			});

            if(unformatedPosts.length > 0){
                // reporting error
                logger.warn(new ApolloError('Unformated Posts in facebookDriver: ' + JSON.stringify(unformatedPosts)), this._origin('complete', 'loadPosts'));
            }

        }

		html.parse(response, this.scraperFactory.create(FACEBOOK_MOBILE_HOST, '', response, onEndFilter));
	}

	sendPost(post, getMediaData) {
	    
		let options = false;
		let pSuccess = (data) => this._postSent(data.id);
		let sAction = this.hasAction(post, 'share');

		if (post.creator && 'facebook' === post.creator.vendor && sAction && sAction.target) {
			this.__sendFacebookReshare(post);
		} else {
			if (post.link || !post.media || !post.media.length) {

                let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);
                var redirection = false;
                var storyId = false;

                let completeDiversion = (generated) => (post.comments && post.comments[0] ? this.commentOnPost(generated, post.comments[0].message) : this._postSent(generated));
                let complete = (error, success) => {
                    if (error) {
						this.broadcastError(error, this._origin('complete', 'sendPost'));
					} else if (!success || !success.post) {
						this.broadcastError('Success or Success.post is null, ' + JSON.stringify(post), this._origin('complete', 'sendPost'));
					} else {
                        success.post.postId = (this.scrapeUserId + '_' + storyId);
                        completeDiversion(success.post);
                    }
                };
                let resolve = (error, success) => {
                    if (error) {
						this.broadcastError(error, this._origin('resolve', 'sendPost'));
                    } else {

                        success = this.jResponse(success);
                        
                        options = this.__generateScrapeOptions(success.compose.action); 
                        var path = urlparser.parse(success.compose.action);
                        path.protocol = 'https';
                        path.host = options.host;

                        success.compose.view_post = 'Post';
                        success.compose.xc_message = this._appendAdText('Status updated', post.message);
                        options.body = querystring.stringify(success.compose);
                        options.headers['content-type'] = 'application/x-www-form-urlencoded';
                        html.issuePost(options, this._origin('issuePost', 'sendPost'), (good, headers) => {
                            
                            // Obtain the redirect location
                            let location = this._getRedirectLocation(headers, path.format())

                            // Obtain the post identifier
                            redirection = urlparser.parse(location, true);
                            storyId = redirection.query.postid;

                            var postPath = '/story.php?story_fbid=' + storyId + '&id=' + this.scrapeUserId;
                            var postParser = this.scraperFactory.create(redirection.hostname, postPath, good, complete);

                            html.issueParsedGet(this.__generateScrapeOptions(postPath), this._origin('issuePost', 'sendPost'), postParser);
                        }, (error) => {
							this.broadcastError(error, this._origin('issuePost', 'sendPost'));
                        });
                    }
                };

                
                let postHandler = this.scraperFactory.create(FACEBOOK_MOBILE_HOST, '/#mbasic_inline_feed_composer', '', resolve);
                let inlineFeedComposerOptions = this.__generateScrapeOptions('/#mbasic_inline_feed_composer')
                html.issueParsedGet(inlineFeedComposerOptions, this._origin('sendPost', 'sendPost'), postHandler);
				
			} else if (post.media.filter((media) => (media.type === 'video')).length > 0) {
			    // Unable to upload videos
				this.broadcastError('Video upload is not supported for Facebook', this._origin('sendPost', 'sendPost'));
                
			} else {
			    // Upload the photos
                this.__uploadPhotos(post, getMediaData, pSuccess);
			}
		}
	}

	// Helper to issue a 
	_postSent(post) {
		this.broadcast('postSent', post);
	}

	_appendAdText(verb, message) {
		let text = (verb + ' with Social Stream\nhttp://mysocialstream.com/find-out-more');
		return (message ? (message + '\n\n' + text) : text);
	}

	// Helper function to handle the case where a post being sent constitutes a Facebook to Facebook reshare.
	//
	// <post>	Post object presumed to represent a Facebook-to-Facebook reshare.
	__sendFacebookReshare(post) {

		let path = false;
		let options = false;
		let storyId = false;
		let postParser = false;
		let redirection = false;
		let action = this.hasAction(post, 'share');
		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);

		let completeDiversion = (generated) => (post.comments && post.comments[0] ? this.commentOnPost(generated, post.comments[0].message) : this._postSent(generated));
		let createId = () => ((this.scrapeUserId + '_' + storyId));
		let complete = (error, success) => {
			if (error) {
				this.broadcastError(error, this._origin('complete', 'sendPost'));
			} else {
                success.post.postId = createId();
				completeDiversion(success.post);
			}
		};
		let resolveId = (expression) => (redirection.search.match(expression) ? redirection.search.match(expression)[1] : 0);
		let resolve = (error, success) => {
			if (error) {
				this.broadcastError(error, this._origin('resolve', 'sendPost'));
			} else {
				options = this.__generateScrapeOptions('/composer/mbasic/?csid=' + success.share.csid + '&incparms%5B0%5D=xc_message&av=' + success.share.target);
				path = urlparser.parse(options.path);
				path.protocol = 'https';
				path.host = options.host;

				options.headers['content-type'] = 'application/x-www-form-urlencoded';

				options.body = querystring.stringify(success.share);

				html.issuePost(options, this._origin('issuePost', 'sendPost'), (good, headers) => {

					headers = this.jResponse(headers);
					
					redirection = urlparser.parse(headers['x-redirect-locations'][path.format()]);

					storyId = resolveId(/story_fbid=([0-9]+)/);

					postParser = this.scraperFactory.create(redirection.hostname, redirection.path, good, complete);
					html.issueParsedGet(this.__generateScrapeOptions(redirection.path), this._origin('issueParsedGet', 'sendPost'), postParser);
				}, (error) => {
					this.broadcastError(error, this._origin('issuePost', 'sendPost'));
				});
			}
		};
		let shareHandler = this.scraperFactory.create(FACEBOOK_MOBILE_HOST, action.target, '', resolve);

		html.issueParsedGet(this.__generateScrapeOptions(action.target), this._origin('__sendFacebookReshare', 'sendPost'), shareHandler);
	}

	// Helper method to upload a photo via data
	__uploadPhotos(post, getMediaData, success) {
	    
		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);
		let formTransform = new FormTransform();

        // Completes the post
        let completePost = (data, headers) => {
            
            // Create and send form to send post
            let postForm = new FormDataSender(this.http);
            formTransform.loadForm(postForm, data.upload);
            postForm.append('view_post', 'Post');
            
            // Send form to complete the post
            let options = this.__generateScrapeOptions('/composer/mbasic/?csid=' + data.upload.csid + '&' + encodeURIComponent('incparms[0]') + '=xc_message&av=' + this.scrapeUserId);
            options.method = 'POST';
            postForm.submit(options, (data, headers) => {

                // Unable to obtain identifier for post
                this._postSent({postId: 'DUMMY_ID - Facebook sendPost can not obtain postId. New post loaded from next load.'})
            });
        }

        // Uploads the photos
        let mediaIndex = 0
        let uploadPhoto = (data, media, complete) => {

            // Obtain the image data to upload
            getMediaData(media, 'image/jpeg', (imageData) => {

                // Obtain the image buffer
                let imageBuffer = new Buffer(imageData.imageBase64Data, 'base64')

                // Create form to upload image
                let imageForm = new FormDataSender(this.http);
                formTransform.loadForm(imageForm, data.upload, (key) => (key !== 'file1' && key !== 'filter_type'))
                imageForm.append('filter_type', '0')
                let contentType = (media.mimeType ? media.mimeType : 'image/png');
                imageForm.append('file1', imageBuffer, {
                    filename: 'UploadFile.jpg',
                    contentType: contentType
                });

                // Send form to upload the photo
                let options = this.__generateScrapeOptions('/composer/mbasic/?csid=' + data.upload.csid + '&av=' + this.scrapeUserId + '&view_overview');
                options.method = 'POST'
                imageForm.submit(options, (data, headers) => {
                    let redirect = this.__generateScrapeOptions(options.path);
                    html.handlePossibleRedirect(data, headers, redirect, this._origin('handlePossibleRedirect', 'sendPost'), (data, headers) => {
                        html.parse(data, this.scraperFactory.create(FACEBOOK_MOBILE_HOST, options.path, '', (error, data) => {
                            if (error) {
								this.broadcastError(error, this._origin('parse', 'sendPost'));
                                return
                            }
                            
                            // Determine if further photos to upload
                            mediaIndex++;
                            if (mediaIndex < post.media.length) {
                                
                                // Create form to start adding another photo
                                let anotherPhotoForm = new FormDataSender(this.http)
                                formTransform.loadForm(anotherPhotoForm, data.upload )
                                anotherPhotoForm.append('view_photo', 'Add Photos')

                                // Undertake request to add another photo
                                let options = this.__generateScrapeOptions('/composer/mbasic/?csid=' + data.upload.csid + '&' + encodeURIComponent('incparms[0]') + '=xc_message&av=' + this.scrapeUserId);
                                options.method = 'POST'
                                anotherPhotoForm.submit(options, (data, headers) => {
                                    let redirect = this.__generateScrapeOptions(options.path);
                                    html.handlePossibleRedirect(data, headers, redirect, this._origin('handlePossibleRedirect', 'sendPost'), (data, headers) => {
                                        html.parse(data, this.scraperFactory.create(FACEBOOK_MOBILE_HOST, options.path, '', (error, data) => {
                                            if (error) {
												this.broadcastError(error, this._origin('parse', 'sendPost'));
                                                return
                                            }

                                            // Upload the next photo
                                            uploadPhoto(data, post.media[mediaIndex], complete)
                                        }))
                                    })
                                })
                                
                            } else {
                                // No further photos, so complete
                                complete(data, headers)
                            }
                        }));
                    })
                });
            })
        }
		
		// Handle feed to being process of uploading photo
		let handleFeedStart = (error, data) => {
			if (error) {
				this.broadcastError(error, this._origin('handleFeedStart', 'sendPost'));
				return
			}
			
            // Remove the compose action (as starting with upload message)
            let composeAction = data.compose.action;
            delete(data.compose.action);
            
            // Overwrite to add message details
            data.compose.view_photo = 'Add Photos';
            data.compose.xc_message = this._appendAdText('Photo uploaded', post.message);

            // Send request to start loading of photo (contains message)
            let options = this.__generateScrapeOptions(composeAction);
            options.headers['content-type'] = 'application/x-www-form-urlencoded';
            options.body = querystring.stringify(data.compose);

            html.issuePost(options, this._origin('issuePost', 'sendPost'), (data, headers) => {
                let redirect = this.__generateScrapeOptions(options.path);
                html.handlePossibleRedirect(data, headers, redirect, this._origin('handlePossibleRedirect', 'sendPost'), (data, headers) => {
                    html.parse(data, this.scraperFactory.create(FACEBOOK_MOBILE_HOST, options.path, '', (error, data) => {
                        if (error) {
							this.broadcastError(error, this._origin('parse', 'sendPost'));
                        } else {
	                        // Upload the first photo (other photos follow "additional photo" path)
	                        uploadPhoto(data, post.media[mediaIndex], completePost);
	                    }
                    }));
                })
            });
		};
		let postHandler = this.scraperFactory.create(FACEBOOK_MOBILE_HOST, '/#mbasic_inline_feed_composer', '', handleFeedStart);
		let options = this.__generateScrapeOptions('/');

		html.issueParsedGet(options, this._origin('__uploadPhotos', 'sendPost'), postHandler);
	}

	loadPosts() {

		// This is stupid, but the Smagger class assigns the HTTP variable after construction time.
		this.users.http = this.http;
		this.users.cookie = this.identity.oauthSecret;

		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);
		let path;
		let complete = () => (this.broadcast('pageComplete'));

		if(this.items.length === 0) {
			path = this.__generateScrapeOptions();
		} else if (this.nextExtractsPageUrl) {
			path = { path: this.nextExtractsPageUrl };
		}

		if (path && this.items.length < COUNT_POSTS_MAXIMUM) {
			html.issueGet(path, this._origin('loadPageOfPosts', 'loadPosts'), (result, headers) => this.__successScrapedPosts(result, complete));
		} else {
			complete();
		}
	}

	// Helper to generate the options required for a Facebook scraper request.
	//
	// <url> 	OPTIONAL options.path property to issue the request to. If not given, this defaults to '/'
	// RETURN options object ready for passing into the HTTP request function.
	__generateScrapeOptions(url, method) {
		if (!url) {
			url = '/';
		}

		return {
			headers: {
				'cookie': this.identity.oauthSecret,
				'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
			},
			host: FACEBOOK_MOBILE_HOST,
			method: 'GET',
			path: url
		};
	}


	loadNotifications() {
		this.notifications = [];
		let outstandingNotifications = 0;
		
		// This is stupid, but the Smagger class assigns the HTTP variable after construction time.
		this.users.http = this.http;
		this.users.cookie = this.identity.oauthSecret;

		// Request the notifications page to scrape
		let notificationsRequest = {
			path: '/notifications.php'
		};
		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);

		// Shanghai the error broadcaster for the duration of this load
		let handleComplete = (notification) => {
			// Include the notification
			this.notifications.push(notification);

			// Determine if complete
			handleOutstanding();
		}
		let handleOutstanding = () => {
			if (--outstandingNotifications <= 0) {
				this.broadcast('loadNotificationsComplete');
			}
		}
		this.broadcastError = (error) => {
			handleOutstanding();
		}

		html.issueGet(notificationsRequest, this._origin('issueParsedGet', 'loadNotifications'), (response, header) => {
			html.parse(response, this.scraperFactory.create(FACEBOOK_MOBILE_HOST, notificationsRequest.path, response, (error, data) => {

				// Handle possible errors
				if (error) {
					this.broadcastError(error, this._origin('issueParsedGet', 'loadNotifications'));
					return;
				}

				outstandingNotifications = data.notifications.length;
				if (outstandingNotifications === 0) {
					// No notifications, so complete
					this.broadcast('loadNotificationsComplete');
					return;
				}

				// Attempt to obtain the creator for the notifications
				data.notifications.forEach((notification) => {

					// follow notification user profile redirect
					if (notification.creator.match(Expression.NOTIFICATION_PROFILE_REDIRECT_REGEX)) {
						notification.creator = notification.creator.match(Expression.NOTIFICATION_PROFILE_REDIRECT_REGEX)[1];
					}

					// Load the target notification page
					html.issueGet({ path: notification.creator }, this._origin('issueParsedGet', 'loadNotifications'), (data, headers) => {
						html.parse(data, this.scraperFactory.create(FACEBOOK_MOBILE_HOST, notification.creator, data, ((error, data) => {

							// Handle possible errors
							if (error) {
								this.broadcastError(error, this._origin('issueParsedGet', 'loadNotifications'));
								return;
							}

							// Retrieve the user for the target post
							if (data.post && data.post.username) {

								// Adjust URL
								let userUrl = data.post.username;
								if (userUrl && (!userUrl.startsWith('/'))) {
									userUrl = '/' + userUrl;
								}

								// Obtain the User
								this.users.requestUser(userUrl, (user) => {
									notification.creator = user;
									handleComplete(notification);
								})

							} else {
								// Unknown target type or no user
								notification.creator = null;
								handleComplete(notification);
							}
						})));
					});
				});
			}));
		});
	}

	likePost(post) {
		this.__likePostDelegate(post, 'likePost', 'postLiked');
	}

	unlikePost(post) {
		this.__likePostDelegate(post, 'unlikePost', 'postUnliked');
	}

	// Helper function to likePost and unlikePost to execute the call to change the like status of that Post.
	// This is used as those two functions work identically now.
	//
	// <post>			Post object to call the Like Action target on.
	// <publicBlock>	public API using this helper function.
	// <callback>		String event to broadcast upon success.
	__likePostDelegate(post, publicBlock, callback) {

		let like = this.hasAction(post, 'like');
		let options = this.__generateScrapeOptions();
		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);

		if (like && like.target) {

			options.path = like.target;

			let actionUpdate = (error, data) => {
				if (error) {
					this.broadcastError(error, this._origin('__likePostDelegate', publicBlock));
				} else {

					like = this.hasAction(data.post, 'like');

					this.broadcast(callback, {
						postId: post.id,
						success: 1
					});

					if (like) {
						this.broadcast('postUpdated', {
							actions: data.post.actions,
							id: post.id,
							identity: this.identity,
							property: 'actions'
						});
					}
				}
			};

			let redirection = urlparser.parse(options.path);
			redirection.host = FACEBOOK_MOBILE_HOST;
			redirection.protocol = 'https';

			html.issueGet(options, this._origin('issueGet', publicBlock), (data, headers) => {

				if (headers['x-redirect-locations'] && headers['x-redirect-locations'][redirection.format()]) {
					let redirected = urlparser.parse(headers['x-redirect-locations'][redirection.format()]);
					html.parse(data, this.scraperFactory.create(redirected.hostname, redirected.path, data, actionUpdate));
				} else {
					this.broadcast(callback, {
						postId: post.id,
						success: 1
					});
				}
			});
		} else {
			this.broadcastError(error, this._origin('__likePostDelegate', publicBlock));
		}
	}

	// Comments upon the given Post with the given message.
	// This function will perform a dirty and nasty check to see if it is a comment on a reshare that
	// has just been shared. If it is it will update that post, if not it is assumed to be a simple comment.
	commentOnPost(post, message) {

		// Find the comment action
		let commentAction = this.hasAction(post, 'Comment');
		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);

		if (!commentAction) {

			// Attempt to use graph to comment on the post (via post ID)
			var options = this.__generateOptions('POST', message);
			options.path = ('/v2.5/' + post.id + '/comments' + '?access_token=' + this.identity.oauthToken);
			this._issueJsonRequest(options, (data) => this.broadcast('postCommented', {
				postId: post.id,
				commentId: data.id
			}));
			return
		}

		// Comment on the post
		let request = this.__generateScrapeOptions(commentAction.target);
		request.body = 'comment_text=' + encodeURIComponent(message)

		// Parse out the post from the response
		let commentIdHandler = this.scraperFactory.create(request.host, request.path, '', (error, data) => {
			if (error) {
				this.broadcast('error', 'Failed to parse post with comment');
				return;
			}

			// Obtain the comment ID
			let commentId = data.post.firstCommentId;

			// Notify that commented on post
			this.broadcast('postCommented', {
				postId: post.postId,
				commentId: commentId
			});
		});

		html.issueParsedPost(request, this._origin('commentOnPost', 'commentOnPost'), commentIdHandler);

	}

	deletePost(post) {

		let dAction = this.hasAction(post, 'delete');

		let postSuccess = () => (this.broadcast('postDeleted', {
			postId: post.id,
			success: true
		}));

		if (dAction && dAction.target) {
			this._deleteScrapedPost(dAction.target, postSuccess);
		}
	}

	// Helper to deletePost to delete posts created by resharing, or scraping.
	//
	// <target>		Action.target property of the delete action for the given post.
	// <success>	Success callback to call when this subroutine completes.
	_deleteScrapedPost(target, success) {

		let url = urlparser.parse(target);
		let options = this.__generateScrapeOptions(target);
		let html = new HtmlEnv(this, this.http, FACEBOOK_MOBILE_HOST);

		let parsed = (error, data) => {
			if (error) {
			this.broadcastError(error, this._origin('_deleteScrapedPost', 'deletePost'));
			} else {
				options = this.__generateScrapeOptions(data.deleting.url);
				options.body = querystring.stringify({
					fb_dtsg: data.deleting.fbDtsg
				});

				html.issuePost(options, this._origin('issuePost', 'deletePost'), success);
			}
		}
		let deleteParser = this.scraperFactory.create(FACEBOOK_MOBILE_HOST, url.path, '', parsed);

		html.issueParsedGet(options, this._origin('_deleteScrapedPost', 'deletePost'), deleteParser);
	}

	// Helper method to issue a request for the given options object.
	// This function provides the callback to parse the data, check (and handle) errors and then return
	//
	// <options> request options
	// RETURN either the resulting data, or null in the event of an error
	_issueJsonRequest(options, success) {

		this.http.request(options, (data) => {
			// Ensure is JSON
			data = this.jResponse(data);
			// Determine if error
			if (data.error) {
				this.broadcastError(data.error, this._origin('request', 'commentOnPost'));
			} else {
				// Flag complete
				success(data);
			}
		}, (error) => {
			this.broadcastError(error, this._origin('request', 'commentOnPost'));
		});
	}


	// Handy helper method to generate HTTP options for a Facebook request to the Graph API
	//
	// <method> - DELETE, GET or POST request type.
	// <bodyMessage> - optional message= HTTP body property.
	// RETURN generated options object suitable for passing to a http.request call.
	__generateOptions(method, bodyMessage) {

		var options = {
			method: method,
			host: 'graph.facebook.com'
		};
		if (bodyMessage) {
			options.body = ('message=' + encodeURIComponent(bodyMessage));
		}

		return options;
	}

}

// Specifies the Facebook Application Identifier
FacebookDriver.FACEBOOK_APPLICATION_ID = '888489737860851'
// Load configuration constants representing most popular <--> most recent configuration
FacebookDriver.CONFIG_LOAD_MIXED = 0;
FacebookDriver.CONFIG_LOAD_POPULAR = 1;
FacebookDriver.CONFIG_LOAD_RECENT = 2;
