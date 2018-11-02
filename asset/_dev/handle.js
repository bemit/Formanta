/**
 * @type {Runner}
 */
const Runner = require('./Runner');

/**
 * @param {boolean} watch
 *
 * @return {{build: (function(): Promise)}} add all tasks to choose from to this array to have autocompletion in tasker.js
 */
module.exports.handle = (watch = true) => {
    /**
     * Define single tasks in this object, key should be name and will be used to access it in groups and runner
     *
     * @type {Object} each item should be an simple array function, including the needed module for the wanted task, it should return a Promise that is created from `Runner.run`
     */
    let task = {
        sass: () => {
            return new Promise((resolve) => {
                Runner.run(
                    require('./handleSass'), [
                        __dirname + '/../style/main.scss', // entry
                        __dirname + '/../../build/style/main.css', // output
                        watch
                    ],
                    'sass'
                ).then(result => {
                    resolve(result)
                });
            })
        },
        sass_clean: () => {
            return new Promise((resolve) => {
                console.log('sass_clean!');
                resolve('sassy cleany');
            })
        },
        js: () => {
            return new Promise((resolve) => {
                console.log('js js js!');
                resolve('jsy cleany');
            })
        }
    };

    /**
     * Grouping single tasks into groups
     *
     * @type {*}
     */
    let task_group = {
        style: () => {
            return Runner.runSequential([
                task.sass_clean,
                task.sass
            ])
        }
    };

    /**
     * Final run definition, mixing `task_group` and single `task`, indexing with the public name of the task
     */
    return {
        build: () => {
            return Runner.runParallel([
                task_group.style,
                task.js,
            ])
        }
    }
};