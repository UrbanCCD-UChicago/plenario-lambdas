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
const REDIS_CHANNEL_NAME = 'plenario_observations';
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT || 'localhost';

/* Keep references to connections in global scope
   so that we can hold on to connections across function invocations.
   And create the clients lazily in case we don't end up needing them
   (like in unit tests)
*/
const clientCache = {
    get firehose() {
        if (!this._firehoseClient) {
            this._firehoseClient = new aws.Firehose();
        }
        return this._firehoseClient;
    },
    /**
     * pg client constructor uses env variables by default 
     * (https://node-postgres.com/api/client):
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
    get postgres() {
        if (!this._postgresClient) {
            this._postgresClient = new pg.Client({});
        }
        return this._postgresClient;
    },

    get redisPublisher() {
        if (!this._redisClient) {
            this._redisClient = redis.createClient({
                host: REDIS_ENDPOINT, 
                port: 6379
            });
        }
        return this._redisClient;
    }
};

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
    
    // If we're under test, 
    // then the test will pass in stub clients in context.stubs
    const {stubs} = context;
    let clientSource = stubs ? stubs : clientCache;
    const {redisPublisher, postgres, firehose} = clientSource;

    // Kick off the publication steps.
    Promise.all([
        pushToFirehose(observations, firehose),
        pushToSocketServer(observations, postgres, redisPublisher)
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
    return postgres.query('SELECT sensor_tree();')
    .then(tree => {
        observations = observations.map(validate.bind(null, tree)).filter(Boolean);
        publisher.publish(REDIS_CHANNEL_NAME, JSON.stringify(observations));
    });
}

function validate(tree, observation) {
    const {network, node, sensor} = observation;
    let sensorMetadata;
    try {
        sensorMetadata = tree[network][node][sensor];    
    }
    catch (e) {
         // If we failed to traverse that deep, observation must be invalid.
        return false;
    }
    
    const formatted = {};
    for (var beehivePropertyName in observation.data) {
        if (!(beehivePropertyName in sensorMetadata)) return false;
        const [feature, property] = sensorMetadata[beehivePropertyName].split('.');
        if (!formatted[feature]) {
            formatted[feature] = {};
        }
        formatted[feature][property] = observation.data[beehivePropertyName];
    }
    return formatted;
}