#!/usr/bin/env php
<?php

/**
 * @var \FormantaBlocks\Runner $runner
 */
$runner = require __DIR__ . '/_run.php';

///
/// FileWatcher
echo PHP_EOL;
error_log('### Create Filewatcher & Listener');

startTime('formanta--watcher');

$watcher = new FormantaBlocks\Watcher();

$listener_group = [];
/**
 * Add the path views to the watcher
 */
foreach($runner->config->view->storeView() as $key => $value) {
    if(is_string($key)) {
        // key = path, value = namespace
        $listener_group[] = $watcher->watch($key);
    } else {
        // value = path, no namespace
        $listener_group[] = $watcher->watch($value);
    }
}

foreach($listener_group as $listener) {
    $listener->onCreate(static function($resource, $path) {
        echo "{$path} was created." . PHP_EOL;
    });
    $listener->onDelete(static function($resource, $path) {
        echo "{$path} was deleted." . PHP_EOL;
    });

    $listener->onModify(static function($resource, $path) use ($runner) {
        /**
         * @var \JasonLewis\ResourceWatcher\Resource\FileResource $resource
         */
        echo $path . ' was modified.' . PHP_EOL;
        $id_changed = $runner->static_gen->invalidate(false, false, $resource->getPath(), 'static');
        if(false !== $id_changed) {
            // need to re-render/can re-render template
            $runner->static_gen->render($id_changed, $runner->config->view->buildTarget()[$id_changed]);
        } else {
            echo 'did not re-render.' . PHP_EOL;
        }
    });
}

endTime('formanta--watcher');

echo PHP_EOL;
error_log('### Start Filewatcher');

$watcher->start();