# Insulo: Watcher

Simple Wrapper around [chokidar](https://www.npmjs.com/package/chokidar) for watching files and folders for changes with an unified logging.

```js
const {FileWatcher} = require('@insulo/watcher');

let watcher = new FileWatcher('name-for-watcher', ['/optional/init/paths']);

// add element to be watched
watcher.add(src);
// remove element from the watched
watcher.remove(src);

// activate default error message logger
watcher.onError();
// activate default ready message logger
watcher.onReady();
// activate debug logger
watcher.debug();

// add change handler

// listens on: add, change, unlink
watcher.onChange((path) => {});

// listens on: add
watcher.onChangeAdd((path) => {});

// listens on: change
watcher.onChangeChange((path) => {});

// listens on: unlink
watcher.onChangeUnlink((path) => {});


// add custom onReady cb
watcher.onReady(()=>{
    // get all which are watched
    watcher.getWatched();
    
    // end watcher
    watcher.stop();
});

// add custom onError cb
watcher.onError((err)=>{
    console.error(err);
});
``` 

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes