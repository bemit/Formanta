#!/usr/bin/env php
<?php

// todo: remover after dev
usleep(500);

use \Flood\Component\PerformanceMonitor\Monitor;

echo PHP_EOL;
error_log('### Admin Boot');

require __DIR__ . '/../../vendor/autoload.php';

$runtime = new FormantaBlocks\Runner(new FormantaBlocks\Config([
    'url'  => [
        'admin' => [
            // static gen needs url that should be builded
            'ssl'       => false,
            'host'      => 'localhost',
            'port'      => 25020,
            'base-path' => 'admin/',
        ],
    ],
    'view' => [
        'debug'       => true,
        'auto_reload' => true,
        'store'       => [
            'data_dir'          => __DIR__ . '/../data/',
            'cache_dir'         => __DIR__ . '/../../tmp/admin',
            'builded_info_file' => __DIR__ . '/builded.json',
            'static_dir'        => __DIR__ . '/../',
            'view_list'         => [
                __DIR__ . '/../view',
            ],
        ],
        'build'       => [
            /*'main' => [
                'view'   => 'main.twig',
                'static' => 'index.html',
            ],*/
        ],
    ],
]));

echo PHP_EOL;
error_log('### Admin Run');

Monitor::i()->startProfile('canal-admin--run');

$url_root = (isset($runtime->config->url['admin']['ssl']) ? ($runtime->config->url['admin']['ssl'] ? 'https' : 'http') : '') . '://' . (isset($runtime->config->url['admin']['host']) ? $runtime->config->url['admin']['host'] : '') . (isset($runtime->config->url['admin']['port']) && false !== $runtime->config->url['admin']['port'] && 80 != $runtime->config->url['admin']['port'] ? ':' . $runtime->config->url['admin']['port'] : '');

Monitor::i()->endProfile('canal-admin--run');
error_log('in ' .
    Monitor::i()->getInformation('canal-admin--run')['time'] . 's' . ' ' .
    Monitor::i()->convertMemory(Monitor::i()->getInformation('canal-admin--run')['memory']));

error_log('### Admin Cleaning Static Templates');

Monitor::i()->startProfile('canal-admin--clean');

$runtime->static_gen->clean(true);

Monitor::i()->endProfile('canal-admin--clean');
error_log('in ' .
    Monitor::i()->getInformation('canal-admin--clean')['time'] . 's' . ' ' .
    Monitor::i()->convertMemory(Monitor::i()->getInformation('canal-admin--clean')['memory']));

echo PHP_EOL;
error_log('### Admin Build Static Templates');

Monitor::i()->startProfile('canal-admin--build');
try {
    $runtime->static_gen->build();
} catch (\Exception $e) {
    error_log('Canal Admin: build: exception: ' . $e->getMessage());
}
Monitor::i()->endProfile('canal-admin--build');
error_log('in ' .
    Monitor::i()->getInformation('canal-admin--build')['time'] . 's' . ' ' .
    Monitor::i()->convertMemory(Monitor::i()->getInformation('canal-admin--build')['memory']));

echo PHP_EOL;
error_log('### Admin Add Default Template Data');

$runtime->static_gen->renderer
    ->assign('url',
        [
            'home'       => $url_root,
            'page'       => $url_root,
            'home-admin' => $url_root . '/admin/index.html',
            'asset'      => $url_root . '/admin/',
        ]
    )
    ->assign('inf', []);

echo PHP_EOL;
error_log('### Admin Create Filewatcher & Listener');

Monitor::i()->startProfile('canal-admin--watcher');

$watcher = new FormantaBlocks\Watcher();

$listener_group = [];
/**
 * Add the path views to the watcher
 */
foreach ($runtime->config->view->storeView() as $key => $value) {
    if (is_string($key)) {
        // key = path, value = namespace
        $listener_group[] = $watcher->watch($key);
    } else {
        // value = path, no namespace
        $listener_group[] = $watcher->watch($value);
    }
}

foreach ($listener_group as $listener) {
    $listener->onCreate(static function ($resource, $path) {
        echo "{$path} was created." . PHP_EOL;
    });
    $listener->onDelete(static function ($resource, $path) {
        echo "{$path} was deleted." . PHP_EOL;
    });

    $listener->onModify(static function ($resource, $path) use ($runtime) {
        /**
         * @var \JasonLewis\ResourceWatcher\Resource\FileResource $resource
         */
        echo $path.' was modified.' . PHP_EOL;
        $id_changed = $runtime->static_gen->invalidate(false, false, $resource->getPath(), 'static');
        if (false !== $id_changed) {
            // need to re-render/can re-render template
            $runtime->static_gen->render($id_changed, $runtime->config->view->buildTarget()[$id_changed]);
        }else {
            echo 'did not re-render.' . PHP_EOL;
        }
    });
}

Monitor::i()->endProfile('canal-admin--watcher');
error_log('in ' .
    Monitor::i()->getInformation('canal-admin--watcher')['time'] . 's' . ' ' .
    Monitor::i()->convertMemory(Monitor::i()->getInformation('canal-admin--watcher')['memory']));

echo PHP_EOL;
error_log('### Admin Start Filewatcher');

$watcher->start();