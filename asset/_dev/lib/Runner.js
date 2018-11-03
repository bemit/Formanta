class Runner {

    /**
     * @param {Function} fn
     * @param {Object} options
     * @param {String} name
     * @return {Promise<{}>}
     */
    static run(fn, options = {}, name = '') {
        return new Promise((resolve) => {
            const start = new Date();
            Runner.log(start, 'Starting `' + name + '`...');

            fn(...options).then((data) => {
                if(data.err) {
                    // err is only bool
                    console.error('!# Runner: error happened in task: ' + name);
                }
                const end = new Date();
                const time = end.getTime() - start.getTime();
                Runner.log(end, 'Finished `' + name + '` after ' + time + 'ms');

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

    /**
     * Prints the time and text to the log
     *
     * @param time
     * @param text
     */
    static log(time, text) {
        console.log('[' + Runner.formatTime(time) + '] ' + text);
    }
}


module.exports = Runner;