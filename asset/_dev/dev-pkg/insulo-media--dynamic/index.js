const fs = require('fs');

/**
 * @type {HandlerBase}
 */
const HandlerBase = require('@insulo/media-optimizer/lib/HandlerBase');

//
// Handle Dependencies

/**
 * Simple file copy handler
 */
class HandlerDynamic extends HandlerBase {
    run() {
        return super.run_internal((on_finish => {
            let finished = false;

            const done = (err) => {
                if(!finished) {
                    on_finish(err);
                    finished = true;
                }
            };

            let writer = fs.createWriteStream(this.dist);
            writer.on('error', function(err) {
                done(err);
            });
            writer.on('close', function(ex) {
                done(ex);
            });

            fs.createReadStream(this.src).on('error', (err) => {
                done(err);
            }).pipe(writer);
        }));
    }
}

/**
 * @type {HandlerDynamic}
 */
module.exports = HandlerDynamic;