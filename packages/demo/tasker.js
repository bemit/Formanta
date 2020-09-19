const yargs = require('yargs');
const colors = require('colors/safe');

// get the task creator, receives `watch` and returns all needed tasks
const {handle} = require('./handle');

const Runner = require('@insulo/runner');

const failForCI = (code = 1) => {
    if(process.env.CI) {
        // eslint-disable-next-line no-process-exit
        process.exit(code);
    }
};

/**
 * Defining public tasks, see `handle.js` for the internal tasks
 *
 * @type {*}
 */
let tasks = {
    'clean': {
        desc: 'clean dist files',
        args: () => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `clean`'));
            }
            // handle with `no-watch` and clean defined folders
            handle(false)
                .clean()
                .then()
                .catch((err) => {
                    Runner.log().error('tasker.tasks.clean: handle failed with error:: ' + err);
                    failForCI();
                });
        }
    },
    'twig': {
        desc: 'build template files',
        args: () => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `twig`'));
            }
            handle(false)
                .twig()
                .then()
                .catch((err) => {
                    Runner.log().error('tasker.tasks.twig: handle failed with error:: ' + err);
                    failForCI();
                });
        }
    },
    'build': {
        desc: 'build asset files',
        args: () => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `build`'));
            }
            // handle with `no-watch` and building everything
            handle(false)
                .build()
                .then()
                .catch((err) => {
                    Runner.log().error('tasker.tasks.build: handle failed with error:: ' + err);
                    failForCI();
                });
        }
    },
    'watch': {
        desc: 'build and watch asset files',
        args: () => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `watch`'));
            }

            // handle with `watch` and building everything
            handle(true)
                .build()
                .then()
                .catch((err) => {
                    Runner.log().error('tasker.tasks.watch: handle failed with error:: ' + err);
                    failForCI();
                });
        }
    },
    'archive': {
        desc: 'archive files, rebuilds and then packs all src and dist files without tooling dependencies, backup backup backup!',
        args: () => {
        },
        task: (argv) => {
            if(argv.verbose) {
                console.info(colors.gray.italic('tasker.js: starting `archive`'));
            }

            // handle with no `watch`, building everything, then copy and archive current src and dist without build tools and .git and so on
            handle(false)
                .archive()
                .then()
                .catch((err) => {
                    Runner.log().error('tasker.tasks.archive: handle failed with error:: ' + err);
                    failForCI();
                });
        }
    },
    'list task': {
        desc: 'Listing all defined tasks that are published from handle.js',
        args: () => {
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
        yargs.command(t_expr, tasks[t_expr].desc, tasks[t_expr].args, tasks[t_expr].task);
    }
}

yargs.option('verbose', {
    alias: 'v',
    default: true
}).argv;
