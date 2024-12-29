import { Liquid } from 'liquidjs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'
import express from 'express'
import yaml from 'yaml'
import { WebSocketServer, WebSocket } from 'ws'
import { Watcher } from '@formanta/blocks/Watcher'
import { HtmlOptions, HtmlOptionsDefaulted, render } from '@formanta/blocks/Tasks/HtmlTask'
import { DefaultedGeneralOptions, GeneralOptions } from '@formanta/blocks/Options'
import { compileStyle, StyleOptions } from '@formanta/blocks/Tasks/StyleTask'
import normalizePath from 'normalize-path'
import anymatch from 'anymatch'
import mergeWith from 'lodash.mergewith'
import {
    DependencyChanges, EntrypointModule,
    EntrypointTypes,
    isEntrypointModule,
    isPageEntrypointModule,
    ModulesGraph,
    OutputFile,
    PageEntrypointModule, StyleEntrypointModule,
} from '@formanta/blocks/ModulesGraph'
import { scanDir } from '@formanta/blocks/Utils/scanDir'
import { initCompiler } from 'sass'
import url from 'node:url'
import fs from 'node:fs/promises'
import { injectRefresh } from '@formanta/blocks/HtmlUtils/InjectRefresh'
import { renderSystemPage } from '@formanta/blocks/HtmlUtils/RenderSystemPage'

type DefaultedCompleteOptions =
    DefaultedGeneralOptions &
    HtmlOptionsDefaulted &
    StyleOptions

function defaultOptions(
    options: GeneralOptions & HtmlOptions & StyleOptions,
): DefaultedCompleteOptions {
    const mode = options.mode !== 'production' ? 'development' : 'production'
    const root = options.root || process.cwd()
    const base =
        options.base
            ? (
                (options.base.startsWith('/') ? '' : '/')
                + options.base +
                (options.base.endsWith('/') ? '' : '/')
            )
            : '/'
    return {
        ...options,
        mode: mode,
        root: root,
        // todo: allow site for dev? a `siteDev` maybe for local domain based preview? or use localhost?
        site: mode === 'production' && options.site ? options.site?.endsWith('/') ? options.site.slice(0, -1) : options.site : undefined,
        source: options.source || root,
        outputDir: options.outputDir || path.join(root, 'dist'),
        base: base,
        assetsDir:
            options.assetsDir
                ? options.assetsDir.startsWith('/') && options.assetsDir.endsWith('/')
                    ? options.assetsDir.slice(1, -1)
                    : options.assetsDir.startsWith('/')
                        ? options.assetsDir.slice(1)
                        : options.assetsDir.endsWith('/')
                            ? options.assetsDir.slice(0, -1)
                            : options.assetsDir
                : 'assets',
        htmlOptions: {
            ...options.htmlOptions || {},
            strategy: options.htmlOptions?.strategy || 'self',
            extensions: options.htmlOptions?.extensions || new Set(['liquid']),
        },
        minimize:
            typeof options.minimize === 'boolean'
                ? options.minimize
                : mode !== 'development',
    }
}

export function initGenerator(
    options: GeneralOptions & HtmlOptions & StyleOptions,
) {
    return generatorInternal(defaultOptions(options))
}

