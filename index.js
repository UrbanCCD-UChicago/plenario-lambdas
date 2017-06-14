//@ts-check

// Make sure all io-performing libraries return promises
const Promise = require('bluebird');

// https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
const aws = require('aws-sdk');
aws.config.setPromisesDependency(Promise);

// https://github.com/NodeRedis/node_redis#promises
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);

// pg uses promises natively
const pg = require('pg');

exports.handler = handler;

/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context, callback) {
    // Decode and format the incoming observations,
    // discarding the ones we can't parse.
    const decodedRecords = event.Records.map(decode).filter(Boolean);
    if (decodedRecords.length === 0) {
        callback(null, 'Early exit: No valid records');
        return;
    }
    // If we're under test, then the test will pass in stub clients this way.
    const {stubs} = context;
    const clients = obtainClients(stubs);

    // Kick off the publication steps.
    Promise.all([pushToFirehose(), pushToSocketServer()])
    // Claim victory...
    .then(() => callback(null, `Published ${decodedRecords.length} records`))
    // or propagate the error.
    .error(callback);
}

/**
 * Extract the base64 data encoded in the kinesis record to an object.
 * Return false if it isn't the format we expect.
 * @return {Object}
 */
function decode(record) {
    try {
        const data = Buffer.from(record.kinesis.data, 'base64').toString();
        const parsed = JSON.parse(data);
        const valid = ['network', 'meta_id', 'node_id', 'sensor', 'data', 'datetime']
                        .every(k => parsed[k]);
        if (!valid) return false;
        return {
            network: parsed.network,
            meta_id: parsed.meta_id,
            node: parsed.node_id,
            sensor: parsed.node.toLowerCase(),
            data: parsed.data,
            datetime: parsed.datetime.replace("T", " ")
        }
    } catch (e) {
        console.log(`[index.js] could not decode ${record.kinesis.data}: ${e.toString()}`);
        return false;
    }
}

function hasRightProperties(observation) {
    if (!observation) return false;
    return ['network', 'meta_id', 'node_id', 'sensor', 'data', 'datetime']
        .every(k => observation[k]);
} 

// Returns success or error promise.
function pushToSocketServer() {
    // Grab network layout tree
    // Validate observations
    // Push in a big batch to socket server
}


// Returns success or error promise.
function pushToFirehose() {
    // Do message conversion
    // push in big batch
}

/**
 * Returns {
 *  redisPublisher: client with publish method,
 *  postgres: client with a query method that returns a promise(result),
 *  firehose: client with putRecordBatch method
 * }
 */
function obtainClients(stubs={}) {
    let {redisPublisher, postgres, firehose} = stubs;
    if(!firehose) {
        firehose = Promise.promisifyAll(new aws.Firehose());
    }
    if (!redisPublisher) {
        redisPublisher = redis.createClient({
            host: 'localhost', 
            port: 6379
        });
    }
    /**
     * Uses env variables by default (https://node-postgres.com/api/client):
     * 
     * config = {
        user?: string, // default process.env.PGUSER || process.env.USER
        password?: string, //default process.env.PGPASSWORD
        database?: string, // default process.env.PGDATABASE || process.env.USER
        port?: number, // default process.env.PGPORT
        connectionString?: string // e.g. postgres://user:password@host:5432/database
        ssl?: any, // passed directly to node.TLSSocket
        types?: any, // custom type parsers
        }
     */
    if (!postgres) {
        postgres = new pg.Client({});
    }
    return {redisPublisher, postgres, firehose};
}
