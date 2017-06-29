import {Comment} from '../../data/comment.es6';
import {User} from '../../data/user.es6';

/**
 * Common parsing code for the TopCommentsTransform and PagedCommentsTransform.
 *
 * Implementing classes should have a transform function that takes a raw JSON array and returns an object mapping
 * 	- comments -> an array of Comment objects.
 *	- count -> count of comments upon that post.	
 * 	- cursor -> the next page cursor.
 * Implementing class should implement an identifyUser function which returns a String JSON property identifier that is used to parse the creator of the post.
 */
export class CommentsTransform {

	/**
	 * @param	node
	 *			Either a {String} or an {Object} containing the comments data from Instagram.
	 * @returns	{Object} containing an array of {Comment} objects (mapped to the "comments" key), and the next page cursor (mapped to the "cursor" key).
	 */
	parseComment(node) {

	    let creator = null;
	        
        if (node[this.identifyUser()]) {

            creator = new User({
                id: node[this.identifyUser()].id,
                name: node[this.identifyUser()].username,
                photoUrl: node[this.identifyUser()].profile_pic_url,
                vendor: 'instagram'
            });
        }

        // Add the comment
        return new Comment({
            creator: creator,
            id: node.id,
            message: node.text,
            rawTimestamp: String(node.created_at),
            vendor: 'instagram'
        });
	}

	parseCount(commentsJson) {
		return (commentsJson.count ? commentsJson.count : 0);
	}

	/**
	 * Handles the end_cursor property for the current page.
	 *
	 * @param 	{Object} commentsJson
	 *			JSON data to check for a next page cursor.
	 *
	 * @returns Next comments page cursor if one exists, or false.
	 */
	parseCursor(commentsJson) {
		return (commentsJson.page_info && commentsJson.page_info.has_next_page ? commentsJson.page_info.end_cursor : false);
	}
}