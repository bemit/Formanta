# Create AMP Page

Fast development of fast pages.

Gulp tasks for a Twig template based static side generator, with support for Sass, media; optimized for building [AMP](https://amp.dev) pages.

## Quick Start

Create a `Gulpfile.js` and paste the following content in it:

```js
const {ampCreator} = require('create-amp-page')

// now the file exports the gulp tasks
module.exports = ampCreator({
    // yeah, the port
    port: 4488,
    paths: {
        // folder of .scss/.sass files
        styles: 'src/styles',
        // if set, injects this stylesheet into `<style amp-custom/>`
        // relative name to style dist folder
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

        // folder where everything is saved,
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
