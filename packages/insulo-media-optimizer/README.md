# Insulo: Media Optimizer

Optimize your media assets before publishing - save storage, speed up performance, make your customers happier!

Including a file watcher for local development, only re-optimizes changed files, currently doesn't delete files when source files are deleted.

## Handler

For different file type support install and register needed handler.

- dynamic: generic copy of files
  
  `npm i --save @insulo/media-optimizer-handler-dynamic`
  
  ```js
  const handlerConfig = {
      dynamic: {
          files: ['**/*.{pdf,gif}']
      }
  };
  ```
  
- gif: optimize animated and non-animated gif with `gifsicle` *future, not implemented*
- handbrake: optimize video files with [Handbrake](https://handbrake.fr/docs/en/latest/cli/command-line-reference.html)
  
  `npm i --save @insulo/media-optimizer-handler-handbrake`
  
  ```js
  const handlerConfig = {
      handbrake: {
          // uses handbrake, must be installed as peer dep. on linux
          optimize: true,
          // framerate, 15 for most web
          rate: 15,
          // high no. = low quality
          quality: 24.0,
          // mp4, avi and more https://handbrake.fr
          files: ['**/*.mp4']
      }
  };
  ```
- image-transform: rotate, resize, transform different image types with `sharp` *future, not implemented*
  
  `npm i --save @insulo/media-optimizer-handler-image-transform`
  
  ```js
  const handlerConfig = {
      task1: {handler:()=>{}},
      task2: {handler:()=>{}}
  };
  ```
- jpg: optimize jpg images with `mozjpeg`
  
  `npm i --save @insulo/media-optimizer-handler-jpg`
  
  ```js
  const handlerConfig = {
      jpg: {
          quality: 80,
          progressive: true,
          files: ['**/*.{jpg,jpeg}']
      }
  };
  ```
- png: optimize png images with `pngquant`
  
  `npm i --save @insulo/media-optimizer-handler-png`
  
  ```js
  const handlerConfig = {
      png: {
          quality: 80,
          files: ['**/*.png']
      }
  };
  ```
- svg: optimize svg files with `svgo`
  
  `npm i --save @insulo/media-optimizer-handler-dynamic`
  
  ```js
  const handlerConfig = {
      svg: {
          removeViewBox: false,
          files: ['**/*.svg']
      }
  };
  ```

## Example

```js
const {MediaOptimizer} = require('@insulo/media-optimizer');

// add default handler functions, must be activated through a config for loading during runtime
MediaOptimizer.constructor.handler_default = {
    png: () => require('@insulo/media-optimizer-handler-png'),
    jpg: () => require('@insulo/media-optimizer-handler-jpg'),
    svg: () => require('@insulo/media-optimizer-handler-svg'),
    handbrake: () => require('@insulo/media-optimizer-handler-handbrake'),
    dynamic: () => require('@insulo/media-optimizer-handler-dynamic'),
    customType: () => require('your-package/customType'),
};

const handlerConfig = {
    png: { /* include config */ },
    jpg: {
        /* include config */ 
        // overwrite default handler
        handler: require('your-package/customJpg')
    },
    svg: { /* include config */ },
    handbrake: { /* include config */ },
    dynamic: { /* include config */ },
    customType: { /* include config */ },
};

let watch = true;

const src = __dirname + '/src';
const build = __dirname + '/build';

let optimizer = new MediaOptimizer(watch);

// activate handlers with handlerConfig
for(let type in handlerConfig) {
    if(option.hasOwnProperty(type)) {
        optimizer.addHandler(type, option[type]);
    }
}

// trigger execution
optimizer.run(src, build).then(res => {
    
});

```

## Example Custom Handler

`this.option` contains the used handlerConfig

```js
/**
 * @type {HandlerBase}
 */
const HandlerBase = require('@insulo/media-optimizer/lib/HandlerBase');

class HandlerCustom extends HandlerBase {
    run() {
        // inline handle dependency load for using `option` provided by handler for setup
        const executionHandler = new SomePlugin(this.option);
       
        // run the actual thing wrapped in logger, registers it on watcher and everything needed
        return super.run_internal((on_finish => {
            // your actual async thing
            executionHandler.doingStuff((err, data) => {
                if(err) {
                    throw err;
                }
                // important to call with existing errors
                on_finish(err);
            });
        }));
    }
}

// Existing variables, from HandlerBase filled on construct
/**
 * Root of `src` folder, will be used to get the pure name from an full src path
 * @type string
 */
HandlerCustom.root
/**
 * Full path to one file
 * @type string
 */
HandlerCustom.src
/**
 * Path to build directory
 * @type string
 */
HandlerCustom.build
/**
 * Options pushed in for the specific handler type
 * @type {Object}
 */
HandlerCustom.option
/**
 * Relative path to an file, added to `build` is absolute path to `dist` and added to `root` is absolute path to `src`
 * @type {string}
 */
HandlerCustom.name
/**
 * Absolute path to the distribution target
 * @type string
 */
HandlerCustom.dist

/**
 *
 * @type {HandlerCustom}
 */
module.exports = HandlerCustom;
```

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes