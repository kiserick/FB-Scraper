export class Compose {

	constructor({ action = '', charset_test = '', fb_dtsg = '', privacyx = 0, target = 0 }) {

		this.fb_dtsg = fb_dtsg;
		this.charset_test = charset_test;
		this.privacyx = privacyx;
		this.target = target;
		this.c_src = 'feed';
		this.cwevent = 'composer_entry';
		this.referrer = 'feed';
		this.ctype = 'inline';
		this.cver = 'amber';
		this.rst_icv = '';
		this.xc_message = '';
		this.action = action;
	}
}
