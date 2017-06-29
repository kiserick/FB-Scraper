import {ActionsTransform} from './transform/ActionsTransform.es6';
import {Expression} from '../expression.es6'
import {CommentsTransform} from './transform/CommentsTransform.es6';
import {FacebookHandler} from '../FacebookHandler.es6';
import {LikesTransform} from './transform/LikesTransform.es6';
import {Post} from '../data/post.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

util.inherits(FacebookAlbumHandler, FacebookHandler);
FacebookAlbumHandler.prototype.init = DomHandler;

//Implementation of DomParser specifically for the Facebook noscript mobile site.
//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookAlbumHandler(completionCallback) {
  this.init(completionCallback);
  this.post = new Post()
}

FacebookAlbumHandler.prototype.onend = function() {
  
  // Obtain the photos from the album
  var parent = this.findPostParent(this.dom);
  var errors = [];
  if (parent) {
    // Locate the photos
    var isPhoto = (elem) => (this.isAnchor(elem) && elem.attribs.href && (elem.attribs.href.search(Expression.PHOTO_URL_REGEX) === 0 || elem.attribs.href.search(Expression.DYNAMIC_PHOTO_URL_REGEX) === 0) )
    var photos = DomUtils.findAll(isPhoto, [ parent ])
    if (photos) {
      photos.forEach((photoLink) => {
        
        // Ensure have the array
        if (!this.post.multiplePhotos) {
          this.post.multiplePhotos = []
        }
        
        // Add the photo link
        this.post.multiplePhotos.push(photoLink.attribs.href)
      })
    }else {
        errors.push({error:"Not found Album photos", html : this.dom});
    }
  }else{
      errors.push({error:"Not found FacebookAlbumHandler root OR m_story_permalink_view", html : this.dom});
  }
  
  // Obtain the comments
  this.post.comments = new CommentsTransform().transform(this.dom)
  
  // Obtain the actions
  this.post.actions = new ActionsTransform().transform(this.dom)
  
  // Determine liked and likeCount
  var likesStruct = new LikesTransform(this.post).transform(this.dom, this.post.actions)
  this.post.likeStatus = likesStruct.likeStatus
  this.post.likeCount = likesStruct.likeCount
  
  // Load results
  this.dom = {
      post: this.post
  }

  if(!this.post.multiplePhotos){
      errors.push({error:"Not found Album multiplePhotos", html : this.dom});
  }
  if(errors.length === 0){
      errors = null;
  }

    this._handleCallback(errors);
}