<?php

$config = require __DIR__ . '/boot.php';

///
///
echo PHP_EOL;
error_log('### Run');

startTime('formanta--run');

$runner = new FormantaBlocks\Runner(new FormantaBlocks\Config($config));

$url_root = (isset($runner->config->url['ssl']) ? ($runner->config->url['ssl'] ? 'https' : 'http') : '') . '://' . (isset($runner->config->url['host']) ? $runner->config->url['host'] : '') . (isset($runner->config->url['port']) && false !== $runner->config->url['port'] && 80 != $runner->config->url['port'] ? ':' . $runner->config->url['port'] : '');

///
/// Data for Template
echo PHP_EOL;
error_log('### Add Default Template Data');

$runner->static_gen->renderer
    ->assign('url',
        [
            'home'  => $url_root,
            'page'  => $url_root,
            'asset' => $url_root,
        ]
    )
    ->assign('inf', []);

endTime('formanta--run');

return $runner;