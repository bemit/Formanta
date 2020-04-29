/**
 * @type {HandlerBase}
 */
const HandlerBase = require('@insulo/media-optimizer/lib/HandlerBase');

//
// Handle Dependencies

const execFile = require('child_process').execFile;
const pngquant = require('pngquant-bin');

class HandlerPNG extends HandlerBase {
    run() {
        return super.run_internal((on_finish => {
            execFile(pngquant, ['-o', this.dist, this.src, '--quality', this.option.quality], on_finish);
        }));
    }
}

/**
 *
 * @type {HandlerPNG}
 */
module.exports = HandlerPNG;