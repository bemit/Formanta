#!/usr/bin/env node
const yargs = require('yargs');
const colors = require('colors/safe');

const {handle} = require('./handle');

/**
 * Defining tasks
 *
 * @type {*}
 */
let tasks = {
    'build': {
        desc: 'build asset files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.green.italic('tasker: starting `build`'));
            }
            // handle with `no-watch` and building everything
            handle(false).build().then().catch((err) => {
                console.error(colors.red.underline('!# tasker: handle failed: ' + err));
            });
        }
    },
    'build-no-media': {
        desc: 'build asset files without media files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.green.italic('tasker: starting `build-no-media`'));
            }
            // handle with `no-watch` and building everything
            handle(false).build_no_media().then().catch((err) => {
                console.error(colors.red.underline('!# tasker: handle failed: ' + err));
            });
        }
    },
    'watch': {
        desc: 'build and watch asset files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.green.italic('tasker: starting `watch`'));
            }

            // handle with `watch` and building everything
            handle(false).build().then().catch((err) => {
                console.error(colors.red.underline('!# tasker: handle failed: ' + err));
            });
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