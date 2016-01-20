<?php

$options = array();
array_shift($argv);
while ($option = array_shift($argv)){
	$matches = null;
	if(!preg_match('/^--(.+)$/', $option, $matches)){
		echo "Invalid argument $option\n";
		exit(-1);
	}

	$options[$matches[1]] = trim(array_shift($argv), '\'"');
}

$queueName = $options['queue'];

require_once __DIR__ . "/autoload.php";

use PhpAmqpLib\Connection\AMQPConnection;
use PhpAmqpLib\Message\AMQPMessage;

$connection = new AMQPConnection('localhost', 5672, 'guest', 'guest');
$channel = $connection->channel();

$channel->queue_declare($queueName, false, false, false, false);

$json = json_encode($options);
$msg = new AMQPMessage($json);
$channel->basic_publish($msg, '', $queueName);

$channel->close();
$connection->close();

