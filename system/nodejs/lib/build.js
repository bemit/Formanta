/**
 * @param {module.Runner|undefined} runner
 * @returns {Promise<{runner:module.Runner, builded: {}}>}
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
            runner.static_gen.clean(true);
            endTime('formanta--clean');

            console.log('### Build Static Templates');

            startTime('formanta--build');
            runner.static_gen.build().then((builded) => {
                endTime('formanta--build');

                resolve({
                    runner: runner,
                    builded: builded
                });
            });
        };

        if(undefined === runner) {
            /**
             * @type {Promise}
             */
            let run = require('./run');
            run.then((runner) => {
                build(runner);
            });
        } else {
            build(runner);
        }
    });
};