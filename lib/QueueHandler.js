/**
 * @constructor
 * @abstract
 */
function QueueHandler() {
	if (this.constructor !== QueueHandler) {
		this.init();
	}
}

/**
 * @abstract
 */
QueueHandler.prototype.init = function(config) {
	// each provider implement its own init
	throw new Error("Abstract method!");
};

/**
 * @abstract
 */
QueueHandler.prototype.handle = function(callback) {
	// each provider implement its own open
	throw new Error("Abstract method!");
};

module.exports = QueueHandler;