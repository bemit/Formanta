const {run, sequential, parallel, log} = require('@insulo/runner/pretty');
const {FileWatcher} = require('@insulo/watcher');

const path = require('path');

const colors = require('colors/safe');
const browsersync = require("browser-sync").create();

const ROOT_DIR = path.resolve(__dirname);
const ASSET_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'build');

/**
 * Returns all tasks to choose from
 *
 * @param {boolean} watch global switch to turn on watching, only `clean` and `archive` are not supporting `watch` at all
 */
module.exports.handle = (watch = true) => {
    let pretty_date = log.longDate();

    /**
     * Define single tasks in this object, key should be name and will be used to access it in groups and runner
     *
     * @type {Object} each item should be an simple array function, including the needed module for the wanted task, it should return a Promise that is created from `run`
     */
    let task = {
        sass: run(
            require('@formanta/build-task.sass').run, // task
            [
                [
                    ASSET_DIR + '/style/main.scss', // entry
                ], // entry
                [
                    BUILD_DIR + '/style/main.css', // output
                ],
                watch,
                'compressed',
                ROOT_DIR,
            ],
            colors.underline.blue('task--sass') // name for logging
        ),
        clean: run(
            require('@formanta/build-task.clean'),
            [BUILD_DIR],
            colors.underline.blue('task--clean')
        ),
        twig: () => {
            const StaticGenerator = require('@formanta/blocks/src/StaticGenerator');
            const ConfigView = require('@formanta/blocks/src/ConfigView');

            const staticGen = new StaticGenerator(new ConfigView({
                debug: true,
                auto_reload: true,
                store: {
                    data_dir: 'data/',
                    cache_dir_: 'tmp/',
                    cache_dir: false,
                    builded_info_file: 'builded.json',
                    build_dir: 'build/',
                    view_list: {
                        0: 'src/view',
                        'src/view': 'module'
                    }
                },
                build: {
                    index: {
                        view: 'index.twig',
                        static: 'index.html'
                    },
                    demo: {
                        view: 'demo.twig',
                        static: 'demo.html'
                    }
                }
            }));

            if(watch) {
                let watcher = new FileWatcher('twig', [path.resolve(ASSET_DIR, 'view')]);
                watcher.onError();
                watcher.onReady();
                watcher.onChangeAdd((path, text) => {
                    staticGen.build();
                    browsersync.stream()
                });
                watcher.onChangeChange((path, text) => {
                    staticGen.build();
                    browsersync.stream()
                });
            }

            return staticGen.build();
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
                run(
                    require('@formanta/build-task.media'),
                    [
                        {
                            // to : from
                            [BUILD_DIR + '/media']: ASSET_DIR + '/media/'
                        }, // src
                        {
                            png: {
                                quality: 80,
                                files: ['**/*.png'],
                                // to provide custom handler, a lot are implemented as default
                                // handler: require('@insulo/media-optimizer-handler-png')
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
                                // uses handbrake, must be installed as peer dep. on linux
                                optimize: true,
                                // framerate, 15 for most web
                                rate: 15,
                                // high no. = low quality
                                quality: 24.0,
                                // mp4, avi and more https://handbrake.fr
                                files: ['**/*.mp4']
                            },
                            dynamic: {
                                files: ['**/*.{pdf,gif}']
                            }
                        }, // option
                        watch
                    ],
                    colors.underline.blue('task--media')
                )().then(result => {
                    resolve(result);
                });
            });
        },
        archive: () => {
            return new Promise((resolve) => {
                run(
                    // todo: having more then 63054.7KB of data, after ignore filter, breaks zipping [bug]
                    require('@formanta/build-task.archive'),
                    [
                        ROOT_DIR, // base
                        [
                            '.idea',
                            '.git',
                            '.gitkeep',
                            'tmp',
                            '/archive',
                            'node_modules'
                        ], // exclude
                        ROOT_DIR + '/archive/' + pretty_date, // dist: folder name; will be used as folder name to copy files first, then as name of archive
                        {
                            pack: 'zip', // use zip or targz
                            delete_auto: true, // delete after packing (a pack handler must been set)
                            debug: false
                        } // option
                    ],
                    colors.underline.blue('task--archive')
                )().then(result => {
                    resolve(result);
                });
                resolve({});
            });
        },
    };

    const run_info = () => log.raw(colors.yellow('Starting parallel execution of build pipeline, keep async in mind when reading times and order'));

    /**
     * Grouping single tasks into groups
     *
     * @type {*}
     */
    const task_group = {
        style: task.sass,
        build: () => {
            run_info();
            return run(
                sequential([
                    () => {
                        if(watch) {
                            browsersync.init({
                                open: false,
                                notify: false,
                                ghostMode: false,
                                server: {
                                    baseDir: BUILD_DIR,
                                    serveStaticOptions: {
                                        extensions: ['html']
                                    },
                                },
                                port: 4444
                            });
                        }
                        return Promise.resolve()
                    },
                    task.clean,
                    parallel([
                        task_group.style,
                        //task.twig,
                        task.media,
                    ]),
                ]), [],
                'build'
            )();
        },
        archive: task.archive,
    };

    /**
     * Final run definition, mixing `task_group` and single `task`, indexing with the public name of the task
     */
    return {
        clean: task.clean,
        twig: task.twig,
        build: task_group.build,
        archive: task_group.archive
    };
};
