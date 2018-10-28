/**
 * @type {Promise}
 */
let run = require('./lib/run');

run.then(
    /**
     * @param {module.Runner} runner
     */
    (runner) => {
        // todo: get server data:
        /*runner.config.url.host
        runner.config.url.port
        runner.config.url.ssl
        runner.config.url['base-path']*/

        // todo: check if port is available

        /**
         * @type {(function(): Promise)}
         */
        let build = require('./lib/build');
        build(runner).then((runner) => {

            // todo: start server
        });
    }
);
