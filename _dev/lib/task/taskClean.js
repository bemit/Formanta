const fs = require('fs');

const rmdir = (dir) => {
    if(fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
            let cur = dir + '/' + file;
            if(fs.lstatSync(cur).isDirectory()) {
                rmdir(cur);
            } else {
                fs.unlinkSync(cur);
            }
        });
        fs.rmdirSync(dir);
    }
};

/**
 * Deletes folders recursively, accepts a single or an array of folders
 *
 * @param to_del
 *
 * @return {Promise}
 */
module.exports = (to_del) => {
    return new Promise((resolve) => {
        if(!Array.isArray(to_del)) {
            to_del = [to_del];
        }
        to_del.forEach((f) => {
            rmdir(f);
        });
        resolve();
    });
};