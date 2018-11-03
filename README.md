# Formanta Project

- [Formanta](https://bitbucket.org/bemit_eu/formanta)
    - [FormantaBlocks](https://bitbucket.org/bemit_eu/formantablocks)
    - [FormantaBlocks-JS](https://bitbucket.org/bemit_eu/formantablocks-js)
- [FormantaSass: Core](https://bitbucket.org/bemit_eu/formantasass-core)
    - [FormantaSass](https://bitbucket.org/bemit_eu/formantasass), extension with further components for web-apps
- [FormantaJS](https://bitbucket.org/bemit_eu/formantajs)

With Formanta you get a quick start boilerplate for integrated frontend development and in general a StaticSide Generator ready to go.

The Static Side Generator could be run with NodeJS or PHP and the CLI interface is in the root directory

> Formanta is a work-in-progress and currently PHP and NodeJS features aren't alike, this will be from version 0.9 onwards.
> Current versions:
> - Formanta `in-work`
> - FormantaBlocks PHP `in-work`
> - FormantaBlocks NodeJS `in-work`
> - FormantaSass: Core `stable, inline-doc`
> - FormantaSass `currently not usable`
> - FormantaJS `old concept files`, see [Canal: Asset](https://bitbucket.org/bemit_eu/canal-asset), [Canal: Admin](https://bitbucket.org/bemit_eu/canal-admin) for features which will be integrated

## Setup

For PHP or NodeJS, setup with Git:

    git clone https://bitbucket.org/bemit_eu/formanta.git

Only for PHP, setup with composer:

    composer create-project bemit/formanta
    
### Install Static Side Generator

#### NodeJS System

Install dependencies with `npm i` in root directory.

#### PHP System

Only needed when you have setup through Git: install dependencies with `composer install` in root directory.
    
## Usage

### Config, Universal for PHP and NodeJS

The config is in `config/*.json`.

- `build.json` which static files should be made
- `url.json` used for dev-server and output URL; index `view` is not used, concept
- `view_system.json` Twig environment and declaring storage paths

```text
// todo: add content for configuration, choosing between JS and PHP and content management
```
   
### Run with PHP

Through the `package.php` file the runtime tasks are available:

```bash
# Builds static view files
php package.php build
# Builds static view files and adds file watcher onto the rendered views
php package.php watch
# Builds static view files and starts development server on localhost
php package.php start
```
 
### Run with NodeJS

Through normal NPM tasks the runtime is available:

```bash
# Builds static view files
npm run build
# Builds static view files and adds file watcher onto the rendered views
npm run watch
# Builds static view files and starts development server on localhost
npm run start
```

### Develop Asset Files

Asset files and their dependencies are declared in `/asset`.

When using NodeJS system, asset dependencies are installed with setup.

Or run `npm i` in `/asset` to install both asset dependencies and build tools which are in `/asset/_dev`.

Tasks for the build pipelines:  

```bash
# in /asset

# nothing, to be implemented
npm run start
# build all assets
npm run build
# build all assets and add file watcher
npm run watch
# show tasks which are available in `/asset/_dev`
npm run help

# in /asset/_dev

# nothing, to be implemented
node tasker.js start
# build all assets
node tasker.js build
# build all assets and add file watcher
node tasker.js watch
# show available tasks
node tasker.js --help
```

For asset build tools guide see [/asset/_dev/README.md](/asset/_dev/README.md)

### View System

The view system uses Twig as template language, through [npm:twig](https://www.npmjs.com/package/twig) in JS and [composer:twig/twig](https://packagist.org/packages/twig/twig) in PHP.

Both are used with modified FS Loaders for enabling extended namespace usage and file_watcher handling.

The existing files in `/view` are a quick boilerplate, see [/view/base/README.md](/view/base) for technical docs.

## Known Bugs / Static Side Generator

File watcher only watches the entry view file defined in `build.json` and not which files are all used by this file. Needing to modify Twig FS Loader further to save 'used' templates for each rendered file and passing them back to the Renderer and the to runtime.

Data is only possible to push globally to all templates, FormantaBlocks NodeJS hasn't implemented data loading at all, PHP tasks haven't implemented FormantaBlocks loading function.

Data is only fetched once and not updated correctly on watcher.

### Known NodeJS Bugs

> atm. NodeJS feature set is not in parity with PHP

Doesn't save already builded files into `system/builded.json` and thus isn't capable of cleaning old files.

### Known PHP Bugs

The file watcher doesn't re-render, as the twig cache interferences.

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes