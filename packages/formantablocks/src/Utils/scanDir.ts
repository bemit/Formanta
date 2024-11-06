import fs from 'node:fs/promises'
import path from 'node:path'
import normalizePath from 'normalize-path'
import anymatch from 'anymatch'

interface DirEntry<TType extends 'directory' | 'link' | 'file' = 'directory' | 'link' | 'file'> {
    type: TType
    path: string
    pathRel: string
    size: number
    createdAt: number
    updatedAt: number
}

type DirEntryFile = DirEntry<'file'>
type DirEntryDirectory = DirEntry<'directory'>

export async function scanDir<TIncludeDirs extends boolean = false>(
    dir: string,
    {
        includeDirs,
        glob,
    }: {
        includeDirs?: TIncludeDirs
        glob?: string[]
    } = {},
): Promise<TIncludeDirs extends true ? (DirEntryFile | DirEntryDirectory)[] : DirEntryFile[]> {
    let contents: string[]
    try {
        contents = await fs.readdir(dir, {
            recursive: true,
        })
    } catch (e) {
        if (e instanceof Error && 'code' in e) {
            console.log(e.code)
        }
        return []
    }

    const result: DirEntry[] = []
    for (const contentPath of contents) {
        const fullPath = path.join(dir, contentPath)
        const stat = await fs.stat(fullPath)

        if (
            (stat.isDirectory() && !includeDirs)
            || stat.isFIFO()
            || stat.isSocket()
            || stat.isBlockDevice()
            || stat.isCharacterDevice()
            || stat.isSymbolicLink() // todo: support symbolic link resolve?
            || (
                glob?.length
                // @ts-expect-error anymatch type is invalid
                && !anymatch(glob, normalizePath(contentPath))
            )
        ) continue

        result.push({
            type: stat.isDirectory() ? 'directory' : 'file',
            // type: stat.isDirectory() ? 'directory' : stat.isSymbolicLink() ? 'link' : 'file',
            pathRel: normalizePath(contentPath),
            path: normalizePath(fullPath),
            size: stat.size,
            createdAt: stat.birthtimeMs,
            updatedAt: stat.mtimeMs,
        })
    }

    return result as TIncludeDirs extends true ? (DirEntryFile | DirEntryDirectory)[] : DirEntryFile[]
}
