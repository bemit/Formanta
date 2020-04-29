// simple test stub

const {expect, should} = require('chai');

let archive = require('../index');

const base = __dirname + '/../';
const exclude = [
    '.git',
    'node_modules'
];
const dist = __dirname + '/../archive';
const option = {
    pack: 'zip', // use zip or targz
    delete_auto: true, // delete after packing (a pack handler must been set)
    debug: false
};


describe('Exists', function() {
    describe('generic existence check', function() {
        it('check module exports not undefined', function() {
            expect(archive).to.not.equal(undefined);
        });
    });
});