import {FeedTransform} from '../FeedTransform.es6';
import {Media} from '../../../data/media.es6';
import {Post} from '../../../data/post.es6';
import {NetworkDriver} from '../../../NetworkDriver.es6';
import {InstagramDriver} from '../../../instagramDriver.es6';

/**
 * Implementation of FeedTransform for the second and subsequent pages requested by the InstagramDriver.
 */
export class FrontPageFeedTransform extends FeedTransform {

	/**
	 * @param	{Object} commentsTransform
	 *			{CommentsTransform} object for delegating comment JSON parsing to.
	 */
	constructor(commentsTransform) {
		super();
		this.parser = new NetworkDriver();
		this.commentsTransform = commentsTransform;
	}

	parseMedia(node) {
		return [
			new Media({
				height: node.dimensions.height,
				imageUrl: node.display_url,
				srcUrl: node.video_url ? node.video_url : node.display_url,
				type: node.video_url ? 'video' : 'photo',
				width: node.dimensions.width
			})
		];
	}

	/**
	 * @param 	{Object} parent
	 *			JSON object to parse post data from.
	 *
	 * @returns	Possibly empty array of Post objects.
	 */
	transform(parent) {

		let post = {};
		let posts = [];

		parent = this.parser.jResponse(parent);
		parent = (parent && parent.edges ? parent.edges.map((child) => child.node) : []);

		parent.forEach((node) => {

			if(node.dimensions !== undefined){
					
				post = this.parsePost(node);
				
				post.memento = node.shortcode;
				post.likeCount = node.edge_media_preview_like.count;
				post.rawTimestamp = String(node.taken_at_timestamp);
				post.timestamp = Number(node.taken_at_timestamp * 1000);
				post.likeStatus = (node.viewer_has_liked ? Post.LikeStatusLike : Post.LikeStatusNone);
				post.message = node.edge_media_to_caption.edges.map((edge) => edge.node.text).join(' ');

				posts.push(post);
			}
				
		});

		return posts;
	}

	/**
	 * @param 	{Object} parent
	 *			JSON object to parse post data from.
	 *
	 * @returns	Possibly empty array of Post objects.
	 */
	getUnformatted(parent) {

		let posts = [];
		parent = this.parser.jResponse(parent);
		parent = (parent && parent.edges ? parent.edges.map((child) => child.node) : []);

		parent.forEach((node) => {

			if(node.dimensions === undefined &&
				(node.__typename && node.__typename.toString() !== InstagramDriver.INSTAGRAM_GRAPH_SUGGESTED_USER )){
				posts.push(node);
			}
				
		});

		return posts;
	}
}