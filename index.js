//@ts-check

/* Make sure all io-performing libraries return promises */
const Promise = require('bluebird');
// https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
const aws = require('aws-sdk');
aws.config.setPromisesDependency(Promise);
// https://github.com/NodeRedis/node_redis#promises
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
// pg uses promises natively
const pg = require('pg');

/* Constants and config */
const FIREHOSE_STREAM_NAME = 'DatabaseStream';
const SOCKET_CHANNEL_NAME = 'plenario_observations';
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT || 'localhost';


exports.handler = handler;

/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context, callback) {
    // Decode and format the incoming observations,
    const observations = event.Records.map(decode)
    // and discard the ones we can't parse.
    .filter(Boolean);
    
    if (observations.length === 0) {
        callback(null, 'Early exit: No valid records');
        return;
    }
    
    // If we're under test, then the test will pass in stub clients this way.
    const {stubs} = context;
    const clients = obtainClients(stubs);

    // Kick off the publication steps.
    Promise.all([
        pushToFirehose(observations, clients.firehose),
        pushToSocketServer(observations, clients.postgres, clients.redisPublisher)
    ])
    // Claim victory...
    .then(() => callback(null, `Published ${observations.length} records`))
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

// Returns success or error promise.
function pushToFirehose(observations, firehose) {
    const payload = {
        Records: observations.map(prepObservationForFirehose),
        DeliveryStreamName: FIREHOSE_STREAM_NAME
    };
    return firehose.putRecordBatch(payload).promise();
}

function prepObservationForFirehose(o) {
    let row = `${o.network},${o.node},${o.datetime},${o.meta_id},${o.sensor},'${o.data}'\n`;
    // Not sure what's going on with this escaping... ask Jesse.
    row = row.replace(/"/g, '""').replace(/'/g, '"');
    return {Data: row};
}

// Returns success or error promise.
function pushToSocketServer(observations, postgres, publisher) {
    // Grab network layout tree
    // Validate observations
    // Push in a big batch to socket server
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
        // Works automagically in the lambda runtime.
        // Uses your ~/.aws config locally.
        firehose = new aws.Firehose();
    }
    if (!redisPublisher) {
        redisPublisher = redis.createClient({
            host: REDIS_ENDPOINT, 
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
