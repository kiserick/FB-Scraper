import {Eventable} from './eventable.es6';
import {HtmlHandlerFactory} from './HtmlHandlerFactory.es6';
import {Identity} from './data/identity.es6';
import {PostBlock} from './data/PostBlock.es6';
import {PostMasterGeneral} from './PostMasterGeneral.es6';
import {UserRegistry} from './facebook/UserRegistry.es6';
import {Origin} from './data/origin.es6';


export class Smagger extends Eventable {

	constructor() {

		super();

		this.blocks = [];
		this.errors = [];
		this.drivers = [];
		this.updates = [];
		this.notifications = [];
		this.driverRegistry = {};
		this.postMasterGeneral = new PostMasterGeneral();

		this.errorHandler = () => {};
		this.systemStressed = (prop) => (prop === 2);
		this.stillBusy = () => (this.drivers.filter((driver) => driver.busy).length);

        // Error reporting convenience block.
        this._origin = (cBlock, pBlock) => new Origin(cBlock, 'Smagger', pBlock);

    }

	createIdentity(vendor, oauthToken, oauthSecret, userId) {
		return new Identity({
			vendor: vendor,
			oauthToken: (oauthToken ? oauthToken : ''),
			oauthSecret: (oauthSecret ? oauthSecret : ''),
			userId: userId
		})
	}

	newDriver(identity, loadParameters, options) {
		let factory = new HtmlHandlerFactory();
		let userRegistry = new UserRegistry(factory)
		let clazz = this.driverRegistry[identity.vendor];

		if (clazz) {
			let driver = new clazz(identity, loadParameters, factory, userRegistry);
			driver.networkIdentity = identity;
			return driver;
		} else {
			throw new Error("Unsupported network '" + identity.vendor + "'");
		}
	}

	addDriver(identity, loadParameters, options) {

		// Create and register the driver
		let driver = this.newDriver(identity, loadParameters, options);

		driver.http = this.env.http;
		this.drivers.push(driver);

        driver.on('htmlCatehed', (driver, html) => this._htmlCatched(html));
        driver.on('postLoaded', (driver, post) => this._postLoaded(driver, post));
		driver.on('pageComplete', (driver, post) => this._pageComplete(driver, post));
		driver.on('loadNotificationsComplete', (driverWotJustFinishedLoading) => {
			driverWotJustFinishedLoading.busy = false
			if (!this.stillBusy()) {
				this.busy = false

				// Load notifications from each driver
				let notifications = []
				this.drivers.forEach(function(driver) {
					driver.notifications.forEach(function(notification) {
						notifications.push(notification)
					})
				})

				// Sort the notifications in reverse chronological order
				notifications.sort(function(a, b) {
					return b.timestamp - a.timestamp
				})

				// Append the notifications to existing notifications
				notifications.forEach((notification) => {
					this.notifications.push(notification)
				})

				this.broadcast('loadNotificationsComplete')
			}
		})
		driver.on('postLiked', (driver, data) => {
			driver.busy = false
			let result = {
				vendor: driver.networkIdentity.vendor,
				postId: data.postId,
				success: data.success
			}
			this.broadcast('postLiked', result)
		})
		driver.on('postUnliked', (driver, data) => {
			driver.busy = false
			let result = {
				vendor: driver.networkIdentity.vendor,
				postId: data.postId,
				success: data.success
			}
			this.broadcast('postUnliked', result)
		})
		driver.on('postCommented', (driver, data) => {
			driver.busy = false
			let result = {
				vendor: driver.networkIdentity.vendor,
				commentId: data.commentId
			}
			this.broadcast('postCommented', result)
		})
		driver.on('postDeleted', (driver, data) => {
			driver.busy = false
			let result = {
				vendor: driver.networkIdentity.vendor,
				postId: data.postId
			}
			this.broadcast('postDeleted', result)
		})
		driver.on('postSent', (driver, data) => {
			driver.busy = false
			let result = {
				vendor: driver.networkIdentity.vendor,
				postId: data.postId,
				actions: data.actions
			}
			this.broadcast('postSent', result);
		});
		driver.on('postUpdated', (driver, result) => {
			if (this.stillBusy()) {
				this.updates.push(result);
			} else {
				this.firePostUpdate(result);
			}
		});

		driver.on('error', (driverWotJustFinishedLoading, error) => {

			driverWotJustFinishedLoading.busy = false;

			// Load the errors
			this.errors.push(error);

			// Handle flagging busy
			if (!this.stillBusy()) {
				this.busy = false;
			}

			// Provide any possible handling
			if (this.errorHandler) {
				this.errorHandler(driverWotJustFinishedLoading);
			}
		});

		return driver;
	}

