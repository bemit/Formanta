# Formanta Build Task: Archive

Make filtered copy of source directory and pack it in the end, wrapping [@insulo/archiver](https://www.npmjs.com/package/@insulo/archiver).

```js
const archive = require('@formanta/build-task.archive');

archive(
    // src folder, when dist inside src don't forget to exclude it
    __dirname + '/src',
    [
        // exclude folders
        '.idea',
        '.git',
        '.gitkeep',
        'tmp',
        '/archive',
        'node_modules',
    ],
    // dist: folder name; will be used as folder name to copy files first, then as name of archive
    __dirname + '/dist',
    {
        // option
        pack: 'zip', // use zip or targz [targz to be implemented]
        delete_auto: true, // delete copy after packing
        debug: false
    }
)().then(res => {});
```

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes