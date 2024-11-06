import path from 'node:path'
import { parse, DefaultTreeAdapterTypes } from 'parse5'
import normalizePath from 'normalize-path'

export interface EntrypointReference {
    path: string,
    node: DefaultTreeAdapterTypes.Element
}

export interface EntrypointsReferenced {
    script: EntrypointReference[]
    style: EntrypointReference[]
    // todo: support media? make image, audio, video separate? what for data: and embedded svg?
    // media: {}[]
}

function isElement(node: DefaultTreeAdapterTypes.Node): node is DefaultTreeAdapterTypes.Element {
    return 'tagName' in node
}

function traverseNodes(
    node: DefaultTreeAdapterTypes.Node,
    htmlFileDir: string,
    entries: EntrypointsReferenced,
) {
    if (isElement(node)) {
        if (node.tagName === 'script') {
            const typeAttr = node.attrs.find(attr => attr.name === 'type')
            const srcAttr = node.attrs.find(attr => attr.name === 'src')
            if (typeAttr?.value === 'module' && srcAttr) {
                entries.script.push({path: normalizePath(path.resolve(htmlFileDir, srcAttr.value)), node})
            }
        } else if (node.tagName === 'link') {
            const relAttr = node.attrs.find(attr => attr.name === 'rel')
            const hrefAttr = node.attrs.find(attr => attr.name === 'href')
            if (relAttr?.value === 'stylesheet' && hrefAttr) {
                entries.style.push({path: normalizePath(path.resolve(htmlFileDir, hrefAttr.value)), node})
            }
        }
    }

    if ('childNodes' in node) {
        for (const child of node.childNodes) {
            traverseNodes(child, htmlFileDir, entries)
        }
    }
}

export function updateLinkHref(node: DefaultTreeAdapterTypes.Element, newHref: string) {
    const hrefAttr = node.attrs.find(attr => attr.name === 'href')
    if (hrefAttr) {
        hrefAttr.value = newHref
    }
}

export function findEntrypointsInHtml(content: string, htmlFilePath: string): {
    document: DefaultTreeAdapterTypes.Document
    entrypoints: EntrypointsReferenced
} {
    const document = parse(content)

    const entrypoints: EntrypointsReferenced = {script: [], style: []}
    const htmlFileDir = path.dirname(htmlFilePath)

    traverseNodes(document, htmlFileDir, entrypoints)

    return {document, entrypoints}
}
