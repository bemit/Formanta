#!/usr/bin/env php
<?php

use Symfony\Component\Console\Input\ArgvInput;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;

set_time_limit(0);

function writeln($msg) {
    echo $msg . "\r\n";
}

require __DIR__ . '/vendor/autoload.php';

$input = new ArgvInput();
$input->bind(new InputDefinition([
    new InputArgument('task', InputArgument::OPTIONAL),
    new InputOption('debug', 'd', InputOption::VALUE_NONE),
]));

$env = $input->getParameterOption(['--env', '-e'], 'dev');

$debug = $input->hasParameterOption(['--debug', '-d']);

if(!$input->getArgument('task')) {
    if($debug) {
        writeln('Error: Argument `task` is missing.');
        writeln('abort.');
    }
    exit(2);
}

$allowed_task = [
    'build',
    'start',
    'watch',
];

$task = $input->getArgument('task');
$task_file = __DIR__ . '/system/php/' . $task . '.php';
if(in_array($task, $allowed_task) && file_exists($task_file)) {
    exec('php ' . $task_file);
} else {
    error_log('Formanta: task not available, try one of: `' . str_replace(['[', ']', '","', '"'], ['', '', ', ', ''], json_encode($allowed_task)) . '`, exiting now.');
    exit(0);
}