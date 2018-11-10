#!/usr/bin/env node
const yargs = require('yargs');
const colors = require('colors/safe');

const handle = (watch) => {
    const {handle} = require('./handle');
    handle(watch).build().then().catch((err) => {
        console.error(colors.red.underline('!# tasker: handle failed: ' + err));
    });
};

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
            handle(false);
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

            handle(true);
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