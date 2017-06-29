export class User {

  constructor({ vendor = "unknown", id = '', name = '', photoUrl = '', memento = '' } = {}) {
    this.id = id;
    this.memento = memento;
    this.name = name;
    this.photoUrl = photoUrl;
    this.vendor = vendor;
  }
}