	// Handle the pageComplete event.
	_pageComplete(driver) {

		driver.busy = false;

		if (driver.siCount > driver.soCount) {
			driver.busy = true;
			driver.soCount = driver.siCount;

			driver.loadPosts();
		} else if (!this.stillBusy()) {

			this.busy = false;
			this.broadcast('postsLoaded', []);
			this.updates.forEach(this.firePostUpdate, this);
        }
	}

	// Handle postLoaded event.
	_postLoaded(driver, post) {

		let issuing = [];
		let existing = [];
		let nBlock = new PostBlock();
		let vendor = driver.networkIdentity.vendor;

		let truth = (value) => value;
		let bReduce = (aBlock, bBlock) => aBlock.concat(bBlock);
		let bToArray = (block) => (Object.values(block).filter(truth));
		let bFilter = (block) => (block.apollo || block.facebook || block.instagram || block.twitter || block.youtube);

		existing = this.blocks.filter((block) => bFilter && !block[vendor]);
		if (existing.length) {
			existing[0][vendor] = post;
		} else {
			nBlock[vendor] = post;
			this.blocks.push(nBlock);
		}

		driver.siCount++;
		issuing = this.postMasterGeneral.shouldPostBlocks(this.blocks);

		if (issuing.length) {
			this.broadcast('postsLoaded', issuing.map(bToArray).reduce(bReduce).filter(truth));
			issuing.map((block) => this.blocks.indexOf(block)).forEach((indice) => this.blocks.splice(indice, 1));
		}
	}

    // Handle htmlCatched event.
    _htmlCatched(html) {
        this.broadcast('htmlCatched', html);
    }

	// Determines the which property of the Post object is being updated, and alerts the listening classes.
	firePostUpdate(post) {

		// Ensure property specified
		if (!post.property) {
			// Property not specified, so attempt to determine it
			if (post.message) {
				post.property = 'message';
			} else if (post.comments) {
				post.property = 'comments';
			}
		}

		// Notify of the update
		this.broadcast('postUpdated', post);
	}

	loadPosts() {

		this.busy = true;
		this.errors = []; // reset to no errors for load

		// Set error handling
		this.errorHandler = this._pageComplete;

		// Flag all drivers busy (in case first driver completes synchronously before other driver load is called)
		this.drivers.forEach((driver) => {
			driver.busy = true;
			driver.siCount = 0;
			driver.soCount = 0;
		});
		this.drivers.forEach((driver) => driver.loadPosts());
	}

	loadNotifications() {
		this.busy = true
		this.notifications = []
		this.errors = [] // reset to no errors for load

		// Set error handling
		this.errorHandler = () => {
			if (!this.stillBusy()) {
				this.busy = false
				this.broadcast('loadNotificationsComplete');
			}
		}

		// Flag all drivers busy (in case first driver completes synchronously before other driver load is called)
		this.drivers.forEach((driver) => driver.busy = true);
		this.drivers.forEach((driver) => driver.loadNotifications());
	}

	likePost(post) {
		this._execute(post.identity, 'likePost', 'postLiked', post);
	}

	unlikePost(post) {
		this._execute(post.identity, 'unlikePost', 'postUnliked', post);
	}

	sendPost(identity, post, getMediaData) {
		this._execute(identity, 'sendPost', 'postSent', post, getMediaData);
	}

	commentOnPost(post, message) {
		this._execute(post.identity, 'commentOnPost', 'postCommented', post, message);
	}

	deletePost(post) {
		this._execute(post.identity, 'deletePost', 'postDeleted', post)
	}

    catchHtml(){

	}

	// Helper method to iterate through the network drivers searching for the requested driver.
	// Once found that driver will be used to execute the given function
	_execute(identity, execution, completeEvent, first, second) {

		if (!identity.oauthToken) {
			identity.oauthToken = ''
		}
		if (!identity.oauthSecret) {
			identity.oauthSecret = ''
		}

		// Set error handling
		this.errorHandler = () => {
			this.broadcast(completeEvent)
		}

		// Trigger event
		this.drivers.forEach((driver) => {
			let driverIdentity = driver.networkIdentity
			if ((identity.vendor == driverIdentity.vendor) && (identity.oauthToken == driverIdentity.oauthToken) && (identity.oauthSecret == driverIdentity.oauthSecret)) {
				driver.busy = true;
				driver[execution](first, second);
			}
		})
	}
}
