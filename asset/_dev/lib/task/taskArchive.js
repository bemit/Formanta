/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const path = require('path');
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
    archive.debug = option.debug;

    // add own pack handler
    // archive.pack_handler['<name>'] = (base, src) => { // packing and saving... return true;};
    let pack_method = false;
    if(archive.pack_handler.hasOwnProperty(option.pack)) {
        pack_method = option.pack;
    }

    return new Promise((resolve) => {
        /**
         * Contains the to execution tasks from which are used from Archiver
         * @type {Array}
         */
        let packing = [];

        packing.push(
            () => {
                return archive.copy(dist).then((result) => {
                    return 'copy';
                });
            }
        );

        if(pack_method) {
            packing.push(
                () => {
                    return Runner.run(
                        () => {
                            return archive.pack(pack_method, dist).then((handler_done) => {
                                // finishing the result that is implemented in each archive.pack_handler, after compressing and saving everything, returns the full target path or false
                                return new Promise((res) => {
                                    if(handler_done) {
                                        res('pack-' + pack_method);
                                    } else {
                                        res(colors.red('failed: pack-' + pack_method));
                                    }
                                });
                            });
                        }, [],
                        'archive-pack'
                    )
                }
            );
            /*packing.push(
                Runner.run(() => {
                    return archive.copy(dist).then(() => 'copy');
                }), {},
                'archive-copy'
            );*/
        }

        return Runner.runSequential(packing).then((task_names) => {
            Runner.log().raw('taskArchive: executed tasks ' + colors.blue(task_names.join(', ')) + ' and saved in ' + colors.underline(path.resolve(dist)));
            resolve();
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
