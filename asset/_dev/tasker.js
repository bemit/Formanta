#!/usr/bin/env node
const serve = (p) => {
};

const yargs = require('yargs');

let tasks = {
    'build': {
        desc: 'build asset files',
        args: (yargs) => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info('tasker: starting `build`');
            }

            const handle = require('./handle');
            handle(false);
        }
    },
    'sass [file] <watch> <outputStyle>': {
        desc: 'build sass files',
        args: (yargs) => {
            yargs
                .positional('file', {
                    describe: 'which file should be rendered',
                    default: ''
                })
                .positional('watch', {
                    describe: 'if also should add file watcher to files',
                    default: true
                })
                .positional('outputStyle', {
                    describe: 'in which style the css will be rendered'
                })
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info('tasker: sass build of ' + argv.file);
            }
            const {handleSass} = require('./handleSass');
            handleSass(argv.file, argv.watch, argv.outputStyle).then((d) => {
                console.log('d . d . d . d . d . d . d . d . d . d . d . d . d . d . d');
                console.log(d);
            });
        }
    }
};

for(let t_expr in tasks) {
    if(tasks.hasOwnProperty(t_expr)) {
        yargs.command(t_expr, tasks[t_expr].desc, tasks[t_expr].args, tasks[t_expr].task)
    }
}

yargs.option('verbose', {
    alias: 'v',
    default: true
}).argv;

module.exports = yargs;