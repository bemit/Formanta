<?php

error_log('### Starting Dev Server');

$runner  = require __DIR__ . '/lib/run.php';

$port = $runner->config->url['port'];
$host = $runner->config->url['host'];
$connection = $host . ':' . $port;

$socket = @fsockopen($host, $port);

if(false !== $socket) {
    error_log('### hostname with port is already listening: ' . $connection);
    exit(50);
}

error_log('### Building Formanta');
$build = require __DIR__ . '/lib/build.php';
$runner = $build($runner);

error_log('### dev server on: ' . $connection);
exec('php -S ' . $connection . ' ' . __DIR__ . '/lib/server.php');