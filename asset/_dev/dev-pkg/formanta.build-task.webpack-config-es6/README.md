# ES6 Config

Install dependencies:

```bash
npm i --save-dev @formanta/build-task.webpack @formanta/build-task.webpack-config-es6 webpack babel-loader @babel/core @babel/preset-env eslint eslint-loader babel-eslint
```

File `build.js`:

```js
const taskWebpack = require('@formanta/build-task.webpack');
taskWebpack.run([{
        _use: require('@formanta/build-task.webpack-config-es6'),
        mode: 'development', // 'production'
        // Windows (known): `path.resolve` must be called on paths or webpack could stuck without a message/error
        entry: {
            main: path.resolve(__dirname + '/js/main.js')
        },
        output: {
            filename: '[name].min.js',
            path: path.resolve(__dirname + '/build')
        },
        devtool: 'source-map'
    }],
    {
        watch: {
            aggregateTimeout: 300,
            ignored: ['node_modules'],
            poll: true
        }
    }
)().then(() => {
    
});
```

and in `.babelrc`

```json
{
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
    "transform-es2015-template-literals",
    "es6-promise"
  ]
}
```

and in `.eslintrc`

```json
{
  "parser": "babel-eslint",
  "root": true,
  "extends": [
    "eslint:recommended"
  ],
  "env": {
    "browser": true,
    "es6": true
  },
  "rules": {
  }
}
```

From console or `package.json` `scripts`:

```bash
node ./build.js
```

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

2019 | [bemit UG (haftungsbeschränkt)](https://bemit.eu)

Author: [Michael Becker](https://mlbr.xyz)