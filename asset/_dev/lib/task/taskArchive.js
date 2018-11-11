/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const Archiver = require('../Archiver/Archiver');

/**
 * @param {Object} include
 * @param {Object} exclude
 * @param {string} build_dir
 * @param {Object} option
 * @param {boolean} watch
 *
 * @return {Promise<{[]}>}
 */
const pack = (include, exclude, build_dir, option, watch) => {
    let archive = new Archiver();

    console.log(include);
    console.log(exclude);

    return new Promise((resolve) => {
        archive.copy(__dirname + '/../', build_dir).then(() => {
            resolve({result: 'handleArchive-end'});
        });
    });
};

/**
 * Bootstraps and runs the packing of all current files into an archive
 *
 * @param {Object} src array with notation [build_dir: src_dir, build_dir_1: src_dir_1,]
 * @param {string} build
 * @param {Object} option
 * @param {boolean} watch
 * @example
 *
 * @return {Promise}
 */
module.exports = (src, build, option, watch = true) => {
    return new Promise((resolve) => {
        // todo: add multithreaded async option for transpiling multiple folders at the same time
        pack(src.include, src.exclude, build, option, watch).then(result => {
            let error = false;
            resolve({
                err: error,
                result: result
            });
        })
    });
};
