import {User} from './user.es6'

export class Comment {

  constructor({ vendor = "unknown", id = "", timestamp = 0, rawTimestamp = '', message = "", creator = null, memento = '' } = {}) {
    this.creator = creator;
    this.id = id;
    this.memento = memento;
    this.message = message;
    this.rawTimestamp = rawTimestamp;
    this.timestamp = timestamp;
    this.vendor = vendor;
  }
}