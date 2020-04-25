const fs = require('fs');
const path = require('path');

const {FileWatcher} = require('@insulo/watcher');
const Runner = require('@insulo/runner');
const {pipe, log} = require('@insulo/runner/pretty');

const colors = require('colors/safe');

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const sassGraph = require('sass-graph');
const sass = require('node-sass');

class TaskSass {
    constructor(entry, output, outputStyle, root_dir = '', includePaths = []) {
        this.entry = path.resolve(entry);
        this.output = path.resolve(output);
        this.outputStyle = outputStyle;
        this.root_dir = root_dir;
        this.includePaths = includePaths;

        /**
         *
         * @type {undefined|FileWatcher}
         */
        this.watcher = undefined;
        /**
         * which files the watcher is watching
         * @type {Set}
         */
        this.files = new Set();

        // build pretty path for logging
        this.log_path_entry = colors.underline((this.root_dir ? this.entry.replace(path.resolve(this.root_dir), '').substr(1) : this.entry));
        this.log_path_output = colors.underline((this.root_dir ? this.output.replace(path.resolve(this.root_dir), '').substr(1) : this.output));

        this.postcss = postcss([
            autoprefixer({
                browsers: ['defaults']
            })
        ]);
    }

    /**
     * Perform Sass to CSS and then use the result in-memory to optimize the CSS, then generate and save map and save the final CSS file
     * @return {Promise<any>}
     */
    render() {
        return Runner.run(
            pipe([
                // Sass to CSS
                this.transpile.bind(this),
                // Optimize with postcss
                (result) => {
                    return this.optimize(result);
                },
                // Saving Map
                // todo: map is not created atm [bug]
                (result) => {
                    if(result.map) {
                        let map_start = log.start('task-sass.saving map for ' + this.log_path_output);
                        try {
                            fs.writeFileSync(this.output + '.map', result.map);
                        } catch(e) {
                            log.error('Error in: task-sass.saving map for ' + this.log_path_output + ' | ' + e);
                            throw e;
                        }
                        log.end('task-sass.saving map for ' + this.log_path_output, map_start);
                    }
                    return Promise.resolve(result);
                },
                // Save final file
                (result) => {
                    return this.saveFile(result).catch(e => {
                        throw e;
                    });
                }
            ]),
            [],
            'sass'
        ).catch(e => {
            throw e;
        });
    }

    /**
     * @return {Promise<any>}
     */
    transpile() {
        return new Promise((resolve, reject) => {
            let start_render = log.start('task-sass.transpile ' + this.log_path_entry);
            sass.render({
                file: this.entry,
                // true for no sourcemaps
                omitSourceMapUrl: false,
                // floating point precision in css output
                precision: 5,
                // helps to load @import statements
                includePaths: this.includePaths,
                // css output: nested, expanded, compact, compressed
                outputStyle: this.outputStyle,
                /*importer: (url, prev, done) => {
                    console.log(url + ' #sass ' + prev + ' # ' + done);
                }*/
            }, (err, result) => {
                log.end('task-sass.transpile ' + this.log_path_entry, start_render);

                if(err) {
                    // transpilation error
                    log.error(err.formatted);
                    reject(err);
                    if(process.env.CI) {
                        throw new Error(err);
                    }
                    return;
                }
                resolve(result);
            }, (err) => {
                // runtime error
                console.error('Error: ' + err.message);
                reject(err);
            });
        });
    }

    /**
     * @param result
     * @return {Promise}
     */
    optimize(result) {
        let start_postcss = log.start('task-sass.optimize ' + this.log_path_entry);
        return this.postcss.process(result.css.toString(), {from: this.entry, to: this.output}).then((result) => {
            log.end('task-sass.optimize ' + this.log_path_entry, start_postcss);
            return result;
        }).catch(e => {
            log.error(e);
            if(process.env.CI) {
                throw new Error('Error in @formanta/build-task-sass: CSS optimization failed');
            }
            throw e;
        });
    }

