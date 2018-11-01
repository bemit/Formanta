/**
 * @type {Runner}
 */
const Runner = require('./Runner');

const {handleSass} = require('./handleSass');

/**
 * @param {Boolean} watch
 */
module.exports = (watch = true) => {
    let task = {
        sass: new Promise((resolve) => {
            console.log(__dirname);

            let run = new Runner(handleSass, [
                __dirname + '/../',
                watch
            ], 'sass');

            run.run().then((ee) => {
                console.log('ee ee ee ee ee ee ee ');
                console.log(ee);
                resolve(ee);
            });
        }),
        clean: new Promise((resolve) => {
            resolve();
        })
    };

    let task_group = {
        style: [task.clean, task.sass]
    };

    let run = [
        ...task_group.style
    ];

    return Promise.all(run);
};