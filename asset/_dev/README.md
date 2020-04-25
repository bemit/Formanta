# Formanta: Asset Build Tools

This package uses NodeJS scripts to start and configure the building of assets files like Sass to CSS transpiling with autoprefixer and browserslist.

```bash
# See which tasks are available through cli
node tasker.js --help
```

## Concept Notes

- higher level NPM Scripts are convenience entry points to trigger tasks specified in `tasker.js`
- Tasks in `tasker.json` are the main interface for developers to trigger anything, but should simplify the deeper logic, e.g. only providing `build, watch, start` as tasks
- Tasks are simple wrappers for an independent handler file
- In `handle.js` are the individual asset handlers defined and grouped, at the end a task list is generated, this list is used from `tasker.js`

Examples

- defining new global tasks like `build` see `tasker.js` and the return of `handle.js`
- modifying build order and groups see `handle.js`
- adding new build support to something: write a new handler file which wraps the needed modules, register the use with needed values in `handle.js` 

## Implemented Build Tasks 

- [@formanta/build-task.archive](https://www.npmjs.com/package/@formanta/build-task.archive)
- [@formanta/build-task.clean](https://www.npmjs.com/package/@formanta/build-task.clean)
- [@formanta/build-task.media](https://www.npmjs.com/package/@formanta/build-task.media)
- [@formanta/build-task.react-app](https://www.npmjs.com/package/@formanta/build-task.react-app)
- [@formanta/build-task.sass](https://www.npmjs.com/package/@formanta/build-task.sass)

    - included in `build` and `watch`
    
    Using **Sass** and **postcss** with **autoprefixer** to transpile Sass to compressed and optimized CSS.
    
    Implemented file watcher adds all files automatically for each entry file declared.

- [@formanta/build-task.webpack](https://www.npmjs.com/package/@formanta/build-task.webpack) 
- [@formanta/build-task.webpack-config-es6](https://www.npmjs.com/package/@formanta/build-task.webpack-config-es6) 
- [@formanta/build-task.webpack-config-html](https://www.npmjs.com/package/@formanta/build-task.webpack-config-html) 
- [@formanta/build-task.webpack-config-jsx](https://www.npmjs.com/package/@formanta/build-task.webpack-config-jsx) 
- [@formanta/build-task.webpack-config-polymer](https://www.npmjs.com/package/@formanta/build-task.webpack-config-polymer) 
- [@formanta/build-task.webpack-config-sass](https://www.npmjs.com/package/@formanta/build-task.webpack-config-sass) 
- [@formanta/build-task.webpack-config-vue](https://www.npmjs.com/package/@formanta/build-task.webpack-config-vue) 

### mp4 Support media task

> [Extra setup required for Linux, NOT: Mac, Windows](https://www.npmjs.com/package/handbrake-js#system-requirements)