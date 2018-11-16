/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const path = require('path');
const colors = require('colors/safe');

const merge = require('webpack-merge');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const webpack = require('webpack');

/***
 * Utility Function to calculate and concat with KB: bytes to kilobytes (binary not decimal system)
 *
 * @param {number} size
 * @return {string}
 */
const calcByte2KB = (size) => {
    return colors.underline((Math.round(size / 1024 * 100) / 100) + 'KB');
};

/**
 * Print a line with a calculated space prefix to make a output tree
 *
 * @param line
 * @param lvl
 */
const msg = (line, lvl = 0) => {
    let lvmsg = '';
    for(let i = 0; i < lvl; i++) {
        lvmsg += '  ';
    }
    Runner.log().raw(lvmsg + line);
};

/**
 * Result Handler for Task Handler
 */
class TaskWebPackResult {

    /**
     * Execution Handler for a webpack result with error handling and pretty logging
     *
     * @param err
     * @param stats
     */
    static parse(err, stats) {
        const info = stats.toJson();

        Runner.log().raw('Webpack ' + colors.underline.yellow('v' + info.version) + ' runned:');

        let error = TaskWebPackResult.printError(err, stats);
        if(error) {
            return;
        }

        if(info.children) {
            info.children.forEach(child => {
                TaskWebPackResult.printChildStats(child);
            });
        }
    }

    /**
     * @param err
     * @param stats
     * @return {boolean}
     */
    static printError(err, stats) {
        const info = stats.toJson();

        if(err) {
            console.error(err.stack || err);
            if(err.details) {
                console.error(err.details);
            }
            return true;
        }

        if(stats.hasErrors()) {
            info.errors.forEach(error => {
                Runner.log().error(error);
            });
        }

        if(stats.hasWarnings()) {
            info.warnings.forEach(warning => {
                Runner.log().raw(colors.yellow(warning));
            });
        }

        if([] !== info.warnings) {
            // if global warnings are existing
            info.warnings.forEach(warning => {
                Runner.log().raw('Webpack Warning: ' + colors.yellow(warning));
            });
        }

        return false;
    }

    /**
     * @param child
     */
    static printChildStats(child) {
        msg(colors.green(child.hash) + ' finished in ' + colors.underline.blue(child.time + 'ms'), 1);

        if(child.warnings) {
            // if compiler warnings are existing
            child.warnings.forEach(warning => {
                msg('Webpack ' + colors.green(child.hash) + ' warning: ' + colors.red(warning), 2);
            });
        }

        child.modules.forEach(module => {
            msg(colors.underline(module.chunks.length) + ' chunk' + (1 < module.chunks.length ? 's' : '') + ' created for module ' + colors.green('number' === typeof module.id ? module.name : module.id) + ' ' + colors.underline(calcByte2KB(module.size)), 2);
        });

        let tmp_msg = '';
        for(let chunk_name in child.assetsByChunkName) {
            if(child.assetsByChunkName.hasOwnProperty(chunk_name)) {
                if('string' === typeof child.assetsByChunkName[chunk_name]) {
                    tmp_msg = colors.underline(chunk_name) + ', saved 1 file: ' + colors.green(child.assetsByChunkName[chunk_name]);
                } else {
                    tmp_msg = colors.underline(chunk_name) + ' has ' + colors.underline(child.assetsByChunkName[chunk_name].length) + ' files';
                    child.assetsByChunkName[chunk_name].forEach((chunk) => {
                        tmp_msg += 'saved: ' + colors.green(chunk);
                    });
                }
                msg(tmp_msg, 2);
            }
        }

        child.assets.forEach(asset => {
            msg(
                colors.underline(asset.name) + ' ' +
                colors.underline.yellow(calcByte2KB(asset.size)) +
                (asset.isOverSizeLimit ? colors.red('oversize: ' + asset.isOverSizeLimit) : '') + ' ' +
                colors.gray(asset.chunks.length + ' chunks'), 3
            );
        });

        msg('saved in: ' + colors.green(child.outputPath), 2);
    }
}

/**
 * Task Handler Class
 */
class TaskWebPack {
    /**
     * @param config
     * @param option
     */
    constructor(config, option) {
        if(!Array.isArray(config)) {
            config = [config];
        }
        this.config = config;
        this.option = option;
    }

    /**
     * @return {Promise<{}>}
     */
    run() {
        return Runner.run(
            () => {
                return new Promise((resolve) => {
                    // MultiCompiler as default

                    // Travers all configs and execute `_use()` to deepmerge the other data into its return, build an array again
                    // config.for(conf => deepmerge(conf.use():<Object>, conf)
                    let tmp_conf = {};
                    let fin_conf = [];
                    this.config.forEach(conf => {
                        tmp_conf = {...conf};
                        tmp_conf.watch = true;
                        if(conf._use) {
                            delete tmp_conf._use;
                            fin_conf.push(merge(conf._use(), tmp_conf));
                        } else {
                            fin_conf.push(tmp_conf);
                        }
                    });

                    let wbpk = webpack(fin_conf);

                    if(this.option.watch) {
                        //let watching = wbpk.watch(this.option.watch, TaskWebPackResult.parse);
                        let first = true;
                        let prev_hash = '';
                        let same = false;
                        let watching = wbpk.watch(this.option.watch, (err, stats) => {
                            TaskWebPackResult.parse(err, stats);
                            if(first) {
                                // On first run tell that watcher is watching
                                Runner.log().raw('taskWebPack: Watcher watching...');
                                prev_hash = stats.hash;
                                first = false;
                            } else {
                                // on all other the current file hash

                                // tell if file has really changed, e.g. adding blank lines doesnt change the hash and also forgotten imports and other "input errors"
                                same = (prev_hash === stats.hash);
                                prev_hash = stats.hash;
                                Runner.log().raw('taskWebPack: Watcher handled: ' + colors.green(stats.hash) + ' ' + (same ? colors.yellow('not output change') : colors.grey('output changed')));
                            }
                        });
                        Runner.log().raw('taskWebPack: Watcher starting...');

                        /*  other methods that TRIGGER things on webpack watch
                        // end and close watcher
                        watching.close(() => {
                            Runner.log().raw('taskWebPack: Watcher ended.');
                        });
                        // just rebuild
                        watching.invalidate();
                        */
                        resolve();
                    } else {
                        Runner.log().raw('taskWebPack: Build starting...');
                        wbpk.run((err, stats) => {
                            TaskWebPackResult.parse(err, stats);
                            resolve();
                        });
                        Runner.log().raw('taskWebPack: Build started...');
                    }
                });
            }, [],
            'webpack'
        );
    }
}

/**
 * Class Export for Extension: Main WebPack Handler
 * @type {TaskWebPack}
 */
module.exports.task = TaskWebPack;

/**
 * Class Export for Extension: WebPack Result Handler
 * @type {TaskWebPackResult}
 */
module.exports.result = TaskWebPackResult;

/**
 * @param {Object} config
 * @param {Object} option
 * @return {function(): Promise<{}>}
 */
module.exports.run = (config, option) => {
    let task = new TaskWebPack(config, option);
    return task.run.bind(task);
};

/**
 * @type {{es6: (function(): *), jsx: (function(): *)}}
 */
module.exports.config = {
    es6: () => require('./taskWebPack.config.es6'),
    jsx: () => require('./taskWebPack.config.jsx')
};