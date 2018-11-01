/**
 * @param filename
 * @param watch
 * @param outputStyle
 * @return {Promise<void>}
 */
module.exports.handleSass = async (filename, watch = true, outputStyle = 'nested') => {
    let sass = require('node-sass');
    return sass.render({
        file: filename,
        // true for no sourcemaps
        omitSourceMapUrl: false,
        // floating point precision in css output
        precision: 5,
        // helps to load @import statements
        includePaths: [],
        // css output: nested, expanded, compact, compressed
        outputStyle: outputStyle,
        importer: (url, prev, done) => {
            console.log(url + ' # ' + prev + ' # ' + done);
        }
    });
};