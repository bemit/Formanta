const colors = require('colors/safe');

class Runner {
    /**
     *Executes a fn with params or returns the fn, to be able to use functions which holds promises and promises as the same param
     * @param fn
     * @param params
     * @return {*}
     * @private
     */
    static _handleFN(fn, params = []) {
        if('function' === typeof fn) {
            // executing the `fn` with params to get the promise
            return fn(...params);
        }
        return fn;
    }

    /**
     * Runs a function with data and handles the promise, will print runtime information
     *
     * @param {Function<Promise>|Promise} fn which will be executed, must return a Promise
     * @param {Array} params which will be used as parameters through spread selector
     * @param {String} name of the execution, printed in runtime information
     *
     * @return {Promise<{}>}
     */
    static run(fn, params = [], name = '') {
        return new Promise((resolve) => {
            const start = Runner.log().start(name);

            Runner._handleFN(fn, params).then((data) => {
                Runner.log().end(name, start);

                resolve(data);
            }).catch((err) => {
                // todo: if error happens in `fn` there is no deep stacktrace thrown for really knowing the cause
                console.error(colors.red.underline('!# Runner: error happened in task: ' + colors.inverse(name)));
                console.error(err);
                console.error(new Error().stack);
                resolve(false);
            });
        });
    }

    /**
     * Runs defined tasks in parallel
     *
     * @param {[()<Promise>, Promise, ...]} task_def array with task definitions

     * @todo implement multithreading parallel execution
     *
     * @return {Promise}
     */
    static runParallel(task_def) {
        let to_run = [];
        task_def.forEach((e) => {
            to_run.push(Runner._handleFN(e));
        });
        return Promise.all(to_run);
    }

    /**
     * Runs defined tasks sequential
     *
     * @param {[()<Promise>, ()<Promise>, ...]} task_def array with task definitions
     *
     * @todo implement 'break on failure' option, a `cb` that will - if set - be called if an error happens and depending if it returns `true` the chain will continue, if `false` it will fail, receives value of failure
     *
     * @return {Promise}
     */
    static runSequential(task_def) {
        return new Promise((resolve) => {
            let all_value = [];
            const runSequentialInner = (r) => {
                if(0 >= r.length) {
                    resolve(all_value);
                    return;
                }

                let e = r.shift();
                try {
                    Runner._handleFN(e).then((task_value) => {
                        all_value.push(task_value);
                        runSequentialInner(r);
                    });
                } catch(e) {
                    Runner.log().error('Error in Runner._handleFN execution');
                    console.log(new Error().stack);
                }
            };
            return runSequentialInner(task_def);
        })
    };

    /**
     * Formats timestamp into display time
     *
     * @param {Date} time
     * @return {string}
     */
    static formatTime(time) {
        return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
    }

    static log() {
        return {
            /**
             * @param text
             * @param time
             * @param prefix
             */
            raw: (text, time = undefined, prefix = '') => {
                if('undefined' === typeof time) {
                    time = new Date();
                }
                /*
                // currently cascading console styling is to buggy with promises, registerChild connectors would be needed which are called from within childs
                for(let i = 0; i < Runner.constructor.level_cur; i++) {
                    buffer += '    ';
                }
                */
                console.log(prefix + colors.grey('[' + Runner.formatTime(time) + ']') + ' ' + text);
            },
            /**
             * @param text
             * @param time
             * @return {undefined}
             */
            start: (text, time = undefined) => {
                Runner.constructor.level_cur++;
                if('undefined' === typeof time) {
                    time = new Date();
                }
                Runner.log().raw(colors.green.italic('Starting `' + text + '`'), time);
                return time;
            },
            /**
             * @param text
             * @param time_start
             * @param time
             * @param suffix
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
                Runner.constructor.level_cur--;
            },
            /**
             * @param text
             * @param time
             */
            error: (text, time = undefined) => {
                Runner.log().raw(
                    colors.red.bold(
                        colors.bgRed.white('#!') + ' ' +
                        text
                    ),
                    time
                );
            }
        };
    }
}

if('undefined' === typeof Runner.constructor.level_cur) {
    Runner.constructor.level_cur = 0;
}

module.exports = Runner;