/**
 * @type {LoadEnv}
 */
const LoadEnv = require('./lib/LoadEnv');

const fs = require('fs');
const path = require('path');

const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('./lib/Runner');
/**
 * @type {MediaOptimizer}
 */
const MediaOptimizer = require('./lib/Media/MediaOptimizer');

/**
 * Handles a src to build pair, parsing ones src_dir and all files for registered handlers into optimized build versions
 *
 * @param {string} src_dir
 * @param {string} build_dir
 * @param {Object} option
 * @param {boolean} watch
 *
 * @return {Promise<{[]}>}
 */
const optimize = (src_dir, build_dir, option, watch) => {
    let optimizer = new MediaOptimizer(watch);

    // activate handlers with pushed in options
    for(let type in option) {
        if(option.hasOwnProperty(type)) {
            optimizer.addHandler(type, option[type]);
        }
    }

    return optimizer.run(src_dir, build_dir);
};

/**
 * Bootstraps and runs the media handling pipeline
 *
 * @param {Object} src array with notation [build_dir: src_dir, build_dir_1: src_dir_1,]
 * @param {Object} option
 * @param {boolean} watch
 * @example
 *
 * @return {Promise}
 */
module.exports = (src, option, watch = true) => {
    return new Promise((resolve) => {
        let exec = [];
        // setup optimizer per src group
        for(let build_dir in src) {
            if(src.hasOwnProperty(build_dir)) {
                // register running `optimize`
                exec.push(Runner.run(
                    optimize,
                    [
                        src[build_dir],
                        build_dir,
                        option,
                        watch
                    ],
                    'media-optimize ' + colors.underline(path.resolve(src[build_dir]))
                ));
            }
        }

        // todo: add multithreaded async option for transpiling multiple folders at the same time
        Promise.all(exec).then(result => {
            let error = false;
            resolve({
                err: error,
                result: result
            });
        })
    });
};
