const {FileWatcher} = require('../FileWatcher');
/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const sassGraph = require('sass-graph');
const sass = require('node-sass');

class TaskSass {
    constructor(entry, output, outputStyle, root_dir = '') {
        this.entry = path.resolve(entry);
        this.output = path.resolve(output);
        this.outputStyle = outputStyle;
        this.root_dir = root_dir;

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
     * Perform Sass to CSS and then use
     * @return {Promise<any>}
     */
    render() {
        return Runner.run(
            new Promise((resolve) => {
                // Config for `sass.render`
                Runner.runPipe([
                    () => {
                        // Sass to CSS
                        return this.transpile();
                    },
                    (result) => {
                        // Optimize with postcss
                        return this.optimize(result);
                    },
                    (result) => {
                        // Saving Map
                        if(result.map) {
                            // todo: map is not created atm [bug]
                            let map_start = Runner.log().start('taskSass.saving map for ' + this.log_path_output);
                            try {
                                fs.writeFileSync(this.output + '.map', result.map);
                            } catch(e) {
                                Runner.log().error('Error in: taskSass.saving map for ' + this.log_path_output + ' | ' + e);
                            }
                            Runner.log().end('taskSass.saving map for ' + this.log_path_output, map_start);
                        }
                        return Promise.resolve(result);
                    },
                    (result) => {
                        return this.saveFile(result);
                    }
                ]).then((result) => {
                    resolve({
                        result: 'sass-finished'
                    });
                });
            }),
            [],
            'sass'
        ).then(result => {
            return result;
        })
    };

    /**
     * @return {Promise<any>}
     */
    transpile() {
        return new Promise((resolve, reject) => {
            let start_render = Runner.log().start('taskSass.transpile ' + this.log_path_entry);
            sass.render({
                file: this.entry,
                // true for no sourcemaps
                omitSourceMapUrl: false,
                // floating point precision in css output
                precision: 5,
                // helps to load @import statements
                includePaths: [],
                // css output: nested, expanded, compact, compressed
                outputStyle: this.outputStyle,
                /*importer: (url, prev, done) => {
                    console.log(url + ' #sass ' + prev + ' # ' + done);
                }*/
            }, (err, result) => {
                Runner.log().end('taskSass.transpile ' + this.log_path_entry, start_render);

                if(err) {
                    Runner.log().error(err);
                    reject(err);
                    return;
                }
                resolve(result);
            }, (err) => {
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
        let start_postcss = Runner.log().start('taskSass.optimize ' + this.log_path_entry);
        return this.postcss.process(result.css.toString(), {from: this.entry, to: this.output}).then((result) => {
            Runner.log().end('taskSass.optimize ' + this.log_path_entry, start_postcss);
            return result;
        });
    }

    /**
     * @param result
     */
    saveFile(result) {
        let start_saving = Runner.log().start('save ' + this.log_path_entry + ' to ' + this.log_path_output);

        if(false === fs.existsSync(path.dirname(this.output))) {
            // create dist dir if not exists
            try {
                fs.mkdirSync(path.dirname(this.output), {recursive: true})
            } catch(e) {
                Runner.log().error('handleArchive: could not create dist dir: ' + colors.underline(path.dirname(this.output)));
                Runner.log().error(e);
            }
        }
        return new Promise(resolve => {
            fs.writeFile(this.output, result.css, (err) => {
                Runner.log().end('save ' + this.log_path_entry + ' to ' + this.log_path_output + ' ' + colors.grey((Math.round(((fs.statSync(this.output).size / 1024) * 100) / 100)) + 'KB'), start_saving);
                if(err) {
                    console.error(err);
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
        return new Promise((resolve) => {
            // only add watcher when wanted

            let watcher = new FileWatcher('sass');
            let graph = sassGraph.parseFile(this.entry);

            for(let file in graph.index) {
                if(graph.index.hasOwnProperty(file)) {
                    watcher.add(file);
                }
            }

            watcher.onReady(resolve);
            watcher.onError();

            watcher.onChange(this.render.bind(this));
        })
    }

    /**
     * Render
     * @return {Promise<any>}
     */
    run() {
        return new Promise((resolve) => {
            Promise.all([
                this.render()
            ]).then(res => {
                // resolve with sass rendering result
                resolve(res[0]);
            })
        })
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
            })
        })
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
 * @param root_dir
 *
 * @example
 * const handleSass = require('./handleSass');
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
module.exports.run = (entry, output, watch = true, outputStyle = 'nested', root_dir = '') => {
    if('string' === typeof entry) {
        entry = [entry];
    }
    if('string' === typeof output) {
        output = [output];
    }

    return new Promise((resolve) => {
        // construct transpiling for all entry files

        let exec = [];
        for(let i in entry) {
            if(entry.hasOwnProperty(i) && output.hasOwnProperty(i)) {
                exec.push((() => {
                    let task = new TaskSass(entry[i], output[i], outputStyle, root_dir);
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
            let error = false;
            let result = [];
            res.forEach((elem) => {
                result.push(elem);
            });
            resolve({
                err: error,
                result: result
            });
        })
    });
};