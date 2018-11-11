/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const fs = require('graceful-fs');
const path = require('path');

class Archiver {
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
     * @param src
     * @param dist
     * @return {Array}
     */
    copyDir(src, dist) {
        Archiver.mkdir(dist);
        let writers = [];
        let files = fs.readdirSync(src);
        for(let i = 0; i < files.length; i++) {
            let current = fs.lstatSync(path.join(src, files[i]));
            if(current.isDirectory()) {
                writers.push(...this.copyDir(path.join(src, files[i]), path.join(dist, files[i])));
            } else if(current.isSymbolicLink()) {
                let symlink = fs.readlinkSync(path.join(src, files[i]));
                fs.symlinkSync(symlink, path.join(dist, files[i]));
            } else {
                writers.push(this.copyFile(path.join(src, files[i]), path.join(dist, files[i])));
            }
        }
        return writers;
    }

    /**
     * @param src
     * @param dist
     * @return {Promise<[any]>}
     */
    copy(src, dist) {
        return Promise.all(this.copyDir(src, dist)).then((data) => {
            // finished copying everything
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
                resolve();
                dist_file.end();
            });
        });
    }
}

module.exports = Archiver;