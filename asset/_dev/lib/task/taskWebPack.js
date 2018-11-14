/**
 * @type {LoadEnv}
 */
const LoadEnv = require('../LoadEnv');

const path = require('path');
const colors = require('colors/safe');

const deepmerge = require('deepmerge');

/**
 * @type {Runner}
 */
const Runner = require('../Runner');

const webpack = require('webpack');

/**
 * Bootstraps and runs the packing of all current files into an archive
 *
 * @param {Object} config
 * @param {Object} option
 *
 * @return {Promise}
 */
module.exports.task = (config, option) => {
    return Runner.run(
        () => {
            return new Promise((resolve) => {
                const handler = (err, stats) => {
                    if(err) {
                        console.error(err.stack || err);
                        if(err.details) {
                            console.error(err.details);
                        }
                        resolve();
                        return;
                    }

                    const info = stats.toJson();

                    if(stats.hasErrors()) {
                        console.error(info.errors);
                    }

                    if(stats.hasWarnings()) {
                        console.warn(info.warnings);
                    }

                    console.log(info);

                    /*console.log(stats.toString({
                        chunks: false,  // Makes the build much quieter
                        colors: true    // Shows colors in the console
                    }));*/

                    Runner.log().raw('Webpack [' + info.version + '] has run');

                    if([] !== info.warnings) {
                        // if global warnings are existing
                        info.warnings.forEach(warning => {
                            Runner.log().raw('Webpack Warning: ' + warning);
                        });
                    }

                    if(info.children) {
                        info.children.forEach(child => {
                            Runner.log().raw('Webpack Compiler in Child [' + colors.underline(child.hash) + '] finished in ' + colors.underline.blue(child.time + 'ms'));
                            if(child.warnings) {
                                // if compiler warnings are existing
                                child.warnings.forEach(warning => {
                                    Runner.log().raw('Webpack Compiler Warning in Child [' + info + '] ' + warning);
                                });
                            }

                            for(let chunk_name in child.assetsByChunkName) {
                                if(child.assetsByChunkName.hasOwnProperty(chunk_name)) {

                                }
                            }
                            console.log(child.assetsByChunkName);
                            console.log(child.outputPath);
                            // here size of buildes chunks [{name:string,size:string,chunks:string,chunkNames:string,emitted:bool}]
                            console.log(child.assets);
                            console.log(child.entrypoints);
                            console.log(child.namedChunkGroups);
                            console.log(child.chunks);
                            console.log(child.modules);
                        });
                    }

                    resolve();
                };

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
                        fin_conf.push(deepmerge(conf._use(), tmp_conf));
                    } else {
                        fin_conf.push(tmp_conf);
                    }
                });

                let wbpk = webpack(fin_conf);

                if(option.watch) {
                    let watching = wbpk.watch(option.watch, handler);
                    Runner.log().raw('taskWebPack: Watcher starting.');
                    watching.close(() => {
                        Runner.log().raw('taskWebPack: Watcher ended.');
                    });
                } else {
                    Runner.log().raw('taskWebPack: Build starting.');
                    wbpk.run(handler);
                    Runner.log().raw('taskWebPack: Build started.');
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