'use strict'
const twig = require('gulp-twig')
const fs = require('fs')
const colors = require('colors/safe')
const autoprefixer = require('autoprefixer')
const postcssImport = require('postcss-import')
const browsersync = require('browser-sync').create()
const cssnano = require('cssnano')
const del = require('del')
const {series, parallel, ...gulp} = require('gulp')
const replace = require('gulp-replace')
const imagemin = require('gulp-imagemin')
const newer = require('gulp-newer')
const postcss = require('gulp-postcss')
const sass = require('gulp-sass')
const plumber = require('gulp-plumber')
const logger = require('gulplog')
const gulpCopy = require('gulp-copy')
const historyApiFallback = require('connect-history-api-fallback')
const tildeImporter = require('node-sass-tilde-importer')

module.exports = function({
                              paths,
                              port,
                              prettyUrlExtensions,
                              historyFallback,
                              serveStaticMiddleware = [],
                          }) {
    function browserSync(done) {
        browsersync.init({
            open: false,
            notify: false,
            ghostMode: false,
            server: {
                baseDir: paths.dist,
                serveStaticOptions: {
                    extensions: prettyUrlExtensions,
                },
                middleware: [
                    ...(historyFallback ? [historyApiFallback({
                        index: historyFallback,
                    })] : []),
                    ...serveStaticMiddleware,
                ],
            },
            port: port,
        })
        done()
    }

    function clean() {
        return del([paths.dist])
    }

    function copyFactory(copyInfo) {
        return function copy() {
            return gulp
                .src(copyInfo.src)
                .pipe(browsersync.stream())
                .pipe(gulpCopy(paths.dist, {prefix: copyInfo.prefix}))
        }
    }

    function images() {
        return gulp
            .src(paths.media + '/**/*')
            .pipe(newer(paths.dist + '/' + paths.distMedia))
            .pipe(
                imagemin([
                    imagemin.gifsicle({interlaced: true}),
                    imagemin.mozjpeg({progressive: true}),
                    imagemin.optipng({optimizationLevel: 5}),
                    imagemin.svgo({
                        plugins: [
                            {
                                removeViewBox: false,
                                collapseGroups: true,
                            },
                        ],
                    }),
                ]),
            )
            .pipe(gulp.dest(paths.dist + '/' + paths.distMedia))
            .pipe(browsersync.stream())
    }

    function cssFactory(fail = true) {
        return function css(done) {
            return gulp
                .src(paths.styles + '/**/*.scss')
                .pipe(plumber({
                    errorHandler: function(error) {
                        logger.error(colors.red('Error in css build:') + '\n' + error.message)
                        if(fail) throw error
                        done()
                    },
                }))
                .pipe(sass({
                    outputStyle: 'expanded',
                    importer: tildeImporter,
                }))
                .pipe(gulp.dest(paths.dist + '/' + paths.distStyles))
                .pipe(postcss([postcssImport(), autoprefixer(), cssnano()]))
                .pipe(replace('@charset "UTF-8";', ''))
                .pipe(gulp.dest(paths.dist + '/' + paths.distStyles))
                .pipe(browsersync.stream())
        }
    }

    function htmlFactory(requireCss = true) {
        return function html() {
            return gulp.src(paths.htmlPages + '/*.twig')
                .pipe(twig({
                    base: paths.html,
                    data: {
                        title: 'Gulp and Twig',
                        benefits: [
                            'Fast',
                            'Flexible',
                            'Secure',
                        ],
                    },
                }))
                .pipe(replace(/style amp-custom>/, function() {
                    if(!paths.stylesInject) return 'style amp-custom>'

                    let style = ''
                    try {
                        style = fs.readFileSync(paths.dist + '/' + paths.distStyles + '/' + paths.stylesInject, 'utf8')
                        if(Buffer.byteLength(style, 'utf8') > 75000) {
                            logger.error(colors.red('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes'))
                            if(requireCss) throw new Error('css file exceeds amp limit of 75kb')
                        } else {
                            logger.info('Style Size: ' + (Buffer.byteLength(style, 'utf8')) + ' bytes')
                        }
                    } catch(err) {
                        if(requireCss || err.code !== 'ENOENT') {
                            // only throw if other error then file not-found
                            throw err
                        }
                    }
                    return 'style amp-custom>\n' + style + '\n'
                }))
                .pipe(gulp.dest(paths.dist))
                .pipe(browsersync.stream())
        }
    }

    function watchFiles() {
        gulp.watch([paths.styles + '/**/*.(scss|sass)'], {ignoreInitial: false}, series(cssFactory(false), htmlFactory(false)))
        gulp.watch(paths.html + '/**/*.twig', {ignoreInitial: false}, htmlFactory(false))
        gulp.watch(paths.media + '/**/*', {ignoreInitial: false}, images)

        let copies = paths.copy
        if(!Array.isArray(copies)) {
            copies = [copies]
        }
        copies.forEach(copyOne => {
            // todo: add something like "sync-the-files" instead of copy for watch
            gulp.watch(copyOne.src, {ignoreInitial: false}, copyFactory(copyOne))
        })
    }

    const build =
        series(clean,
            parallel(
                ...(paths.copy ? [Array.isArray(paths.copy) ? paths.copy.map(copySingle => (
                    copyFactory(copySingle)
                )) : copyFactory(paths.copy)] : []),
                series(
                    cssFactory(true),
                    parallel(htmlFactory(true), images),
                ),
            ),
        )
    const watch = parallel(watchFiles, browserSync)

    return {
        images,
        clean,
        build,
        watch,
    }
}
