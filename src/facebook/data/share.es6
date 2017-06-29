export class Share {

	constructor({ csid = '', fbDtsg = '', fbId = '', privacyx = 0, sid = 0 }) {

		this.appid = 0;
		this.c_src = 'share';
		this.csid = csid;
		this.fb_dtsg = fbDtsg;
		this.m = 'self';
		this.privacyx = privacyx;
		this.referrer = 'permalink';
		this.sid = sid;
	    this.target = fbId;
        this.view_post = 'Share';
	    this.view_privacy = 'Public';
	    this.xc_message = '';
	}
}