// simple test stub

const {expect} = require('chai');

let toTest = require('../index');

describe('Exists', function() {
    describe('generic existence check', function() {
        it('check module exports not undefined', function() {
            expect(toTest).to.not.equal(undefined);
        });
        it('check module exports HandlerBase', function() {
            expect(toTest.HandlerBase).to.not.equal(undefined);
        });
        it('check module exports MediaOptimizer', function() {
            expect(toTest.MediaOptimizer).to.not.equal(undefined);
        });
    });
});