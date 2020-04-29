/**
 * @type {TwigLoader}
 */
const TwigLoader = require('./Twig/TwigLoader');
/**
 * @type {TwigEnvironment}
 */
const TwigEnvironment = require('./Twig/TwigEnvironment');

/**
 * @type {module.Renderer}
 */
module.exports = class Renderer {
    /**
     * @param {module.ConfigView} config
     */
    constructor(config) {
        /**
         * @type {module.ConfigView}
         */
        this.config = config;

        /**
         * Data that should be inserted the template
         *
         * @type {Array}
         */
        this.tpl_data = [];


        // todo: read namespaces in
        /**
         * @type {TwigEnvironment}
         */
        this.twig_env = new TwigEnvironment({
            debug: this.config.debug(),
            // negotiating autoReload (e.g. in PHP `autoreload = true` doesn't cache, so in JS `autoreload = true` should turn cache off
            cache: this.config.storeCache(),
        });
        /**
         * @type {TwigLoader}
         */
        this.twig_loader = new TwigLoader();
        this.twig_env.extend(this.twig_loader.registerLoader());

        let view_list = this.config.storeView();
        for(let key in view_list) {
            if(view_list.hasOwnProperty(key)) {
                let tmp_val = view_list[key];

                if(isNaN(key * 1)) {
                    // some trick to check if the key is truly a string

                    // key = path, value = namespace
                    this.twig_loader.addPath(key, tmp_val);
                } else {
                    // value = path, no namespace
                    this.twig_loader.addPath(tmp_val);
                }
            }
        }
    }

    /**
     * Assign a Value that will be pushed into the template
     * fluent interface return
     *
     * @param key
     * @param val
     *
     * @return module.Renderer
     */
    assign(key, val) {
        this.tpl_data[key] = val;
        return this;
    }

    /**
     * @todo implement equivalent to PHP assignByRef
     * @param key
     * @param val
     */
    assignByRef(key, val) {
        console.error('Renderer.assignByRef is not implemented in NodeJS');
        return this.assign(key, val);
    }

    /**
     * Renders the template and injects the values into the global template data
     *
     * @param       template
     * @param {Object} value
     *
     * @return Promise<string>
     */
    render(template, value = []) {
        return this.twig_env.load(template).then((/**Twig.Template*/tpl) => {
            return tpl.render(Object.assign(this.tpl_data, value));
        });
    }
};
