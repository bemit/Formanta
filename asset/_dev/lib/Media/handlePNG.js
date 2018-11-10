const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

/**
 * @type {module.HandlePNG}
 */
const HandlerBase = require('./HandlerBase');

const execFile = require('child_process').execFile;
const pngquant = require('pngquant-bin');


/**
 * @type {Runner}
 */
const Runner = require('../Runner');

/**
 *
 * @type {module.HandlePNG}
 */
module.exports = class HandlePNG extends HandlerBase {
    run() {
        return super.run((resolve => {
            let start = Runner.log().start('MediaHandler: ' + this.name);
            const size_before = fs.statSync(this.src).size / 1024;// in KB, Kilobyte in base 2

            execFile(pngquant, ['-o', this.dist, this.src, '--quality', this.option.quality], err => {
                if(err) {
                    console.error(colors.red(err));
                }
                const size_after = fs.statSync(this.dist).size / 1024;// in KB, Kilobyte in base 2
                const size_saved = size_before - size_after;// in KB, Kilobyte in base 2

                Runner.log().end('MediaHandler: ' + this.name, start);
                resolve({
                    'file': this.name,
                    'before': size_before,
                    'after': size_after,
                    'saved': size_saved
                });
            });
        }));
    }
};