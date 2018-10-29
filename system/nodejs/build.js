/**
 * @type {(function(): Promise<{runner:module.Runner, builded: Object}>)}
 */
let build = require('./lib/build');

build().then(({builded, runner = {}}) => {
    //console.log(builded);
});
