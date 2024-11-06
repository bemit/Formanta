import { Drop, Liquid } from 'liquidjs'
import { minify } from 'html-minifier-terser'
import { DefaultedGeneralOptions, GeneralOptions } from '@formanta/blocks/Options'
import { EntrypointTypes, ModulesGraph, PageEntrypointModule } from '@formanta/blocks/ModulesGraph'
import normalizePath from 'normalize-path'
import path from 'node:path'

export interface HtmlOptions extends GeneralOptions {
    htmlOptions?: {
        extensions?: Set<string>
        strategy?: 'self' | 'index'
    }
}

export type HtmlOptionsDefaulted =
    DefaultedGeneralOptions &
    HtmlOptions &
    { htmlOptions: Required<Pick<NonNullable<HtmlOptions['htmlOptions']>, 'strategy' | 'extensions'>> }

export async function render(
    {
        engine,
        options,
        entrypoint,
        context,
        modulesGraph,
    }: {
        engine: Liquid
        options: HtmlOptionsDefaulted
        entrypoint: PageEntrypointModule
        context: object
        modulesGraph: ModulesGraph
    },
) {
    // todo: cache this at AssetModule, but stil won't cache things included by the template when rendering
    const parsedTemplate = engine.parseFileSync(
        entrypoint.pathRel,
        'root' as never,
    )

    const usedDependencies: string[] = []

    function toPath(relPath: string, absolute?: boolean) {
        const urlPath = normalizePath(path.join(options.base, relPath))
        if (absolute && options.site) {
            return options.site + urlPath
        }
        return urlPath
    }

    const request = {
        path: toPath(entrypoint.outputFile.path),
    }

    class SettingsDrop extends Drop {
        liquidMethodMissing(key: string | number): unknown {
            return options[key as keyof typeof options]
        }
    }

    class ActivePageDrop extends Drop {
        id() {
            return entrypoint.pathBase
        }

        path() {
            return toPath(entrypoint.outputFile.path)
        }

        canonical() {
            return toPath(entrypoint.outputFile.path, true)
        }

        valueOf() {
            // @ts-expect-error should exist
            return context.request?.path
        }
    }

    class AssetsProxyDrop extends Drop {
        readonly #scope: string

        constructor(scope: string) {
            super()
            this.#scope = scope
        }

        liquidMethodMissing(key: string): unknown {
            const module = modulesGraph.entrypoints.get(this.#scope)?.get(key)
            if (!module || !module.outputFile?.path) return undefined
            usedDependencies.push(module.path)
            return toPath(module.outputFile?.path)
        }
    }

    class AssetsDrop extends Drop {
        styles = new AssetsProxyDrop(EntrypointTypes.Style)

        liquidMethodMissing(key: string): unknown {
            const outputPath = options.assetsDir + '/' + key
            const modules = modulesGraph.getOutputs(outputPath)
            if (!modules) return undefined
            if (modules.size > 1) {
                throw new Error(`Conflicting Outputfiles for output: ${JSON.stringify(outputPath)}`)
            }
            const module = modules?.values().next().value
            if (!module) return undefined
            usedDependencies.push(module.path)
            return toPath(outputPath)
        }
    }

    const systemContext = {
        request,
        settings: new SettingsDrop(),
        assets: new AssetsDrop(),
        page: new ActivePageDrop(),
    }

    for (const reservedKey in systemContext) {
        if (reservedKey in context) {
            throw new Error(`Page data contains reserved key: ${reservedKey}`)
        }
    }

    let html: string = await engine.render(
        parsedTemplate,
        {
            ...context,
            ...systemContext,
        },
        {},
    )

    if (options.minimize) {
        html = await minify(
            html,
            {
                caseSensitive: true,
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                decodeEntities: true,
                minifyCSS: true,
                minifyJS: true,
                removeComments: true,
                removeEmptyElements: false,
                sortAttributes: false,
            },
        )
    }

    return [html, usedDependencies] as const
}