    /**
     * @param result
     * @return {Promise<any>}
     */
    saveFile(result) {
        let start_saving = log.start('save ' + this.log_path_entry + ' to ' + this.log_path_output);

        if(false === fs.existsSync(path.dirname(this.output))) {
            // create dist dir if not exists
            try {
                fs.mkdirSync(path.dirname(this.output), {recursive: true});
            } catch(e) {
                log.error('Error in @formanta/build-task-sass: could not create dist dir: ' + colors.underline(path.dirname(this.output)));
                log.error(e);
            }
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(this.output, result.css, (err) => {
                if(err) {
                    log.error('Error in @formanta/build-task-sass: could not save File, ' + this.log_path_entry + ' to ' + this.log_path_output + 'error is:');
                    console.error(err);
                    reject(err);
                } else {
                    log.end('save ' + this.log_path_entry + ' to ' + this.log_path_output + ' ' + colors.grey((Math.round(((fs.statSync(this.output).size / 1024) * 100) / 100)) + 'KB'), start_saving);
                }
                resolve(result);
            });
        });
    }

    /**
     * Use Sassgraph to fetch used files and add watcher to them
     * @return {Promise<any>}
     */
    watch() {
        if(!this.watcher) {
            // when watcher not existing, bootstrap on first watch
            this.watcher = new FileWatcher('sass');
            this.watcher.onError();

            this.watcher.onChange(() => {
                this.render();
                this.watch();
            });
        }

        return new Promise((resolve) => {
            let currentFiles = new Set(Object.keys(sassGraph.parseFile(this.entry).index));

            let removedFiles = [...this.files].filter((f) => !currentFiles.has(f));
            let newFiles = [...currentFiles].filter((f) => !this.files.has(f));

            removedFiles.forEach((file) => {
                this.watcher.remove(file);
            });

            newFiles.forEach((file) => {
                this.watcher.add(file);
            });

            this.files = currentFiles;

            this.watcher.onReady(resolve);
        });
    }

    /**
     * Render
     * @return {Promise<any>}
     */
    run() {
        return Promise.all([
            this.render()
        ]).catch(e => {
            throw e;
        });
    }

    /**
     * Render and Watch
     * @return {Promise<any>}
     */
    runWatch() {
        return new Promise((resolve) => {
            Promise.all([
                this.render(),
                this.watch()
            ]).then(res => {
                // resolve with sass rendering result
                resolve(res[0]);
            }).catch(e => {
                throw e;
            });
        });
    }
}

/**
 * Class Export for Extension: Main WebPack Handler
 * @type {TaskSass}
 */
module.exports.task = TaskSass;

/**
 *
 * @param {Object|Array|string} entry an array of entry files or one file, if array use an array of same length in output
 * @param {Object|Array|string} output an array of entry files or one file, if array use an array of same length in entry
 * @param watch
 * @param outputStyle
 * @param root_dir gets removed from all paths for pretty logging
 * @param {[]} includePaths folders to include, e.g. `node_modules`
 *
 * @example
 * const handleSass = require('@formanta/build-task-sass');
 * handleSass([
 *     __dirname + '/../style/main.scss', // entry
 *     __dirname + '/../../build/style/main.css', // output
 *     false, // watch
 *     'compressed' // outputStyle
 *     __dirname + '/../../' // root_dir
 * ]).then(({err, result = {}}) => {
 *     if(err) {
 *         // err is only bool
 *         throw new Error('Error in handleSass.');
 *     }
 *
 *     // do something, or nothing, with result
 *
 *     result;
 * });
 *
 * @return {Promise}
 */
module.exports.run = (entry, output, watch = true, outputStyle = 'nested', root_dir = '', includePaths = []) => {
    if('string' === typeof entry) {
        entry = [entry];
    }
    if('string' === typeof output) {
        output = [output];
    }

    return new Promise((resolve, reject) => {
        // construct transpiling for all entry files

        let exec = [];
        for(let i in entry) {
            if(entry.hasOwnProperty(i) && output.hasOwnProperty(i)) {
                exec.push((() => {
                    let task = new TaskSass(entry[i], output[i], outputStyle, root_dir, includePaths);
                    if(watch) {
                        return task.runWatch();
                    } else {
                        return task.run();
                    }
                })());
            }
        }

        // todo: add multithreaded async option for transpiling multiple sass entry files
        Promise.all(exec).then(res => {
            let result = [];
            res.forEach((elem) => {
                result.push(elem);
            });
            resolve({
                result
            });
        }).catch(e => {
            reject(e);
        });
    }).catch(() => {
        // no error leakage atm,
        throw 'Failed: @formanta/build-task-sass';
    });
};