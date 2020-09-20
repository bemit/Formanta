export interface CopyInfo {
    // array of paths / glob patterns that will be copied
    src: string[]
    // how many pf the leading path segments should be removed
    prefix: number
}

export interface AmpCreatorOptions {
    paths: {
        // folder of .scss/.sass files
        styles: string
        // if set, injects this stylesheet into `<style amp-custom/>`
        // relative name to style dist folder
        stylesInject: string
        // root folder of .twig templates
        html: string
        // root folder of templates that will be used as pages
        htmlPages: string
        // root folder of media files that should be processed
        media: string
        // folders / glob that should be copied into dist
        copy: CopyInfo | CopyInfo[]
        // folder where everything is served,
        // also the root of static server
        dist: string
        // relative to `dist`, where media files are saved
        distMedia: string
        // relative to `dist`, where CSS files are saved
        distStyles: string
        // for SPA / PWA
        historyFallback?: string
    },
    // yeah, the port
    port: number
    // which extensions should be removed for prettier URLs, like `/contact` instead of `/contact.html`
    prettyUrlExtensions?: string[]
    // middlewares passed to serve-static
    serveStaticMiddleware?: Function[]
}

export function ampCreator(options: AmpCreatorOptions): {
    images: Function
    clean: Function
    build: Function
    watch: Function
}
