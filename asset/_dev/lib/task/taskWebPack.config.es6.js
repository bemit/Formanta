const path = require('path');
const webpack = require('webpack');

const TerserPlugin = require('terser-webpack-plugin');

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
    optimization: {
        minimizer: [new TerserPlugin()]
    },
    plugins: []
};
