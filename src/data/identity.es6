export class Identity {

  constructor({ vendor = "unknown", oauthToken = "", oauthSecret = "", userId = '' } = {}) {
    this.vendor = vendor
    this.oauthToken = oauthToken
    this.oauthSecret = oauthSecret
    this.userId = userId
  }

}