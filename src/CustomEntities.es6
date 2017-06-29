let Entities = require('html-entities').AllHtmlEntities;
let util = require('util');

// This class is used by the NetworkDriver superclass to resolve message text from the given HTML.
util.inherits(CustomEntities, Entities);

export function CustomEntities() {
}

CustomEntities.prototype.decode = function(str) {
	if (typeof str !== 'string') {
        logger.warn(new ApolloError('Invalid value type for html entities decode.'));
        return '';
    }
    return Entities.prototype.decode.apply(this, [str]);
}
