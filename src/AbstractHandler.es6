let DomHandler = require('domhandler');
let util = require('util');

// Top-level abstract class that all scraper handlers should extend, for code reuse purposes.
util.inherits(AbstractHandler, DomHandler);
AbstractHandler.prototype.init = DomHandler;

//PLEASE NOTE: This class must be used with a parser with recognizeSelfClosing option set to True.
export function AbstractHandler() {}


/*********************** DEBUG METHODS *********************/
AbstractHandler.prototype.printStage = function(message, parent, level) {
	logger.debug("=======================")
	logger.debug(message)
	if (parent) {
		this.printTree(parent, level)
	} else {
		logger.debug('No nodes')
	}
}

AbstractHandler.prototype.printTree = function(node, level, currentLevel) {
	var levelBullet = ''
	if (!currentLevel) {
		currentLevel = 1
		levelBullet = '-'
	} else if (currentLevel > level) {
		return; // depth of tree output reached
	} else {
		for (var i = 0; i < currentLevel; i++) {
			levelBullet += '  ';
		}
		levelBullet += '-'
	}

	AbstractHandler.prototype.printNode = function(node, level, currentLevel) {
		if (node) {
			logger.debug(levelBullet + (node.name ? node.name + ': ' + JSON.stringify(node.attribs) : (node.type === 'text' ? node.data : node.type)));
			if (node.children) {
				node.children.forEach((child) => {
					this.printTree(child, level, (currentLevel + 1))
				})
			}
		} else {
			logger.debug(levelBullet + node)
		}
	}

	if (Array.isArray(node)) {
		node.forEach((element) => this.printNode(element, level, currentLevel))
	} else {
		this.printNode(node, level, currentLevel)
	}
}