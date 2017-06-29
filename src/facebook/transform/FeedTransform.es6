import {FacebookHandler} from '../../FacebookHandler.es6';
import {ProfileUrlTransform} from './ProfileUrlTransform.es6';

let DomUtils = require('domutils');
let util = require('util');

// Default regular expression used to extract the creator identifier from the Full Story element of a story.
const REGEX_CREATORID_FULLSTORY = /(?:(?:&id=|&amp;id=)|groups\/)(\d+)/;
// Regular expression used to extract the creator identifier from the Full Story element of a photo album.
const REGEX_CREATORID_PHOTOALBUM = /(\d+|[a-zA-Z0-9_.]+)\/albums/;
// Regular expression used to extract the creator identifier from the Full Story element of a posts story.
const REGEX_CREATORID_POSTS = /(\d+|[a-zA-Z0-9_.]+)\/posts/;
// Regular expression used to extract the creator identifier from the Full Story element of a photos story.
const REGEX_CREATORID_PHOTOS = /(\d+|[a-zA-Z0-9_.]+)\/photos/;
// Default regular expression used to extract the story identifier from a Full Story element
const REGEX_STORYID_FULLSTORY = /(?:fbid=|albums\/)(\d+)/;
// Regular expression used to extract the story identifier from a Full Story element for a group posting.
const REGEX_STORYID_GROUP = /(?:&id=|&amp;id=)(\d+)/;
// Regular expression used to extract the story identifier from the Full Story element of a posts posting.
const REGEX_STORYID_POSTS = /posts\/(\d+)/;
// Regular expression used to extract the story identifier from the Full Story element of a photos posting.
const REGEX_STORYID_PHOTOS = /\/photos\/[^\/]+\/(\d+)\//;

util.inherits(FeedTransform, FacebookHandler);

// Creates a FeedTransform handler.
//
// The FeedTransform handler is stateful, handling both left-to-right and right-to-left layout, depending upon the
// language of the page being scraped. Left-to-Right layout (representing Latinate languages) is the default behaviour - this class
// is expected to operate left-to-right unless FALSE is passed into the constructor.
//
// One or both of the following parameters can be passed into this object.
//
// <ltr>	<OPTIONAL> Boolean indicating whether or not the handler should be operating in Left-To-Right mode. This defaults to TRUE.
// <source>	<OPTIONAL> HTML passed to this transformer for handling.
export function FeedTransform(ltr, source) {
	this.ltr = (typeof(ltr) === 'boolean' ? ltr : true);
	this.source = (typeof(ltr) === 'string' ? ltr : source);
}
  
FeedTransform.prototype.transform = function(parent) {

    // Filter functions
    let hasContainedAnchor = (elem) => (DomUtils.findOne(this.isAnchor, [elem]) !== null);
    let isNameHeader = (elem) => {
        // Name header if all link text is the full text of the header (typically being the name of the person.  Note: links may be nested)
        let fullText = this.extractText(elem);
        let links = DomUtils.findAll(this.isAnchor, [elem]);
        let linkTest = (link) => (fullText === this.extractText(link));

        return ((links && links.length > 0) ? links.every(linkTest) : false);
    }
    let isStory = (elem) => (this.isHeader(elem) && hasContainedAnchor(elem) && !isNameHeader(elem));
    let isNotTrackingFrame = (elem) => (!('iframe' === elem.name && elem.attribs && !elem.attribs.height && !elem.attribs.width));
    // Generate the required details from the scraped data.
    let parseChild = (child) => {

        // Lots of useful data in this div.
        let actionsDiv = DomUtils.findOne((elem) => this.isActionsDiv(elem, this), [ child ]);
        
        let id = this.extractId(actionsDiv);
        let fullStory = this.extractFullStoryUrl(actionsDiv);
        let username = new ProfileUrlTransform(this.ltr).transform(child);
        let story = (!this._isAd(child) ? DomUtils.findAll(isStory, [ child ]) : false);
        
        if (id && fullStory && username) {
            return {
                id: id,
                story: (story ? this.generateStory(story) : false),
                type: (this._isAd(child.children[0]) ? 'offer' : false),
                username: username,
                fullStoryUrl: fullStory
            };
        } else {
            return false;
        }
    }

    parent = (parent && parent.next ? parent.next : (this.hasFirstChild(parent) && parent.children.length === 1 ? parent.children[0] : parent));
    return (parent ? parent.children.filter(isNotTrackingFrame).map(parseChild).filter((post) => post) : []);
}


//Determine which creator identifier regular expression should be used for the given element.
//
// This function has been abstracted into its own class function as it is expected that it may grow.
//
// <element>	HTML element to examine for potential creator identifier.
// RETURN 		one of the constant regular expressions to use to extract a creator identifier for a potential post.
FeedTransform.prototype.creatorRegex = function(element) {
    var cFunction = REGEX_CREATORID_FULLSTORY;
    if (this.isAnchor(element)) {
        if (element.attribs.href.contains('/albums/')) {
            cFunction = REGEX_CREATORID_PHOTOALBUM;
        } else if (element.attribs.href.contains('/posts/')) {
            cFunction = REGEX_CREATORID_POSTS;
        } else if (element.attribs.href.contains('/photos/')) {
            cFunction = REGEX_CREATORID_PHOTOS;
        }
    }
    return cFunction;
}

