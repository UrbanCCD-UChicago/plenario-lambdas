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
            var status = handler(fixtures.authRequest, null, (_, response) => {});
            return expect(status).to.eventually.equal(200);
        });

        it('should respond with a 200 for just a valid network', () => {
            var status = handler(fixtures.authRequestNetwork, null, (_, response) => {});
            return expect(status).to.eventually.equal(200);
        });

        it('should respond with a 200 for just a valid node', () => {
            var status = handler(fixtures.authRequestNode, null, (_, response) => {});
            return expect(status).to.eventually.equal(200);
        });

        it('should respond with a 200 for just a valid sensor', () => {
            var status = handler(fixtures.authRequestSensor, null, (_, response) => {});
            return expect(status).to.eventually.equal(200);
        });

        it('should respond with a 200 for just a valid feature', () => {
            var status = handler(fixtures.authRequestFeature, null, (_, response) => {});
            return expect(status).to.eventually.equal(200);
        });

        it('should respond with a 403 for no channel name', () => {
            var status = handler(fixtures.noAuthRequest, null, (_, response) => {});
            return expect(status).to.eventually.equal(403);
        });

        it('should respond with a 403 for a random channel name', () => {
            var status = handler(fixtures.randomAuthRequest, null, (_, response) => {});
            return expect(status).to.eventually.equal(403);
        });

        it('should respond with a 403 for an invalid channel network', () => {
            var status = handler(fixtures.badAuthRequestNetwork, null, (_, response) => {});
            return expect(status).to.eventually.equal(403);
        });

        it('should respond with a 403 for an invalid channel node', () => {
            var status = handler(fixtures.badAuthRequestNode, null, (_, response) => {});
            return expect(status).to.eventually.equal(403);
        });

        it('should respond with a 403 for an invalid channel sensor', () => {
            var status = handler(fixtures.badAuthRequestSensor, null, (_, response) => {});
            return expect(status).to.eventually.equal(403);
        });

        it('should respond with a 403 for an invalid channel feature', () => {
            var status = handler(fixtures.badAuthRequestFeature, null, (_, response) => {});
            return expect(status).to.eventually.equal(403);
        });
    });
});
