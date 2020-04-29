/**
 * @type {module.ConfigView}
 */
const ConfigView = require('./ConfigView');

/**
 * @type {module.Config}
 */
module.exports = class Config {
    /**
     * @param {{view: {debug: boolean, auto_reload: boolean, store: {data_dir: string, cache_dir: string, builded_info_file: string, build_dir: string, view_list: {}}, build: {}}, url: {ssl: string, host: string, port: number|boolean, 'base-path': string}}} config
     */
    constructor(config) {
        if('undefined' !== typeof config.view && 'object' === typeof config.view) {
            /**
             * @type {module.ConfigView}
             */
            this.view = new ConfigView(config.view);
        } else {
            this.view = new ConfigView(false);
        }

        if('undefined' !== typeof config.url && 'object' === typeof config.url) {
            /**
             * @type {{ssl: string, host: string, port: number|boolean, 'base-path': string}}}
             */
            this.url = config.url;
        } else {
            this.url = [];
        }
    }
};