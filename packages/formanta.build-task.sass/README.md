# Formanta Build Task: Sass

Transpile Sass (.sass and .scss) to CSS and optimize it with postcss.

```js
const {run} = require('@formanta/build-task.sass');

let entry = __dirname + '/main.scss';
let output = __dirname + '/style.css';

// or multiple
entry = [
    __dirname + '/main.scss',
    __dirname + '/slider.scss',
];
output = [
    __dirname + '/style.css',
    __dirname + '/slider.css',
];

run(entry, output, watch = true, outputStyle = 'nested', root_dir = '', includePaths = [])
    .then(res => {})
    .catch(e => {});
```

- watch enabled a FileWatcher (build upon Chokidar) starts, checks imported files and when changing any, it rebuilds `entry`. It tracks import changes.
- outputStyle: `nested`, `expanded`, `compact`, `compressed`
- root_dir: for building a prettier output, removing the root_dir from log. e.g. `__dirname`.
- includePaths: array with paths for resolving `@imports`

Builds upon those other open-source projects:
- [LibSass](https://github.com/sass/libsass)
- [node-sass](https://github.com/sass/node-sass)
- [Autoprefixer](https://www.npmjs.com/package/autoprefixer)
- [PostCSS](https://www.npmjs.com/package/postcss)
- [@insulo/runner](https://www.npmjs.com/package/@insulo/runner)
- [@insulo/watcher](https://www.npmjs.com/package/@insulo/watcher)

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

2018 - 2019 | [bemit UG](https://bemit.eu) (haftungsbeschränkt)

Author: [Michael Becker](i-am-digital.eu)
