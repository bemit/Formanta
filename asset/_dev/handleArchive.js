/**
 * @type {LoadEnv}
 */
const LoadEnv = require('./lib/LoadEnv');

/**
 * @type {fs}
 */
const fs = require('graceful-fs');
const path = require('path');
const util = require('util');

const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('./lib/Runner');


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
    let mkdir = (dir) => {
        if(false === fs.existsSync(dir)) {
            if(fs.mkdirSync(dir, {recursive: true})) {
                Runner.log().raw('handleArchive: could not create dist dir: ' + colors.underline(dir));
            }
        }
    };

    let copyDir = (src, dist) => {
        mkdir(dist);
        let writers = [];
        let files = fs.readdirSync(src);
        for(let i = 0; i < files.length; i++) {
            let current = fs.lstatSync(path.join(src, files[i]));
            if(current.isDirectory()) {
                writers.push(...copyDir(path.join(src, files[i]), path.join(dist, files[i])));
            } else if(current.isSymbolicLink()) {
                let symlink = fs.readlinkSync(path.join(src, files[i]));
                fs.symlinkSync(symlink, path.join(dist, files[i]));
            } else {
                writers.push(copyFile(path.join(src, files[i]), path.join(dist, files[i])));
            }
        }
        return writers;
    };

    let copy = (src, dist) => {
        return Promise.all(copyDir(src, dist)).then((data) => {
            // finished copying everything
        });
    };

    let copyFile = (src, dist) => {
        return new Promise((resolve) => {
            let src_file = fs.createReadStream(src);
            let dist_file = fs.createWriteStream(dist);
            src_file.on('data', (chunk) => {
                dist_file.write(chunk);
            });
            src_file.on('end', () => {
                resolve();
                dist_file.end();
            });
        });
    };

    console.log(include);
    console.log(exclude);

    return new Promise((resolve) => {
        copy(__dirname + '/../', build_dir, resolve).then(() => {
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
