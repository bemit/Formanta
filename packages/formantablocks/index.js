const startTime = (id) => {
    // manipulating id for changing output text
    console.time('> ' + id);
};

const endTime = (id) => {
    // manipulating id for changing output text
    console.timeEnd('> ' + id);
};

/**
 * @type {{Config: (module.Config|*), ConfigView: (module.ConfigView|*), Runner: module.Runner, startTime: startTime, endTime: endTime}}
 */
module.exports = {
    Config: require('./src/Config'),
    Runner: require('./src/Runner'),
    startTime,
    endTime,
};