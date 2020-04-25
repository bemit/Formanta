# JSX / React Config

```bash
npm i --save-dev @formanta/build-task.webpack @formanta/build-task.webpack-config-jsx webpack babel-loader @babel/core @babel/preset-env

npm i --save-dev @babel/plugin-proposal-class-properties @babel/plugin-proposal-object-rest-spread babel-plugin-es6-promise babel-plugin-transform-es2015-template-literals es6-promise

npm i --save-dev eslint eslint-loader babel-eslint eslint-plugin-react

npm i --save react react-dom
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
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "plugins": [
    "react"
  ],
  "env": {
    "browser": true,
    "es6": true
  },
  "rules": {
    "react/display-name": 1,
    "react/forbid-prop-types": 1,
    "react/jsx-boolean-value": 1,
    "react/jsx-closing-bracket-location": 1,
    "react/jsx-curly-spacing": 1,
    "react/jsx-handler-names": 1,
    "react/jsx-indent-props": 1,
    "react/jsx-key": 1,
    "react/jsx-no-bind": 1,
    "react/jsx-no-duplicate-props": 1,
    "react/jsx-no-undef": 1,
    "react/jsx-pascal-case": 1,
    "react/jsx-uses-react": 1,
    "react/jsx-uses-vars": 1,
    "react/no-danger": 1,
    "react/no-did-mount-set-state": 1,
    "react/no-did-update-set-state": 1,
    "react/no-direct-mutation-state": 1,
    "react/no-multi-comp": 1,
    "react/no-set-state": 1,
    "react/no-unknown-property": 1,
    "react/prefer-es6-class": 1,
    "react/prop-types": 1,
    "react/react-in-jsx-scope": 1,
    "react/self-closing-comp": 1,
    "react/sort-comp": 1
  }
}
```

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

2019 | [bemit UG (haftungsbeschränkt)](https://bemit.eu)

Author: [Michael Becker](https://mlbr.xyz)