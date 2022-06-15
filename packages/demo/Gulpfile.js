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
            style: isDev ? '*.scss' : '**/*.scss',
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

console.log('isDevisDevisDevisDevisDevisDevisDev', isDev);
// for infos check `create-amp-page` docs or typings/inline-doc!
const tasks = ampCreator({
    port: port,
    open: '/demo',
    dist: 'build',
    srcMedia: 'src/media',
    distMedia: 'media',
    minifyHtml: false,
    cleanInlineCSS: false,
    pages: pages,
    collections: [{
        fm: (file) => 'src/data/' + path.basename(file).slice(0, '.twig'.length * -1) + '.md',
        tpl: 'src/html/pages/*.twig',
        base: '',
        pageId: 'demo',
    }],
    data: {},
    sassConfig: {
        // postImport: !isDev,
        // postNano: !isDev,
        // postPrefix: !isDev,
    },
    fmMap: (data, files) => {
        const pageId = files.pageId;
        const pageEnv = isDev ? 'local' : 'prod';
        const {
            pagePath, pageBase, urlMap,
        } = getPageInfo(files, urls, pageId, pageEnv);
        const {title, description, lang, ...attr} = data.attributes;
        return {
            ...attr,
            pageId: pageId,
            head: {
                title: title,
                description: description,
                lang: lang,
            },
            links: {
                canonical: pageBase + pagePath,
                origin: pageBase,
                cdn: isDev ? 'http://localhost:' + port + '/' : pageBase,
            },
            request: {
                path: pagePath,
                urlMap,
            },
        };
    },
    twig: {
        functions: [],
    },
    watchFolders: {
        twig: ['src/data/**/*.json', 'src/data/**/*.md'],
        sass: [
            // 'node_modules/@formanta/sass/**/*.scss',
            '../formantasass/**/*.scss',
        ],
        media: [],
    },
    prettyUrlExtensions: ['html'],
});
Object.keys(tasks).forEach(taskName => gulp.task(taskName, tasks[taskName]));
