/**
 * @type {Runner}
 */
const Runner = require('../../Runner');

/**
 * @type {HandlerBase}
 */
const HandlerBase = require('../HandlerBase');

//
// Handle Dependencies

const execFile = require('child_process').execFile;
const mozjpeg = require('mozjpeg');

class HandlerJPG extends HandlerBase {
    run() {
        return super.run_internal((on_finish => {
            // order of args is important, input file must be last for mozjpeg
            execFile(mozjpeg, ['-outfile', this.dist, '-quality', this.option.quality, this.src], on_finish);
        }));
    }
}

/**
 *
 * @type {HandlerJPG}
 */
module.exports = HandlerJPG;