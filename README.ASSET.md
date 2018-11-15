# Develop Asset Files with Formanta

Asset files and their dependencies are declared in `/asset`.

When using NodeJS system, asset dependencies are installed with setup.

Or run `npm i` in `/asset` to install both asset dependencies and build tools which are in `/asset/_dev`.

Tasks for the build pipelines:  

```bash
# IMPORTANT: switch to folder /asset

# clean build folder
npm run clean
# build all assets
npm run build
# build all assets and add file watcher
npm run watch
# show tasks which are available in `/asset/_dev`
npm run help

# IMPORTANT: switch to folder /asset/_dev

# clean build folder
node tasker.js clean
# build all assets
node tasker.js build
# build assets without media
node tasker.js build-no-media
# build all assets and add file watcher
node tasker.js watch
# show available tasks
node tasker.js --help
```

- [/asset/README.md](/asset/README.md) guide for asset files
- [/asset/_dev/README.md](/asset/_dev/README.md) guide for asset build tools