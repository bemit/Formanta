/**
 * Loads an environment one time, e.g. for saving time on watchers
 */
class LoadEnv {
    static load(name, cb = undefined) {
        if(false === LoadEnv.constructor.loaded.hasOwnProperty(name)) {
            LoadEnv.constructor.loaded[name] = require(name);
            if('function' === typeof cb) {
                LoadEnv.constructor.loaded[name] = cb(LoadEnv.constructor.loaded[name]);
            }
        }

        return LoadEnv.constructor.loaded[name];
    }
}

if('undefined' === typeof LoadEnv.constructor.loaded) {
    LoadEnv.constructor.loaded = {};
}

module.exports = LoadEnv;