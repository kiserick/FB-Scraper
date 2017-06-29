import {Action} from '../../data/action.es6';
import {Post} from '../../data/post.es6';
import {User} from '../../data/user.es6';

/**
 * Abstract class for parsing Instagram JSON feeds.
 *
 * Due to the similarities between the FirstPageFeedTransform and the PagedFeedTransform JSON, this class is here to provide shared code for testability.
 *
 * Subclasses should implement the transform function, mapping the parent array to its appropriate subnodes before calling parsePost.
 * Subclasses should implement a parseMedia function which converts the given JSON node into one or more Media objects in an array. This allows future implementations to handle multiple images.
 */
export class FeedTransform {

	/**
	 * Parses a Post object out of the given JSON node.
	 * This function is not guaranteed to parse all possible fields - specialised implementations should parse custom fields as they can.
	 *
	 * Please DO NOT fill this function with a bunch of of-property-else-other property code control flows. It is a bad pattern. Be ashamed of yourself for thinking it.
	 * If there are different properties in specialised classes, they should be handled in those classes.
	 *
	 * @param 	{Object} node
	 *			Dictionary to translate into a Post object.
	 *
	 * @returns	{Object} Post.
	 */
	parsePost(node) {

		let post = new Post({ id: node.id });

		post.media = this.parseMedia(node);
		if (post.media && post.media.length) {
			post.type = post.media[0].type;
		}

		if (node) {
			// generate comments
			post.comments = this.commentsTransform.transform(node);
			// This order is important.
			post.nextCommentPage = post.comments.cursor;
			post.commentsCount = post.comments.count;
			post.comments = post.comments.comments;
		}

		if (node.comments_disabled) {
			// comments disabled
			post.actions = [
				new Action({
					type: 'Share'
				}),
				new Action({
					type: 'Like',
					target: 'https://www.instagram.com/web/likes/' + node.id
				})
			];
		} else {
			// comments enabled
			post.actions = [
				new Action({
					type: 'Share'
				}),
				new Action({
					type: 'Like',
					target: 'https://www.instagram.com/web/likes/' + node.id
				}),
				new Action({
					type: 'Comment',
					target: 'https://www.instagram.com/web/comments/' + node.id + '/add/'
				})
			];
		}

		if (node.owner) {
			post.creator = new User({
				vendor: 'instagram',
				id: String(node.owner.id),
				name: node.owner.username,
				photoUrl: node.owner.profile_pic_url
			});
		}

		return post;
	}
}
