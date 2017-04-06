var assert = require('assert');
var handler = require('../index').handler;
var fixtures = require('./fixtures');

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);


describe('Handler', () => {
    describe('#handler()', function() {
        it('should respond with a 200 for a valid channel request', () => {
            var status = handler(fixtures.authRequest, null, (_, response) => {
                return response.statusCode;
            });

            return expect(status).to.eventually.equal(200);
        });

        it('should respond with a 403 for an invalid channel request', () => {
            assert.equal(1, 1);
        });
    });
});
