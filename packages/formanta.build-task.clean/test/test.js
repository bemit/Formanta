// simple test stub
const fs = require('fs');

const {expect} = require('chai');

let clean = require('../index');

const single = __dirname + '/../test-data/folder1';
const multiple = [
    __dirname + '/../test-data/folder2',
    __dirname + '/../test-data/folder3',
    __dirname + '/../test-data/folder4'
];

const mkdir = (dir) => {
    try {
        fs.mkdirSync(dir);
    } catch(err) {
        // fail silent, catched by asserts
    }
};

mkdir(__dirname + '/../test-data');
mkdir(single);
multiple.forEach(mkdir);

describe('Clean', function() {
    describe('deleteSingle', function() {
        it('test folder exist', function() {
            expect(fs.existsSync(single)).to.equal(true);
        });

        it('test delete a single folder', function(done) {
            clean(single).then(() => {
                expect(fs.existsSync(single)).to.equal(false);
                done();
            });
        });
    });
    describe('deleteMultiple', function() {
        it('test folders exist', function() {
            multiple.forEach(dir => {
                expect(fs.existsSync(dir)).to.equal(true);
            });
        });

        it('should delete multiple folders', function(done) {
            clean(multiple).then(() => {
                multiple.forEach(dir => {
                    expect(fs.existsSync(dir)).to.equal(false);
                });
                done();
            });
        });
    });
});