import {NetworkDriver} from '../../NetworkDriver.es6';

export class EndPageCursorTransform {

	constructor() {
		this.parser = new NetworkDriver();
	}

	transform(parent) {
		parent = this.parser.jResponse(parent);
	    return (parent && parent.page_info && parent.page_info.has_next_page ? parent.page_info.end_cursor : false)
	}
}