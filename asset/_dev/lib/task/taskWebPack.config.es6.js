const path = require('path');

module.exports = {
    module: {
        rules: [/*{
            enforce: 'pre',
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: 'eslint-loader'
        }, */{
            // Babel ES6
            test: /\.js$/,
            use: [{
                loader: 'babel-loader',
                options: {
                    plugins: [
                        'transform-es2015-template-literals',
                        'es6-promise'
                    ],
                    presets: [
                        ['@babel/preset-env']
                    ]
                }
            }]
        }]
    },
    plugins: [
        //new webpack.optimize.UglifyJsPlugin(),
    ]
};
