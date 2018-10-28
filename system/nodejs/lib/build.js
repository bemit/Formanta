/**
 * @param {module.Runner|undefined} runner
 * @returns {Promise}
 */
module.exports = (runner = undefined) => {
    const {startTime, endTime} = require('@bemit/formantablocks');

    return new Promise((resolve) => {
        /**
         * @param {module.Runner} runner
         */
        let build = (runner) => {
            console.log('### Cleaning Static Templates');

            startTime('formanta--clean');
            runner.static_gen.clean();
            endTime('formanta--clean');

            console.log('### Build Static Templates');

            startTime('formanta--build');
            runner.static_gen.build();
            endTime('formanta--build');

            return runner;
        };

        if (undefined === runner) {
            /**
             * @type {Promise}
             */
            let run = require('./run');
            run.then((runner) => {
                resolve(build(runner));
            });
        } else {
            resolve(build(runner));
        }
    });
};