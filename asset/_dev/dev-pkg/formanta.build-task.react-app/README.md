# Formanta Build Task: React App

Wraps and handles a react app that was installed with create-create app - capable of `yarn` and `npm` installs.

Executes the given task against all apps that are passed into it.

```js
const taskReactApp = require('@formanta/build-task.react-app');

const apps = [
    '/absolute-path/to-react-app-dir/'    
];

// defaults tasks included in CRA
taskReactApp.start(apps).then(res => {});
taskReactApp.build(apps).then(res => {});
taskReactApp.test(apps).then(res => {});

// run any script defined in the target package.json
taskReactApp.run('script-name',apps).then(res => {});
``` 

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes