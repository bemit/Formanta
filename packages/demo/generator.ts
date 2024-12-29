#!/usr/bin/env node
import { initGenerator } from '@formanta/blocks/Generator'
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'

const argv = process.argv.slice(2)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

if (argv.includes('--help')) {
    process.exit(0)
}

async function readSvg(importPath: string) {
    const fileUrl = await import.meta.resolve(importPath, import.meta.url)
    return fs.readFile(url.fileURLToPath(fileUrl), 'utf-8')
}

const generator = initGenerator({
    mode: process.env.NODE_ENV,
    root: __dirname,
    site: 'https://formanta.bemit.codes',
    htmlOptions: {
        extensions: new Set(['liquid', 'html']),
    },
    sassOptions: {
        loadPaths: [
            path.join(__dirname, 'node_modules'),
            path.join(__dirname, '../..', 'node_modules'),
        ],
        quietDeps: false,
        silenceDeprecations: [
            'import',
        ],
    },
    disableWarnings: {
        missingDataFile: true,
    },
    setupEngine: (engine) => {
        // engine.registerFilter('icon', {
        //     raw: true,
        //     handler: async (value, args) => {
        //         console.log('args', args /* color, size, style */)
        //         // const r = await readSvg('@material-design-icons/svg/filled/5k.svg')
        //         // console.log('r', r)
        //         // const r2 = await readSvg('@material-symbols/svg-400/rounded/5k.svg')
        //         const iconData = await readSvg(`@material-design-icons/svg/filled/${value}.svg`)
        //         return iconData
        //     },
        // })

        engine.registerTag('icon', {
            args: [] as [string, 'value' | 'var', unknown][],
            parse(tagToken) {
                // todo: support variables as iconName
                const match = tagToken.args.match(/^"([^"]+)"|'([^']+)'$/)
                if (!match) throw new Error('Invalid syntax for icon tag')

                this.iconName = match[1] || match[2]

                this.args = []

                const argsString = tagToken.args.replace(/^"([^"]+)"|'([^']+)'/, '').trim()

                const keyValueRegex = /(\w+)\s*:\s*("[^"]*"|'[^']*'|[0-9]+|true|false|nil|(\w+))/g
                let keyValueMatch

                while ((keyValueMatch = keyValueRegex.exec(argsString)) !== null) {
                    this.args.push([keyValueMatch[1], 'var', keyValueMatch[2]])
                }
            },
            async render(ctx) {
                // const iconName = await this.liquid.evalValue(this.iconName, ctx)
                const iconName = this.iconName
                // console.log('iconName', this.iconName, this.args)
                const args = this.args.reduce((
                    args: { [x: string]: unknown },
                    valueDef:
                        ['var', string, string] |
                        ['value', string, string | number | null | boolean],
                ) => {
                    args[valueDef[0]] =
                        valueDef[1] === 'var'
                            ? this.liquid.evalValueSync(valueDef[2] as string, ctx)
                            // ? ctx.getSync([valueDef[2]])
                            : valueDef[2]
                    return args
                }, {})
                const {
                    color, size, style, variant,
                    role, ...others
                } = args

                let iconData = await readSvg(`@material-design-icons/svg/${variant || 'filled'}/${iconName}.svg`)

                const inject = (attr: string) => {
                    iconData = iconData.replace('<svg', `<svg ${attr}`)
                }

                if (size) {
                    iconData = iconData
                        .replace('width="24"', `width="${size || '24'}"`)
                        .replace('height="24"', `height="${size || '24'}"`)
                }
                if (role) {
                    inject(`role="${role}"`)
                }
                if (style) {
                    inject(`style="${style}"`)
                }
                if (color) {
                    inject(`fill="${color}"`)
                }
                if (others.ariaLabel) {
                    inject(`aria-label="${others.ariaLabel}"`)
                    iconData = iconData
                        .replace('viewBox="0 0 24 24">', `viewBox="0 0 24 24"><title>${others.ariaLabel}</title>`)
                }

                return iconData
            },
        })
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
