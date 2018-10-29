const fs = require('fs');
const path = require('path');

const root_dir = path.resolve(__dirname + '/../../../');

console.log('### Boot');

let config_folder = root_dir + '/config/';
let config_path_url = config_folder + 'url.json';
let config_path_view_system = config_folder + 'view_system.json';
let config_path_build = config_folder + 'build.json';

const loadConfig = (file) => {
    // check if file is readable
    return new Promise((resolve, reject) => {
        fs.access(file, fs.constants.R_OK, (err) => {
            if(err) {
                console.error('!# Config not readable: ' + file);
                return;
            }

            let config = require(file);

            if('object' === typeof config) {
                resolve(config);
            }

            reject(false);
        });
    });
};


module.exports = new Promise((resolve, reject) => {
    /**
     * Config for the whole view system, key `build` is the `build.json` config
     * @type {{debug: boolean, auto_reload: boolean, store: {data_dir: string, cache_dir: string, builded_info_file: string, build_dir: string, view_list: {}}, build: {}}}
     */
    let view_system = {};
    /**
     * @type {{ssl: string, host: string, port: string, 'base-path': string}}
     */
    let url = {};

    Promise.all([
        loadConfig(config_path_url),
        loadConfig(config_path_view_system),
        loadConfig(config_path_build)
    ]).then((data) => {
        if(false !== data[0]) {
            // url
            url = data[0];
        }
        if(false !== data[1]) {
            // view_system
            view_system = data[1];
            if('string' === typeof view_system.store.data_dir) {
                view_system.store.data_dir = root_dir + view_system.store.data_dir;
            }
            if('string' === typeof view_system.store.cache_dir) {
                view_system.store.cache_dir = root_dir + view_system.store.cache_dir;
            }
            if('string' === typeof view_system.store.builded_info_file) {
                view_system.store.builded_info_file = root_dir + view_system.store.builded_info_file;
            }
            view_system.store.build_dir = root_dir + view_system.store.build_dir;
            for(let key in view_system.store.view_list) {
                if(view_system.store.view_list.hasOwnProperty(key)) {
                    let tmp_val = view_system.store.view_list[key];

                    if('Array' === view_system.store.view_list.constructor.name) {
                        // using just objects so no need to differentiate between Array and Object when deleting/updating keys
                        view_system.store.view_list = Object.assign({}, view_system.store.view_list);
                    }
                    delete view_system.store.view_list[key];

                    if(isNaN(key * 1)) {
                        // some trick to check if the key is truly a string

                        // key = path, value = namespace
                        view_system.store.view_list[root_dir + key] = tmp_val;
                    } else {
                        // value = path, no namespace
                        view_system.store.view_list[key] = root_dir + tmp_val;
                    }
                }
            }
        }
        if(false !== data[2]) {
            // build
            view_system.build = data[2];
        }
        resolve({
            url: url,
            view: view_system,
        });
    });
});