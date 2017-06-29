import {Action} from './action.es6'
import {Comment} from './comment.es6'
import {Identity} from './identity.es6'
import {Media} from './media.es6'
import {User} from './user.es6'

export class Post {

  constructor({ identity = null, id = "", type = "status", timestamp = 0, rawTimestamp = '', message = "", link = "", media = [], comments = [], actions = [], likeStatus = Post.LikeStatusNone, creator = null, memento = '' } = {}) {
    this.actions = actions;
    this.comments = comments;
    this.creator = creator;
    this.id = id;
    this.identity = identity;
    this.likeStatus = likeStatus;
    this.link = link;
    this.media = media;
    this.message = (message ? message : '');
    this.memento = memento;
    this.rawTimestamp = rawTimestamp;
    this.timestamp = timestamp;
    this.type = type;
  }
}

// States for likes
// Note: these align with LikeStatusEnum in IOS
Post.LikeStatusNone = 0
Post.LikeStatusLike = 1
Post.LikeStatusDislike = 2