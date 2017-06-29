import {ActionsTransform} from './transform/ActionsTransform.es6';
import {CommentsTransform} from './transform/CommentsTransform.es6';
import {Expression} from '../expression.es6';
import {LikesTransform} from './transform/LikesTransform.es6';
import {Media} from '../data/media.es6';
import {MessageTransform} from './transform/MessageTransform.es6';
import {FacebookHandler} from '../FacebookHandler.es6';
import {ProfileUrlTransform} from './transform/ProfileUrlTransform.es6';
import {Post} from '../data/post.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

// Magic string representing a vide URL.
const PATH_VIDEO_PREFIX = '/video_redirect/?src=';
// Magic string representing the embedded string to search for when extracting links to third-party webpage URLs.
const REGEX_LINK_EXTERNAL = /u=([^&]+)\&/;
// Magic string representing a tracking redirect link in youtube video
const REGEX_LINK_EXTERNAL_TRACKED = /https:\/\/www.youtube.com\/(?:attribution_link|)\?.+?u\=(%2Fwatch%3Fv%3D.+?&)/;
// Regular expression used to determine if a link is a video or not.
const REGEX_URL_VIDEO = /([^\s]+\.[mp4]{3,4})(?:\?|$)/;
// Regex representing a YouTube link (either mobile or www) which then extracts the URL path for individual use.
const REGEX_LINK_YOUTUBE_MOBILE = /https:\/\/m.youtube.com\/(.+)/;

util.inherits(FacebookPostHandler, FacebookHandler);
FacebookPostHandler.prototype.init = DomHandler;

//Implementation of DomParser specifically for the Facebook noscript mobile site.
//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookPostHandler(completionCallback, source) {
	this.init(completionCallback);
	this.source = (source || '');
	this.post = new Post();
}

