#!/usr/bin/env node
const yargs = require('yargs');
const colors = require('colors/safe');

const Runner = require('./lib/Runner');

const {handle} = require('./handle');

/**
 * Defining tasks
 *
 * @type {*}
 */
let tasks = {
    'clean': {
        desc: 'clean dist files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `clean`'));
            }
            // handle with `no-watch` and building everything
            handle(false).clean().then().catch((err) => {
                console.error(colors.red.underline('!# tasker.tasks.clean: handle failed: ' + err));
            });
        }
    },
    'build': {
        desc: 'build asset files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `build`'));
            }
            // handle with `no-watch` and building everything
            handle(false).build().then().catch((err) => {
                console.error(colors.red.underline('!# tasker.tasks.build: handle failed: ' + err));
            });
        }
    },
    'build-no-media': {
        desc: 'build asset files without media files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `build-no-media`'));
            }
            // handle with `no-watch` and building everything
            handle(false).build_no_media().then().catch((err) => {
                console.error(colors.red.underline('!# tasker.tasks.build-no-media: handle failed: ' + err));
            });
        }
    },
    'watch': {
        desc: 'build and watch asset files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `watch`'));
            }

            // handle with `watch` and building everything
            handle(true).build().then().catch((err) => {
                console.error(colors.red.underline('!# tasker.tasks.watch: handle failed: ' + err));
            });
        }
    },
    'archive': {
        desc: 'archive files, rebuilds and then packs all src and dist files without tooling dependencies, backup backup backup!',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `archive`'));
            }

            // handle with no `watch`, building everything, then copy and archive current src and dist without build tools and .git and so on
            handle(false).archive().then().catch((err) => {
                console.error(colors.red.underline('!# tasker.tasks.archive: handle failed: ' + err));
            });
        }
    },
    'list task': {
        desc: 'Listing all defined tasks that are published from handle.js',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `list task`'));
            }

            let handle_tasks = Object.getOwnPropertyNames(handle(false));

            Runner.log().raw('tasker.js: from ' + colors.underline('handle.js') + ' published tasks ' + colors.grey('not for CLI usage'));
            Runner.log().raw(colors.blue(handle_tasks.join(', ')));
        }
    }
};


// Registering tasks

for(let t_expr in tasks) {
    if(tasks.hasOwnProperty(t_expr)) {
        yargs.command(t_expr, tasks[t_expr].desc, tasks[t_expr].args, tasks[t_expr].task)
    }
}

yargs.option('verbose', {
    alias: 'v',
    default: true
}).argv;