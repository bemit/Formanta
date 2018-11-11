/**
 * @type {HandlerBase}
 */
const HandlerBase = require('./HandlerBase');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

//
// Handle Dependencies

const execFile = require('child_process').execFile;
const pngquant = require('pngquant-bin');

class HandlePNG extends HandlerBase {
    run() {
        return super.run_internal((on_finish => {
            execFile(pngquant, ['-o', this.dist, this.src, '--quality', this.option.quality], on_finish);
        }));
    }
}

/**
 *
 * @type {HandlePNG}
 */
module.exports = HandlePNG;