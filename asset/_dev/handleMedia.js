/**
 * @type {LoadEnv}
 */
const LoadEnv = require('./lib/LoadEnv');
const {FileWatcher} = require('./lib/FileWatcher');
/**
 * @type {Runner}
 */
const Runner = require('./lib/Runner');


const fs = require('fs');
const path = require('path');

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

function getFilesizeInBytes(filename) {
    return fs.statSync(filename).size;
}

class MediaOptimize {
    constructor() {
        this.handler_list = {
            png: (src, build, option, resolve) => {
                imagemin(option.files, build, {
                    plugins: [
                        imageminPngquant({quality: option.quality})
                    ]
                }).then((files) => {
                    let optimized = [];
                    files.forEach((file) => {
                        optimized.push(file.path);
                    });
                    console.log('png finished: ' + optimized.length);
                    resolve(optimized);
                });
            },
            jpg: {},
            svg: {},
            pdf: {},
            dynamic: {}
        };
        /**
         * Holds runtime config to each handler
         * @type {{}}
         */
        this.option = {};
    }

    run(src, build) {
        return new Promise((resolve) => {
            let exec = [];
            let res;
            for(let type in this.option) {
                // go through all activated handler types, those with option
                res = this.handlerDispatch(type, src, build);
                if(res) {
                    exec.push(res);
                }
            }

            Promise.all(exec).then((result_list) => {
                resolve(result_list);
            })
        });
    }

    handlerDispatch(type, src, build) {
        if(this.handler_list.hasOwnProperty(type) && 'function' === typeof this.handler_list[type]) {
            // when handler exists
            let option = this.getOption(type);
            let tmp_files = [];
            // suffix the src path with the files glob
            option.files.forEach(src_glob => {
                tmp_files.push(path.resolve(src + src_glob));
            });
            option.files = tmp_files;
            console.log(option.files);

            return new Promise((resolve) => {
                this.handler_list[type](src, build, option, resolve);
            });
        }
        return false;
    }

    getOption(type) {
        if(this.option.hasOwnProperty(type)) {
            return this.option[type];
        }
        return {};
    }

    addHandler(type, option) {
        this.option[type] = option;
    }
}

/**
 * Function for parsing one entry file to one output file
 * @param src_dir
 * @param build_dir
 * @param option
 * @param watch
 * @return {Promise<{[]}>}
 */
const optimize = (src_dir, build_dir, option, watch) => {
    let optimizer = new MediaOptimize();

    for(let type in option) {
        if(option.hasOwnProperty(type)) {
            console.log(type);
            optimizer.addHandler(type, option[type]);
        }
    }

    return optimizer.run(src_dir, build_dir);
};

/**
 *
 * @param {Object} src
 * @param {Object} option
 * @param watch
 * @example
 *
 * @return {Promise}
 */
module.exports = (src, option, watch = true) => {

    return new Promise((resolve) => {
        let exec = [];
        for(let build_dir in src) {
            if(src.hasOwnProperty(build_dir)) {
                exec.push(optimize(src[build_dir], build_dir, option, watch));
            }
        }

        // todo: add multithreaded async option for transpiling multiple folders at the same time
        Promise.all(exec).then(res => {
            let error = false;
            let result = [];
            res.forEach((elem) => {
                result.push(elem);
            });
            resolve({
                err: error,
                result: result
            });
        })
    });
};
