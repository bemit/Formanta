#!/usr/bin/env node
import { initGenerator } from '@formanta/blocks/Generator'
import path from 'node:path'
import url from 'node:url'

const argv = process.argv.slice(2)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

if (argv.includes('--help')) {
    process.exit(0)
}

const generator = initGenerator({
    mode: process.env.NODE_ENV,
    root: __dirname,
    // base: '/sub-path/',
    htmlOptions: {
        extensions: new Set(['liquid', 'html']),
    },
})

if (!argv[0] || argv[0] === 'serve') {
    await generator.serve({})
}

if (argv[0] === 'build') {
    await generator.build()
}

if (argv[0] === 'clean') {
    await generator.clean()
}
