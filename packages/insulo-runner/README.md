# Insulo: Runner

Execute functions and promises with logging runtime information like duration; run them in sequential or parallel order or with piping the return as param through an array of those.

Having the two entrypoints `@insulo/runner` and `@insulo/runner/pretty` to choose from, where pretty just wraps the base implementation with closures, some implementations are needing everything wrapped and some not.

- `@insulo/runner` `@insulo/runner/pretty`
- `run` `run` execute with runtime configuration, pass params for fn, add a name, disable logging
- `runSequential` `sequential` execute an array, wait e.g. for the first promise to have finished before starting second
- `runParallel` `parallel` execute an array in parallel (not multi-threaded)
- `runPipe` `pipe` execute an array sequential and pass down the return values as params
- `log` utility console.log wrapper with coloring, timestamp etc.
    - `log.raw` `()<string: text, Date|undefined: time>`
    - `log.error`
    - `log.start`
    - `log.end`

## Example Usage with pretty/dsl-like functions

How `run`, `sequential`, `parallel`, `pipe` and `log` can be used to execute a lot of things. 

`someThing` can be: function, function wrapping a promise or just a promise
 
```js
const {run, sequential, parallel, pipe, log} = require('@insulo/runner/pretty');

run(
    sequential([
         someThing0,
         parallel([
             pipe([
                 someThing1,
                 someThing2,
             ]),
             someThing3
         ]),
         sequential([
             someThing4,
             someThing5
         ]),
         run(
             someThing6,
             ['param'],
             'task-name'
         ),
         someThing7,
    ]),
    ['param1', 2],
    'task-root-name'
    
// this run must be executed 
)().then(res => {
    // this log is an object
    log.raw('log e.g. the result');
    log.raw(JSON.stringify(res));
}).catch(e =>{});
```

## Example Usage with base implementation Runner

How `Runner.run`, `Runner.runSequential`, `Runner.runParallel`, `Runner.runPipe` and `Runner.log` can be used to execute a lot of things. 

`someThing` can be: function, function wrapping a promise or just a promise
 
```js
const Runner = require('@insulo/runner');

Runner.run(
    () => Runner.runSequential([
         someThing0,
         () => Runner.runParallel([
             () => Runner.runPipe([
                 someThing1,
                 someThing2,
             ]),
             someThing3
         ]),
         () => Runner.runSequential([
             someThing4,
             someThing5
         ]),
         () => Runner.run(
             someThing6,
             ['param'],
             'task-name'
         ),
         someThing7,
    ]),
    ['param1', 2],
    'task-root-name'
    
// this run is executed automatically
).then(res => {
    // this log is a function returning an object
    Runner.log().raw('log e.g. the result');
    Runner.log().raw(JSON.stringify(res));
}).catch(e =>{});
```


## Example Mixed Usage

`someThing` can be: function, function wrapping a promise or just a promise
 
```js
const Runner = require('@insulo/runner');
const {run, sequential, parallel, pipe, log} = require('@insulo/runner/pretty');

Runner.run(
    sequential([
         someThing0,
         parallel([
             pipe([
                 someThing1,
                 someThing2,
             ]),
             someThing3
         ]),
         sequential([
             someThing4,
             someThing5
         ]),
         run(
             someThing6,
             ['param'],
             'task-name'
         ),
         someThing7,
    ]),
    ['param1', 2],
    'task-root-name'
    
// this run is executed automatically
).then(res => {
    log.raw('log e.g. the result');
    log.raw(JSON.stringify(res));
}).catch(e =>{});
```

## Example log

Using the logger from `Runner`:

```js
const Runner = require('@insulo/runner');

//
// Raw

Runner.log().raw('Text');
Runner.log().raw('Text', new Date());
// [10:45:50] Text

//
// Error

Runner.log().error('Text');
Runner.log().error('Text', new Date());
// [10:45:50] #! Text

//
// Start and End

let start_date = Runner.log().start('Name');
let start_date = Runner.log().start('Name', new Date());
// [10:45:50] Starting `Name`

Runner.log().end('Name', start_date);
Runner.log().end('Name', start_date, new Date());
// [10:45:50] Finished `Name` after 50ms
Runner.log().end('Name', start_date, undefined, 'Suffix');
Runner.log().end('Name', start_date, new Date(), 'Suffix');
// [10:45:50] Finished `Name` after 50ms Suffix
```

Using `log` from `pretty`:

```js
const {log} = require('@insulo/runner/pretty');

//
// Raw

log.raw('Text');
log.raw('Text', new Date());
// [10:45:50] Text

//
// Error

log.error('Text');
log.error('Text', new Date());
// [10:45:50] #! Text

//
// Start and End

let start_date = log.start('Name');
let start_date = log.start('Name', new Date());
// [10:45:50] Starting `Name`

log.end('Name', start_date);
log.end('Name', start_date, new Date());
// [10:45:50] Finished `Name` after 50ms
log.end('Name', start_date, undefined, 'Suffix');
log.end('Name', start_date, new Date(), 'Suffix');
// [10:45:50] Finished `Name` after 50ms Suffix
```

## Licence

This project is free software distributed under the terms of two licences, the CeCILL-C and the GNU Lesser General Public License. You can use, modify and/ or redistribute the software under the terms of CeCILL-C (v1) for Europe or GNU LGPL (v3) for the rest of the world.

This file and the LICENCE.* files need to be distributed and not changed when distributing.
For more informations on the licences which are applied read: [LICENCE.md](LICENCE.md)


# Copyright

    2018 | bemit UG (haftungsbeschränkt) - project@bemit.codes
    Author: Michael Becker - michael@bemit.codes
