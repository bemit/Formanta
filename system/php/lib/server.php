<?php

$request = filter_input(INPUT_SERVER, 'REQUEST_URI', FILTER_SANITIZE_URL);

if(false === $request) {
    error_log('Formanta Server: REQUEST_URI is not valid.');
    exit(100);
}

if(null === $request) {
    error_log('Formanta Server: REQUEST_URI is not set.');
    exit(101);
}

if(!is_string($request)) {
    error_log('Formanta Server: unknown REQUEST_URI problem.');
    exit(102);
}

if(
    0 === strpos($request, '/api/')
) {
    // todo
    return false;
}

$filename = filter_input(INPUT_SERVER, 'REQUEST_URI', FILTER_UNSAFE_RAW);

if(false === $filename) {
    error_log('Formanta Server: $filename is not valid.');
    exit(110);
}
if(null === $filename) {
    error_log('Formanta Server: $filename is not set.');
    exit(111);
}

if(!is_string($filename)) {
    error_log('Formanta Server: unknown $filename problem.');
    exit(112);
}


if('/' === $request) {
    $request = '/index';
    $filename = '/index';
}

$file = __DIR__ . '/../../../build/' . $filename . '.html';

if(is_file($file)) {
    $path = pathinfo($file);
    if($path['extension'] == 'js') {
        header('Content-Type: application/javascript');
        readfile($file);
        exit(0);
    }

    if($path['extension'] == 'css') {
        header('Content-Type: text/css');
        readfile($file);
        exit(0);
    }

    if(
        $path['extension'] == 'map' ||
        $path['extension'] == 'json'
    ) {
        header('Content-Type: application/json');
        readfile($file);
        exit(0);
    }
    readfile($file);
    exit(0);
}

error_log('Formanta: No Route found.');