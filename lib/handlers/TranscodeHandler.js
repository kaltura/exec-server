var child_process = require('child_process');

if (typeof String.prototype.exec != 'function') {
	String.prototype.exec = function(callback, errorCallback) {
		var cmd = this;
		var childProcess = child_process.exec(cmd, function(error, stdout, stderr) {
			KalturaLogger.log('Command: ' + cmd);
			KalturaLogger.debug('Standard output: ' + stdout);

			if (stderr.length) {
				KalturaLogger.log('Standard error: ' + stderr);
			}

			if (error) {
				if (errorCallback) {
					errorCallback(error);
				} else {
					var exception = new Error();
					KalturaLogger.error('Exec: ' + error + '\n' + exception.stack);
				}
			} else if (callback) {
				callback(stdout);
			}
		});

		KalturaLogger.debug('Started cli process [' + childProcess.pid + ']: ' + cmd);
		return childProcess;
	};
}

var QueueHandler = require('../QueueHandler');

function TranscodeHandler() {
	QueueHandler.apply(this);
}

TranscodeHandler.queues = {};
TranscodeHandler.prototype = new QueueHandler();
TranscodeHandler.prototype.constructor = TranscodeHandler;
TranscodeHandler.prototype.ffmpegPath = null;
TranscodeHandler.prototype.streams = null;

TranscodeHandler.prototype.init = function() {
	this.ffmpegPath = KalturaConfig.config.bin.ffmpagPath;
	this.streams = {};
};

TranscodeHandler.prototype.isAlreadyHandled = function(streamName) {
	// TODO check against memcache
	
	if (this.streams[streamName]) {
		return true;
	}
	return false;
};

TranscodeHandler.prototype.touch = function(streamName) {
	KalturaLogger.debug('Touching stream [' + streamName + ']');
	
	// TODO touch against memcache

	var d = new Date();
	this.streams[streamName].lastTouch = d.getTime();
};

TranscodeHandler.prototype.done = function(streamName) {
	// TODO remove from memcache
	clearInterval(this.streams[streamName].interval);
	delete this.streams[streamName];
};

TranscodeHandler.prototype.kill = function(streamName) {
	KalturaLogger.log('Killing stream [' + streamName + '] process id [' + this.streams[streamName].childProcess.pid + ']');
	this.streams[streamName].childProcess.kill('SIGKILL');
	this.done(streamName);
};

TranscodeHandler.prototype.validate = function(streamName) {
	KalturaLogger.debug('Validating stream [' + streamName + ']');
	var d = new Date();
	var timeout = d.getTime() - 30000;
	if(!this.streams[streamName].lastTouch || this.streams[streamName].lastTouch < timeout){
		this.kill(streamName);
	}
};

TranscodeHandler.prototype.exec = function(streamName, command) {
	KalturaLogger.debug('Executing stream [' + streamName + ']');

	var cmd = ["time", this.ffmpegPath, command];
	var This = this;
	
	var commandLine = cmd.join(' ');
	this.streams[streamName].childProcess = commandLine.exec(function(){
		This.done(streamName);
	});

	this.streams[streamName].interval = setInterval(function(){
		This.validate(streamName);
	}, 60000);
};

TranscodeHandler.prototype.handle = function(json) {
	var data = JSON.parse(json);
	if (this.isAlreadyHandled(data.streamName)) {
		this.touch(data.streamName);
	} else {
		this.streams[data.streamName] = {
			streamName : data.streamName
		};
		this.exec(data.streamName, data.command);
	}
};

module.exports = TranscodeHandler;