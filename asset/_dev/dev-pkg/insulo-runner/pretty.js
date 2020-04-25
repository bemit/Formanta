const Runner = require('./index');

/*
 * Wraps the Runner in pretty, dsl-like functions, for e.g. cascaded use;
 * default Runner.run* executes everything directly, so every `runSequential` inside a `run` must be wrapped in a closure to pause execution until all are defined and run is executed on the end
 *
 * @example
 * of all exports in one execution definition;
 * where `someFunction`, `someThing` can be: function, function wrapping a promise or just a promise;
 *
 * const {run, sequential, parallel, pipe, log} = require('@insulo/runner/pretty');
 *
 * run(
 *     sequential([
 *         someFunction,
 *         parallel([
 *             pipe([
 *                 someThing0,
 *                 someThing1,
 *             ]),
 *             someThing2
 *         ]),
 *         sequential([
 *             someThing3,
 *             someThing4
 *         ]),
 *         run(
 *             someThing5,
 *             ['param'],
 *             'task-name'
 *         ),
 *         someThing6,
 *     ]),
 *     ['param1', 2],
 *     'task-root-name'
 *
 * )().then(res => {
 *     log.raw('log e.g. the result');
 *     log.raw(res);
 * });
 */

/**
 * @param fn
 * @param params
 * @param name
 * @return {function(): Promise<{}>}
 */
module.exports.run = function run(fn, params = [], name = '') {
    return () => {
        return Runner.run(fn, params, name);
    };
};

/**
 * @param task_def
 * @return {function(): Promise}
 */
module.exports.sequential = function sequential(task_def) {
    return () => {
        return Runner.runSequential(task_def);
    };
};

/**
 * @param task_def
 * @return {function(): Promise}
 */
module.exports.parallel = function parallel(task_def) {
    return () => {
        return Runner.runParallel(task_def);
    };
};

/**
 * @param fn_list
 * @return {function(): Promise<any>}
 */
module.exports.pipe = function parallel(fn_list) {
    return () => {
        return Runner.runPipe(fn_list);
    };
};

/**
 * @type {{
 *  raw: function(string, Date|undefined = undefined, string = ''),
 *  start: function(string, Date|undefined = undefined):Date,
 *  end: function(string, Date, Date|undefined = undefined, string = ''),
 *  error: function(string, Date|undefined),
 *  longDate: function():string
 * }}
 */
module.exports.log = Runner.log();