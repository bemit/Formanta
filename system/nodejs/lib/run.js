/**
 * @type {Promise}
 */
module.exports = new Promise((resolve, reject) => {
    /**
     * @type {Promise}
     */
    let boot = require('./boot');
    boot.then((config) => {
        const {Runner, Config, startTime, endTime} = require('@bemit/formantablocks');

        startTime('formanta--run');
        /**
         * @type {module.Runner}
         */
        let r = new Runner(new Config(config));

        console.log('### Run');

        console.log('### Add Default Template Data (todo)');
        // todo: add default template data creation

        endTime('formanta--run');

        resolve(r);
    });
});