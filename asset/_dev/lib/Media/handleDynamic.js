const fs = require('fs');

/**
 * @type {HandlerBase}
 */
const HandlerBase = require('./HandlerBase');

//
// Handle Dependencies

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

/**
 * Simple file copy handler
 */
class HandleDynamic extends HandlerBase {
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
                done();
            });

            fs.createReadStream(this.src).on('error', (err) => {
                done(err);
            }).pipe(writer);
        }));
    }
}

/**
 * @type {HandleDynamic}
 */
module.exports = HandleDynamic;