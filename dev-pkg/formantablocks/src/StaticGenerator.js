const fs = require('fs');

/**
 * @type {module.Renderer}
 */
const Renderer = require('./Renderer');

/**
 * @type {module.StaticGenerator}
 */
module.exports = class StaticGenerator {
    /**
     * @param {module.ConfigView} config
     */
    constructor(config) {
        /**
         * @type {module.ConfigView}
         */
        this.config = config;

        // todo: read in all already rendered
        this.builded = {};
        if(this.config.storeBuildedInfo()) {
            try {
                fs.accessSync(this.config.storeBuildedInfo(), fs.constants.R_OK | fs.constants.W_OK);

                let builded_info = require(this.config.storeBuildedInfo());

                if('object' === typeof builded_info) {
                    this.builded = builded_info;
                } else {
                    console.error('!# BuildedInfo file not valid: ' + this.config.storeBuildedInfo());
                }
            } catch(e) {
                console.error('!# BuildedInfo file not readable/writeable: ' + this.config.storeBuildedInfo());
                return;
            }
        }

        this.renderer = new Renderer(this.config);
    }

    /**
     * Renders the template to an static html file, injects template dependent values from a json file, uses all other values defined in the templates-global tpl_data
     *
     * @param {string} id unique id, will be used also as filename to the value json of the template file
     * @param {Object}  to_build
     */
    render(id, to_build) {
        return new Promise((resolve) => {
            if(to_build.view && to_build['static']) {
                const {startTime, endTime} = require('../index');
                startTime('  formanta-blocks--static-generator--render[' + id + ']');

                let value_file = this.config.storeData() + id + '.json';

                let value = {};

                try {
                    fs.accessSync(value_file, fs.constants.R_OK);

                    value = require(value_file);
                } catch(e) {
                    // no value_file, means only no special values;
                }

                let content = this.renderer.render(to_build.view, value);

                content.then((html) => {
                    let output = html.valueOf();

                    if('string' === typeof output && 0 < output.trim().length) {
                        fs.writeFile(this.config.storeBuild() + to_build['static'], output, (err) => {
                            if(err) {
                                console.error('!# FormantaBlocks: can not be saved: `' + id + '` - `' + to_build.view + '` to `' + to_build['static'] + '`');
                            } else {
                                console.log('FormantaBlocks: rendered: `' + id + '` - `' + to_build.view + '` to `' + to_build['static'] + '`');

                                this.writeToBuilded(id, to_build['static']);
                            }
                            endTime('  formanta-blocks--static-generator--render[' + id + ']');
                            resolve({[id]: output});
                        });
                    }
                });
            }
        });
    }

    /**
     * Saves
     *
     * @param id
     * @param static_
     */
    writeToBuilded(id, static_) {
        console.log(id, static_);
        /*if (in_array(id, this.builded) && static !== this.builded[id][static]) {
            // when the id is already in the array but the new static file is not the same like the old, the old file is no longer needed and should be deleted
            this.delete(this.builded[id], 'static');
        }
        this.builded[id] = static;
        file_put_contents(this.config.storeBuildedInfo(), json_encode(this.builded), LOCK_EX);*/
    }

    /**
     * Deletes an static file and removes it when in the saved already builded templates (e.g. previous builds)
     *
     * @param {boolean|String} id
     * @param {boolean|String} static_
     * @param {boolean|String} view_file
     * @param {string} type
     * @param {boolean}   verbose
     */
    invalidate(id = false, static_ = false, view_file = false, type = 'unkown', verbose = false) {
        let deleted = false;
        let changed = false;
        let id_changed = false;

        console.log(static_, view_file);

        if(false !== id) {
            if(this.builded.hasOwnProperty(id)) {
                // when the id is already in the array but the new static file is not the same like the old, the old file is no longer needed and should be deleted
                deleted = this.delete(this.builded[id], type, verbose);
                delete this.builded[id];
                id_changed = id;
                changed = true;
            }
        }

        /*if (false !== static) {
            foreach (this.builded as in_id => stat) {
                if (0 === strpos(static, this.config.storeBuild())) {
                    // when a function submitted a full length file
                    static = str_replace(realpath(this.config.storeBuild()), '', (static));
                }

                if (stat === static) {
                    // when the id is already in the array but the new static file is not the same like the old, the old file is no longer needed and should be deleted
                    deleted = this.delete(stat, type, verbose);
                    unset(this.builded[in_id]);
                    id_changed = in_id;
                    changed = true;
                    break;
                }
            }
        }*/
        /*if (false !== view_file) {
            build_target = this.config.buildTarget();

            foreach (build_target as build_id => build_info) {
                // todo especially check here for multiple view dir support
                foreach (this.config.storeView() as key => value) {
                    if (is_string(key)) {
                        // key = path, value = namespace
                        path = key;
                    } else {
                        // value = path, no namespace
                        path = value;
                    }
                    if (realpath(path + '/' + build_info['view']) === view_file) {
                        deleted = this.delete(build_info['static'], type, verbose);
                        unset(this.builded[build_id]);
                        id_changed = build_id;
                        changed = true;
                        break;
                    }
                }
            }
        }*/

        if(deleted && changed) {
            fs.writeFile(this.config.storeBuildedInfo(), JSON.stringify(this.builded), (err) => {
                if(err) {
                    console.error('BuildedInfo file can not be saved.');
                }
            });
        }
        return id_changed;
    }

    /**
     * Deletes all already builded files
     *
     * @param {boolean} verbose error messages are printed no matter how but success messages only when verbose
     */
    clean(verbose = false) {
        for(let id in this.builded) {
            if(this.builded.hasOwnProperty(id)) {
                this.invalidate(id, false, false, 'static', verbose);
            }
        }
    }

    /**
     * @param        file
     * @param {string} type         is just for error message
     * @param {boolean}   show_success shows also success messages when true
     *
     * @return true
     */
    delete(file, type = '', show_success = false) {
        try {
            fs.unlinkSync(this.config.storeBuild() + file);

            if(show_success) {
                console.error('FormantaBlocks: deleted `' + type + '` - file: `' + file + '`');
            }
            return true;
        } catch(e) {
            console.error('FormantaBlocks: can not delete `' + type + '` - file: `' + file + '`');
            return false;
        }
    }

    /**
     * Build all files defined in the config
     *
     * @returns {Promise}
     */
    build() {
        let to_build = this.config.buildTarget();
        let building = [];
        for(let build_id in to_build) {
            if(to_build.hasOwnProperty(build_id)) {
                building.push(this.render(build_id, to_build[build_id]));
            }
        }
        return Promise.all(building);
    }
};