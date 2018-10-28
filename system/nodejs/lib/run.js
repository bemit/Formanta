module.exports = new Promise((resolve, reject) => {
    let boot = require('./boot');
    boot.then((config) => {

        const Runner = require('@bemit/formantablocks/Runner');
        const Config = require('@bemit/formantablocks/Config');
        let r = new Runner(new Config(config));
        console.log(r);
        resolve(r);
    });
});