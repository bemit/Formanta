# Create AMP Page

Fast development of fast pages.

Gulp tasks for a Twig template based static side generator, optimized for building [AMP](https://amp.dev) pages.

Support for Sass, CSS optimizing, media file compressing, copy tasks, Twig global and per-page data with JSON or front-matter, browsersync with custom static server middlewares.

## Quick Start

Create a `Gulpfile.js` and paste the following content in it:

```js
'use strict'
const path = require('path')
const {ampCreator} = require('create-amp-page')

module.exports = ampCreator({
    // yeah, the port
    port: 4488,
    paths: {
        // folder of .scss/.sass files
        styles: 'src/styles',
        // injects this stylesheet into `<style amp-custom/>`, optional
        // relative name to style dist folder
        stylesInject: 'main.css',
        // root folder of .twig templates
        html: 'src/html',
        // root folder of templates that will be used as pages
        htmlPages: 'src/html/pages',
        // root folder of media files that should be processed
        media: 'src/media',

        // folders / glob that should be copied into dist, optional
        copy: [
            {src: ['./src/api/*'], prefix: 1},
            {src: ['./public/*'], prefix: 2},
        ],

        // folder where everything is served,
        // also the root of static server
        dist: 'build',
        // relative to `dist`, where media files are saved
        distMedia: 'media',
        // relative to `dist`, where CSS files are saved
        distStyles: 'styles',

        // for SPA / PWA, optional
        // historyFallback: '/default.html',
    },
    // settings used for `gulp-twig` and related plugins
    twig: {
        // data passed globally to the twig templates, optional
        data: {},

        // receives the absolute path to the template file, optional
        // must return path to JSON file to use as data for this template
        json: (file) => './src/data/' + path.basename(file).replace('.twig', '') + '.json',

        // receives the absolute path to the template file, must return path to frontmatter file, optional
        fm: (file) => './src/data/' + path.basename(file).replace('.twig', '') + '.md',
        // receives the front matter to map it to template values, required when `fm` exists, otherwise not used
        fmMap: (data) => ({
            head: {
                title: data.attributes.title,
                description: data.attributes.description,
            },
        }),
        
        // merge function to produce data from multiple sources for twig, optional
        // used for merging the three twig data sources: global (`twig.data`), `twig.json` and `twig.fm`
        // like let data = customMerge(globalTwigData, jsonData); data = customMerge(data, fmData);
        // customMerge: (data1, data2) => ({...data1, ...data2}),
    },
    // which extensions should be removed for prettier URLs, like `/contact` instead of `/contact.html`
    prettyUrlExtensions: ['html'],
    // middlewares passed to serve-static
    // serveStaticMiddleware: [],
})

```

Add those scripts into `package.json`:

```json
{
    "scripts": {
        "tasks": "gulp --tasks",
        "start": "gulp watch",
        "build": "gulp build"
    }
}
```

Create `postcss.config.js` with:

```js
module.exports = {
    plugins: [
        require('cssnano')({
            preset: ['default', {
                discardComments: {
                    removeAll: true,
                },
            }],
        }),
    ],
}
```

Add `src` folders etc., run `npm start` and happy coding!

## License

This project is free software distributed under the **MIT License**.

See: [LICENSE](LICENSE).

© 2020 [Michael Becker](https://mlbr.xyz)

### Contributors

By committing your code/creating a pull request to this repository you agree to release the code under the MIT License attached to the repository.
