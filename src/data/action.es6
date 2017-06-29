export class Action {

  constructor({ type = '', target = '', enabled = true } = {}) {
    this.type = type
    this.target = target
    this.enabled = enabled
  }

}