// Extracts the Post Id from the actions div.
//
// <actionsDiv>  Previously determined div containing the available post actions.
// RETURN        Post id.
FeedTransform.prototype.extractId = function(actionsDiv) {
	let id = false;
    var matchStory = (elem) => (elem.attribs.href.search(this.storyRegex(elem)) != -1);
    var matchCreator = (elem) => (elem.attribs.href.search(this.creatorRegex(elem)) != -1);
    var isCandidateElement = (elem) => (this.isAnchor(elem) && matchStory(elem) && matchCreator(elem));
    var generateStoryId = (elem) => (elem.attribs.href.match(this.creatorRegex(elem))[1] + '_' + elem.attribs.href.match(this.storyRegex(elem))[1]);

    id = (actionsDiv ? DomUtils.findOne(isCandidateElement, [ actionsDiv ]) : false);
    
    return (id ? generateStoryId(id) : false);
}

// Extracts the Full Story URL from the actions div.
//
// <actionsDiv> 	Previously-determined div containing the available post actions.
// RETURN           Relative URL pointing to the full story post.
FeedTransform.prototype.extractFullStoryUrl = function(actionsDiv) {

	let result = false;

	let filterSave = (elem) => (elem.attribs.href.startsWith('/save/'));
	let filterMore = (elem) => (elem.attribs.href.startsWith('/nfx/basic/direct_actions/?context_str'));
	let filterUndesired = (elem) => (this.isAnchor(elem) && !filterMore(elem) && !filterSave(elem));

	if (actionsDiv) {

	    let options = (actionsDiv.children.filter(filterUndesired).reverse());

	    if (options.length) {
		    result = this.readyUrl(options[0].attribs.href);
		}
	}

	return result;
}

// Extract the story from the HTML.
//
// <element>	previously-determined story element.
// RETURN		Story text for this scraped post, or false is no story could be parsed.
FeedTransform.prototype.generateStory = function(elements) {
    // Provide blank line between each story item
    let story = false
    
    if (elements) {
        elements.forEach((element) => {
            let extracted = DomUtils.find(this.isText, [element], true);
            if (extracted) {
                extracted = (extracted.length === 1 ? false : extracted.map((elem) => elem.data, this).join(' '));
                extracted = (extracted ? this.prettifyText(extracted) : extracted);
            }
            story = (story ? story + '\n\n' + extracted : extracted);
        })
    }
    
    return story;
}

//Extract the creator of the story.
//
//<elem> top-level Story element including a creator.
//RETURN Relative URL to the post creator's Facebook page, of false if non could be determined.
FeedTransform.prototype.generateStoryCreator = function(elem) {
    
    let element = DomUtils.find(this.isAnchor, [ elem ], true, 1);
    if (element && element.length > 0) {
        element = element[0].attribs.href;
    }
    
    return element;
}

// Helper to determine if the HTML block contains the actions available on a Post.
// The actions are determined by the following rules:
// 1. Every element must be a span or an anchor
// 2. No two anchors can follow one another.
//
// <elem>       Element to test.
// <thisArg>    DomUtils + array iterator = (this-mangling).
// RETURN       True if the given element is the top-level div containing the actions of the Post.
FeedTransform.prototype.isActionsDiv = function(elem, thisArg) {
    let isMatchingSpan = (span) => (span.attribs.class === elem.attribs.class);
    let isValidSpan = (span, index, arr) => (span.name === 'span' && span.attribs && (this.isButtonDivider(span) || isMatchingSpan(span) || isAdSpan(span, index, arr)));
    let isValidAnchor = (anchor, index, arr) => (this.isAnchor(anchor) && isValidSpan(arr[index - 1], (index - 1), arr));
    let isValidFirst = (child, index, arr) => (index === 0 && (isValidSpan(child, index, arr) || this.isAnchor(child)));
    let isAdSpan = (span, index, arr) => (index === arr.length - 1 && this._isAd(span) && this.isButtonDivider(arr[index - 1]));
    let test = (child, index, arr) => (isValidFirst(child, index, arr) || isValidSpan(child, index, arr) || isValidAnchor(child, index, arr));
    
    thisArg = (thisArg || this);
    
    return (elem.children && (elem.children.length > 1) && elem.children.every(test, thisArg));
}

// Helper funtion to determine if the given element satisfies the criteria to suggest that it contains text indicating that the current post is an ad.
// An ad Post is determined by the rules;
//
// 1. Element is not a header-three element.
// 2. Element has exactly one child.
// 3. Child element is text-only.
//
// <element>    Element to test apply the above rules to.
// RETURN       Boolean indicating whether or not the element suggests that this ad is a post.
FeedTransform.prototype._isAd = function(element) {
    return (!this.isHeader(element) && this.hasFirstChild(element) && (element.children.length === 1) && this.isText(element.children[0]));
}

// Determine which story identifier regular expression should be used for the given element.
//
// This function has been abstracted into its own class function as it is expected that it may grow.
//
// <element> HTML element to examine for potential story identifier.
// RETURN one of the constant regular expressions to use to extract a creator identifier for a potential post.
FeedTransform.prototype.storyRegex = function(element) {
    var sFunction = REGEX_STORYID_FULLSTORY;
    if (this.isAnchor(element)) {
        if (element.attribs.href.startsWith('/groups/')) {
            sFunction = REGEX_STORYID_GROUP;
        } else if (element.attribs.href.contains('/posts/')) {
            sFunction = REGEX_STORYID_POSTS;
        } else if (element.attribs.href.contains('/photos/')) {
            sFunction = REGEX_STORYID_PHOTOS;
        }
    }
    return sFunction;
}
