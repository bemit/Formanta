/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const path = require('path');
const colors = require('colors/safe');

const os = require('os');
const EOL = os.EOL;

const merge = require('webpack-merge');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const webpack = require('webpack');

const calcByte2KB = (size) => {
    return colors.underline((Math.round(size / 1024 * 100) / 100) + 'KB');
};

const msg = (line, lvl = 0) => {
    let lvmsg = '';
    for(let i = 0; i < lvl; i++) {
        lvmsg += '  ';
    }
    Runner.log().raw(lvmsg + line);
};

/**
 * Execution Handler for a webpack result with error handling and pretty logging
 *
 * @param err
 * @param stats
 */
const webpackResult = (err, stats) => {
    if(err) {
        console.error(err.stack || err);
        if(err.details) {
            console.error(err.details);
        }
        return;
    }

    const info = stats.toJson();

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

    Runner.log().raw('Webpack ' + colors.underline.yellow('v' + info.version) + ' runned:');

    if([] !== info.warnings) {
        // if global warnings are existing
        info.warnings.forEach(warning => {
            Runner.log().raw('Webpack Warning: ' + colors.yellow(warning));
        });
    }

    if(info.children) {
        info.children.forEach(child => {
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
        });
    }
};

/**
 * Bootstraps and runs webpack, if `option.watch` is existing, watching is enabled
 *
 * @param {Object} config
 * @param {Object} option
 *
 * @return {Promise}
 */
module.exports.run = (config, option) => {
    return Runner.run(
        () => {
            return new Promise((resolve) => {
                // MultiCompiler as default
                if(!Array.isArray(config)) {
                    config = [config];
                }

                // Travers all configs and execute `_use()` to deepmerge the other data into its return, build an array again
                // config.for(conf => deepmerge(conf.use():<Object>, conf)
                let tmp_conf = {};
                let fin_conf = [];
                config.forEach(conf => {
                    tmp_conf = {...conf};
                    if(conf._use) {
                        delete tmp_conf._use;
                        fin_conf.push(merge(conf._use(), tmp_conf));
                    } else {
                        fin_conf.push(tmp_conf);
                    }
                });

                let wbpk = webpack(fin_conf);

                if(option.watch) {
                    let watching = wbpk.watch(option.watch, webpackResult);
                    Runner.log().raw('taskWebPack: Watcher starting...');
                    watching.close(() => {
                        Runner.log().raw('taskWebPack: Watcher ended.');
                    });
                    resolve();
                } else {
                    Runner.log().raw('taskWebPack: Build starting...');
                    wbpk.run((err, stats) => {
                        webpackResult(err, stats);
                        resolve();
                    });
                    Runner.log().raw('taskWebPack: Build started...');
                }
            });
        }, [],
        'webpack'
    );
};

/**
 * @type {{es6: (function(): *), jsx: (function(): *)}}
 */
module.exports.config = {
    es6: () => require('./taskWebPack.config.es6'),
    jsx: () => require('./taskWebPack.config.jsx')
};