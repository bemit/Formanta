/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const path = require('path');
const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');
const child_process = require('child_process');

/**
 * Bootstraps and runs the packing of all current files into an archive
 *
 * @param {string} task
 * @param {Array} apps
 * @param {Object} option
 * @example
 *
 * @return {Promise}
 */
function runReactTask(task, apps, option = {}) {
    let app_run = [];
    app_run.push(apps.forEach(app => {
        return Runner.run(() => {
                return new Promise((resolve) => {
                    const runner = child_process.spawn('yarn.cmd', [task], {cwd: app, stdio: 'inherit'});

                    runner.on('close', (code) => {
                        Runner.log().raw('React end [' + code + ']');
                        resolve();
                    });
                });
            }, [],
            colors.blue(colors.underline(task) + ' | ' + colors.underline(path.resolve(app))));
    }));

    return Promise.all(app_run);
}

/**
 * @type {function(string, Array, Object=): Promise<[any]>}
 */
module.exports.run = runReactTask;

/**
 * @param apps
 * @param option
 * @return {Promise}
 */
module.exports.start = (apps, option = {}) => {
    return runReactTask('start', apps, option)
};

/**
 * @param apps
 * @param option
 * @return {Promise}
 */
module.exports.build = (apps, option = {}) => {
    return runReactTask('build', apps, option)
};

/**
 * @param apps
 * @param option
 * @return {Promise}
 */
module.exports.test = (apps, option = {}) => {
    return runReactTask('test', apps, option)
};