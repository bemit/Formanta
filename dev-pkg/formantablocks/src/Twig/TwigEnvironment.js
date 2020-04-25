/**
 * Twig Wrapper
 */
class TwigEnvironment {
    constructor(option) {
        /**
         * @type {twig}
         */
        this.twig = require('twig');

        if(option) {
            this.twig.cache = option.cache || false;
            this.twig.debug = option.debug || false;
            this.twig.trace = option.trace || false;
        }
    }

    /**
     * @param {function} extending
     */
    extend(extending) {
        this.twig.extend(extending);
    }

    /**
     * @param template
     * @returns {Promise}
     */
    load(template) {
        return new Promise((resolve) => {
            return this.twig.twig({
                id: undefined,
                path: template,
                // base: __dirname, // not-used
                strict_variables: false,
                autoescape: true,
                allowInlineIncludes: false,
                rethrow: true,
                //debug: true, // overwritten with general
                //trace: true,
                //namespaces: [], // not-used
                async: true,
                //data: {} // not-used
                load: (template) => {
                    resolve(template);
                },
                error: (err) => {
                    console.error('!# Twig Error: ' + err);
                    resolve('');
                }
            });
        });
    }
}

module.exports = TwigEnvironment;