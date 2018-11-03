const chokidar = require('chokidar');

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

            // turned on for fixing Jet Brains IDE's saving bug (first change fires `change`, second change fires `unlink`, next nothing happend)
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
            console.log((this.name ? 'Watcher [' + this.name + '] ' : 'Watcher: ') + ' listening for changes');
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
            console.log((this.name ? 'Watcher [' + this.name + '] ' : 'Watcher: ') + 'error `' + error + '`');
            if('function' === typeof cb) {
                cb(error);
            }
        });
        return this;
    }

    /**
     *
     * @param cb
     * @param watcher
     *
     * @return {FileWatcher}
     */
    onChange(cb) {
        const exec = (path, text) => {
            console.log((this.name ? 'Watcher [' + this.name + '] ' : 'Watcher: ') + text);
            cb(path);
        };

        //this.watcher.on('add', (path) => exec(path, 'new file ' + path));
        this.watcher.on('change', (path, stats) => exec(path, 'changed file ' + path + ' [' + stats.size + ']'));
        //this.watcher.on('unlink', (path) => exec(path, 'removed file ' + path));

        return this;
    }
}

/**
 * @type {FileWatcher}
 */
module.exports.FileWatcher = FileWatcher;