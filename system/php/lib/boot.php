<?php

use \Flood\Component\PerformanceMonitor\Monitor;

echo PHP_EOL;
error_log('### Boot');

require dirname(__DIR__, 3) . '/vendor/autoload.php';

$config_folder = dirname(__DIR__, 3) . '/config/';
$config_path_url = $config_folder . 'url.json';
$config_path_view_system = $config_folder . 'view_system.json';
$config_path_build = $config_folder . 'build.json';

/**
 * Loads a Config file
 *
 * @param $file
 *
 * @throw \Exception when file was not found or is not readable
 *
 * @return mixed
 */
$load_config = static function($file) {
    if(is_file($file)) {
        if(null === ($data = json_decode(file_get_contents($file), true))) {
            throw new \Exception('json not readable in `' . $file . '`');
        }

        return $data;
    }

    throw new \Exception('file not found: `' . $file . '`');
};

try {
    $url = $load_config($config_path_url);

    $view_system = $load_config($config_path_view_system);
    if(is_string($view_system['store']['data_dir'])) {
        $view_system['store']['data_dir'] = dirname(__DIR__, 3) . $view_system['store']['data_dir'];
    }
    if(is_string($view_system['store']['cache_dir'])) {
        $view_system['store']['cache_dir'] = dirname(__DIR__, 3) . $view_system['store']['cache_dir'];
    }
    if(is_string($view_system['store']['builded_info_file'])) {
        $view_system['store']['builded_info_file'] = dirname(__DIR__, 3) . $view_system['store']['builded_info_file'];
    }

    $view_system['store']['build_dir'] = dirname(__DIR__, 3) . $view_system['store']['build_dir'];
    foreach($view_system['store']['view_list'] as $key => $val) {
        $tmp_val = $view_system['store']['view_list'][$key];
        unset($view_system['store']['view_list'][$key]);

        if(is_string($key)) {
            // key = path, value = namespace
            $view_system['store']['view_list'][dirname(__DIR__, 3) . $key] = $tmp_val;
        } else {
            // value = path, no namespace
            $view_system['store']['view_list'][] = dirname(__DIR__, 3) . $tmp_val;
        }
    }
    $build = $load_config($config_path_build);
    $view_system['build'] = $build;
} catch(\Exception $e) {
    error_log('Formanta Boot: ' . $e->getMessage());
    echo 'Boot Error: Config File not read, see error_log for more info';
    exit(0);
}

function startTime($name) {
    Monitor::i()->startProfile($name);
}

function endTime($name) {
    Monitor::i()->endProfile($name);
    error_log('> in ' .
        Monitor::i()->getInformation($name)['time'] . 's' . ' ' .
        Monitor::i()->convertMemory(Monitor::i()->getInformation($name)['memory']) . ' [' . $name . ']');
}

return [
    'url'  => $url,
    'view' => $view_system,
];