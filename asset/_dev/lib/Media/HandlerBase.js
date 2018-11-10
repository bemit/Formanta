const fs = require('fs');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

/**
 *
 * @type {module.HandlePNG}
 */
module.exports = class HandlerBase {
    constructor(root, src, build, option) {
        this.root = root;
        this.src = src;
        this.build = build;
        this.option = option;
        this.name = src.replace(root, '');
        this.dist = build + this.name;
    }

    clean() {
        if(fs.existsSync(this.dist)) {
            fs.unlinkSync(this.dist);
            Runner.log().raw(new Date(), 'MediaHandler: removed dist: ' + this.dist);
        }
    }

    run(cb) {
        return new Promise(cb);
    }
};