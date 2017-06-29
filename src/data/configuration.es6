export class Configuration {

  constructor({ media_friends = 50, popular_mostRecent = 50 } = {}) {
    this.media_friends = media_friends
    this.popular_mostRecent = popular_mostRecent
  }
}