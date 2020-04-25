const colors = require('colors/safe');

class Runner {
    /**
     * Executes a fn with params or returns the `fn`, to be able to use
     * - functions
     * - functions which holds promises
     * - promises
     * all together over the same interfacing, converting anything to promises
     *
     * @param {Function|Function<Promise>|Promise} fn
     * @param {Array} params
     * @return {*}
     * @private
     */
    static _handleFN(fn, params = []) {
        if('function' === typeof fn) {
            // executing the `fn` with params to try get the promise
            fn = fn(...params);

            if('function' === typeof fn.then) {
                // when result is promise, just return
                return fn;
            }

            // or wrap in promise for having the same interface on all `fn`
            return new Promise(resolve => {
                resolve(fn);
            }).catch(e => {
                throw e;
            });
        }

        // is a promise, just return it
        return fn;
    }

    /**
     * Runs a function with data and handles the promise, will print runtime information
     *
     * @param {Function|Function<Promise>|Promise} fn which will be executed, must return a Promise
     * @param {Array} params which will be used as parameters through spread selector
     * @param {String} name of the execution, printed in runtime information
     * @param {boolean} verbose
     *
     * @return {Promise<{}>}
     */
    static run(fn, params = [], name = '', verbose = true) {
        let start = undefined;
        if(verbose) {
            start = Runner.log().start(name);
        }

        return new Promise((resolve, reject) => {
            Runner._handleFN(fn, params).then((data) => {
                if(verbose) {
                    Runner.log().end(name, start);
                }

                resolve(data);
            }).catch((err) => {
                Runner.log().error('Runner: error happened in task: ' + colors.inverse(name));
                console.error(err);
                reject(err);
            });
        });
    }

    /**
     * Runs defined tasks in parallel
     *
     * @param {[Function, Function<Promise>, Promise, ...]} task_def array with task definitions

     * @todo implement multithreading parallel execution in e.g
     *
     * @return {Promise}
     */
    static runParallel(task_def) {
        let to_run = [];
        task_def.forEach((e) => {
            to_run.push(Runner._handleFN(e));
        });
        let failed = 0;
        let length = to_run.length;
        return Promise.all(to_run).catch((e) => {
            failed++;
            Runner.log().error('Error happened in Runner.runParallel, incl. this error till now ' + failed + ' out of ' + length + ' failed');
            throw e;
        });
    }

    /**
     * Runs defined tasks sequential
     *
     * @param {[Function, Function<Promise>, Promise, ...]} task_def array with task definitions
     *
     * @todo implement 'break on failure' option, a `cb` that will - if set - be called if an error happens and depending if it returns `true` the chain will continue, if `false` it will fail, receives value of failure
     *
     * @return {Promise}
     */
    static runSequential(task_def) {
        return new Promise((resolve, reject) => {
            let all_value = [];
            const runSequentialInner = (r) => {
                if(0 >= r.length) {
                    resolve(all_value);
                    return;
                }

                let e = r.shift();
                Runner._handleFN(e).then((task_value) => {
                    all_value.push(task_value);
                    runSequentialInner(r);
                }).catch(e => {
                    Runner.log().error('Error happened in Runner.runSequential, aborting sequence.');
                    reject(e);
                });
            };
            return runSequentialInner(task_def);
        }).catch(e => {
            throw e;
        });
    }

    /**
     * Define functions that get executed one after another and get pushed in the result from the previous one
     *
     * @param {[Function, Function<Promise>, Promise, ...]} fn_list array containing functions returning promises
     * @return {Promise<any>}
     */
    static runPipe(fn_list) {
        return new Promise((resolve, reject) => {
            /**
             * contains the return value of the first, then the second and so on
             * @type {undefined}
             */
            let prev_val = undefined;
            /**
             * go through the fn in list, decrementing the array for each executed fn
             * @param fn_list_
             */
            const runInner = (fn_list_) => {
                if(0 >= fn_list_.length) {
                    resolve(prev_val);
                    return;
                }

                let fn = fn_list_.shift();
                Runner._handleFN(fn, [prev_val]).then((result) => {
                    prev_val = result;
                    runInner(fn_list_);
                }).catch(e => {
                    Runner.log().error('Error happened in Runner.runPipe, aborting pipe.');
                    reject(e);
                });
            };
            return runInner(fn_list);
        }).catch(e => {
            throw e;
        });
    }

    /**
     * Formats timestamp into display time
     *
     * @param {Date} time
     * @return {string}
     */
    static formatTime(time) {
        return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
    }

    /**
     * Log Utility functions `raw`, `start`, `end`, `error`
     */
    static log() {
        return {
            /**
             * @param {String} text
             * @param {Date|undefined} time
             * @param {String} prefix
             */
            raw: (text, time = undefined, prefix = '') => {
                if('undefined' === typeof time) {
                    time = new Date();
                }
                console.log(prefix + colors.grey('[' + Runner.formatTime(time) + ']') + ' ' + text);
            },

            /**
             * @param {String} text
             * @param {Date|undefined} time
             * @return {Date|undefined} the started date, need to be pushed into `end`
             */
            start: (text, time = undefined) => {
                if('undefined' === typeof time) {
                    time = new Date();
                }
                Runner.log().raw(colors.green.italic('Starting `' + text + '`'), time);
                return time;
            },

            /**
             * @param {String} text
             * @param {Date} time_start date returned from start
             * @param {Date|undefined} time
             * @param {String} suffix
             */
            end: (text, time_start, time = undefined, suffix = '') => {
                if('undefined' === typeof time) {
                    time = new Date();
                }
                let end = time.getTime() - time_start.getTime();
                Runner.log().raw(
                    colors.green.bold(
                        colors.bgGreen.white('Finished') + ' `' + text + '`' +
                        colors.grey(' after ') +
                        colors.blue.underline(end + 'ms') +
                        (0 < suffix.length ? ' ' + colors.grey(suffix) : '')
                    ),
                    time
                );
            },

            /**
             * @param {String} text
             * @param {Date|undefined} time
             */
            error: (text, time = undefined) => {
                Runner.log().raw(
                    colors.red.bold(
                        colors.bgRed.white('#!') + ' ' +
                        text
                    ),
                    time
                );
            },

            /**
             * returns current date as YYYY-MM-DD_HH-MM-SS
             * @return {string}
             */
            longDate: () => {
                let current_date = new Date();
                // create pretty date in YYYY-MM-DD_HH-MM-SS
                return current_date.getFullYear() + '-' + ((current_date.getMonth() + 1) + '').padStart(2, '0') + '-' + (current_date.getDate() + '').padStart(2, '0') +
                    '_' +
                    (current_date.getHours() + '').padStart(2, '0') + '-' +
                    (current_date.getMinutes() + '').padStart(2, '0') + '-' +
                    (current_date.getSeconds() + '').padStart(2, '0');
            }
        };
    }
}

/**
 * @type {Runner}
 */
module.exports = Runner;