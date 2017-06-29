import {FacebookHandler} from '../../FacebookHandler.es6';

let DomUtils = require('domutils');
let util = require('util');

util.inherits(TimestampTransform, FacebookHandler);

export function TimestampTransform() {}

TimestampTransform.prototype.transform = function(parent) {
  var isRawTimestamp = (elem) => (elem && 'abbr' === elem.name);
  var rawTimestampDiv = DomUtils.findOne(isRawTimestamp, [ parent ]);
  
  return (rawTimestampDiv ? this.extractText(rawTimestampDiv) : '');
}