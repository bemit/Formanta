<?php
/**
 * @param \FormantaBlocks\Runner $runner
 *
 * @return \FormantaBlocks\Runner $runner
 */
return static function($runner) {
    if(!isset($runner)) {
        $runner = require __DIR__ . '/run.php';
    }

    ///
    /// Clean
    error_log('### Cleaning Static Templates');

    startTime('formanta--clean');

    $runner->static_gen->clean(true);

    endTime('formanta--clean');

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
};