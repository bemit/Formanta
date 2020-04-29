const chokidar = require('chokidar');
const colors = require('colors/safe');

const {log} = require('@insulo/runner/pretty');

class FileWatcher {
    /**
     * @param {String} name
     * @param {Array|String} target
     */
    constructor(name, target = []) {
        this.name = name;
        this.watcher = chokidar.watch(target, {
            persistent: true,

            ignored: '*.txt',
            // don't fire handler for initial scan
            ignoreInitial: true,
            followSymlinks: true,
            //cwd: '.',
            //disableGlobbing: false,

            // turned on for fixing Jet Brains IDE's saving bug (first change fires `change`, second change fires `unlink`, next nothing happens)
            usePolling: true,
            //interval: 100,
            //binaryInterval: 300,
            //alwaysStat: false,
            depth: 99,
            /*awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            },*/

            //ignorePermissionErrors: false,
            //atomic: true // or a custom 'atomicity delay', in milliseconds (default 100)
        });
    }

    /**
     * Add a a file or dir or glob to be watched, or an Array of items to be watched
     *
     * @param {Array, String} target
     *
     * @return FileWatcher
     */
    add(target) {
        this.watcher.add(target);
        return this;
    }

    /**
     * Removes a file or dir or glob from the watch stack
     *
     * @param {String} target single target file or glob, no array
     *
     * @return FileWatcher
     */
    remove(target) {
        this.watcher.unwatch(target);
        return this;
    }

    /**
     * End file watching
     */
    stop() {
        this.watcher.close();
    }

    /**
     * Get list of actual paths being watched on the filesystem
     * @return {*}
     */
    getWatched() {
        return this.watcher.getWatched();
    }

    /**
     * Enables Debug Logs on each event
     */
    debug() {
        this.watcher.on('raw', console.log);
    }

    //
    // Abstracted event handling
    //

    /**
     * @param {Function} cb optional
     *
     * @return FileWatcher
     */
    onReady(cb = null) {
        this.watcher.on('ready', () => {
            if(null === cb) {
                log.raw((this.name ? 'Watcher [' + this.name + '] ' : 'Watcher: ') + colors.green('listening for changes'));
            }
            if('function' === typeof cb) {
                cb();
            }
        });
        return this;
    }

    /**
     * @param {Function} cb optional
     *
     * @return FileWatcher
     */
    onError(cb = null) {
        this.watcher.on('error', (error) => {
            if(null === cb) {
                log.raw(((this.name ? 'Watcher [' + this.name + '] ' : 'Watcher: ') + colors.red('error') + ' `' + error + '`'));
            }
            if('function' === typeof cb) {
                cb(error);
            }
        });
        return this;
    }

    /**
     * internal function which wraps all onchange handler with default logging
     * @param cb
     * @return {Function}
     */
    onChangeCb(cb) {
        return (path, text) => {
            log.raw((this.name ? 'Watcher [' + this.name + '] ' : 'Watcher: ') + text);
            cb(path);
        };
    }

    /**
     * Add a cb to listen on `add`, `change` and `unlink`
     *
     * @param cb
     *
     * @return {FileWatcher}
     */
    onChange(cb) {
        this.onChangeAdd(cb);
        this.onChangeChange(cb);
        this.onChangeUnlink(cb);

        return this;
    }

    /**
     * Add a cb to listen on `add`
     *
     * @param cb
     *
     * @return {FileWatcher}
     */
    onChangeAdd(cb) {
        this.watcher.on('add', (path) => this.onChangeCb(cb)(path, colors.green('new file ') + path));

        return this;
    }

    /**
     * Add a cb to listen on `change`
     *
     * @param cb
     *
     * @return {FileWatcher}
     */
    onChangeChange(cb) {
        this.watcher.on('change', (path, stats) => this.onChangeCb(cb)(path, colors.yellow('changed file ') + path + ' [' + stats.size + ']'));

        return this;
    }

    /**
     * Add a cb to listen on `unlink`
     *
     * @param cb
     *
     * @return {FileWatcher}
     */
    onChangeUnlink(cb) {
        this.watcher.on('unlink', (path) => this.onChangeCb(cb)(path, colors.red('removed file ') + path));

        return this;
    }
}

/**
 * @type {FileWatcher}
 */
module.exports.FileWatcher = FileWatcher;
