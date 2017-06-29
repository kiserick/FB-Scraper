import {CommentsTransform} from '../CommentsTransform.es6';
import {NetworkDriver} from '../../../NetworkDriver.es6';

export class PagedCommentsTransform extends CommentsTransform {

	constructor() {
		super();
		this.parser = new NetworkDriver();
	}

	identifyUser() {
		return 'user';
	}

	/**
	 * @param	{Object} commentsJson
	 *			Either a {String} or an {Object} containing the earlier pagesd comments data from Instagram.
	 * @returns	{Object} containing an array of {Comment} objects (mapped to the "comments" key), and the next page cursor (mapped to the "cursor" key).
	 */
	transform(commentsJson) {

	    commentsJson = this.parser.jResponse(commentsJson);

	    // Return the comments
	    return {
	    	comments: commentsJson.comments.nodes.map(this.parseComment, this),
	    	count: this.parseCount(commentsJson.comments),
	    	cursor: this.parseCursor(commentsJson.comments)
	    }
	}
}