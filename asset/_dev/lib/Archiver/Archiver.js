/**
 * @type {Runner}
 */
const Runner = require('../Runner');

/**
 * @type {fs}
 */
const fs = require('graceful-fs');
const path = require('path');
const colors = require('colors/safe');
const ignore = require('ignore');

const readline = require('readline');

/**
 * @type {function<Archiver>}
 */
const archive_lib = require('archiver');

//
// Special Pack functions for factory
//

/**
 *
 * @type {{zip: (function(*=, *=): Promise)}}
 */
const default_handler = {
    zip: (src, debug) => {

        let dist_file = fs.createWriteStream(src + '.zip');

        let archive = archive_lib('zip', {
            // todo: make params based
            zlib: {level: 9} // compression level
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        /*dist_file.on('end', function() {
            console.log('Archiver: zipping ' + archive.pointer() + 'bytes written');
        });*/

        archive.on('warning', function(err) {
            if(err.code === 'ENOENT') {
                //warning
            } else {
                throw err;
            }
        });

        archive.on('error', function(err) {
            throw err;
        });

        // set dist, doesn't start zipping
        archive.pipe(dist_file);

        let start = Runner.log().start('zip-read-dir ' + colors.underline(path.resolve(src)));

        let files = Archiver.readDir(src, src, true);

        Runner.log().end('zip-read-dir ' + colors.underline(path.resolve(src)), start);

        return Runner.run(
            () => {
                return new Promise((resolve) => {
                    let getKB = () => {
                        return colors.underline((Math.round(archive.pointer() / 1024 * 100) / 100) + 'KB');
                    };

                    let saving = setInterval(() => {
                        Runner.log().raw(getKB() + ' written, zipping ' + colors.underline(path.resolve(src + '.zip')));
                    }, 250);

                    // 'close' event is fired only when a file descriptor is involved
                    dist_file.on('close', () => {
                        clearInterval(saving);
                        Runner.log().raw('Archiver.js:zip finished and the output file is closed.');
                        Runner.log().raw(path.resolve(src + '.zip') + ' [' + getKB() + '] written');
                        resolve(src + '.zip');
                    });

                    files.forEach(
                        /**
                         * @param {{name: string, path: string}} file object with props `name` relative, normalized filename; `path` absolute, filesystem dependent path to src file
                         */
                        ({name, path = {}}) => {
                            // append a file from stream
                            archive.append(fs.createReadStream(path), {name: name});
                            if(debug) {
                                console.log('zip: adding file name: ' + name);
                            }
                        }
                    );

                    // finalize the archive (ie we are done appending files but streams have to finish yet)
                    archive.finalize();
                });
            }, [],
            'zip-write-file'
        );
    }
};

/**
 *
 */
class Archiver {
    constructor() {
        this.base = '';
        this.exclude = [];
        this.debug = false;
        /**
         * @type {{zip: (function(*=, *=): Promise)}}
         */
        this.pack_handler = default_handler;
    }

    //
    // Main API methods
    //

    /**
     * @param dist
     * @return {Promise}
     */
    copy(dist) {
        return Runner.run(() => {
                let start = Runner.log().start('copy-read-dir ' + colors.underline(path.resolve(dist)));

                let file_writer = this.recursiveWriterGenerator(this.base, dist);

                Runner.log().end('copy-read-dir ' + colors.underline(path.resolve(this.base)), start);

                let start_c = Runner.log().start('copy-dir to ' + colors.underline(path.resolve(dist)));

                let writing = [];
                file_writer.forEach((elem, i) => {
                    writing.push(elem(this.debug));
                });

                return Promise.all(writing).then(copy => {
                    Runner.log().end('copy-dir to ' + colors.underline(path.resolve(dist)), start_c, new Date(), colors.grey(' | ' + colors.underline(copy.length) + ' files copied.'));

                    if(this.debug) {
                        console.log(copy);
                        return copy;
                    } else {
                        return 'copy';
                    }
                }).catch((e) => {
                    throw new Error(e);
                });
            }, [],
            'filtered-copy of ' + colors.underline(path.resolve(this.base)) + ' into ' + colors.underline(path.resolve(dist)));
    }

    /**
     *
     * @param pack_method
     * @param dist string to a folder, is used as src and suffixed with e.g .zip after compressing
     * @return {Promise}
     */
    pack(pack_method, dist) {
        return new Promise((resolve) => {
            if(this.pack_handler.hasOwnProperty(pack_method)) {
                resolve(this.pack_handler[pack_method](dist));
            } else {
                resolve(false);
            }
        });
    }

    /**
     *
     * @param {string} src absolute or relative path is transformed to normalized forward slashed relative path and checked against the exclude data
     */
    isAllowedPath(src) {
        // normalize path: remove base, leading slash, change all backward slash to forward slash
        let name = path.resolve(src).replace(path.resolve(this.base), '').substr(1).replace(/\\/g, '/');

        // check the src against all excluded paths, syntax like `.gitignore`, each line is an array item
        if(ignore().add(this.exclude).ignores(name)) {
            return false;
        }
        return true;
    }

    //
    // Utility like methods
    //

    /**
     * @param dir
     */
    static mkdir(dir) {
        if(false === fs.existsSync(dir)) {
            if(fs.mkdirSync(dir, {recursive: true})) {
                Runner.log().raw('handleArchive: could not create dist dir: ' + colors.underline(dir));
            }
        }
    }

    /**
     * Reads dir recursively and executes handler on lifecycle events
     * @param base
     * @param src
     * @param log
     * @param accessCheck
     * @param onFile
     * @param onDir
     * @param qty
     * @return {Array}
     */
    static readDir(
        base,
        src,
        log = true,
        /**
         * @param {string} absolute_path
         * @return {boolean}
         */
        accessCheck = (path_absolute) => {
            return true;
        },
        onDir = (normalized_relative, path_absolute, handler) => {
            return handler(path_absolute);
        },
        onFile = (normalized_relative, path_absolute, handler) => {
            return handler(path_absolute);
        },
        qty = {dir: 0, file: 0, max_length: 0}) {

        let first = (0 === qty.dir && 0 === qty.file);
        let found = [];

        let files = fs.readdirSync(src);

        // is pretty loading logger, created per dir and file individually and is padded to the max occurred string for clean stdout output
        let createMsg = (is_dir, suffix = '') => {
            let tmp_msg = '';

            // current state
            if(is_dir) {
                tmp_msg += colors.underline('dir') + ' ' + qty.dir + ' file ' + qty.file;
            } else {
                tmp_msg += 'dir ' + qty.dir + ' ' + colors.underline('file') + ' ' + qty.file;
            }
            tmp_msg += ' | ' + suffix;

            qty.max_length = (qty.max_length < tmp_msg.length ? tmp_msg.length : qty.max_length);
            return tmp_msg.padEnd(qty.max_length, "\0");
        };

        for(let i = 0; i < files.length; i++) {
            let current_path = path.join(src, files[i]);
            let current = fs.lstatSync(current_path);

            // Check Access on `before parse current`
            if(accessCheck(current_path)) {
                if(current.isDirectory()) {
                    // execute onDir, add the result to found, pretty logging
                    found.push(...(onDir(current_path.replace(base, ''), current_path, (path_absolute) => {
                        // push handler to event handler
                        // call this function recursive

                        // Stats and nice logging
                        qty.dir++;
                        // printing which dir WILL be traversed the next
                        if(log) {
                            process.stdout.write("\r" + createMsg(true, current_path.replace(base, '')));
                        }
                        return Archiver.readDir(base, path_absolute, log, accessCheck, onDir, onFile, qty);
                    })));
                } else if(current.isSymbolicLink()) {
                    let symlink = fs.readlinkSync(current_path);
                    // todo: what to do with symlinks?
                    console.log(colors.cyan('symlinksymlinksymlinksymlinksymlinksymlinksymlink'));
                    console.log(symlink);
                } else {
                    // execute onFile. the actual result is formed from onFile's return value and should be [{name: string, path: string},]
                    found.push(
                        onFile(current_path.replace(base, ''), current_path, (path_absolute) => {
                            // push handler to event handler
                            // return current stats

                            // Stats and nice logging
                            qty.file++;
                            // printing which files copy handler HAS been catched
                            if(log) {
                                process.stdout.write("\r" + createMsg(false, current_path.replace(base, '')));
                            }
                            return {
                                name: path.resolve(current_path).replace(path.resolve(base), '').substr(1).replace(/\\/g, '/'),
                                path: path_absolute,
                            }
                        })
                    );
                }
            }
        }

        if(first && log) {
            process.stdout.write("\n");
        }

        return found;
    }

    //
    // Specialised controller methods
    //

    /**
     * Generates needed copy writers for all files recursively found in src, with filtration through `ignore`
     *
     * @param src
     * @param dist
     * @param qty
     * @return {[Promise, Promise]|Array}
     */
    recursiveWriterGenerator(src, dist, qty = {dir: 0, file: 0, max_length: 0}) {
        Archiver.mkdir(dist);
        let writers = [];
        let first = (0 === qty.dir && 0 === qty.file);

        if(path.resolve(this.base) !== path.resolve(src) && !this.isAllowedPath(src)) {
            return writers;
        }

        let files = fs.readdirSync(src);

        // is pretty loading logger, created per dir and file individually and is padded to the max occurred string for clean stdout output
        let createMsg = (is_dir, suffix = '') => {
            let tmp_msg = '';

            // current state
            if(is_dir) {
                tmp_msg += colors.underline('dir') + ' ' + qty.dir + ' file ' + qty.file;
            } else {
                tmp_msg += 'dir ' + qty.dir + ' ' + colors.underline('file') + ' ' + qty.file;
            }
            tmp_msg += ' | ' + suffix;

            qty.max_length = (qty.max_length < tmp_msg.length ? tmp_msg.length : qty.max_length);
            return tmp_msg.padEnd(qty.max_length, "\0");
        };

        for(let i = 0; i < files.length; i++) {
            let current = fs.lstatSync(path.join(src, files[i]));

            if(this.isAllowedPath(path.join(src, files[i]))) {
                if(current.isDirectory()) {
                    qty.dir++;
                    // printing which dir WILL be traversed the next
                    process.stdout.write("\r" + createMsg(true, path.resolve(path.join(src, files[i]))));

                    writers.push(...this.recursiveWriterGenerator(path.join(src, files[i]), path.join(dist, files[i]), qty));
                } else if(current.isSymbolicLink()) {
                    let symlink = fs.readlinkSync(path.join(src, files[i]));
                    fs.symlinkSync(symlink, path.join(dist, files[i]));
                } else {
                    writers.push(this.copyFile(path.join(src, files[i]), path.join(dist, files[i])));

                    qty.file++;
                    // printing which files copy handler HAS been catched
                    process.stdout.write("\r" + createMsg(false, path.resolve(path.join(src, files[i]))));
                }
            }
        }

        if(first) {
            process.stdout.write("\n");
        }

        return writers;
    }


    copyFile(src, dist) {
        return (debug = false) => {
            return new Promise((resolve, reject) => {
                let src_file = fs.createReadStream(src);
                let dist_file = fs.createWriteStream(dist);
                src_file.on('data', (chunk) => {
                    //console.log(colors.cyan(src_file.bytesRead));
                    dist_file.write(chunk);
                });

                // data end
                src_file.on('end', () => {
                    dist_file.end();
                });

                // when everything is written and file pointer is closed
                src_file.on('close', () => {
                    if(debug) {
                        resolve(dist);
                    } else {
                        resolve(true);
                    }
                });

                src_file.on('error', () => {
                    Runner.log().raw(colors.red('Archiver: error on copyFile for src `' + src_file + '` to dist `' + dist_file + '`'));
                    dist_file.end();
                    reject(false);
                });
            });
        };
    }
}

module.exports = Archiver;