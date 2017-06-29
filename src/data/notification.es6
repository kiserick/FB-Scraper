export class Notification {

  constructor({ vendor = "unknown", id = "", timestamp = 0, rawTimestamp = '', message = "", creator = null, memento = '' } = {}) {
    this.creator = creator;
    this.id = id;
    this.message = message;
    this.memento = memento;
    this.rawTimestamp = rawTimestamp;
    this.timestamp = timestamp;
    this.vendor = vendor;
  }
}