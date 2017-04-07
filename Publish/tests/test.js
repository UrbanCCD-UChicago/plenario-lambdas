var assert = require('assert');
var handler = require('../index').handler;
var fixtures = require('./fixtures');

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);


describe('Handler', () => {
    describe('#handler()', function() {
        it('should only allow 14 records to pass through', () => {
            var records = handler(fixtures.records, null);
            return expect(records).to.eventually.deep.equal([20, 14]);
        }).timeout(0);
    });
});
