# Insulo: Archiver

Make a filtered copy of a source directory and pack it in the end.

## Example

```js
const Archiver = require('@insulo/archiver');

// declare some dist folder, when inside of base don't forget to add relative path to exclude
// can also be used as filename 
const dist = __dirname + '/build';

let archive = new Archiver();
archive.base = './src';
archive.exclude = [
    '.idea',
    '.git',
    '.gitkeep',
    'tmp',
    'node_modules',
];
archive.debug = true;

// add own pack handler
// archive.pack_handler['<name>'] = (base, src) => { // packing and saving... return true;};
let pack_method = false;
if(archive.pack_handler.hasOwnProperty('zip')) {
    pack_method = 'zip';
}

// first copy
archive.copy(dist).then((/*result*/) => {
    
    // then pack it to a zip
    archive.pack(pack_method, dist).then((handler_done) => {
        // returns the full target path or false
        if(handler_done) {
            console.log('finished' + dist);
        } else {
            console.error('failed: pack-' + pack_method);
        }
    });
});
``` 

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes