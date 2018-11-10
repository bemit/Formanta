const colors = require('colors/safe');

class Runner {

    /**
     * @param {Function} fn
     * @param {Object} options
     * @param {String} name
     * @return {Promise<{}>}
     */
    static run(fn, options = {}, name = '') {
        return new Promise((resolve) => {
            const start = Runner.log().start(name);

            fn(...options).then((data) => {
                if(data.err) {
                    // err is only bool
                    console.error('!# Runner: error happened in task: ' + name);
                }

                Runner.log().end(name, start);

                resolve(data.result);
            });
        });
    }

    /**
     * Runs defined tasks in parallel
     *
     * @param {[Promise, Promise, ...]} task_def array with task definitions

     * @todo implement multithreading parallel execution
     *
     * @return {Promise}
     */
    static runParallel(task_def) {
        let to_run = [];
        task_def.forEach((e) => {
            to_run.push(e());
        });
        return Promise.all(to_run);
    }

    /**
     * Runs defined tasks sequential
     *
     * @param {[()<Promise>, ()<Promise>, ...]} task_def array with task definitions
     * @return {Promise}
     */
    static runSequential(task_def) {
        return new Promise((resolve) => {
            let all_value = [];
            const runSequentialInner = (r) => {
                if(0 === r.length) {
                    resolve(all_value);
                    return;
                }

                let e = r.shift();
                e().then((task_value) => {
                    all_value.push(task_value);
                    runSequentialInner(r);
                });
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
             * @param time
             * @param text
             */
            raw: (time, text) => {
                let buffer = '';
                for(let i = 0; i < Runner.constructor.level_cur; i++) {
                    buffer += '    ';
                }
                console.log(buffer + colors.grey('[' + Runner.formatTime(time) + ']') + ' ' + text);
            },
            /**
             * @param text
             * @param time
             * @return {*}
             */
            start: (text, time = undefined) => {
                Runner.constructor.level_cur++;
                if('undefined' === typeof time) {
                    time = new Date();
                }
                Runner.log().raw(time, colors.green.italic('Starting `' + text + '`'));
                return time;
            },
            /**
             * @param text
             * @param time_start
             * @param time
             */
            end: (text, time_start, time = undefined) => {
                if('undefined' === typeof time) {
                    time = new Date();
                }
                let end = time.getTime() - time_start.getTime();
                Runner.log().raw(time,
                    colors.green.bold(
                        colors.bgGreen.white('Finished') + ' `' + text + '`' + colors.grey(' after ') + colors.blue.underline(end + 'ms')
                    )
                );
                Runner.constructor.level_cur--;
            }
        };
    }
}

if('undefined' === typeof Runner.constructor.level_cur) {
    Runner.constructor.level_cur = 0;
}


module.exports = Runner;