import {NetworkDriver} from '../../src/NetworkDriver.es6';
import {Origin} from '../../src/data/origin.es6';

export class ErrorDriver extends NetworkDriver {

	constructor(identity, errorMessage) {

		super();

		this.items = [];
		this.identity = identity;

		// Initiate to default to report error once
		this.numberOfErrors = 1;
		if (errorMessage) {
			if (typeof(errorMessage) === 'string') {
				this.errorMessage = errorMessage;
			} else {
				this.errorMessage = errorMessage.message;
				this.numberOfErrors = errorMessage.repeat;
			}
		}

	}

	error(pBlock) {
		for (let i = 0; i < this.numberOfErrors; i++) {
			this.broadcastError(this.errorMessage, new Origin('', 'ErrorDriver', pBlock));
		}
	}

	loadPosts() {
		this.error('loadPosts');
	}

	loadNextPageOfPosts() {
		this.error('loadNextPageOfPosts')
	}

	sendPost(post) {
		this.error('sendPost')
	}

	likePost(postId) {
		this.error('likePost')
	}

	unlikePost(postId) {
		this.error('unlikePost')
	}

	commentOnPost(post, message) {
		this.error('commentOnPost')
	}

	deletePost(post) {
		this.error('deletePost')
	}

}