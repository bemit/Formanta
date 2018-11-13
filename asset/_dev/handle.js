/**
 * @type {Runner}
 */
const Runner = require('./lib/Runner');

const fs = require('fs');
const colors = require('colors/safe');

const ROOT_DIR = __dirname + '/../../';
const ASSET_DIR = ROOT_DIR + 'asset/';
const BUILD_DIR = ROOT_DIR + 'build/';

/**
 * Returns all tasks to choose from
 *
 * @param {boolean} watch
 *
 * @return {{clean: (clean|(function(): Promise<{}>)), build: (build|(function(): Promise<{}>)), build_no_media: (build_no_media|(function(): Promise<{}>)), archive: (archive|(function(): Promise))}}
 */
module.exports.handle = (watch = true) => {
    /**
     * Define single tasks in this object, key should be name and will be used to access it in groups and runner
     *
     * @type {Object} each item should be an simple array function, including the needed module for the wanted task, it should return a Promise that is created from `Runner.run`
     */
    let task = {
        sass: () => {
            return new Promise((resolve) => {
                Runner.run(
                    require('./lib/task/taskSass'), [
                        ASSET_DIR + 'style/main.scss', // entry
                        BUILD_DIR + 'style/main.css', // output
                        watch,
                        'compressed',
                        ROOT_DIR,
                    ],
                    colors.underline.blue('task--sass')
                ).then(result => {
                    resolve(result)
                });
            })
        },
        clean: () => {
            // inline task definition example
            // remove whole build folder
            return Runner.run(
                new Promise((resolve) => {
                    const rmdir = (dir) => {
                        if(fs.existsSync(dir)) {
                            fs.readdirSync(dir).forEach((file) => {
                                let cur = dir + '/' + file;
                                if(fs.lstatSync(cur).isDirectory()) {
                                    rmdir(cur);
                                } else {
                                    fs.unlinkSync(cur);
                                }
                            });
                            fs.rmdirSync(dir);
                        }
                    };
                    rmdir(BUILD_DIR);
                    resolve('clean');
                }), [],
                colors.underline.blue('task--clean')
            );
        },
        js: () => {
            return new Promise((resolve) => {
                /*Runner.run(
                    require('./handleJS'), [
                        {
                            pack: {
                                [BUILD_DIR + 'js']: __dirname + '/../js/interact.js'
                            },
                            concat: {
                                main: {
                                    entry: [
                                        __dirname + '/../node_modules/package/some-vendor-file.js',
                                        __dirname + '/../node_modules/package/another-vendor-file.js',
                                        __dirname + '/../js/basic-file.js'
                                    ],
                                    output: BUILD_DIR + 'js/main.js'
                                }
                            }
                        }, // entry
                        watch
                    ],
                    'js--boot'
                ).then(result => {
                    resolve(result)
                });*/
                resolve(['jssy!']);
            })
        },
        media: () => {
            // Asset Files like JPG, PNG, SVG, MP4 and Generic Copying for e.g. PDF
            return new Promise((resolve) => {
                Runner.run(
                    require('./lib/task/taskMedia'), [
                        {
                            [BUILD_DIR + 'media']: ASSET_DIR + 'media/'
                        }, // src
                        {
                            png: {
                                quality: 80,
                                files: ['**/*.png'],
                                // to provide custom handler, a lot are implemented as default
                                // handler: require('./lib/Media/handlePNG')
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
                            mp4: {
                                optimize: true,
                                // framerate, 15 for most web
                                rate: 15,
                                // the higher the worser
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
                    colors.underline.blue('task--media')
                ).then(result => {
                    resolve(result)
                });
            })
        },
        archive: () => {
            return new Promise((resolve) => {
                let cur_d = new Date();
                // create pretty date in YYYY-MM-DD_HH-MM-SS
                let pretty_d = cur_d.getFullYear() + '-' + ((cur_d.getMonth() + 1) + '').padStart(2, '0') + '-' + (cur_d.getDate() + '').padStart(2, '0') + '_' + (cur_d.getHours() + '').padStart(2, '0') + '-' + (cur_d.getMinutes() + '').padStart(2, '0') + '-' + (cur_d.getSeconds() + '').padStart(2, '0');
                Runner.run(
                    require('./lib/task/taskArchive'), [
                        ROOT_DIR, // base
                        [
                            '.idea',
                            '.git',
                            '.gitkeep',
                            'tmp',
                            '/archive',
                            'node_modules',
                            // todo: including single node modules breaks promise resolving [bug]
                            /*'/node_modules',
                            '/asset/_dev/node_modules',
                            '/asset/_dev/lib/Archiver/node_modules',
                            '/asset/_dev/lib/ModuleOptimizer/node_modules',*/
                            'bower_components'
                        ], // exclude
                        ROOT_DIR + 'archive/' + pretty_d, // dist: folder name; will be used as folder name to copy files first, then as name of archive
                        {
                            pack: 'zip', // use zip or targz
                            delete_auto: true, // delete after packing (a pack handler must been set)
                            debug: false
                        } // option
                    ],
                    colors.underline.blue('task--archive')
                ).then(result => {
                    resolve(result);
                });
            })
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
                                task_group.style,
                                task.js,
                                task.media,
                            ])
                        }
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
                                task_group.style,
                                task.js
                            ])
                        }
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