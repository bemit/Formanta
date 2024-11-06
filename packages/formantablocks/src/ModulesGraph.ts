import path from 'node:path'
import normalizePath from 'normalize-path'

interface FileStat {
    pathRel: string
    path: string
    size?: number
    createdAt?: number
    updatedAt?: number
}

export class AssetModule implements FileStat {
    public extension: string
    public pathBase: string
    public pathRel: string
    public path: string
    public size?: number
    public createdAt?: number
    public updatedAt?: number

    constructor(
        fileStat: FileStat,
    ) {
        this.pathRel = fileStat.pathRel
        this.path = fileStat.path
        this.size = fileStat.size
        this.createdAt = fileStat.createdAt
        this.updatedAt = fileStat.updatedAt
        const extension = path.extname(fileStat.pathRel)
        this.extension = extension.slice(1)
        this.pathBase =
            normalizePath(
                path.join(
                    path.dirname(fileStat.pathRel),
                    path.basename(fileStat.pathRel, extension),
                ),
            )
    }
}

export interface OutputFile {
    path: string
    generation?: string
    cache?: {
        contentType: string
        content: string | Buffer
    }
    /**
     * @todo support e.g. hash for style via params? e.g. init hash with empty `''` or `.<hash>` respectively
     */
    params?: {
        [k: string]: string
    }
}

export class EntrypointModule extends AssetModule {
    entrypointType: string
    // todo: for some entrypoints, there will be multiple files generated, e.g. SourceMaps,
    //       must be supported by outputFile and outputCache,
    //       which differ from other e.g. dependencies, as they are virtual and don't have a related file "on disk",
    //       thus their lifecycle fully depends on whatever the entrypoint emits;
    //       except for code-split in e.g. script, where one script produces independent files on demand,
    //       which would need a real HMR implementation, thus atm. out of scope (in regard to cache clearing)
    // todo: in general, for source-maps and other controlled assets, it would be easier and much safer to rewrite that not only "EntrypointModules"
    //       can have an outputFile, and that any AssetModule can have a list of managed assets
    // todo: atm. outputFiles are readOnly, they must not be changed after registration of the module,
    //       as linking from `.outputs` isn't updated on mutations
    // public outputFile?: string
    // outputFiles?: Map<string, OutputFile>
    // todo: try using "promise" for getting last file for dedupe? seen something similar in liquid,
    //       yet in comyata experienced strange behaviour with such cases,
    //       and it would make `generation` checking not possible atomically
    //       or getting the `outputFile.path` in sync
    // outputFile?: Promise<OutputFile>
    outputFile?: OutputFile
    generation?: string

    constructor(
        fileStat: FileStat,
        entrypointType: string,
    ) {
        super(fileStat)
        this.entrypointType = entrypointType
    }
}

/**
 * @todo differentiate between `page` and `collection` HTML entrypoints?
 */
export class PageEntrypointModule extends EntrypointModule {
    outputFile: OutputFile & Required<Pick<OutputFile, 'path'>>

    constructor(
        fileStat: FileStat,
    ) {
        super(fileStat, EntrypointTypes.Page)
        // - source file basename and extension
        // - absolute source file with extension
        // - relative source file with extension
        // - output file with/without extension
        // - for collection need to support props placeholder

        // todo: rewriting pathBase here makes e.g. data file loading not consistent
        // if (this.pathBase === 'index') {
        //     this.pathBase = ''
        // } else if (this.pathBase.endsWith('/index')) {
        //     this.pathBase = this.pathBase.slice(0, -'/index'.length)
        // }

        let outputPath: string
        if (this.pathBase === 'index') {
            outputPath = ''
        } else if (this.pathBase.endsWith('/index')) {
            outputPath = this.pathBase.slice(0, -'/index'.length)
        } else {
            outputPath = this.pathBase
        }

        this.outputFile = {
            // todo: support collections!?
            // path: this.pathBase,
            path: outputPath,
        }
    }
}

export class StyleEntrypointModule extends EntrypointModule {
    outputFile: OutputFile & Required<Pick<OutputFile, 'path'>>

    constructor(
        fileStat: FileStat,
        {assetsDir}: { assetsDir: string },
    ) {
        super(fileStat, EntrypointTypes.Style)
        this.outputFile = {
            // todo: this type of filename makes adding hashes near impossible,
            //       but hash is only known once the file was compiled
            // todo: assetsDir should not be required here, but is atm. used in `outputs` registration
            path: normalizePath(path.join(assetsDir, this.pathBase)) + '.css',
        }
    }
}

export enum EntrypointTypes {
    Page = 'page',
    Style = 'style',
    Script = 'script',
}

export class DependencyChanges {
    unused: string[] = []
    /**
     * @todo rename, to `initialized`, `used`?!
     */
    added: string[] = []
}

export class ModulesGraph {
    protected modules: Map<string, AssetModule>

    // 'page' | 'style' | 'script'
    entrypoints: Map<string, Map<string, EntrypointModule>>
    protected outputs: Map<string, Set<EntrypointModule>>

    protected dependencyToModules: Map<string, Set<string>>
    protected moduleToDependencies: Map<string, Set<string>>

    constructor() {
        this.modules = new Map()
        this.entrypoints = new Map()
        this.outputs = new Map()
        this.dependencyToModules = new Map()
        this.moduleToDependencies = new Map()
    }

