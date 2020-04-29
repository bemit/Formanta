const {expect} = require('chai');

let Runner = require('../index');

describe('Exists', () => {
    describe('generic existence check', () => {
        it('check module exports not undefined', () => {
            expect(Runner).to.not.equal(undefined);
        });
        it('check Runner.log defined', () => {
            expect(Runner.log).to.not.equal(undefined);
            let log = Runner.log();
            expect(log.raw).to.not.equal(undefined);
            expect(log.error).to.not.equal(undefined);
            expect(log.start).to.not.equal(undefined);
            expect(log.end).to.not.equal(undefined);
        });
    });
});

const testFn1 = () => {
    return true;
};

const testFn2 = () => {
    return false;
};

const testFnPromise1 = () => new Promise(resolve => {
    resolve(true);
});

const testFnPromise2 = () => new Promise(resolve => {
    resolve(false);
});

const testPromise1 = new Promise(resolve => {
    resolve(true);
});

const testPromise2 = new Promise(resolve => {
    resolve(false);
});

describe('Execution Test', () => {
    describe('execute single function', () => {
        it('Runner.run', () => {
            return Runner.run(testFn1, [], '', false).then((res) => {
                expect(res).to.equal(true);
            });
        });
        it('Runner.runSequential', () => {
            return Runner.runSequential([testFn1]).then((res) => {
                expect(res).to.eql([true]);
            });
        });
        it('Runner.runParallel', () => {
            return Runner.runParallel([testFn1]).then((res) => {
                expect(res).to.eql([true]);
            });
        });
    });

    describe('execute single Function Promise', () => {
        it('Runner.run', () => {
            return Runner.run(testFnPromise1, [], '', false).then((res) => {
                expect(res).to.equal(true);
            });
        });
        it('Runner.runSequential', () => {
            return Runner.runSequential([testFnPromise1]).then((res) => {
                expect(res).to.eql([true]);
            });
        });
        it('Runner.runParallel', () => {
            return Runner.runParallel([testFnPromise1]).then((res) => {
                expect(res).to.eql([true]);
            });
        });
    });

    describe('execute single Promise', () => {
        it('Runner.run', () => {
            return Runner.run(testPromise1, [], '', false).then((res) => {
                expect(res).to.equal(true);
            });
        });
        it('Runner.runSequential', () => {
            return Runner.runSequential([testPromise1]).then((res) => {
                expect(res).to.eql([true]);
            });
        });
        it('Runner.runParallel', () => {
            return Runner.runParallel([testPromise1]).then((res) => {
                expect(res).to.eql([true]);
            });
        });
    });

    describe('execute multiple function', () => {
        it('Runner.runSequential', () => {
            return Runner.runSequential([testFn1, testFn2]).then((res) => {
                expect(res).to.eql([true, false]);
            });
        });
        it('Runner.runParallel', () => {
            return Runner.runParallel([testFn1, testFn2]).then((res) => {
                expect(res).to.eql([true, false]);
            });
        });
        it('Runner.runPipe', () => {
            // todo: really pass-through some data
            return Runner.runPipe([testFn1, testFn2]).then((res) => {
                expect(res).to.eql(false);
            });
        });
    });

    describe('execute multiple Function Promise', () => {
        it('Runner.runSequential', () => {
            return Runner.runSequential([testFnPromise1, testFnPromise2]).then((res) => {
                // promise 2 has a timeout and should be returned after the first one
                expect(res).to.eql([true, false]);
            });
        });
        it('Runner.runParallel', () => {
            return Runner.runParallel([testFnPromise1, testFnPromise2]).then((res) => {
                expect(res).to.eql([true, false]);
            });
        });
        it('Runner.runPipe', () => {
            // todo: really pass-through some data
            return Runner.runPipe([testFnPromise1, testFnPromise2]).then((res) => {
                expect(res).to.eql(false);
            });
        });
    });

    describe('execute multiple Promise', () => {
        it('Runner.runSequential', () => {
            return Runner.runSequential([testPromise1, testPromise2]).then((res) => {
                expect(res).to.eql([true, false]);
            });
        });
        it('Runner.runParallel', () => {
            return Runner.runParallel([testPromise1, testPromise2]).then((res) => {
                expect(res).to.eql([true, false]);
            });
        });
        it('Runner.runPipe', () => {
            // todo: really pass-through some data
            return Runner.runPipe([testPromise1, testPromise2]).then((res) => {
                expect(res).to.eql(false);
            });
        });
    });
});