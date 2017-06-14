//@ts-check

const assert = require('assert');
const chai = require('chai');  
const sinon = require('sinon');
const fixtureEvent = require('./fixtures').event;
const handler = require('../index').handler;

describe('Handler', function() {
    describe('#handler()', function() {
        it('should publish to redis',function() {
          const redisSpy = {publish: sinon.spy()};
          const shouldBeCalled = sinon.spy();
          const stubs = {redis: {publish: shouldBeCalled}};
          handler(fixtureEvent, {stubs}, makeAssertions);
          function makeAssertions() {
            assert(shouldBeCalled.called);
          }
        })  
    });
});