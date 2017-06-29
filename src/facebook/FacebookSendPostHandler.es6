import {MessageTransform} from './transform/MessageTransform.es6';
import {FacebookHandler} from '../FacebookHandler.es6';
import {FormTransform} from './transform/FormTransform.es6';

let DomHandler = require('domhandler');
let util = require('util');

util.inherits(FacebookSendPostHandler, FacebookHandler);
FacebookSendPostHandler.prototype.init = DomHandler;

//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookSendPostHandler(completionCallback) {
    this.init(completionCallback);
    this.share = null;
}

FacebookSendPostHandler.prototype.onend = function() {

    var parent = this.findPostParent(this.dom).parent;
    let messageTransform = new MessageTransform();

    if (parent) {

        var requestForm = messageTransform.findSendPostForm(parent);

        if (requestForm) {
            this.compose = new FormTransform().transform(requestForm);
            this.compose.form.action = this.readyUrl(requestForm.attribs.action).replace('refid=8', 'refid=7');

            this.dom = {
                compose: this.compose.form
            };

            // Handle completion
            this._handleCallback();
        }
    }
}
