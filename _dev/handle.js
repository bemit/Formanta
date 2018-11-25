/**
 * @type {Runner}
 */
const Runner = require('@insulo/runner');

const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

/**
 * @type {Promise}
 */
const taskWebpack = require('@formanta/build-task.webpack');

const ROOT_DIR = __dirname + '/../../';
const ASSET_DIR = ROOT_DIR + 'asset/';
const BUILD_DIR = ROOT_DIR + 'build/';

/**
 * Returns all tasks to choose from
 *
 * @param {boolean} watch global switch to turn on watching, only `clean` and `archive` are not supporting
 *
 * @return {{clean: ((function(): Promise<{}>)), build: ((function(): Promise<{}>)), build_no_media: ((function(): Promise<{}>)), archive: ((function(): Promise))}}
 */
module.exports.handle = (watch = true) => {

    let current_date = new Date();
    // create pretty date in YYYY-MM-DD_HH-MM-SS
    let pretty_date = current_date.getFullYear() + '-' + ((current_date.getMonth() + 1) + '').padStart(2, '0') + '-' + (current_date.getDate() + '').padStart(2, '0') + '_' + (current_date.getHours() + '').padStart(2, '0') + '-' + (current_date.getMinutes() + '').padStart(2, '0') + '-' + (current_date.getSeconds() + '').padStart(2, '0');

    /**
     * Build Config for Tasks
     */
    const config = {
        // What to delete on build
        clean: [BUILD_DIR],

        // Sass to CSS to optimized CSS
        sass: [
            ASSET_DIR + 'style/main.scss', // entry
            BUILD_DIR + 'style/main.css', // output
            watch,
            'compressed',
            ROOT_DIR,
        ],

        // Media optimizing
        media: [
            {
                // to : from
                [BUILD_DIR + 'media']: ASSET_DIR + 'media/'
            }, // src
            {
                png: {
                    quality: 80,
                    files: ['**/*.png'],
                    // to provide custom handler, a lot are implemented as default
                    // handler: require('@insulo/media-optimizer/lib/Handler/HandlerPNG')
                },
                jpg: {
                    quality: 80,
                    progressive: true,
                    files: ['**/*.{jpg,jpeg}']
                },
                svg: {
                    removeViewBox: false,
                    files: ['**/*.svg']
                },
                handbrake: {
                    // uses handbrake, must be installed as peer dep on linux
                    optimize: true,
                    // framerate, 15 for most web
                    rate: 15,
                    // high = low quality
                    quality: 24.0,
                    // mp4, avi and more
                    files: ['**/*.mp4']
                },
                dynamic: {
                    files: ['**/*.{pdf,gif}']
                }
            }, // option
            watch
        ],

        // Copy and pack
        archive: [
            ROOT_DIR, // base
            [
                '.idea',
                '.git',
                '.gitkeep',
                'tmp',
                '/archive',
                'node_modules',
                /*'/node_modules',
                '/asset/_dev/node_modules',
                '/asset/_dev/lib/Archiver/node_modules',
                '/asset/_dev/lib/ModuleOptimizer/node_modules',*/
                'bower_components'
            ], // exclude
            ROOT_DIR + 'archive/' + pretty_date, // dist: folder name; will be used as folder name to copy files first, then as name of archive
            {
                pack: 'zip', // use zip or targz
                delete_auto: true, // delete after packing (a pack handler must been set)
                debug: false
            } // option
        ],

        webpack: {
            // parsed and deepmerged into `_use`, if supplied; then used as is as WebpackConfig
            config: [{
                // use pre-defined webpack config for ES6
                _use: taskWebpack.config.es6,
                mode: 'production',
                //mode: 'development',
                // Windows (known): `path.resolve` must be called on paths or webpack could stuck without a message/error
                entry: {
                    main: path.resolve(ASSET_DIR + 'js/interact.js')
                },
                output: {
                    filename: '[name].min.js',
                    path: path.resolve(BUILD_DIR + 'js')
                },
                devtool: 'source-map'
            }],
            // controls webpack runtime
            option: {
                // watch: is added automatically down in task
            }
        },

        // React Apps Connection
        react: [
            // Define folder paths which are created with create-react-app (CRA)
            ROOT_DIR + 'react-app/'
        ]
    };


    /**
     * Define single tasks in this object, key should be name and will be used to access it in groups and runner
     *
     * @type {Object} each item should be an simple array function, including the needed module for the wanted task, it should return a Promise that is created from `Runner.run`
     */
    let task = {
        sass: () => {
            return new Promise((resolve) => {
                Runner.run(
                    require('@formanta/build-task.sass').run, // task
                    config.sass, // config for task
                    colors.underline.blue('task--sass') // name for logging
                ).then(result => {
                    resolve(result)
                });
            })
        },
        clean: () => {
            return Runner.run(
                require('@formanta/build-task.clean'),
                config.clean,
                colors.underline.blue('task--clean')
            );
        },
        media: () => {
            // Asset Files like JPG, PNG, SVG, MP4 and Generic Copying for e.g. PDF
            return new Promise((resolve) => {
                const {MediaOptimizer} = require('@insulo/media-optimizer');
                // add default handler functions, must be activated through a config using them
                MediaOptimizer.constructor.handler_default = {
                    png: () => require('@insulo/media-optimizer-handler-png'),
                    jpg: () => require('@insulo/media-optimizer-handler-jpg'),
                    svg: () => require('@insulo/media-optimizer-handler-svg'),
                    handbrake: () => require('@insulo/media-optimizer-handler-handbrake'),
                    dynamic: () => require('@insulo/media-optimizer-handler-dynamic'),
                };
                Runner.run(
                    require('@formanta/build-task.media'),
                    config.media,
                    colors.underline.blue('task--media')
                ).then(result => {
                    resolve(result)
                });
            })
        },
        archive: () => {
            return new Promise((resolve) => {
                Runner.run(
                    // todo: having more then 63054.7KB of data, after ignore filter, breaks zipping [bug]
                    require('@formanta/build-task.archive'),
                    config.archive,
                    colors.underline.blue('task--archive')
                ).then(result => {
                    resolve(result);
                });
            })
        },
        webpack: () => {
            return new Promise((resolve) => {
                if(watch) {
                    config.webpack.option.watch = {
                        aggregateTimeout: 300,
                        ignored: ['node_modules'],
                        poll: true
                    };
                }
                taskWebpack.run(config.webpack.config, config.webpack.option)().then(() => {
                    resolve();
                });
            })
        },
        react: {
            start: () => {
                return require('@formanta/build-task.react-app').start(config.react);
            },
            build: () => {
                return require('@formanta/build-task.react-app').build(config.react);
            }
        }
    };

    const run_info = () => Runner.log().raw(colors.yellow('Starting parallel execution of build pipeline, keep async in mind when reading times and order'));

    /**
     * Grouping single tasks into groups
     *
     * @type {*}
     */
    let task_group = {
        style: () => {
            return Runner.runSequential([
                task.sass
            ])
        },
        build: () => {
            run_info();
            return Runner.run(
                () => {
                    return Runner.runSequential([
                        task.clean,
                        () => {
                            return Runner.runParallel([
                                task.webpack,
                                task_group.style,
                                task.media,
                            ])
                        },
                        /*
                         * React runs async at all, so the task triggering react is finished before react is finished, this is wanted behavior
                         * In this case `build` is finished right after `react` is started`
                         */
                        (watch ? task.react.start : task.react.build),
                    ])
                }, [],
                'build'
            );
        },
        build_no_media: () => {
            run_info();
            return Runner.run(
                () => {
                    return Runner.runSequential([
                        task.clean,
                        () => {
                            return Runner.runParallel([
                                task.webpack,
                                task_group.style
                            ])
                        },
                        (watch ? task.react.start : task.react.build),
                    ])
                }, [],
                'build_no_media'
            );
        },
        archive: () => {
            return Runner.runSequential([
                task_group.build,
                task.archive,
            ])
        }
    };

    /**
     * Final run definition, mixing `task_group` and single `task`, indexing with the public name of the task
     */
    return {
        clean: task.clean,
        build: task_group.build,
        build_no_media: task_group.build_no_media,
        archive: task_group.archive
    }
};