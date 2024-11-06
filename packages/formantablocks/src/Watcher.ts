import * as chokidar from 'chokidar'
import type { FSWatcher } from 'chokidar'

interface WatchChange {
    event: 'add' | 'change' | 'unlink'
    path: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: any
}

export const Watcher = ({debug}: { debug?: boolean } = {}) => {
    const listeners: {
        handler: (changes: WatchChange) => Promise<void> | void
    }[] = []

    const watcher: FSWatcher = chokidar.watch([], {
        ignoreInitial: true,
        // awaitWriteFinish: true,
        followSymlinks: true,
        atomic: true,
    })

    const dispatch = (change: WatchChange) => {
        for (const listener of listeners) {
            listener.handler(change)
        }
    }

    if (debug) {
        watcher.on('ready', () => {
            console.debug(`File watcher is ready, watching ${Object.values(watcher.getWatched()).flat().length} files`)
        })
    }

    watcher
        .on('add', (path, stats) => {
            if (debug) console.debug(`File has been added`, path)
            const change: WatchChange = {
                event: 'add',
                path: path,
                stats: stats,
            }
            dispatch(change)
        })
        .on('change', (path, stats) => {
            // https://github.com/paulmillr/chokidar/issues/750
            // liquid causes an atime change when content was not modified
            if (stats.atime && stats.mtime && stats.atime > stats.mtime) return

            if (debug) console.debug(`File has been changed`, path)
            const change: WatchChange = {
                event: 'change',
                path: path,
                stats: stats,
            }
            dispatch(change)
        })
        .on('unlink', (path, stats) => {
            if (debug) console.debug(`File has been removed`, path)
            const change: WatchChange = {
                event: 'unlink',
                path: path,
                stats: stats,
            }
            dispatch(change)
        })

    return {
        add: (paths: string | string[]) => watcher.add(paths),
        unwatch: (paths: string | string[]) => watcher.unwatch(paths),
        watch: (
            listener: (changes: WatchChange) => Promise<void> | void,
        ) => {
            if (listener) {
                listeners.push({handler: listener})
            }
        },
        close: async () => {
            await watcher.close()?.then(() => {
                if (debug) console.debug(`watcher closed`)
            })
        },
    }
}
