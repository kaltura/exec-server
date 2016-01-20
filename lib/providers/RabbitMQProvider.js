var QueueProvider = require('../QueueProvider');
var amqp = require('amqp');

// RabbitMQProvider c'tor
function RabbitMQProvider(config) { 
	QueueProvider.apply(this, config);
	this.init(config);
}

RabbitMQProvider.queues = {};

// inherit from QueueProvider
RabbitMQProvider.prototype = new QueueProvider();
RabbitMQProvider.prototype.constructor = RabbitMQProvider;
RabbitMQProvider.prototype.connection = null;

RabbitMQProvider.prototype.init = function(config) {
	this.username = config.username;
	this.password = config.password;
	this.server = config.server;
	this.port = config.port;
	this.timeout = config.timeout;
};

RabbitMQProvider.prototype.open = function(callback) {
	this.connection = amqp.createConnection({host: this.server,
		login: this.username,
		password: this.password,
		port: this.port});
	KalturaLogger.log("RabbitMQProvider has connected to " + this.server + ":" + this.port);
	// once the connection is ready, add it to the providers list (trigger the callback)
	var firstReady = true;
	this.connection.on('ready', function(){
		if(firstReady) {
    		firstReady = false;
    		callback();
		}
	});
	
};

RabbitMQProvider.prototype.listen = function(queueKey, callback)
{
	KalturaLogger.log('Connecting to: '+ queueKey);
	// open queue and subscribe to receive messages
	var q = this.connection.queue(queueKey, {
		autoDelete : false
	}, function(queue) {
		var ctag;
		KalturaLogger.log('Queue ' + queue.name + ' is open and waiting for messages...');
		// once the msg receive, trigger callback function (given by QueueManager)
		queue.subscribe(function(msg){
			var content = String.fromCharCode.apply(null, new Uint8Array(msg.data));
			KalturaLogger.debug('Queue [' + queue.name + '] content:' + content);
			callback(content);
		});

		RabbitMQProvider.queues[queueKey] = queue;
	});
};

RabbitMQProvider.prototype.unlisten = function(queueKey) {
	KalturaLogger.log('Closing queue: ' + queueKey); 
	// unsubsribe from queue with ctag
	var ctag = Object.getOwnPropertyNames(RabbitMQProvider.queues[queueKey].consumerTagListeners)[0];
	RabbitMQProvider.queues[queueKey].unsubscribe(ctag);
};

module.exports = RabbitMQProvider;