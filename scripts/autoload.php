<?php

function __autoload($class) {
	$path = str_replace('\\', '/', $class);
    require_once __DIR__ . "/$path.php";
}
