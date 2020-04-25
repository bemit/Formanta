// simple test stub

const {expect} = require('chai');

let handle = require('../handle');
let tasker = require('../tasker');

describe('Exists', function() {
    describe('generic existence check', function() {
        it('check module `handle` exports not undefined', function() {
            expect(handle).to.not.equal(undefined);
        });
        it('check module `tasker` exports not undefined', function() {
            expect(tasker).to.not.equal(undefined);
        });
    });
});