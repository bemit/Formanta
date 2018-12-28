# Formanta: Assets

For Build Tools see [/asset/_dev/README.md](/asset/_dev/README.md).

Convenience NPM tasks for easy `_dev/tasker.js` access:

```bash
npm run clean
npm run build
npm run watch
npm run archive
npm run help

# is equal with above, using npm pass-through args:
npm run tasker -- clean
npm run tasker -- --help
```

# Updating Git Submodules / Fix after Deletion

```bash
git submodule update --init --recursive
```

## Important

> For task `media`: [extra setup required for Linux, NOT: Mac, Windows](https://www.npmjs.com/package/handbrake-js#system-requirements)