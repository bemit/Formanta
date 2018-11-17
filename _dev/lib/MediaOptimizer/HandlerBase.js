const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

/**
 * Base class for a media file handler, must be extended from a class which provides a `run` method which calls `super.run_internal`.
 * Task for this class is: provide all pathes needed to move one file from one direction to another, cleaning the dist file, wrap logging around the handler provided from the child extending this class
 */
class HandlerBase {
    constructor(root, src, build, option) {
        /**
         * Root of `src` folder, will be used to get the pure name from an full src path
         * @type string
         */
        this.root = root;
        /**
         * Full path to one file
         * @type string
         */
        this.src = src;
        /**
         * Path to build directory
         * @type string
         */
        this.build = build;
        /**
         * Options pushed in through `handleMedia` for the specific handler type
         * @type {Object}
         */
        this.option = option;
        /**
         * Relative path to an file, added to `build` is absolute path to `dist` and added to `root` is absolute path to `src`
         * @type {string}
         */
        this.name = src.replace(this.root, '').substr(1);
        /**
         * Absolute path to the distribution target
         * @type string
         */
        this.dist = path.resolve(build + '/' + this.name);
    }

    /**
     * Clean distribution target file
     */
    clean() {
        if(fs.existsSync(this.dist)) {
            if(fs.unlinkSync(this.dist)) {
                Runner.log().raw('MediaHandler: removed dist: ' + colors.underline(this.name));
            } else {
                // todo displaying no error currently
            }
        }
    }

    /**
     * Should be called within a class extending this class, wrapps logging arround the actual `handle` function
     *
     * @param handle a callback which should be called after calculating the beginning size and which receives a callback for `handling for file done`
     *
     * @return {Promise<{file: string, before: number, after: number, saved: number}>}
     */
    run_internal(handle) {
        return new Promise((resolve => {
            let start = Runner.log().start('MediaHandler: ' + colors.underline(this.name));
            const size_before = fs.statSync(this.src).size / 1024;// in KB, Kilobyte in base 2

            // create folder first if it doesn't exist
            if(false === fs.existsSync(path.dirname(this.dist))) {
                if(fs.mkdirSync(path.dirname(this.dist), {recursive: true})) {
                    Runner.log().raw('MediaHandler: could not create dist dir: ' + colors.underline(path.dirname(this.dist)));
                }
            }

            // run the `handle` closure with the `on_finish` closure
            handle(err => {
                if(err) {
                    console.error(colors.red(err));
                }
                const size_after = fs.statSync(this.dist).size / 1024;// in KB, Kilobyte in base 2
                const size_saved = size_before - size_after;// in KB, Kilobyte in base 2

                const round = (size) => {
                    return Math.round(size * 100) / 100 + 'KB';
                };

                // Construct pretty logging message about how much saved for each file, and warn also about copied and more space after compression errors
                let saved_msg = '| [' + round(size_before) + ((0 !== size_saved) ? ' > ' + round(size_after) : '') + '] ' + colors.underline(round(size_saved)) + ' ';
                if(0 === size_saved) {
                    saved_msg += colors.yellow('zero') + ' space saved, copied!';
                } else if(0 > size_saved) {
                    saved_msg += colors.red('more') + ' space used!';
                } else {
                    saved_msg += colors.green('less') + ' space used!';
                }

                Runner.log().end('MediaHandler: ' + colors.underline(this.name), start, new Date(), saved_msg);
                resolve({
                    'file': this.name,
                    'before': size_before,
                    'after': size_after,
                    'saved': size_saved
                });
            });
        }));
    }
}

/**
 *
 * @type {HandlerBase}
 */
module.exports = HandlerBase;