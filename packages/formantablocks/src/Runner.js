/**
 * @type {module.StaticGenerator}
 */
const StaticGenerator = require('./StaticGenerator');

/**
 * @type {module.Runner}
 */
module.exports = class Runner {
    /**
     * @param {module.Config} config
     */
    constructor(config) {
        /**
         * @type {module.Config}
         */
        this.config = config;
        /**
         * @type {module.StaticGenerator}
         */
        this.static_gen = new StaticGenerator(this.config.view);
        this.header = [];
        if(undefined === this.constructor.msg_send) {
            this.constructor.msg_send = false;
        }
    }

    sendHeader() {
        if(false === this.constructor.msg_send) {
            this.header.forEach((h) => {
                // todo: send header
                console.log(h);
            });
        } else {
            console.log('FormantaBlocks: sendHeader: message was already send, can not send header.');
        }
    }

    addHeader(header, as_array = false) {
        if(as_array) {
            this.header = this.header.concat(header);
        } else {
            this.header.push(header);
        }
    }

    sendMessage(msg) {
        this.constructor.msg_send = true;
        // todo: output message
        console.log(msg);
    }
};