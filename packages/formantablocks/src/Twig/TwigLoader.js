const fs = require('fs');
const path = require('path');

/**
 * A FileSystem Twig template loader for TwigJS which implements the namespaces like TwigPHP
 */
class TwigLoader {
    constructor() {
        /**
         * All base-paths
         * @type {Array}
         */
        this.path_base = [];
        /**
         * all namespaced paths with `path: namespace`
         * @type {{}}
         */
        this.path_ns = {};
    }

    /**
     * @param path
     * @param namespace
     */
    addPath(path, namespace = false) {
        if(false === namespace) {
            this.path_base.push(path);
            return;
        }

        if('undefined' === typeof this.path_ns[namespace]) {
            this.path_ns[namespace] = [];
        }
        this.path_ns[namespace].push(path);
    }

    /**
     *
     * @param {Twig} twig
     * @param {Twig.Templates} templates
     * @param {string} location
     * @param {{}} params
     * @param {Function} callback
     * @param {Function} error_callback
     */
    load(twig, templates, location, params, callback, error_callback) {
        if(!fs || !path) {
            throw new twig.Error('Unsupported platform: Unable to load from file ' +
                'because there is no "fs" or "path" implementation');
        }

        params.path = params.path || location;

        const loadNs = (path_pure, fileLoader) => {
            let path_ns = [...this.path_base];
            const loadNsOne = (path_n) => {
                return fileLoader(path_n + '/' + path_pure);
            };
            loadNsOne(path_ns.shift()).then((success) => {
                if(false === success) {
                    loadNsOne(path_ns.shift());
                }
            });
        };

        const loadBase = (path_pure, fileLoader) => {
            let path_base = [...this.path_base];
            const loadBaseOne = (path_b) => {
                return fileLoader(path_b + '/' + path_pure);
            };

            return loadBaseOne(path_base.shift()).then((success) => {
                if(false === success) {
                    return loadBaseOne(path_base.shift());
                }
                return Promise.resolve();
            });
        };

        let {ns, path_pure} = TwigLoader.parsePath(params.path);

        if(params.async) {
            const loadFile = (path) => {
                return new Promise((resolve) => {
                    fs.stat(path, function(err, stats) {
                        if(err || !stats.isFile()) {
                            if(typeof error_callback === 'function') {
                                error_callback(new twig.Error('Unable to find template file ' + path));
                            }
                            resolve(false);
                        }
                        fs.readFile(path, 'utf8', TwigLoader.parseLoaded(params, templates, callback, error_callback));
                        resolve(true);
                    });
                });
            };

            if(false === ns) {
                loadBase(path_pure, loadFile);
            } else {
                if(this.path_ns[ns]) {
                    loadNs(path_pure, loadFile);
                } else {
                    console.error('!# FormantaBlocks.TwigLoader: namespace `' + ns + '` not found in registered views');
                }
            }

            // TODO: return deferred promise
            return true;
        }


        let pathBase;
        if(false === ns) {
            let path_base = [...this.path_base];

            pathBase = path_base.shift() + '/' + path_pure;

            try {
                if(!fs.statSync(pathBase).isFile()) {
                    pathBase = path_base.shift() + '/' + path_pure;
                }
            } catch(error) {
                //throw new twig.Error('Unable to find template file ' + params.path + '. ' + error);
            }
            try {
                if(!fs.statSync(pathBase).isFile()) {
                    throw new twig.Error('Unable to find template file ' + params.path);
                }
            } catch(error) {
                //throw new twig.Error('Unable to find template file ' + params.path + '. ' + error);
            }
        } else {
            // todo: support ns on sync
        }

        return TwigLoader.parseLoaded(params, templates, callback, error_callback)(undefined, fs.readFileSync(pathBase, 'utf8'));
    }

    /**
     * Parsing relative path to template into namespace and pure-path
     *
     * @todo implement absolute path
     * @param {string} path
     * @returns {{ns: boolean, path_pure: *}}
     */
    static parsePath(path) {
        let ns = false;
        let path_pure = path;

        let colon_pos = path.indexOf('::');
        if(-1 !== colon_pos) {
            if(colon_pos < path.indexOf('/')) {
                ns = path.substr(0, colon_pos);
                path_pure = path.replace(ns + '::', '');
            }
        } else if(0 === path.indexOf('@')) {
            let path_pos = path.indexOf('/');
            if(-1 !== path_pos) {
                ns = path.substr(1, (path_pos - 1));
                path_pure = path.replace('@' + ns + '/', '');
            }
        }
        return {
            ns,
            path_pure
        };
    }

    /**
     *
     * @param {{}} params
     * @param {Twig.Templates} templates
     * @param {Function} callback
     * @param {Function} error_callback
     * @returns {Function}
     */
    static parseLoaded(params, templates, callback, error_callback) {
        let precompiled = params.precompiled;
        let parser = templates.parsers[params.parser] || templates.parser.twig;

        return function(err, data) {
            if(err) {
                if(typeof error_callback === 'function') {
                    error_callback(err);
                }
                return;
            }

            if(precompiled === true) {
                data = JSON.parse(data);
            }

            params.data = data;
            //params.path = params.path;

            // template is in data
            let template = parser.call(templates, params);

            if(typeof callback === 'function') {
                callback(template);
            }

            return template
        };
    }

    /**
     *
     * @returns {Function}
     */
    registerLoader() {
        const loader = this;

        return (twig) => {
            if(!twig) {
                console.error('TwigLoader: twig to attach not set');
                return;
            }
            twig.Templates.registerLoader('fs', function(location, params, callback, error_callback) {
                return loader.load(twig, this, location, params, callback, error_callback);
            });
        };
    }
}

module.exports = TwigLoader;
