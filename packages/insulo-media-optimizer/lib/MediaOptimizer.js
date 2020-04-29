const {log} = require('@insulo/runner/pretty');

const {FileWatcher} = require('@insulo/watcher');

const path = require('path');
const colors = require('colors/safe');

const glob = require('glob');

// Default Handlers are done below the class

class MediaOptimizer {
    constructor(watch) {
        this.watch = watch;
        this.handler_list = {};
        /**
         * Holds runtime config for each handler
         * @type {{}}
         */
        this.option = {};
    }

    /**
     * Searches the `src` for all files that match registered handlers, executing building and attaching of wanted file/folder watcher
     *
     * @param src
     * @param build
     * @return {Promise<{}>}
     */
    run(src, build) {
        return new Promise((resolve) => {
            let exec = [];
            let res;
            for(let type in this.option) {
                // go through all activated handler types, those with option
                res = this.handlerDispatch(type, src, build);
                if(res) {
                    exec.push(...res);
                }
            }

            this.analyzeStats(exec).then((result_list) => {
                resolve(result_list)
            });
        });
    }

    /**
     * Executes an array of media handlers and will process their async returns, prints stats
     *
     * @param exec
     * @return {Promise<any[]>}
     */
    analyzeStats(exec) {
        return Promise.all(exec).then((result_list) => {
            // create stats for all created files
            let qty = 0;
            let saved = 0;
            result_list.forEach((elem) => {
                if(elem.saved) {
                    if(0 > elem.saved) {
                        log.raw(colors.red('MediaOptimizer: negative saved size (' + elem.saved + 'KB) found for `' + elem.file + '`'));
                    }
                    saved += elem.saved;
                    qty++;
                }
            });
            log.raw(
                colors.white(
                    'MediaOptimizer: optimized ' +
                    qty + ' file' + (1 < qty ? 's' : '') +
                    ' and saved ' +
                    colors.underline(Math.round(saved * 100) / 100 + 'KB') + ' of size!'
                )
            );

            // ends media optimizer
            return result_list;
        })
    }

    /**
     * Executes the handler for each file that is found in one dir to one types all file globs, fetch options and add watchers
     *
     * @param type
     * @param src one dir
     * @param build one dir
     * @return {*}
     */
    handlerDispatch(type, src, build) {
        src = path.resolve(src);
        if(this.handler_list.hasOwnProperty(type) && 'function' === typeof this.handler_list[type]) {
            // when handler exists
            let option = this.getOption(type);

            /**
             * Scan for files foreach `files` selector provided through `option`
             * @return {Array}
             */
            const scanFile = () => {
                let files = [];
                // suffix the src path with the files glob

                // todo: make async multithread glob
                option.files.forEach((src_glob) => {
                    let found = glob(path.resolve(src + '/' + src_glob), {sync: true});
                    files.push(...found);
                });

                return files;
            };

            /**
             * the current active files, overwritten when newer detected
             *
             * @type {Array}
             */
            let files = scanFile();

            /**
             * Gets added files or false for scanned folder files
             * @param new_files
             * @return {boolean|Array}
             */
            const addedFiles = (new_files) => {
                let added = new_files.filter(x => !files.includes(x));
                if([] === added) {
                    added = false;
                }

                return added;
            };

            let exec = [];
            files.forEach((file) => {
                /**
                 * @type {HandlerDynamic|HandlerPNG|HandlerJPG}
                 */
                let handler = this.initHandler(type, src, file, build, option);
                exec.push(handler.run());
            });

            if(this.watch) {
                // add watcher to rescan for new files in folder
                // todo: !warning! maybe this spawns too much file listeners, as is initiated for the src of each handler, so one src and 5 handler = 5 media-folder watcher active, they are watching everything and not only for change for their needed files, !warning! it is filtered through rescanning every src again with recursive glob for each handler active
                let watcher = new FileWatcher('media-folder ' + src);
                watcher.add(src);

                watcher.onError();
                watcher.onReady();

                // Change and Unlink are watched from within each file on itself
                // checks for new files in the directory of this mediaoptimizer instance and starts those files on their own, not retriggering everything
                watcher.onChangeAdd(() => {
                    let added = addedFiles(scanFile());
                    if(added) {
                        // only for new files
                        added.forEach((file) => {
                            /**
                             * @type {HandlerDynamic|HandlerPNG|HandlerJPG}
                             */
                            let handler = this.initHandler(type, src, file, build, option);
                            this.analyzeStats([handler.run()]).then((result_list) => {
                            });
                        });
                    }
                });
            }

            return exec;
        }
        console.log(colors.red('no handler registered for type ' + type));
        return [];
    }

    /**
     * @param type
     * @param src
     * @param file
     * @param build
     * @param option
     * @return {HandlerDynamic|HandlerPNG|HandlerJPG}
     */
    initHandler(type, src, file, build, option) {
        // creating new handler for file
        /**
         * @type {HandlerDynamic|HandlerPNG|HandlerJPG}
         */
        let tmp_handler = new this.handler_list[type](src, path.resolve(file), path.resolve(build), option);
        // initial cleaning
        tmp_handler.clean();

        if(this.watch) {
            // add watcher to each file for cleaning and changing [changing could not be tested atm as every action used from programs is delete then add]
            let watcher = new FileWatcher('media-file ' + tmp_handler.name);
            watcher.add(tmp_handler.src);

            watcher.onError();
            watcher.onReady();

            watcher.onChangeChange(() => {
                tmp_handler.run();
            });

            watcher.onChangeUnlink(() => {
                tmp_handler.clean();
            });
        }

        return tmp_handler;
    }

    /**
     * Returns the set options for a type or an empty object
     *
     * @param type
     *
     * @return {*}
     */
    getOption(type) {
        if(this.option.hasOwnProperty(type)) {
            return this.option[type];
        }
        return {};
    }

    /**
     * Activate a handler through setting his option
     *
     * @param type
     *
     * @param option
     */
    addHandler(type, option) {
        this.option[type] = option;
        if('function' === typeof option.handler) {
            this.handler_list[type] = option.handler;
            return;
        }
        if('function' === typeof MediaOptimizer.constructor.handler_default[type]) {
            // if default handler is registered, execute closure for loading handler
            this.handler_list[type] = MediaOptimizer.constructor.handler_default[type]();
            return;
        }
        throw Error('MediaOptimizer: no handler found for type ' + colors.underline(type));
    }
}

if('undefined' === typeof MediaOptimizer.constructor.handler_default) {
    /**
     * Add your default handler which are used among multiple configs to this config to not define it every time
     * @type {{}}
     */
    MediaOptimizer.constructor.handler_default = {};
}

module.exports = MediaOptimizer;