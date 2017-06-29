import {Email} from './email.es6';
import {NetworkDriver} from './NetworkDriver.es6';
import {Origin} from './data/origin.es6';
import {Post} from './data/post.es6';

const URL_SERVER_APOLLO = 'https://mighty-spire-2048.herokuapp.com/v1/posts';

export class ApolloDriver extends NetworkDriver {

	constructor(identity, loadParameters) {

		super();
		
		if (!identity) throw new Error('Must provide Identity for Apollo');
		
		this.items = [];
		this.identity = identity;
		this.loadParameters = loadParameters;
	}

	loadPosts() {

		let createPost = (entry) => {
			let post = new Post(entry);
			post.identity = this.identity;
			return post;
		}
		this.loadPosts = () => (this.broadcast('pageComplete'));

		this.http.get(URL_SERVER_APOLLO, (response, headers) => {

            if (!this.isSuccessfulRequest(headers)) {
				this.broadcast('pageComplete');
				return;
			}

			// Hooray, there is a response, let's handle it then
			// Parse the response (if necessary)
			if (typeof(response) == 'string') {
				response = JSON.parse(response);
			}

			// catch respons
            this.broadcast('htmlCatehed', {htmlEnv:this, response:JSON.stringify(response)});

			// Iterate through the JSON entries, assuming each to be of the correct format
			response.posts.map(createPost).forEach((post) => this.broadcast('postLoaded', post));

			this.broadcast('pageComplete')

		}, (error) => {
			// Must wrap to ensure 'this' is in context (as directly called by IOS code on error)
			this.broadcastError(error, new Origin('get', 'ApolloDriver', 'loadPosts'));
		})
	}

	loadNotifications() {
		// No notifications available for Apollo
		this.notifications = [];
		this.broadcast('loadNotificationsComplete');
	}

	sendPost(post, getMediaData) {
		// Just succeed
		this.broadcast('postSent', {
			postId: 'ReadOnlyApollo'
		});
	}

	likePost(postId) {
		// Just succeed
		this.broadcast('postLiked', {
			postId: 'ReadOnlyApollo',
			success: true
		});
	}

	unlikePost(postId) {
		// Just succeed
		this.broadcast('postUnliked', {
			postId: 'ReadOnlyApollo',
			success: true
		});
	}

	deletePost(postId) {
		// Just succeed
		this.broadcast('postDeleted', {
			postId: 'ReadOnlyApollo',
			success: true
		});
	}

	commentOnPost(post, message) {
		// Send an email
		let email = new Email(this.http);
		email.send({
			subject: 'Social Stream',
			message: 'Commenting on post ' + post.id + ' with: ' + message
		}, (data) => {
			// Successfully sent the email
			this.broadcast('postCommented', {
				postId: 'ReadOnlyApollo',
				commentId: 'Email-' + new Date().getTime()
			});
		}, (error) => {
			this.broadcastError(error, new Origin('email.send', 'ApolloDriver', 'commentOnPost'));
		});
	}

}