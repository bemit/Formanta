/**
 * @type {Promise}
 */
module.exports = new Promise((resolve, reject) => {
    /**
     * @type {Promise}
     */
    let boot = require('./boot');
    boot.then((config) => {
        const {Runner, Config, startTime, endTime} = require('@bemit/formantablocks');

        startTime('formanta--run');
        /**
         * @type {module.Runner}
         */
        let runner = new Runner(new Config(config));

        console.log('### Run');

        let url_root = '';
        if(runner.config.url) {
            url_root = ('undefined' !== typeof runner.config.url.ssl ? (runner.config.url.ssl ? 'https' : 'http') + '://' : '') + (runner.config.url.host ? runner.config.url.host : '') + (runner.config.url.port && false !== runner.config.url.port && 80 !== runner.config.url.port ? ':' + runner.config.url.port : '');
        }

        console.log('### Add Default Template Data (todo)');

        let demo_label = [
            'demo',
            'funky',
            'lit',
            'amazing',
            'little',
            'template template',
            'twiggy',
            'woody',
            'twiggididoo',
            'TwigJS or TwigPHP',
        ];

        runner.static_gen.renderer
            .assign('url',
                {
                    home: url_root,
                    asset: url_root,
                }
            )
            .assign('demo_label', demo_label[Math.floor((Math.random() * 10))]);

        endTime('formanta--run');

        resolve(runner);
    });
});