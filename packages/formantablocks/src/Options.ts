import { Liquid } from 'liquidjs'

export interface GeneralOptions {
    mode?: string | 'development' | 'production'
    /**
     * root directory
     */
    root?: string
    /**
     * directory folder of sources, default is `root`,
     * expects to contain:
     * `/public`
     * `/styles`
     * `/templates`
     * `/templates/includes`
     * `/templates/layouts`
     * `/templates/pages`
     */
    source?: string
    /**
     * directory to save build files, defaults to `<root>/dist`
     */
    outputDir?: string

    /**
     * domain used in production, to generate e.g. canonical links
     */
    site?: string
    /**
     * base path under which the page is hosted, defaults to `/`
     */
    base?: string
    /**
     * base path under which the build assets are hosted, defaults to `assets`
     */
    assetsDir?: string

    // todo: support granular settings for `inline-css` etc.?
    sourceMaps?: boolean

    minimize?: boolean

    setupEngine?: (engine: Liquid, options: DefaultedGeneralOptions) => void

    disableWarnings?: {
        missingDataFile?: boolean
    }
}

export type DefaultedGeneralOptions =
    GeneralOptions &
    { mode: 'development' | 'production' } &
    Required<Pick<GeneralOptions, 'root' | 'source' | 'outputDir' | 'base' | 'assetsDir'>>
