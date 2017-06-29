import {CommentsTransform} from '../CommentsTransform.es6';
import {NetworkDriver} from '../../../NetworkDriver.es6';

export class TopCommentsTransform extends CommentsTransform {

	constructor() {
		super();
		this.parser = new NetworkDriver();
	}

	identifyUser() {
		return 'owner';
	}

	/**
	 * @param	{Object} commentsJson
	 *			Either a {String} or an {Object} containing the earlier pagesd comments data from Instagram.
	 * @returns	{Object} containing an array of {Comment} objects (mapped to the "comments" key), and the next page cursor (mapped to the "cursor" key).
	 */
	transform(commentsJson) {

	    let delve = (edge) => (edge.node);

	    commentsJson = this.parser.jResponse(commentsJson);

	    // Return the comments
	    return {
	    	comments: commentsJson.edge_media_to_comment.edges.map(delve).map(this.parseComment, this),
	    	count: this.parseCount(commentsJson.edge_media_to_comment),
	    	cursor: this.parseCursor(commentsJson.edge_media_to_comment)
	    }
	}
}