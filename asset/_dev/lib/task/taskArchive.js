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
 * @param {string} base
 * @param {Object} exclude
 * @param {string} dist
 * @param {Object} option
 *
 * @return {Promise<{[]}>}
 */
const pack = (base, exclude, dist, option) => {
    let archive = new Archiver();
    archive.base = base;
    archive.exclude = exclude;

    return new Promise((resolve) => {
        archive.copy(dist).then(() => {
            resolve({result: 'handleArchive-end'});
        });
    });
};

/**
 * Bootstraps and runs the packing of all current files into an archive
 *
 * @param {string} base
 * @param {Object} exclude
 * @param {string} dist
 * @param {Object} option
 * @example
 *
 * @return {Promise}
 */
module.exports = (base, exclude, dist, option) => {
    return new Promise((resolve) => {
        // todo: add multithreaded async option for transpiling multiple folders at the same time
        pack(base, exclude, dist, option).then(result => {
            let error = false;
            resolve({
                err: error,
                result: result
            });
        })
    });
};
