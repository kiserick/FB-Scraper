import {FeedTransform} from '../FeedTransform.es6';
import {Media} from '../../../data/media.es6';
import {Post} from '../../../data/post.es6';
import {NetworkDriver} from '../../../NetworkDriver.es6';

/**
 * Implementation of FeedTransform for the second and subsequent pages requested by the InstagramDriver.
 */
export class PagedFeedTransform extends FeedTransform {

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
				imageUrl: node.display_src,
				srcUrl: node.video_url ? node.video_url : node.display_src,
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
		parent = (parent && parent.nodes ? parent.nodes : []);

	    parent.forEach((node) => {
			
			if(node.dimensions !== undefined){
				post = this.parsePost(node);
	    	
				post.memento = node.code;
				post.message = node.caption;
				post.likeCount = node.likes.count;
				post.rawTimestamp = String(node.date);
				post.timestamp = Number(node.date * 1000);
				post.likeStatus = (node.likes.viewer_has_liked ? Post.LikeStatusLike : Post.LikeStatusNone);

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
        parent = (parent && parent.nodes ? parent.nodes : []);

        parent.forEach((node) => {

            if(node.dimensions === undefined){
                posts.push(node);
            }
        });

        return posts;
    }
}