    addModule<TModule extends AssetModule>(module: TModule): TModule {
        this.modules.set(module.path, module)

        if (isEntrypointModule(module)) {
            if (!this.entrypoints.has(module.entrypointType)) {
                this.entrypoints.set(module.entrypointType, new Map())
            }
            this.entrypoints.get(module.entrypointType)!.set(module.pathRel, module)
            if (module.outputFile) {
                if (!this.outputs.has(module.outputFile.path)) {
                    this.outputs.set(module.outputFile.path, new Set())
                }
                this.outputs.get(module.outputFile.path)!.add(module)
            }
        }

        return module
    }

    getModule(path: string) {
        return this.modules.get(path)
    }

    getOutputs(path: string) {
        return this.outputs.get(path)
    }

    log(dependencyChanges?: DependencyChanges) {
        console.log('entrypoints', Array.from(this.entrypoints.keys()).reduce((entrypoints, entrypointType) => ({
            ...entrypoints,
            [entrypointType]: this.entrypoints.get(entrypointType)?.keys(),
        }), {}))
        console.log('modules', this.modules.keys())
        console.log('outputs', this.outputs.keys())
        console.log('dependencies', this.dependencyToModules, this.moduleToDependencies)
        if (dependencyChanges && (dependencyChanges.added.length || dependencyChanges.unused.length)) {
            console.log('dependencyChanges', dependencyChanges)
        }
    }

    removeModule(modulePath: string) {
        const dependencies = this.moduleToDependencies.get(modulePath)
        const dependencyChanges = new DependencyChanges()
        if (dependencies?.size) {
            dependencies.forEach(dependency => {
                const usages = this.dependencyToModules.get(dependency)
                if (usages) {
                    usages.delete(modulePath)
                    if (!usages.size) {
                        this.dependencyToModules.delete(dependency)
                        dependencyChanges.unused.push(dependency)
                    }
                }
            })
        }
        this.moduleToDependencies.delete(modulePath)

        const module = this.modules.get(modulePath)
        this.modules.delete(modulePath)
        if (module && isEntrypointModule(module)) {
            // this.entrypoints.delete(modulePath) // wrong, type then path
            this.entrypoints.get(module.entrypointType)?.delete(module.pathRel)
            if (module.outputFile) {
                if (this.outputs.has(module.outputFile.path)) {
                    this.outputs.get(module.outputFile.path)!.delete(module)
                    if (!this.outputs.get(module.outputFile.path)!.size) {
                        this.outputs.delete(module.outputFile.path)
                    }
                }
            }
        }

        return [module, dependencyChanges] as const
    }

    findUsages(modulePath: string) {
        const openUsages: string[] = [modulePath]
        // a modulePath could be from a dependency which is not itself a module
        const maybeModule = this.getModule(modulePath)
        const usages: Set<AssetModule> = new Set(maybeModule ? [maybeModule] : [])

        do {
            const usagePath = openUsages.pop()
            if (!usagePath) continue
            const additionalUsages = this.dependencyToModules.get(usagePath)
            if (additionalUsages?.size) {
                // only add those not already known to prevent looping visits
                for (const additionalUsage of additionalUsages) {
                    const usedModule = this.getModule(additionalUsage)
                    // could there be usages without a module? NO, only dependencies may not have a related module
                    if (
                        !usedModule
                        || usages.has(usedModule)
                    ) continue
                    usages.add(usedModule)
                    openUsages.push(additionalUsage)
                }
            }
        } while (openUsages.length)

        return usages
    }

    patchDependencies(
        modulePath: string,
        ...dependencies: string[]
    ) {
        const currentDependencies = this.moduleToDependencies.get(modulePath)
        const dependencyChanges = new DependencyChanges()
        if (currentDependencies) {
            const removed: string[] = []
            const added: string[] = []
            dependencies.forEach(dependency => {
                if (dependency === modulePath) return
                if (!currentDependencies.has(dependency)) {
                    added.push(dependency)
                }
            })
            currentDependencies.forEach(dependency => {
                if (!dependencies.includes(dependency)) {
                    removed.push(dependency)
                }
            })

            removed.forEach((dependency) => {
                currentDependencies.delete(dependency)
                this.dependencyToModules.get(dependency)!.delete(modulePath)
                if (!this.dependencyToModules.get(dependency)!.size) {
                    this.dependencyToModules.delete(dependency)
                    dependencyChanges.unused.push(dependency)
                }
            })

            added.forEach((dependency) => {
                currentDependencies.add(dependency)
                if (!this.dependencyToModules.has(dependency)) {
                    this.dependencyToModules.set(dependency, new Set())
                    dependencyChanges.added.push(dependency)
                }
                this.dependencyToModules.get(dependency)!.add(modulePath)
            })

            if (!currentDependencies.size) {
                this.moduleToDependencies.delete(modulePath)
            }
        } else if (dependencies.length) {
            this.moduleToDependencies.set(modulePath, new Set(dependencies.filter(dependency => dependency !== modulePath)))
            dependencies.forEach(dependency => {
                if (dependency === modulePath) return
                if (!this.dependencyToModules.has(dependency)) {
                    this.dependencyToModules.set(dependency, new Set())
                    dependencyChanges.added.push(dependency)
                }
                this.dependencyToModules.get(dependency)!.add(modulePath)
            })
        }

        return dependencyChanges
    }
}

export function isEntrypointModule(module: AssetModule): module is EntrypointModule {
    return module instanceof EntrypointModule
}

export function isPageEntrypointModule(module: AssetModule): module is PageEntrypointModule {
    return module instanceof PageEntrypointModule
}
