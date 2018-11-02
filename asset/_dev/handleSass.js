/**
 * @type {LoadEnv}
 */
const LoadEnv = require('./lib/LoadEnv');


const fs = require('fs');
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
 * @return {Promise<{[]}>}
 */
const render = (entry_, output_, watch, outputStyle) => {
    console.log(sassGraph.parseFile(entry_));

    return new Promise((resolve) => {
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
            importer: (url, prev, done) => {
                console.log(url + ' # ' + prev + ' # ' + done);
            }
        }, (err, result) => {
            if(err) {
                console.error(err);
                resolve({
                    err: err
                });
                return;
            }
            const processor = postcss([
                autoprefixer({
                    browsers: ['defaults']
                })
            ]);

            processor.process(result.css.toString()).then(
                (result) => {
                    console.log('Saving to "' + output_ + '" ...');
                    fs.writeFile(output_, result.css, (e, r) => {
                        // todo: first check if dir exists, when not, create dir and then write file
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
    })
};

/**
 *
 * @param {Object|Array|string} entry an array of entry files or one file, if array use an array of same length in output
 * @param {Object|Array|string} output an array of entry files or one file, if array use an array of same length in entry
 * @param watch
 * @param outputStyle
 * @example
 * const handleSass = require('./handleSass');
 * handleSass([
 *     __dirname + '/../style/main.scss', // entry
 *     __dirname + '/../../build/style/main.css', // output
 *     false // watch
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
module.exports = (entry, output, watch = true, outputStyle = 'nested') => {
    if('string' === typeof entry) {
        entry = [entry];
    }
    if('string' === typeof output) {
        output = [output];
    }

    return new Promise((resolve) => {
        let exec = [];
        for(let i in entry) {
            if(entry.hasOwnProperty(i) && output.hasOwnProperty(i)) {
                exec.push(render(entry[i], output[i], watch, outputStyle));
            }
        }

        // todo: add multithread async option for transpiling sass
        Promise.all(exec).then(res => {
            let error = false;
            let result = [];
            res.forEach((elem) => {
                if(elem.err) {
                    error = true;
                }
                if(elem.result) {
                    result.push(elem.result);
                }
            });
            resolve({
                err: error,
                result: result
            });
        })
    });
};
