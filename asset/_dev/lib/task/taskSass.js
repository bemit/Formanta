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
        this.postcss = postcss([
            autoprefixer({
                browsers: ['defaults']
            })
        ]);
    }

    render() {
        return Runner.run(
            new Promise((resolve) => {

                // build pretty path for logging
                let log_path_entry = colors.underline((this.root_dir ? this.entry.replace(path.resolve(this.root_dir), '').substr(1) : this.entry));
                let log_path_output = colors.underline((this.root_dir ? this.output.replace(path.resolve(this.root_dir), '').substr(1) : this.output));

                let start_render = Runner.log().start('transpiling ' + log_path_entry);

                if(false === fs.existsSync(path.dirname(this.output))) {
                    // create dist dir if not exists
                    try {
                        fs.mkdirSync(path.dirname(this.output), {recursive: true})
                    } catch(e) {
                        Runner.log().error('handleArchive: could not create dist dir: ' + colors.underline(path.dirname(this.output)));
                        Runner.log().error(e);
                    }
                }

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
                    Runner.log().end('transpiling ' + log_path_entry, start_render);

                    if(err) {
                        console.error(err);
                        resolve({
                            err: err
                        });
                        return;
                    }

                    let start_postcss = Runner.log().start('postcss ' + log_path_entry);

                    this.postcss.process(result.css.toString(), {from: this.entry, to: this.output})
                        .then(
                            (result) => {
                                Runner.log().end('postcss ' + log_path_entry, start_postcss);

                                let start_saving = Runner.log().start('save ' + log_path_entry + ' to ' + log_path_output);
                                fs.writeFile(this.output, result.css, (err, r) => {
                                    Runner.log().end('save ' + log_path_entry + ' to ' + log_path_output, start_saving);

                                    if(err) {
                                        console.error(err);
                                    }

                                    // todo: first check if dir exists, when not, create dir and then write file
                                    if(result.map) {
                                        // todo: map is not created atm [bug]
                                        Runner.log().start('saving map for ' + log_path_output + '');
                                        fs.writeFile(this.output + '.map', result.map, () => true);
                                    }
                                    resolve({
                                        err: err,
                                        result: 'sass-finished'
                                    });
                                });
                            },
                            (err) => {
                                console.error('Error: ' + err.message);
                                resolve({
                                    err: err
                                });
                            }
                        );
                });
            }),
            [],
            'sass'
        ).then(result => {
            return result;
        })
    };

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
    };

    /**
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

/**
 * @type {{es6: (function(): *), jsx: (function(): *)}}
 */
module.exports.config = {
    es6: () => require('./taskWebPack.config.es6'),
    jsx: () => require('./taskWebPack.config.jsx')
};