FacebookPostHandler.prototype.onend = function() {
    let href = (elem) => (this.readyUrl(elem.attribs.href));

    var linkRef = null;
    var messageDiv = null;
    let messageTransform = new MessageTransform()
    var isAllowLink = true;
    var parent = this.findPostParent(this.dom);
    var errors = [];

    if (parent) {

        // Obtain the message
        messageDiv = messageTransform.findMessageDiv(parent);

        var isVideo = (elem) => (this.isAnchor(elem) && elem.attribs.href.startsWith(PATH_VIDEO_PREFIX));
        var isYouTubeVideo = (elem) => (this.isAnchor(elem) && elem.attribs.href.contains('youtube.com') && !messageTransform.isSpannedUrl(elem));

        var youtubeLink;
        var videoImageImg;
        var videoLink = DomUtils.findOne(isVideo, [messageDiv]);
        var video = FacebookPostHandler.prototype._makeMeAVideo();

        if (videoLink) {

            videoImageImg = DomUtils.findOne(this.isImage, [videoLink]);
            video.srcUrl = this.readyUrlParameter(this.readyUrl(videoLink.attribs.href).substring(PATH_VIDEO_PREFIX.length));

        } else {

            // Attempt to find YouTube shared video (within the message)
            videoLink = DomUtils.findOne(isYouTubeVideo, [messageDiv]);

            if (videoLink) {

                videoImageImg = DomUtils.findOne(this.isImage, [videoLink]);
                youtubeLink = this.readyUrlParameter(this.readyUrl(videoLink.attribs.href.match(REGEX_LINK_EXTERNAL)[1]));

                if (youtubeLink.match(REGEX_LINK_EXTERNAL_TRACKED)) {
                    var sanatizedYoutubeLink = this.readyUrlParameter(youtubeLink.match(REGEX_LINK_EXTERNAL_TRACKED)[1]);
                    video.srcUrl = sanatizedYoutubeLink ? "https://www.youtube.com" + sanatizedYoutubeLink : youtubeLink;
                } else {
                    video.srcUrl = youtubeLink;
                }

                // Make sure all youtube links are not m.youtube.com
                if (video.srcUrl.match(REGEX_LINK_YOUTUBE_MOBILE) ) {
                    video.srcUrl = "https://www.youtube.com/" + video.srcUrl.match(REGEX_LINK_YOUTUBE_MOBILE)[1];
                }
            }
        }

        if (videoLink) {

            if (videoImageImg) {

                video.imageUrl = this.readyFullImageUrl(this.readyUrl(videoImageImg.attribs.src));
                video.width = (videoImageImg && videoImageImg.attribs.width ? parseInt(videoImageImg.attribs.width) : -1);
                video.height = (videoImageImg && videoImageImg.attribs.height ? parseInt(videoImageImg.attribs.height) : -1);
            }

            this.post.type = 'video';
            this.post.media.push(video);
            isAllowLink = false; // do not use video as link

        } else {

            // Obtain the lowest child element containing the information (avoids comments)
            let multipleImagesParent = parent.children[0].children[0]

            // Search for multiple images
            var images = DomUtils.findAll(this.isPhotoLink, [multipleImagesParent]);

            isAllowLink = (images.length === 0);

            if (images.length === 1) {
                this.post.resharedPhoto = this.readyFullImageUrl(href(images[0]));
                this.post.type = 'photo';
            } else if (images.length > 1) {
                this.post.multiplePhotos = [];
                this.post.type = 'photo';

                images.forEach((image) => {

                    var imageFullSizePageUrl = this.readyFullImageUrl(href(image));

                    // Load the multiple photos
                    this.post.multiplePhotos.push(imageFullSizePageUrl);
                });
            }
        }
    }

    if (messageDiv) {
        this.post.message = messageTransform.transform(messageDiv);
    } else {
        // Below relies on existence of messageDiv (so use parent if message div not found)
        messageDiv = parent
    }

    // Determine if a link
    if (isAllowLink && messageDiv) {

        let firstLink = false;
        let linkImage = false;
        let videoLink = false;
        let externalLink = false;

        let isExternalHref = (href) => (href.match(REGEX_LINK_EXTERNAL) || href.match(Expression.REGEX_IMAGEURL_QUERIES) || href.match(REGEX_URL_VIDEO));
        let isExternalLink = (elem) => (this.isAnchor(elem) && isExternalHref(elem.attribs.href))
        // Determine if picture for the link
        let isTableLocatedLinkRef = (elem) => (this.hasFirstChild(elem) && this.isAnchor(elem.children[0]) && DomUtils.findOne(((elem) => elem && 'table' === elem.name), [elem.children[0]]));
        let postTo = (link, type, pFunction) => {
            this.post.type = type;
            this.post.message = (this.post.message.slice(0, this.post.message.indexOf(link)).trim());

            if (!this.post.media.length) {
                this.post.media.push(FacebookPostHandler.prototype[pFunction](link));
            }
        };
        let postToLinkedImage = (linkedImageUrl) => postTo(linkedImageUrl, 'photo', '_makeMeAJPeg');
        let postToLinkedVideo = (linkedVideoUrl) => postTo(linkedVideoUrl, 'video', '_makeMeAVideo');

        linkRef = DomUtils.findOne(isTableLocatedLinkRef, [messageDiv]);
        firstLink = DomUtils.findOne(isExternalLink, [messageDiv]);

        if (linkRef) {
            // Obtain possible image within the link
            linkImage = DomUtils.findOne(this.isImage, [linkRef]);

            if (linkImage) {

                linkImage = this.readyFullImageUrl(this.readyUrl(linkImage.attribs.src));

                this.post.type = 'photo';
                this.post.media.push(FacebookPostHandler.prototype._makeMeAJPeg(linkImage));
            }
        }
        if (firstLink) {

            firstLink = href(firstLink);

            videoLink = firstLink.match(REGEX_URL_VIDEO);
            externalLink = firstLink.match(REGEX_LINK_EXTERNAL);
            linkImage = firstLink.match(Expression.REGEX_IMAGEURL_QUERIES);

            if (externalLink) {

                externalLink = this.readyUrlParameter(externalLink[1]);

                if ('http://mysocialstream.com/find-out-more' !== externalLink) {

                    videoLink = externalLink.match(REGEX_URL_VIDEO);
                    linkImage = externalLink.match(Expression.REGEX_IMAGEURL_QUERIES);

                    if (linkImage) {
                        postToLinkedImage(linkImage[1]);
                    } else if (videoLink) {
                        postToLinkedVideo(videoLink[1]);
                    } else {
                        this.post.link = externalLink;
                        this.post.type = ('status' === this.post.type ? 'link' : this.post.type);
                    }
                }
            } else if (linkImage) {
                postToLinkedImage(linkImage[1]);
            } else if (videoLink) {
                postToLinkedVideo(videoLink[1]);
            }
        }
    }

    if (parent) {
        // Obtain the raw timestamp
        var isRawTimestamp = (elem) => (elem && 'abbr' === elem.name);
        var rawTimestampDiv = DomUtils.findOne(isRawTimestamp, [parent]);
        this.post.rawTimestamp = (rawTimestampDiv ? this.extractText(rawTimestampDiv) : '');

        // Extract the actions
        this.post.actions = new ActionsTransform().transform(parent);

        // Extract the comments
        this.post.comments = new CommentsTransform().transform(this.dom);

        // Find the first comment ID (if available)
        if (this.post.comments && this.post.comments.length > 0) {
            this.post.firstCommentId = this.post.comments[0].id;
        }

        // Determine liked and likeCount
        var likesStruct = new LikesTransform(this.post).transform(this.dom);
        this.post.likeStatus = likesStruct.likeStatus;
        this.post.likeCount = likesStruct.likeCount;

        // Determine the user profile URL
        this.post.username = new ProfileUrlTransform().transform(parent);
        if (this.post.username === false){
            errors.push({error:"Not found post.username", html : this.source});
        }

        this.dom = {
            post: this.post
        };
    }else{
        errors.push({error:"Not found FacebookPostHandler root OR m_story_permalink_view", html : this.source});
    }

    if((!this.post.media || this.post.media.length === 0) && (this.post.message.toString().length === 0)){
        errors.push({error:"Not found post message and media", html : this.source});
    }

    if (!this.post.type || this.post.type.toString().length === 0){
        errors.push({error:"Not found post type", html : this.source});
    }

    if(errors.length === 0){
        errors = null;
    }
    // Handle completion
    this._handleCallback(errors);

}

FacebookPostHandler.prototype._makeMeAJPeg = function(imageUrl) {

	imageUrl = (imageUrl || '');

	return new Media({
		imageUrl: imageUrl,
		mimeType: 'image/jpeg',
		srcUrl: imageUrl,
		type: 'photo'
	});
}

FacebookPostHandler.prototype._makeMeAVideo = function(sourceUrl, imageUrl) {
	return new Media({
		duration: -1,
		imageUrl: imageUrl,
		mimeType: 'video/mp4',
		srcUrl: sourceUrl,
		type: 'video'
	});
}