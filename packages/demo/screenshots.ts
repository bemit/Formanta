import http from 'http'
import fs from 'fs/promises'
import path from 'path'
import puppeteer, { Viewport } from 'puppeteer'
import url from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const outputDir = path.join(__dirname, 'dist', 'media')
const root = path.join(__dirname, 'dist')
const port = 8080

await fs.mkdir(outputDir, {recursive: true})

const server = http.createServer((req, res) => {
    if (!req.url) {
        res.writeHead(404, {'Content-Type': 'text/plain'})
        res.end('404 Not Found')
        return
    }
    const filePath = path.join(root, req.url === '/' ? 'index.html' : req.url.includes('.') ? req.url : req.url + '.html')
    const extname = path.extname(filePath)

    // Map file extensions to MIME types
    const mimeTypes: { [ext: string]: string } = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
    }
    const contentType = extname in mimeTypes ? mimeTypes[extname] : 'application/octet-stream'

    fs.readFile(filePath)
        .then(content => {
            res.writeHead(200, {'Content-Type': contentType})
            res.end(content)
        })
        .catch(e => {
            if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
                res.writeHead(404, {'Content-Type': 'text/plain'})
                res.end('404 Not Found')
            } else {
                console.error(e)
                res.writeHead(500, {'Content-Type': 'text/plain'})
                res.end('500 Server Error')
            }
        })
})

const screenshotPrefix = 'screenshot-'
// const screencastPrefix = 'video-'

async function captureScreenshots(page: puppeteer.Page) {
    const screenshots: (Viewport & { name: string, goTo: string })[] = [
        {width: 1440, height: 900, deviceScaleFactor: 2, name: 'hidpi', goTo: 'index.html'},
        {width: 1280, height: 800, deviceScaleFactor: 1, name: 'mdpi', goTo: 'index.html'},
        {width: 375, height: 812, deviceScaleFactor: 3, name: 'mobile', goTo: 'index.html'},
        {width: 1440, height: 900, deviceScaleFactor: 2, name: 'hidpi-dark', goTo: 'dark.html'},
        {width: 1280, height: 800, deviceScaleFactor: 1, name: 'mdpi-dark', goTo: 'dark.html'},
        {width: 375, height: 812, deviceScaleFactor: 3, name: 'mobile-dark', goTo: 'dark.html'},
    ]

    for (const {name, goTo, ...viewport} of screenshots) {
        await page.setViewport(viewport)
        await page.goto(`http://localhost:${port}/${goTo}`, {waitUntil: 'networkidle0'})
        const screenshot = await page.screenshot({
            type: 'png',
        })
        await sharp(screenshot)
            .resize({width: viewport.width, height: viewport.height})
            .png()
            .toFile(path.join(outputDir, `${screenshotPrefix}${name}.png`))
        await sharp(screenshot)
            .resize({width: viewport.width, height: viewport.height})
            .webp()
            .toFile(path.join(outputDir, `${screenshotPrefix}${name}.webp`))
        console.log(`Saved screenshots ${name}`)

        // const recorder = await page.screencast({
        //     path: path.join(outputDir, `${screencastPrefix}${name}.webm`) as `${string}.webm`,
        // })
        // console.log(`Recording video ${name}`)
        // const wait = (timeout: number = 1500) => new Promise((resolve) => setTimeout(resolve, timeout))
        // // page.viewport().
        // await wait(1000)
        // await page.evaluate(() => {
        //     window.scrollBy({top: 500, left: 0, behavior: 'smooth'})
        // })
        // await wait(850)
        // await page.evaluate(() => {
        //     window.scrollBy({top: 500, left: 0, behavior: 'smooth'})
        // })
        // await wait(850)
        // await page.evaluate(() => {
        //     window.scrollBy({top: 500, left: 0, behavior: 'smooth'})
        // })
        // await wait(850)
        // await page.evaluate(() => {
        //     window.scrollBy({top: 500, left: 0, behavior: 'smooth'})
        // })
        // await wait(850)
        // await page.evaluate(() => {
        //     window.scrollBy({top: 500, left: 0, behavior: 'smooth'})
        // })
        // await wait(1500)
        //
        // console.log(`Saving video ${name}`)
        // await recorder.stop()
        // console.log(`Saved video ${name}`)
    }
}

console.log('Starting server...')
server.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`)

    console.log('Starting browser...')
    const browser = await puppeteer.launch({})

    console.log('Creating screenshots...')
    const page = await browser.newPage()
    try {
        await captureScreenshots(page)
    } catch (err) {
        console.error('Error capturing screenshots:', err)
    }

    console.log('Shutting down...')

    await browser.close()
    await new Promise<void>(resolve => server.close(() => resolve()))
})
