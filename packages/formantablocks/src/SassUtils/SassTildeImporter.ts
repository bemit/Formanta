import path from 'node:path'
import url from 'node:url'
import fsSync from 'node:fs'
import type { FileImporter } from 'sass'

export const SassTildeImporter: FileImporter<'sync'> = {
    findFileUrl(file, context) {
        if (
            !file.startsWith('~')
            || !context.containingUrl
        ) return null
        const filePath = file.slice(1)
        // todo: support manual setting base when containingUrl is unknown?
        let prevContextDir = path.dirname(url.fileURLToPath(context.containingUrl.toString()))
        let contextDir = prevContextDir
        let foundNodeModules = false
        do {
            foundNodeModules = fsSync.existsSync(path.join(contextDir, 'node_modules'))
            if (foundNodeModules) {
                // todo: this may require the `.sass`, `.scss`, `.css` fallback logic,
                //       atm. requires imports with file extension
                const testFilePath = path.join(contextDir, 'node_modules', filePath)
                if (fsSync.existsSync(testFilePath)) {
                    return url.pathToFileURL(testFilePath)
                }
            } else {
                prevContextDir = contextDir
                contextDir = path.dirname(contextDir)
            }
        } while (!foundNodeModules && prevContextDir !== contextDir)

        return null
    },
}
