'use strict'
const {ampCreator} = require('create-amp-page')

module.exports = ampCreator({
    // yeah, the port
    port: 4488,
    paths: {
        // folder of .scss/.sass files
        styles: 'src/styles',
        // if set, injects this stylesheet into `<style amp-custom/>`
        stylesInject: 'main.css',
        // root folder of .twig templates
        html: 'src/html',
        // root folder of templates that will be used as pages
        htmlPages: 'src/html/pages',
        // root folder of media files that should be processed
        media: 'src/media',

        // folders / glob that should be copied into dist
        copy: [
            {src: ['./src/api/*',], prefix: 1},
            {src: ['./public/*',], prefix: 2},
        ],

        // folder where everything is served,
        // also the root of static server
        dist: 'build',
        // relative to `dist`, where media files are saved
        distMedia: 'media',
        // relative to `dist`, where CSS files are saved
        distStyles: 'styles',

        // for SPA / PWA
        // historyFallback: '/default.html',
    },
    prettyUrlExtensions: ['html'],
    // serveStaticMiddleware: [],
})
