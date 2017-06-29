import {FacebookHandler} from '../../FacebookHandler.es6';
import {User} from '../../data/user.es6';

let DomUtils = require('domutils');
let util = require('util');

util.inherits(CommentsTransform, FacebookHandler);

export function CommentsTransform() {}

CommentsTransform.prototype.transform = function(dom) {
    
  let comments = [];
  let commentsDiv = null;
  let isSkipFirstComment = false;
  
  var isCommentMarker = (elem) => (this.isDiv(elem) && elem.attribs && elem.attribs.id && 'add_comment_link_placeholder' === elem.attribs.id);
  var isPreviousComments = (elem) => (this.isDiv(elem) && elem.attribs.id && elem.attribs.id.startsWith('see_prev_') && this.hasFirstChild(elem) && (elem.children.length === 1) && this.isAnchor(elem.children[0]));

  var commentMarker = DomUtils.findOne(isCommentMarker, dom);
  if (commentMarker) {
    // Find the div before comment marker (as it contains the comments)
    let isCommentsDivFound = false;
    commentMarker.parent.children.forEach((div) => {
      if (isCommentsDivFound) {
        return; // found no further process
      }
      if (div === commentMarker) {
        isCommentsDivFound = true; // keeps commentDiv pointing to previous div (containing the comments)
      } else {
        // Move to next div
        commentsDiv = div;
      }
    });
  }
  
  if (!commentsDiv) {
    // Attempt to find by previous comments
    commentsDiv = DomUtils.findOne(isPreviousComments, dom);
    if (commentsDiv) {
      commentsDiv = commentsDiv.parent;
      isSkipFirstComment = true; // as first div is the previous comments
    }
  }
  
  if (!commentsDiv) {
    // Attempt to find by comment id
    var isCommentIdentifier = (elem) => (this.isDiv(elem) && elem.attribs && elem.attribs.id && elem.attribs.id.match(/^\d+$/))
    var commentIdentifierDiv = DomUtils.findOne(isCommentIdentifier, dom)
    if (commentIdentifierDiv) {
      commentsDiv = commentIdentifierDiv.parent
    }
  }
  
  if (commentsDiv) {
    
    // Ensure there is comments
    var isCommentSubmitForm = (elem) => (this.isForm(elem) && elem.attribs && elem.attribs.action && elem.attribs.action.startsWith('/a/comment.php?'))
    var commentSubmitForm = DomUtils.findOne(isCommentSubmitForm, [ commentsDiv ]);
    if (commentSubmitForm) {
      return []; // no comments available
    }
    
    // Load the comments
    commentsDiv.children.forEach((commentDiv) => {
     
      // Determine if skip first div
      if (isSkipFirstComment) {
        isSkipFirstComment = false;
        return; // skip
      }
      
      // Obtain the comment ID
      let commentId = null;

      // Attempt to obtain ID from like link
      let isCommentLikeLink = (elem) => (this.isAnchor(elem) && elem.attribs && elem.attribs.href.startsWith('/a/comment.php?like_comment_id='))
      let commentLink = DomUtils.findOne(isCommentLikeLink, [ commentDiv ])
      if (commentLink) {
        commentId = commentLink.attribs.href.match(/like_comment_id=(\d+)\&/)[1]
        
      } else if (commentDiv.attribs.id) {
        // Obtain ID from div
        commentId = commentDiv.attribs.id
        if (commentId.startsWith('see_next')) {
          return // ignore next comments div
        }
      }
      if (!commentId) {
        return // must have identifier for comment
      }
      
      // Obtain the creator details
      let creator = null 
      let isCommentCreatorLink = (elem) => (this.isAnchor(elem) && elem.parent && this.isHeader(elem.parent))
      let commentCreatorLink = DomUtils.findOne(isCommentCreatorLink, [ commentDiv ])
      if (commentCreatorLink) {
        
        // Obtain the name
        let creatorName = this.extractText(commentCreatorLink)
        
        // Obtain the profile URL
        let profileUrl = this.readyUrl(commentCreatorLink.attribs.href)
        
        // Obtain the username (or identifier)
        let userId = profileUrl.match(/\/([^\/?]+)\??/)[1]
        
        // Create the creator
        creator = new User({
          id: userId,
          name: creatorName,
          photoUrl: '', // not able to source (will attempt cached with profileUrl)
          vendor: 'facebook'
        })
        creator.profileUrl = profileUrl
      }
      
      // Obtain the message ( this has added back support for comments contained within a extra div and not )
      let commentTextDiv = commentDiv.children[1] || commentDiv.children[0].children[1]; // always second
      let commentText = this.extractText(commentTextDiv, dom, "CommentsTransform")
      
      // Obtain the timestamp
      let commentRawTimestamp = null 
      let isCommentTimestamp = (elem) => (elem && 'abbr' === elem.name)
      let commentTimestampAbbr = DomUtils.findOne(isCommentTimestamp, [ commentDiv ])
      if (commentTimestampAbbr) {
        commentRawTimestamp = this.extractText(commentTimestampAbbr)
      }
      
      // Add the comment
      let comment = {
        creator: creator,
        id: commentId,
        memento: '',
        message: commentText,
        rawTimestamp: commentRawTimestamp,
        timestamp: 0,
        vendor: 'facebook'
      };
      comments.push(comment);
    })
  }
  
  // Return the comments
  return comments
}