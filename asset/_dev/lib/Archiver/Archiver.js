/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const fs = require('graceful-fs');
const path = require('path');
const ignore = require('ignore');

class Archiver {
    constructor() {
        this.base = '';
        this.include = {};
        this.exclude = [];
    }

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
     *
     * @param {string} src
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

    /**
     * @param src
     * @param dist
     * @return {Array}
     */
    copyDir(src, dist) {
        Archiver.mkdir(dist);
        let writers = [];

        if(path.resolve(this.base) !== path.resolve(src) && !this.isAllowedPath(src)) {
            return writers;
        }

        let files = fs.readdirSync(src);
        for(let i = 0; i < files.length; i++) {
            let current = fs.lstatSync(path.join(src, files[i]));

            if(this.isAllowedPath(path.join(src, files[i]))) {
                if(current.isDirectory()) {
                    writers.push(...this.copyDir(path.join(src, files[i]), path.join(dist, files[i])));
                } else if(current.isSymbolicLink()) {
                    let symlink = fs.readlinkSync(path.join(src, files[i]));
                    fs.symlinkSync(symlink, path.join(dist, files[i]));
                } else {
                    writers.push(this.copyFile(path.join(src, files[i]), path.join(dist, files[i])));
                }
            }
        }
        return writers;
    }

    /**
     * @param dist
     * @return {Promise<[any]>}
     */
    copy(dist) {
        return Promise.all(this.copyDir(this.base, dist)).then((data) => {
            // finished copying everything
            console.log('oooooooooooooooooooooooooooooooooooooooooooon');
        });
    }

    /**
     * @param src
     * @param dist
     * @return {Promise<any>}
     */
    copyFile(src, dist) {
        return new Promise((resolve) => {
            let src_file = fs.createReadStream(src);
            let dist_file = fs.createWriteStream(dist);
            src_file.on('data', (chunk) => {
                dist_file.write(chunk);
            });
            src_file.on('end', () => {
                dist_file.end();
                resolve();
            });
            src_file.on('error', () => {
                Runner.log().raw(colors.red('Archiver: error on copyFile for src `' + src_file + '` to dist `' + dist_file + '`'));
                dist_file.end();
                resolve();
            });
        });
    }
}

module.exports = Archiver;