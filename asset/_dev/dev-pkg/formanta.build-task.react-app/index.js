const fs = require('fs');
const path = require('path');
const os = require('os');
const colors = require('colors/safe');

/**
 * @type {Runner}
 */
const Runner = require('@insulo/runner');
const child_process = require('child_process');

/**
 * Bootstraps and runs the packing of all current files into an archive
 *
 * @param {string} task npm scripts name
 * @param {Array} apps list of dirs to react-apps
 * @param {Object} option for the child process that is spawned and not the command that is executed in it
 * @example
 *
 * @return {Promise}
 */
function runReactTask(task, apps, option = {}) {
    let app_run = [];
    app_run.push(apps.forEach(app => {
        return Runner.run(
            () => {
                return new Promise((resolve) => {
                    let runner = undefined;
                    if(fs.existsSync(app + 'yarn.lock')) {
                        Runner.log().raw('React execute with `yarn` - streaming messages');
                        /**
                         * the global command for yarn depends on the os
                         * @type {boolean|String}
                         */
                        let yarncmd = false;
                        if('Darwin' === os.type() || 'Linux' === os.type()) {
                            yarncmd = 'yarn';
                        }
                        if('Windows_NT' === os.type()) {
                            yarncmd = 'yarn.cmd';
                        }
                        if(yarncmd) {
                            runner = child_process.spawn(yarncmd, [task], {cwd: app, stdio: 'inherit', ...option});
                        } else {
                            throw new Error('formanta.build-task.react-app: yarn is os dependent, unkown os ' + os.type());
                        }
                    }

                    if(fs.existsSync(app + 'package-lock.json')) {
                        Runner.log().raw('React execute with `npm` - output at end');
                        runner = child_process.exec('npm run ' + task, {cwd: app, ...option}, (e, stdout, stderr) => {
                            if(e instanceof Error) {
                                console.error(e);
                                throw e;
                            }
                            Runner.log().raw(stdout);
                            if(stderr) {
                                Runner.log().error(stderr);
                            }
                        });
                    }

                    if(runner) {
                        runner.on('close', (code) => {
                            Runner.log().raw('React end [' + code + ']');
                            resolve();
                        });
                    } else {
                        throw new Error('formanta.build-task.react-app: can not determine used package manager for app in ' + app);
                    }
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
    return runReactTask('start', apps, option);
};

/**
 * @param apps
 * @param option
 * @return {Promise}
 */
module.exports.build = (apps, option = {}) => {
    return runReactTask('build', apps, option);
};

/**
 * @param apps
 * @param option
 * @return {Promise}
 */
module.exports.test = (apps, option = {}) => {
    return runReactTask('test', apps, option);
};