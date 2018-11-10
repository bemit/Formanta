/**
 * @type {LoadEnv}
 */
const LoadEnv = require('./lib/LoadEnv');

const {FileWatcher} = require('./lib/FileWatcher');
/**
 * @type {Runner}
 */
const Runner = require('./lib/Runner');


const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');

const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const sassGraph = require('sass-graph');
const sass = LoadEnv.load('node-sass');

/**
 * Function for parsing one entry file to one output file
 * @param entry_
 * @param output_
 * @param watch
 * @param outputStyle
 * @param {string} root_dir is removed from other output on logging
 * @return {Promise<{[]}>}
 */
const render = (entry_, output_, watch, outputStyle, root_dir = '') => {

    const sass_render = (resolve) => {
        entry_ = path.resolve(entry_);
        output_ = path.resolve(output_);

        let log_path_entry = colors.underline((root_dir ? entry_.replace(path.resolve(root_dir), '').substr(1) : entry_));
        let log_path_output = colors.underline((root_dir ? output_.replace(path.resolve(root_dir), '').substr(1) : output_));

        let start_render = Runner.log().start('transpiling ' + log_path_entry);

        sass.render({
            file: entry_,
            // true for no sourcemaps
            omitSourceMapUrl: false,
            // floating point precision in css output
            precision: 5,
            // helps to load @import statements
            includePaths: [],
            // css output: nested, expanded, compact, compressed
            outputStyle: outputStyle,
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

            const processor = postcss([
                autoprefixer({
                    browsers: ['defaults']
                })
            ]);

            processor.process(result.css.toString(), {from: entry_, to: output_})
                .then(
                    (result) => {
                        Runner.log().end('postcss ' + log_path_entry, start_postcss);

                        let start_saving = Runner.log().start('save ' + log_path_entry + ' to ' + log_path_output);
                        fs.writeFile(output_, result.css, (e, r) => {
                            Runner.log().end('save ' + log_path_entry + ' to ' + log_path_output, start_saving);

                            // todo: first check if dir exists, when not, create dir and then write file
                            if(result.map) {
                                // todo: map is not created atm [bug]
                                Runner.log().start('saving map for ' + log_path_output + '');
                                fs.writeFile(output_ + '.map', result.map, () => true);
                            }
                            resolve({
                                err: e,
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
    };

    const sass_render_run = () => {
        return Runner.run(
            () => {
                return new Promise(sass_render)
            },
            [],
            'sass'
        ).then(result => {
            return result;
        });
    };

    const sass_watch = () => {
        return new Promise((resolve) => {
            if(watch) {
                // only add watcher when wanted

                let watcher = new FileWatcher('sass');
                let graph = sassGraph.parseFile(entry_);

                for(let file in graph.index) {
                    if(graph.index.hasOwnProperty(file)) {
                        watcher.add(file);
                    }
                }

                watcher.onReady(resolve);
                watcher.onError();

                watcher.onChange(sass_render_run);
            } else {
                resolve();
            }
        })
    };

    return new Promise((resolve) => {
        Promise.all([
            sass_render_run(),
            sass_watch()
        ]).then(res => {
            // resolve with sass rendering result
            resolve(res[0]);
        })
    })
};

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
module.exports = (entry, output, watch = true, outputStyle = 'nested', root_dir = '') => {
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
                exec.push(render(entry[i], output[i], watch, outputStyle, root_dir));
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
