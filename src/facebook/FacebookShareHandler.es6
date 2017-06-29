import {MessageTransform} from './transform/MessageTransform.es6';
import {Share} from './data/share.es6';
import {FacebookHandler} from '../FacebookHandler.es6';

let DomHandler = require('domhandler');
let DomUtils = require('domutils');
let util = require('util');

util.inherits(FacebookShareHandler, FacebookHandler);
FacebookShareHandler.prototype.init = DomHandler;

//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function FacebookShareHandler(completionCallback) {
    this.init(completionCallback);
}

FacebookShareHandler.prototype.onend = function() {

    let requestForm = null;
    let parent = this.findPostParent(this.dom);
    let messageTransform = new MessageTransform();

    let childInput = (elem) => (this.isInput(elem) && elem.attribs.value && elem.attribs.type && elem.attribs.type === 'hidden');
    let extractValue = (found) => (found ? found.attribs.value  : false);
    let findChildInput = (elem, name) => (childInput(elem) && elem.attribs.name === name);
    let findCsid = (elem) => (findChildInput(elem, 'csid'));
    let findFbDtsg = (elem) => (findChildInput(elem, 'fb_dtsg'));
    let findPrivacyX = (elem) => (findChildInput(elem, 'privacyx'));
    let findTarget = (elem) => (findChildInput(elem, 'target'));
    let findSid = (elem) => (findChildInput(elem, 'sid'));

    if (parent) {

        requestForm = messageTransform.findShareForm(parent);

        if (!requestForm) {
            requestForm = messageTransform.findShareForm(parent.parent);
        }
        if (requestForm) {
            this.dom = {
                share: new Share({
                    csid: extractValue(DomUtils.findOne(findCsid, [requestForm])),
                    fbDtsg: extractValue(DomUtils.findOne(findFbDtsg, [requestForm])),
                    fbId: extractValue(DomUtils.findOne(findTarget, [requestForm])),
                    privacyx: extractValue(DomUtils.findOne(findPrivacyX, [requestForm])),
                    sid: extractValue(DomUtils.findOne(findSid, [requestForm]))
                })
            };
        }

        // Handle completion
        this._handleCallback();
    }
}