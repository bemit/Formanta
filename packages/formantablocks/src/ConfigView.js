/**
 * @type {module.ConfigView}
 */
module.exports = class ConfigView {
    constructor(config) {
        if('object' === typeof config) {
            /**
             * @type {{debug: boolean, auto_reload: boolean, store: {data_dir: string, cache_dir: string, builded_info_file: string, build_dir: string, view_list: {}}, build: {}}}
             */
            this.config = config;
        } else {
            this.config = [];
        }
    }

    /**
     * @return Object|[]
     */
    buildTarget() {
        if('undefined' !== typeof this.config.build) {
            return this.config.build;
        } else {
            console.log('ConfigView: build not set.');
            return [];
        }
    }

    /**
     * @return boolean
     */
    autoReload() {
        if('undefined' !== typeof this.config.auto_reload) {
            return this.config.auto_reload;
        } else {
            console.log('ConfigView: auto_reload not set.');
            return true;
        }
    }

    /**
     * @return boolean
     */
    debug() {
        if('undefined' !== typeof this.config.debug) {
            return this.config.debug;
        } else {
            console.log('ConfigView: debug not set.');
            return true;
        }
    }

    /**
     * @return string
     */
    storeCache() {
        if('undefined' !== typeof this.config.store.cache_dir) {
            return this.config.store.cache_dir;
        } else {
            console.log('ConfigView: store.cache_dir not set.');
            return '';
        }
    }

    /**
     * @return array
     */
    storeView() {
        if('undefined' !== typeof this.config.store.view_list) {
            return this.config.store.view_list;
        } else {
            console.log('ConfigView: store.view_list not set.');
            return [];
        }
    }

    /**
     * @return array
     */
    storeData() {
        if('undefined' !== typeof this.config.store.data_dir) {
            return this.config.store.data_dir;
        } else {
            console.log('ConfigView: store.data_dir not set.');
            return [];
        }
    }

    /**
     * @return string
     */
    storeBuildedInfo() {
        if('undefined' !== typeof this.config.store.builded_info_file) {
            return this.config.store.builded_info_file;
        } else {
            console.log('ConfigView: store.builded_info_file not set.');
            return '';
        }
    }

    /**
     * @return string
     */
    storeBuild() {
        if('undefined' !== typeof this.config.store.build_dir) {
            return this.config.store.build_dir;
        } else {
            console.log('ConfigView: store.build_dir not set.');
            return '';
        }
    }
};