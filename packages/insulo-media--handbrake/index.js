const colors = require('colors/safe');

/**
 * @type {HandlerBase}
 */
const HandlerBase = require('@insulo/media-optimizer/lib/HandlerBase');

const {log} = require('@insulo/runner/pretty');

//
// Handle Dependencies

const hbjs = require('handbrake-js');

class HandlerHandbrake extends HandlerBase {
    run() {
        return super.run_internal((on_finish => {

            hbjs.spawn({input: this.src, output: this.dist, optimize: true, rate: 15, quality: 24.0})
                .on('error', on_finish)
                //.on('end', on_finish)
                .on('complete', on_finish)
                .on('progress', progress => {
                    log.raw('HandleMP4: ' + colors.underline(this.name) + ' encoding ' + colors.underline(progress.percentComplete + '%') + ' done' + (progress.eta ? ', ETA: ' + progress.eta : ''));
                });
        }));
    }
}

/**
 *
 * @type {HandlerHandbrake}
 */
module.exports = HandlerHandbrake;