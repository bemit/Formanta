#!/usr/bin/env node
import path from 'node:path'
import url from 'node:url'
import fs from 'node:fs/promises'
import sharp from 'sharp'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const sourceLogo = path.join(__dirname, 'public', 'formanta_logo.svg')
const outputDir = path.join(__dirname, 'dist', 'media')

await fs.mkdir(outputDir, {recursive: true})

await sharp(sourceLogo, {density: 92})
    .resize({
        height: 192,
        width: 192,
    })
    .png()
    .toFile(path.join(outputDir, 'logo192.png'))

await sharp(sourceLogo, {density: 92})
    .resize({
        height: 512,
        width: 512,
    })
    .png()
    .toFile(path.join(outputDir, 'logo512.png'))
