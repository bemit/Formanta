import path from 'path';
import gulp from 'gulp';
import {ampCreator, getPageInfo} from 'create-amp-page';

const port = process.env.PORT || 4488;
const isDev = process.env.NODE_ENV === 'development';

const urls = {
    demo: {
        local: {base: 'http://localhost:' + port + '/demo/'},
        prod: {base: 'https://formanta.bemit.codes/'},
    },
};

const pages = {
    demo: {
        paths: {
            styles: 'src/styles',
            stylesInject: 'main.css',
            style: '*.scss',
            html: 'src/html',
            copy: [
                {src: ['src/api/*'], prefix: 1},
                {src: ['public/*'], prefix: 2},
                {src: ['public/**/*'], prefix: 1},
            ],
            dist: 'build/demo',
            distStyles: 'styles',
        },
    },
};

// for infos check `create-amp-page` docs or typings/inline-doc!
const tasks = ampCreator({
    port: port,
    dist: 'build',
    srcMedia: 'src/media',
    distMedia: 'media',
    minifyHtml: false,
    cleanInlineCSS: false,
    //cleanInlineCSSWhitelist: ['#toggle-inspect', '.demo'],
    pages: pages,
    collections: [{
        //data: 'src/data',
        fm: (file) => 'src/data/' + path.basename(file).slice(0, '.twig'.length * -1) + '.md',
        tpl: 'src/html/pages/*.twig',
        pagesByTpl: true,
        base: '',
        pageId: 'demo',
    }],
    cssInjectTag: '<style>',
    twig: {
        data: {},
        fmMap: (data, files) => {
            const pageId = files.pageId;
            const pageEnv = isDev ? 'local' : 'prod';
            const {
                pagePath, pageBase, relPath,
            } = getPageInfo(files, urls, pageId, pageEnv);
            return {
                pageId: pageId,
                head: {
                    title: data.attributes.title,
                    description: data.attributes.description,
                    lang: data.attributes.lang,
                },
                links: {
                    canonical: pageBase + pagePath,
                    origin: pageBase,
                    cdn: isDev ? 'http://localhost:' + port + '/' : pageBase,
                },
            };
        },
        functions: [],
    },
    watchFolders: {
        twig: ['src/data/**/*.json', 'src/data/**/*.md'],
        sass: [
            '../formantasass/**/*.scss',
        ],
        media: [],
    },
    prettyUrlExtensions: ['html'],
});
Object.keys(tasks).forEach(taskName => gulp.task(taskName, tasks[taskName]));
