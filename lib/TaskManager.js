require('./utils/KalturaConfig');
require('./utils/KalturaLogger');
var QueueManager = require('./QueueManager');

var TaskManager = function() {
	this.socketIoServer = null;
	this.queueManager = null;
	this.handlers = {};
	this.init();
};

TaskManager.prototype.init = function() {
	var This = this;
	this.queueManager = new QueueManager(function() {
		This.startServer();
	});
};

TaskManager.prototype.startServer = function() {
	for(var queue in KalturaConfig.config.queues) {
		var handlerType = KalturaConfig.config.queues[queue];
		KalturaLogger.log("Handling queue [" + queue + "] with handler [" + handlerType + "].");
		var handlerClass = require('./handlers/' + handlerType);
		var handler = new handlerClass();
		this.handlers[queue] = handler;
		this.queueManager.addMessageListener(queue, function(message){
			handler.handle(message);
		});
	}
};

module.exports = TaskManager;