function generatorInternal(
    options: DefaultedCompleteOptions,
) {
    const {
        source,
        outputDir,
    } = options
    if (!options.htmlOptions.extensions.size) {
        throw new Error('Min. 1 file ext. must be specified in "options.htmlOptions.extensions"')
    }

    const directories = {
        templates: path.resolve(source, 'templates'),
        data: path.resolve(source, 'data'),
        public: path.resolve(source, 'public'),
        styles: path.resolve(source, 'styles'),
    }

    const directoriesTemplate = {
        pages: path.resolve(directories.templates, 'pages'),
        partials: path.resolve(directories.templates, 'includes'),
        layouts: path.resolve(directories.templates, 'layouts'),
    }

    const newEngine = (
        {
            cache = false,
        },
        modulesGraph: ModulesGraph,
    ) => {
        const engine = new Liquid({
            root: directoriesTemplate.pages,
            // todo: support additional partials and layouts for composition
            partials: directoriesTemplate.partials,
            layouts: directoriesTemplate.layouts,
            // extname: '.liquid',
            strictFilters: true,
            strictVariables: true,
            lenientIf: true,
            relativeReference: true,
            outputEscape: 'escape',
            // locale: 'en', // todo: does liquid require one engine per locale?!
            // dateFormat: '', // todo: does liquid require one engine per dateFormat?!
            // timezoneOffset: '', // todo: does liquid require one engine per timezoneOffset?!
            // todo: cache only gets the related keys, nothing about file path etc., which makes invalidation complex and unstable
            // cache: new CacheLRU(101),
            // cache: 20,
            cache: cache,
        })
        engine.registerFilter('get_link', function (value) {
            // use this to know where what is linked?
            // console.log('get_link is in:', this.context.getSync(['page', 'id']))

            // const modules = modulesGraph.getOutputs(value)
            // if (!modules?.size) throw new Error(`Unknown target for link: ${value}`)
            // if (modules.size > 2) throw new Error(`Too many targets for link: ${value}`)
            // const module = modules.values().next().value
            // if (!(module instanceof PageEntrypointModule)) throw new Error(`Invalid target for link, must be a page: ${value}`)

            // todo: trying all extensions isn't good, add a real "sitemap"
            const extensions = Array.from(options.htmlOptions.extensions)
            let module: PageEntrypointModule | undefined
            do {
                const ext = extensions.pop()
                if (!ext) continue
                module = modulesGraph.entrypoints.get(EntrypointTypes.Page)?.get(value + `.${ext}`) as PageEntrypointModule
            } while (!module && extensions.length)
            if (!module) throw new Error(`Unknown target for link: ${value}`)
            return normalizePath(path.join(options.base, module.outputFile.path))
        })
        options.setupEngine?.(engine, options)
        return engine
    }

    // todo: filters don't contain any stack of from which file they where called,
    //       thus not possible for knowing where e.g. the style was used
    //       {{ 'main' | style_asset }}
    // engine.registerFilter('style_asset', function (value, args) {
    //     console.log('style_asset', this)
    //     console.log('style_asset', this.context)
    //     console.log('value, args', value, args)
    //     return 'style_asset?!'
    // })

    const compiler = initCompiler()

    function couldBeSassEntrypoint(file: string) {
        const fileName = path.basename(file)
        return !fileName.startsWith('_')
    }

    async function buildInitialGraph() {
        const modulesGraph = new ModulesGraph()

        const pageFiles = await scanDir(directoriesTemplate.pages, {
            glob: ['**/*.(' + Array.from(options.htmlOptions.extensions).join('|') + ')'],
        })
        pageFiles.forEach((file) => {
            modulesGraph.addModule(new PageEntrypointModule(file))
        })

        const styleFiles = await scanDir(directories.styles, {
            glob: ['**/*.(scss|sass)'],
        })
        styleFiles.forEach((file) => {
            if (!couldBeSassEntrypoint(file.path)) {
                return
            }
            const styleModule = new StyleEntrypointModule({
                path: normalizePath(file.path),
                pathRel: normalizePath(file.pathRel),
            }, options)
            modulesGraph.addModule(styleModule)
        })

        // modulesGraph.log()

        return modulesGraph
    }

    async function loadDataFile(basePath: string) {
        const extensions: string[] = ['yaml', 'yml', 'json']
        for (const extension of extensions) {
            try {
                const fileContentRaw = await fs.readFile(path.join(directories.data, `${basePath}.${extension}`))
                const fileContent = yaml.parse(fileContentRaw.toString())
                return fileContent
            } catch (e) {
                if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
                    continue
                }
                throw e
            }
        }

        if (!options.disableWarnings?.missingDataFile) {
            console.warn(`No data file found for: ${basePath}`)
        }
        return undefined
    }

    function mergeData(globalData: unknown, pageData: unknown) {
        if (!pageData) return globalData
        // note: mergeWith mutates the first entry
        return mergeWith({}, globalData || {}, pageData, (_objValue: unknown, srcValue: unknown/*, _key: unknown, _object: unknown, _source: unknown, _stack: unknown*/) => {
            // let next = stack
            // while (next) {
            //     console.log('next', next)
            //     next = next.__data__
            // }
            if (Array.isArray(srcValue)) {
                // no merge for arrays
                // todo: support allowing merges for configured stack? as stack does not contain the `key`,
                //       it would not be possible to specify depth/root where nested keys can be merged
                return srcValue
            }
            return undefined
        })
    }

    return {
        clean: async () => {
            await fs.rm(outputDir, {recursive: true, force: true})
        },
        build: async () => {
            await fs.rm(outputDir, {recursive: true, force: true})

            const modulesGraph = await buildInitialGraph()
            const engine = newEngine({cache: true}, modulesGraph)

            const checkedDirs = new Set<string>()

            async function ensureDir(file: string) {
                const outputDirRel = path.dirname(file)
                if (!checkedDirs.has(outputDirRel)) {
                    await fs.mkdir(outputDirRel, {recursive: true})
                    checkedDirs.add(outputDirRel)
                }
            }

            try {
                await fs.cp(directories.public, outputDir, {
                    recursive: true,
                    force: true,
                })
            } catch (e) {
                if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
                    // noop
                } else {
                    throw e
                }
            }

            const timer = {
                start: () => {
                    if (typeof process === 'undefined' || typeof process.hrtime !== 'function') {
                        return new Date().getTime()
                    }
                    return process.hrtime()
                },
                end: (start: number | [number, number]): number => {
                    if (typeof start === 'number') {
                        return new Date().getTime() - start
                    }
                    const elapsedTimeExpr = process.hrtime(start)
                    return parseInt(((elapsedTimeExpr[0] * 1e9 + elapsedTimeExpr[1]) / 1e6).toFixed(0))
                },
            }

            const styleEntrypoints = modulesGraph.entrypoints.get(EntrypointTypes.Style)
            if (styleEntrypoints) {
                for (const module of styleEntrypoints.values() as MapIterator<EntrypointModule>) {
                    const startTime = timer.start()
                    const style = await compileStyle(compiler, options, module.path)
                    if ('error' in style) throw style.error
                    const outputFileRel = module.outputFile?.path as string
                    const outputFile = path.join(outputDir, options.base, outputFileRel)
                    await ensureDir(outputFile)
                    await fs.writeFile(outputFile, style.css)
                    console.log(`Generated ${JSON.stringify(outputFileRel)} - in ${timer.end(startTime)}ms - Size: ${(new TextEncoder().encode(style.css).length / 1024).toFixed(2)}kb`)
                }
            }

            const globalData = {
                current: await loadDataFile('_globals'),
            }

            const pagesEntrypoints = modulesGraph.entrypoints.get(EntrypointTypes.Page)
            if (pagesEntrypoints) {
                for (const module of pagesEntrypoints.values() as MapIterator<PageEntrypointModule>) {
                    const startTime = timer.start()
                    const pageData = await loadDataFile(
                        module.pathBase,
                    )
                    const mergedPageData = mergeData(globalData.current, pageData)
                    const [html] = await render({
                        engine,
                        options,
                        entrypoint: module,
                        context: mergedPageData as object,
                        modulesGraph: modulesGraph,
                    })

                    const outputFileRel =
                        options.htmlOptions.strategy === 'self'
                            ? module.outputFile.path === ''
                                ? 'index.html'
                                : module.outputFile.path + '.html'
                            : module.outputFile.path + '/index.html'
                    const outputFile = path.join(outputDir, options.base, outputFileRel)
                    await ensureDir(outputFile)
                    await fs.writeFile(outputFile, html)
                    console.log(`Generated ${JSON.stringify(module.pathBase)} - in ${timer.end(startTime)}ms - Size: ${(new TextEncoder().encode(html).length / 1024).toFixed(2)}kb`)
                }
            }

            // modulesGraph.log()
        },
        serve: async (
            {
                http = {port: 3000},
                ws = {port: 3001},
            }: {
                http?: {
                    port: number
                }
                ws?: {
                    port: number
                }
            } = {},
        ) => {
            const modulesGraph = await buildInitialGraph()
            const engine = newEngine({cache: false}, modulesGraph)

            const globalData = {
                generation: '-1',
                current: await loadDataFile('_globals'),
            }

            // todo: improve interop between watchMatchPatterns and watcher `.add/.unwatch`
            //       as chokidar no longer supports glob this would somehow work on folder level;
            //       - templates must be watched completely
            //       - pages must be watched completely
            //       - styles must be watched completely on "entrypoint level"
            //       - styles must support lazy dependencies add/unwatch
            //         - unwatch is critical, as this could remove entrypoints
            //         - workaround: only manage style dependencies if not below `.styles` directory
            const watchMatchPatterns: [matchers: string[], id: string][] = [
                [
                    [
                        // todo: support extensions?
                        normalizePath(directoriesTemplate.layouts) + '/**/*',
                        normalizePath(directoriesTemplate.partials) + '/**/*',
                    ],
                    'template',
                ],
                [
                    // todo: a page could be included in another page,
                    //       which isn't picked up for the "per page refresh",
                    //       thus as a convention and bad practice, it shouldn't be done
                    [
                        normalizePath(directoriesTemplate.pages)
                        + '/**/*'
                        + '.(' + Array.from(options.htmlOptions.extensions).join('|') + ')',
                        // data files
                    ],
                    'page',
                ],
                [
                    [
                        normalizePath(directories.data)
                        + '/**/*'
                        + '.(yml|yaml|json)',
                    ],
                    'data',
                ],
                [
                    [
                        normalizePath(directories.data)
                        + '/_globals.(yml|yaml|json)',
                    ],
                    'data-globals',
                ],
                [
                    [
                        normalizePath(directories.styles)
                        + '/**/*'
                        + '.(scss|sass|css)',
                    ],
                    'style',
                ],
            ]

            const watcher = Watcher()

            const watchPaths = [
                directories.templates,
                directories.styles,
                directories.data,
            ].map(p => normalizePath(p))

            watcher.add(watchPaths)

            const updateDependenciesWatcher = (dependencyChanges: DependencyChanges) => {
                if (dependencyChanges.added.length) {
                    watcher.add(
                        dependencyChanges.added
                            .filter(p => {
                                return !watchPaths.some(wp => p.startsWith(wp))
                            }),
                    )
                }
                if (dependencyChanges.unused.length) {
                    watcher.unwatch(
                        dependencyChanges.unused
                            .filter(p => {
                                return !watchPaths.some(wp => p.startsWith(wp))
                            }),
                    )
                }
            }

            const lastGeneration = {
                ts: 0,
                count: 0,
                toString() {
                    return `${lastGeneration.ts}.${lastGeneration.count}`
                },
            }

            watcher.watch((change) => {
                const changedPath = normalizePath(change.path)
                const ts = Date.now()
                // let changeGeneration = `${ts}.0`
                if (lastGeneration.ts === ts) {
                    lastGeneration.count += 1
                    // changeGeneration = `${ts}.${lastGeneration.count}`
                } else {
                    lastGeneration.ts = ts
                    lastGeneration.count = 0
                }
                const changeGeneration = lastGeneration.toString()

                const matchedScopes = watchMatchPatterns
                    // @ts-expect-error anymatch type is invalid
                    .filter(([matchers]) => anymatch(matchers, changedPath))
                    .map(([, id]) => id)

                console.debug(`Processing ${change.event} in ${normalizePath(path.relative(options.root, changedPath))} - as ${matchedScopes?.length ? matchedScopes.join(', ') : 'dependency'}`)

                if (matchedScopes.includes('page')) {
                    if (change.event === 'add') {
                        const pathRel = normalizePath(
                            path.relative(
                                directoriesTemplate.pages,
                                change.path,
                            ),
                        )
                        const module = modulesGraph.addModule(
                            new PageEntrypointModule({
                                path: changedPath,
                                pathRel: pathRel,
                                size: change.stats.size,
                                createdAt: change.stats.birthtimeMs,
                                updatedAt: change.stats.mtimeMs,
                            }),
                        )
                        console.debug(`Added page module ${module.pathRel}`)
                        reloadClients(module.outputFile.path)
                    } else if (change.event === 'change') {
                        const module = modulesGraph.getModule(changedPath)
                        if (module) {
                            console.debug(`Changed page module ${module.pathRel}`)
                            module.size = change.stats.size
                            module.updatedAt = change.stats.mtimeMs
                            if (isEntrypointModule(module)) {
                                module.generation = changeGeneration
                            }
                            if (isPageEntrypointModule(module)) {
                                reloadClients(module.outputFile.path)
                            }
                        }
                    } else if (change.event === 'unlink') {
                        const [module, dependencyChanges] = modulesGraph.removeModule(changedPath)
                        updateDependenciesWatcher(dependencyChanges)
                        if (module) {
                            console.debug(`Removed page module ${module.pathRel}`)
                            if (isPageEntrypointModule(module)) {
                                reloadClients(module.outputFile.path)
                            }
                        }
                    }
                }

                if (matchedScopes.includes('data-globals')) {
                    // todo: for remote data, which could be cancellable, it would be good to support storing e.g.
                    //       abort controller and then abort it, while changeGeneration is especially needed for module based client updates
                    globalData.generation = changeGeneration
                    loadDataFile('_globals')
                        .then((globals) => {
                            if (globalData.generation !== changeGeneration) return
                            globalData.current = globals
                        })
                }

                if (matchedScopes.includes('template') || matchedScopes.includes('data')) {
                    // todo: optimize `data` entrypoint-dependencies referencing,
                    //       as a data file could exist before template and vice versa its very complex to know which belong to which,
                    //       clearing all entrypoints for the moment
                    const pagesEntrypoints = modulesGraph.entrypoints.get(EntrypointTypes.Page)
                    if (pagesEntrypoints) {
                        for (const module of pagesEntrypoints.values() as MapIterator<PageEntrypointModule>) {
                            module.generation = changeGeneration
                            reloadClients(module.outputFile.path)
                        }
                    }
                }

                if (matchedScopes.includes('style')) {
                    if (change.event === 'add') {
                        if (couldBeSassEntrypoint(changedPath)) {
                            const pathRel = normalizePath(
                                path.relative(
                                    directories.styles,
                                    change.path,
                                ),
                            )
                            const styleModule = new StyleEntrypointModule({
                                path: changedPath,
                                pathRel: pathRel,
                                size: change.stats.size,
                                createdAt: change.stats.birthtimeMs,
                                updatedAt: change.stats.mtimeMs,
                            }, options)
                            modulesGraph.addModule(styleModule)
                        }
                    }
                }

                if (!matchedScopes.includes('page') && !matchedScopes.includes('template') && !matchedScopes.includes('data')) {
                    if (change.event === 'unlink') {
                        const [, dependencyChanges] = modulesGraph.removeModule(changedPath)
                        updateDependenciesWatcher(dependencyChanges)
                    }

                    modulesGraph
                        .findUsages(changedPath)
                        .forEach(module => {
                            if (module && isEntrypointModule(module)) {
                                module.generation = changeGeneration
                            }
                            if (module && isPageEntrypointModule(module)) {
                                reloadClients(module.outputFile.path)
                            }
                        })
                }

                // modulesGraph.log()
            })

            const runId =
                crypto
                    .createHash('sha256')
                    .update(Date.now().toString())
                    .digest('hex')
                    .slice(0, 16)

            const wss = new WebSocketServer({port: ws.port})
            const clients = new Map<string, Set<WebSocket>>()

            function reloadClients(slug: string) {
                const clientSet = clients.get(slug)
                if (clientSet) {
                    for (const client of clientSet) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({event: 'reload', runId}))
                        }
                    }
                }
            }

            const app = express()

            app.use(express.static(directories.public))

            app.get('/*', async (req, res) => {
                // todo: support trailingSlash strategy for redirect on dev
                if (
                    req.path !== options.base
                    && !req.path.startsWith(options.base === '/' ? options.base : options.base + '/')
                ) {
                    res
                        .status(404)
                        .send(
                            injectRefresh(renderSystemPage({
                                title: 'Not under base',
                            }), req.path.slice(1), ws, runId),
                        )
                    return
                }

                const slug =
                    req.path.endsWith('/')
                        ? req.path.slice(options.base.length, -1)
                        : req.path.slice(options.base.length)

                const pagesEntrypoints = modulesGraph.entrypoints.get(EntrypointTypes.Page)
                if (!pagesEntrypoints?.size) {
                    res
                        .status(404)
                        .send(
                            injectRefresh(renderSystemPage({
                                title: 'No pages found',
                                // todo: add an dev api to init e.g. `index.liquid`?
                                content: `<blockquote><p>To get started create the first template in:</p><code>${path.join(directories.templates, 'index.liquid')}</code></blockquote>`,
                                severity: 'info',
                            }), slug, ws, runId),
                        )
                    return
                }

                const outputFileModules = modulesGraph.getOutputs(slug)

                if (!outputFileModules) {
                    res
                        .status(404)
                        .send(
                            injectRefresh(renderSystemPage({
                                title: 'Not Found',
                            }), slug, ws, runId),
                        )
                    return
                }

                if (outputFileModules.size > 1) {
                    res
                        .status(500)
                        .send(
                            injectRefresh(renderSystemPage({
                                title: 'Conflicting Outputfiles',
                                content: `
                                    <p>Found ${outputFileModules.size} entrypoints for the same path, can't decide which to serve:</p>
                                    <pre><code>${Array.from(outputFileModules).map(f => f.path).join('\n')}</code></pre>
                                `,
                            }), slug, ws, runId),
                        )
                    return
                }

                const module = outputFileModules.values().next().value
                const outputFile = module?.outputFile
                if (!outputFile) {
                    res
                        .status(501)
                        .send(
                            injectRefresh(renderSystemPage({
                                title: 'No Output File',
                            }), slug, ws, runId),
                        )
                    return
                }

                if (!outputFile.generation || module.generation !== outputFile.generation) {
                    if (!module.generation) {
                        module.generation = lastGeneration.toString()
                    }
                    try {
                        let generation: string
                        let cache: OutputFile['cache']
                        let error: unknown
                        let usedDependencies: string[]
                        // note: everything inside the loop should be side effect free
                        //       and only once it ends, the results must be applied
                        do {
                            generation = module.generation
                            // todo: dedupe with checking if already exists/is in progress
                            //       when result were discarded due to changed `generation` during generating
                            if (isPageEntrypointModule(module)) {
                                const pageData = await loadDataFile(
                                    module.pathBase,
                                )
                                const mergedPageData = mergeData(globalData.current, pageData)
                                const [html, usedDependenciesTmp] = await render({
                                    engine,
                                    options,
                                    entrypoint: module,
                                    context: mergedPageData as object,
                                    modulesGraph: modulesGraph,
                                })
                                usedDependencies = usedDependenciesTmp
                                cache = {
                                    contentType: 'text/html',
                                    content: html,
                                }
                            } else if (module.entrypointType === EntrypointTypes.Style) {
                                const style = await compileStyle(compiler, options, module.path)
                                usedDependencies =
                                    // note: dependencies include the entrypoint itself
                                    style.loadedUrls
                                        .filter(f => f.protocol === 'file:')
                                        .map(f => normalizePath(url.fileURLToPath(f)))

                                if ('error' in style) {
                                    error = style.error
                                } else {
                                    cache = {
                                        content: style.css,
                                        contentType: 'text/css',
                                    }
                                }
                            } else {
                                throw new Error(`Unknown entrypoint type: ${module.entrypointType}`)
                            }
                        } while (module.generation !== generation)

                        outputFile.generation = generation
                        outputFile.cache = cache
                        const dependencyChanges = modulesGraph.patchDependencies(module.path, ...usedDependencies)
                        updateDependenciesWatcher(dependencyChanges)
                        if (error) {
                            throw error
                        }
                    } catch (e) {
                        console.error(`Error Generating Output for ${module.path}`, e)
                        res
                            .status(500)
                            .send(
                                injectRefresh(renderSystemPage({
                                    title: 'Error Generating Output',
                                    content: `<pre style="margin: 0"><code>${e instanceof Error ? e.message : JSON.stringify(e, undefined, 4)}</code></pre>`,
                                }), slug, ws, runId),
                            )
                        return
                    }
                }

                if (!outputFile.cache) {
                    res
                        .status(502)
                        .send(
                            injectRefresh(renderSystemPage({
                                title: 'Empty Output',
                            }), slug, ws, runId),
                        )
                    return
                }

                if (outputFile.cache.contentType === 'text/html') {
                    res.type(outputFile.cache.contentType).send(
                        injectRefresh(outputFile.cache.content, slug, ws, runId, outputFile.generation),
                    )
                } else {
                    res.type(outputFile.cache.contentType).send(
                        outputFile.cache.content,
                    )
                }
            })

            wss.on('connection', (client, req) => {
                const url = new URL(req.url || '', `http://${req.headers.host}`)
                const slug = url.pathname.slice(1) // slug is path without '/'

                if (!clients.has(slug)) clients.set(slug, new Set())

                const outputFileModules = modulesGraph.getOutputs(slug)
                const module = outputFileModules?.values().next().value
                const outputFile = module?.outputFile

                clients.get(slug)!.add(client)
                client.send(JSON.stringify({
                    event: 'sync',
                    runId: runId,
                    generationId: outputFile?.generation || null,
                }))

                client.on('close', () => {
                    clients.get(slug)!.delete(client)
                })
            })

            const server = app.listen(http.port, () => {
                console.log(`Server running at http://localhost:${http.port}`)
            })

            process.on('SIGINT', async () => {
                console.log('Shutting down...')
                await Promise.allSettled([
                    new Promise<void>((resolve, reject) => wss.close(err => err ? reject(err) : resolve())),
                    new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())),
                    watcher.close(),
                ])
                process.exit(0)
            })
        },
    }
}
