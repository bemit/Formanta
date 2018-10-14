<?php

echo PHP_EOL;
error_log('### Boot');

$config = require __DIR__ . '/_boot.php';

$runner = new FormantaBlocks\Runner(new FormantaBlocks\Config($config));

///
///
echo PHP_EOL;
error_log('### Run');

startTime('formanta--run');

$url_root = (isset($runner->config->url['ssl']) ? ($runner->config->url['ssl'] ? 'https' : 'http') : '') . '://' . (isset($runner->config->url['host']) ? $runner->config->url['host'] : '') . (isset($runner->config->url['port']) && false !== $runner->config->url['port'] && 80 != $runner->config->url['port'] ? ':' . $runner->config->url['port'] : '');

endTime('formanta--run');

///
/// Clean
error_log('### Cleaning Static Templates');

startTime('formanta--clean');

$runner->static_gen->clean(true);

endTime('formanta--clean');

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

///
/// Build Views
echo PHP_EOL;
error_log('### Build Static Templates');

startTime('formanta--build');

try {
    $runner->static_gen->build();
} catch(\Exception $e) {
    error_log('Formanta build: exception: ' . $e->getMessage());
}

endTime('formanta--build');

return $runner;