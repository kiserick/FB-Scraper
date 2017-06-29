import {Action} from '../../src/data/action.es6';
import {NetworkDriver} from '../../src/NetworkDriver.es6'

export class TestDriver extends NetworkDriver {

	constructor(identity, loadParameters, arg) {
		super();
		this.arg = arg;
		this.items = [];
		this.notifications = [];
		this.loadParameters = loadParameters;
	}

	loadPosts() {
		
		process.nextTick(() => {
			this.items.forEach((item) => {
				this.broadcast('postLoaded', item);
			});

			this.items = [];
			this.broadcast('pageComplete');
		});
	}

	loadNotifications() {
		process.nextTick(() => this.broadcast('loadNotificationsComplete'));
	}

	likePost(postId) {
		process.nextTick(() => this.broadcast('postLiked', {
			postId: postId,
			success: true,
			options: {}
		}));
	}

	unlikePost(postId) {
		process.nextTick(() => this.broadcast('postUnliked', {
			postId: postId,
			success: true,
			options: {}
		}));
	}

	sendPost(post) {
		process.nextTick(() => this.broadcast('postSent', {
			postId: 'POST_ID',
			actions: [new Action({
				type: 'Test'
			})],
			data: {},
			options: {}
		}));
	}

	commentOnPost(post, message) {
		process.nextTick(() => this.broadcast('postCommented', {
			postId: post.id,
			commentId: 'COMMENT_1',
			data: {},
			options: {}
		}));
	}

	deletePost(post) {
		process.nextTick(() => this.broadcast('postDeleted', {
			postId: post.id,
			data: {}
		}));
	}
}