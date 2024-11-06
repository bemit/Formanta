import { NodePackageImporter, Compiler, CompileResult, Exception } from 'sass'
import postcss from 'postcss'
// import postcssImport from 'postcss-import'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import type { Options } from 'sass'
import type { GeneralOptions } from '@formanta/blocks/Options'
import { SassTildeImporter } from '@formanta/blocks/SassUtils/SassTildeImporter'

export interface StyleOptions extends GeneralOptions {
    sassOptions?: Options<'sync'>
}

export type StyleResult =
    {
        css: string
        sourceMap?: { toString: () => string }
        loadedUrls: URL[]
    } |
    {
        error: unknown
        loadedUrls: URL[]
    }

export async function compileStyle(
    compiler: Compiler,
    options: StyleOptions,
    sassSheet: string,
): Promise<StyleResult> {
    const sourceMaps = options.sourceMaps || options.mode === 'development'
    let result: CompileResult
    try {
        result = compiler.compile(
            sassSheet,
            {
                style: options.minimize ? 'compressed' : 'expanded',
                charset: false,
                // using loadPaths as a simple fallback for any module,
                // enables `@import '@formanta/sass/meta';` instead of:
                // removed tildeImporter: `@import '~@formanta/sass/meta';`
                // new NodePackageImporter requires `@use 'pkg:*'` syntax, which heavily relies on ESM "exports" in packages
                loadPaths: ['node_modules'],
                sourceMap: sourceMaps,
                importers: [
                    new NodePackageImporter(),
                    // An importer that redirects relative URLs starting with "~" to `node_modules`.
                    // to support @import/@use of `.css` files
                    SassTildeImporter,
                ],
                ...options.sassOptions || {},
            },
        )
    } catch (e) {
        // todo: only the failed file is known, not which imports led to the file,
        //       thus refresh can't work if fixing something in between, only if the entrypoint or the failed file are changed
        return {
            error: e,
            loadedUrls: e instanceof Exception && e.span.url ? [e.span.url] : [],
        }
    }

    return postcss([
        autoprefixer,
        // `import` resolving should no longer be needed, BUT could still be useful for DartSass v3,
        // when `import` behaves only like css `import` and does no longer do module resolving
        // postcssImport(),
        ...options.minimize ? [cssnano] : [],
    ])
        .process(
            result.css,
            // todo: `from` is used for source-map generation and browserlist lookup
            {
                // from: undefined,
                from: sassSheet,
                map: sourceMaps ? {
                    // create inline source maps for dev
                    // todo: create separate for production
                    inline: true,
                    // absolute: false,
                    prev: result.sourceMap,
                } : false,
            },
        )
        .then((postResult) => {
            // todo: support non-inline source maps
            // console.log('result.map', result.map?.toString())
            // todo: include urls loaded by postcss (e.g. when using postcss-import)
            return {
                ...postResult,
                loadedUrls: result.loadedUrls,
            }
        })
        .catch(e => {
            console.error(e)
            return {
                css: result.css,
                loadedUrls: result.loadedUrls,
                sourceMap: {
                    ...result.sourceMap,
                    toString() {
                        // todo: based on a comment https://github.com/sass/dart-sass/issues/1594#issuecomment-1013208452
                        //       but for inline-sourceMap, validate if or how that works when stored separately
                        const sm = JSON.stringify(result.sourceMap)
                        const smBase64 = (Buffer.from(sm, 'utf8') || '').toString('base64')
                        return '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,' + smBase64 + ' */'
                    },
                },
            }
        })
}
