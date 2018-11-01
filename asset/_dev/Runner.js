class Runner {
    /**
     * @param {Function} fn
     * @param {Object} options
     * @param {String} name
     */
    constructor(fn, options = {}, name = '') {
        this.fn = fn;
        this.options = options;
        this.name = name;
    }

    static formatTime(time) {
        return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
    }

    static log(time, text) {
        console.log('[' + Runner.formatTime(time) + '] ' + text);
    }

    async run() {
        const start = new Date();
        Runner.log(start, 'Starting `' + this.name + '`...');
        this.fn(...this.options).then((err, result) => {
            if(err) {
                console.log(err);
            }
            const end = new Date();
            const time = end.getTime() - start.getTime();
            Runner.log(end, 'Finished `' + this.name + '` after ' + time + 'ms');
        });
    }
}


module.exports = Runner;