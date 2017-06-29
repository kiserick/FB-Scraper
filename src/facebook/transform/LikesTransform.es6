import {FacebookHandler} from '../../FacebookHandler.es6';
import {Post} from '../../data/post.es6'

let DomUtils = require('domutils');
let util = require('util');

util.inherits(LikesTransform, FacebookHandler);

// Creates the LikesTransform based around the given Post.
//
// <post>	Post object to interrogate for actions.
export function LikesTransform(post) {
	this.post = (post || {});
	this.post.actions = (this.post.actions || []);
}

LikesTransform.prototype.transform = function(parent) {

	let likeCount = 0;
	let likeCountDiv = false;
	let likeCountText = false;
	let likeCountNumber = false;
	let likeStatus = Post.LikeStatusNone;
	let isLikeCount = (elem) => (this.isAnchor(elem) && elem.attribs.href.match(/(\d+)\/likes\//));

	parent = (Array.isArray(parent) ? [parent[parent.length - 1]] : [parent]);
	likeCountDiv = DomUtils.findOne(isLikeCount, parent);
	
	if (likeCountDiv) {
		likeCountDiv = likeCountDiv.parent // surrounding div of the like listing link

		// Obtain the text
		likeCountText = this.extractText(likeCountDiv);

		// Extract the number of likes
		likeCountNumber = likeCountText.match(/([\d,]+)/);
		if (likeCountNumber) {
			likeCountNumber = likeCountNumber[0].replace(/,/g, '');
			likeCount = Number(likeCountNumber);
		} else {
			likeCountNumber = 0;
		}
	}

	// Determine if liked
	this.post.actions.forEach((action) => {
		if (action.type === 'Like') {
			if (action.target.contains('ul=1')) {
				likeStatus = Post.LikeStatusLike;
				likeCount++; // increment as typically listed separately to "other" like count
			}
		}
	})

	// Return the likes
	return {
		likeStatus: likeStatus,
		likeCount: likeCount
	}
}