const path = require('path');
const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('@insulo/runner');

const Archiver = require('@insulo/archiver');

/**
 * @param {string} base
 * @param {Object} exclude
 * @param {string} dist
 * @param {Object} option
 *
 * @return {function(): Promise<any>}
 */
const archive = (base, exclude, dist, option) => {
    let archive = new Archiver();
    archive.base = base;
    archive.exclude = exclude;
    archive.debug = option.debug;

    // add own pack handler is possible with:
    // archive.pack_handler['<name>'] = (base, src) => { // packing and saving... return true;};

    let pack_method = false;
    if(archive.pack_handler.hasOwnProperty(option.pack)) {
        pack_method = option.pack;
    }

    /**
     * Contains the to execution tasks from which are used from Archiver
     * @type {Array}
     */
    let packing = [];

    packing.push(
        () => {
            return archive.copy(dist).then((/*result*/) => {
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
                );
            }
        );
    }

    return Runner.runSequential(packing).then((task_names) => {
        Runner.log().raw('taskArchive: executed tasks ' + colors.blue(task_names.join(', ')) + ' and saved in ' + colors.underline(path.resolve(dist)));
        return task_names;
    });
};

/**
 * Bootstraps and runs the packing of all current files into an archive\
 *
 * @type {function(string, Object, string, Object): function(): Promise<any>}
 */
module.exports = archive;