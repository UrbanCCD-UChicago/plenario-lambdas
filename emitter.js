const Promise = require('bluebird');
const {handler} = require('./index.js');

const {sampleObservations, sampleTree} = require('./fixtures');

/* 
    Mock out everything _except_ for the redis client.
    That will let you use this server to _just_ test interaction with the socket
    server in your laptop dev environment.
  */

// The lambda calls the postgres client's #query method
// with a string calling the sensor_tree() stored procedure.
// We just need to resolve with sensor tree JSON.
const postgresStub = {
    query(queryText) {
        return Promise.resolve(sampleTree);
    }
}

// The lambda calls the firehose client's #putRecordBatch method,
// and expects to chain a "#promise" call.
// It only expects that the #promise call resolves.
const firehoseStub = {
    putRecordBatch(records) {
        return {
            promise() {
                return Promise.resolve();
            }
        }
    }
}

// Try sending a fesh batch of observations every 15 seconds

const recordsAsEvent = {
    Records: sampleObservations.map(o => ({
        kinesis: {
            data: new Buffer(JSON.stringify(o), 'binary').toString('base64')
        }
    }))
}

function sendABatch() {
    const context = {
        stubs: {
            postgres: postgresStub,
            firehose: firehoseStub
        }
    }
    handler(recordsAsEvent, context, console.log);
}

setInterval(sendABatch, 1000);

