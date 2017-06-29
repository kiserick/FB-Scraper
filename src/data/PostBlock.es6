export class PostBlock {

	constructor({ apollo = false, facebook = false, instagram = false, posted = false, twitter = false, youtube = false } = {}) {
		this.apollo = apollo;
		this.facebook = facebook;
		this.instagram = instagram;
		this.posted = posted;
		this.twitter = twitter;
		this.youtube = youtube;
	}

}