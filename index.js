/**
 * Imports and constants
 */

//@ts-check
exports.handler = handler;

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

/* Array merge helper from https://stackoverflow.com/a/10865042/3834754 */
const mergeArrays = arrayOfArrays => [].concat.apply([], arrayOfArrays);

/* Polyfill Object.values and Object.entries for Node 6.10
    https://github.com/tc39/proposal-object-values-entries/blob/master/polyfill.js
 */
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(O) {
		return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
	};
}
if (!Object.entries) {
	Object.entries = function entries(O) {
		return reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []), []);
	};
}

/**
 * Objects that survive across invocations
 */

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

/**
 * Per-invocation logic
 */

/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context, callback) {
    // Decode and format the incoming records,
    const records = event.Records.map(decode)
    // and discard the ones we can't parse.
    .filter(Boolean);
    
    if (records.length === 0) {
        console.log('No valid records!');
        callback(null, 'Early exit: No valid records');
        return;
    }
    
    // If we're under test, 
    // then the test will pass in stub clients in context.stubs
    const {redisPublisher, postgres, firehose} = getClients(context.stubs);

    // Kick off the publication steps.
    Promise.all([
        pushToFirehose(records, firehose),
        pushToSocketServer(records, postgres, redisPublisher)
    ])
    // Claim victory...
    .then(results => {
        // pushToSocketServer resolves with number of observations published
        const msg = `Published ${results[0]} records, ${results[1]} observations`;
        callback(null, msg)
    })
    // or propagate the error.
    .error(callback);
}

function getClients(stubs={}) {
    // Grab a real client for every needed client that wasn't stubbed.
    const clients = Object.assign({}, stubs);
    for (let clientName of ['postgres', 'firehose', 'redisPublisher']) {
        if (!clients[clientName]) {
            clients[clientName] = clientCache[clientName];
        }
    }
    return clients;
}

/**
 * Extract the base64 data encoded in the kinesis record to an object.
 * Return false if it isn't the format we expect.
 * @return {Object}
 */
function decode(record) {
    let data;
    try {
        data = Buffer.from(record.kinesis.data, 'base64').toString();
        const parsed = JSON.parse(data);
        // Edge case: if meta_id is 0, it will fail this test.
        const valid = ['network', 'node_id', 'sensor', 'data', 'datetime']
                        .every(k => parsed[k]);
        if (!valid) return false;
        return {
            network: parsed.network,
            meta_id: parsed.meta_id,
            node: parsed.node_id,
            sensor: parsed.sensor.toLowerCase(),
            data: parsed.data,
            datetime: parsed.datetime.replace("T", " ")
        }
    } catch (e) {
        console.log(`[index.js] could not decode ${data}: ${e.toString()}`);
        return false;
    }
}

// Returns promise that resolves with number of records published
function pushToFirehose(records, firehose) {
    const payload = {
        Records: records.map(prepRecordForFirehose),
        DeliveryStreamName: FIREHOSE_STREAM_NAME
    };
    return firehose.putRecordBatch(payload).promise()
    .then(() => records.length)
}

function prepRecordForFirehose(o) {
    let row = `${o.network},${o.node},${o.datetime},${o.meta_id},${o.sensor},'${o.data}'\n`;
    // Note that the double quote (") is the Redshift escape character.
    row = row.replace(/"/g, '""').replace(/'/g, '"');
    return {Data: row};
}

/**
 * Returns promise that resolves with number of observations pushed over redis
 */
function pushToSocketServer(records, postgres, publisher) {
    return postgres.query('SELECT sensor_tree();')
    .then(tree => {
        const observationArrays = records.map(format.bind(null, tree))
                                         .filter(Boolean);
        const formattedObservations = mergeArrays(observationArrays);
        if (formattedObservations.length === 0) {
            return Promise.resolve(0); // 0 observations published
        };
        const payload = JSON.stringify(formattedObservations);
        return publisher.publishAsync(REDIS_CHANNEL_NAME, payload)
        .then(() => formattedObservations.length);
    })
}

/**
 * Given a record, split it into an array of observations
 * in a format ready to publish to clients.
 * 
 * @param {*} tree 
 * @param {sensor, node, netork, meta_id, timestamp, data} record
 */
function format(tree, record) {
    // Does this combination of network, node and sensor exist in our metadata?
    const sensorMetadata = extractSensorMetadata(tree, record);
    if (!sensorMetadata) return null;

    // This is the descriptive JSONAPI-like format
    // we want to send to our end users
    const {sensor, node, network} = record;
    const observationTemplate = {
        type: 'sensorObservations',
        attributes: {
            metadata: {
                sensor, node, network,
                meta_id: record.meta_id,
                timestamp: record.timestamp
            }
        }
    };
    /** 
     * We maintain a mapping from Beehive naming to Plenario naming in
     * the sensorMetadata JSON:
     * 
     * {
     *      pressure: "atmospheric_pressure.pressure",
     *      temperature: "temperature.temperature",
     *      internal_temperature: "temperature.internal_temperature"
     * }
     * 
     * where the keys are "nicknames" that Beehive uses,
     * and the values are the features of interest maintained in Apiary.
     * (The part before the dot is the feature of interest name;
     *  the part after the dot is the specific property of the feature.)
     * 
     * The data documents in the record look like:
     * 
     * {
     *      pressure: 12,
     *      temperature: 58
     *      internal_temperature: 103
     * }
     * 
     * So the formatting task is to translate from Beehive nickname 
     * and create a separate observation for each where the metadata is the same,
     * but the observation object is distinct
     * {
     *   metadata: {}
     *   observation: {
     *      feature: temperature,
     *      properties: {temperature: 58, internal_temperature: 103 }
     *  }
     * },
     * { 
     *  metadata: {}
     *  observation: {
     *      feature: atmospheric_pressure,
     *      properties: {pressure: 12}
     *  }
     * }
     * 
     * **/
    
    // Map from feature name to observation object that will go in
    // formatted JSONAPI observation object
    const observations = {};
    for (var beehivePropertyName in record.data) {
        if (!(beehivePropertyName in sensorMetadata)) return false;
        const [feature, property] = sensorMetadata[beehivePropertyName].split('.');
        if (!observations[feature]) {
            observations[feature] = {
                feature,
                properties: {}
            };
        }
        observations[feature].properties[property] = record.data[beehivePropertyName];
    }
    // Return array with one JSONAPI observation object 
    // for each feature present in the record
    return Object.values(observations).map(o => 
        Object.assign({observation: o}, observationTemplate)
    );
}

function extractSensorMetadata(tree, observation) {
    const {network, node, sensor} = observation;
    let sensorMetadata;
    try {
        sensorMetadata = tree[network][node][sensor];    
    }
    catch (e) {}
    // sensorMetadata will be undefined if an exception was thrown 
    // or if the sensor metadata just happened to be undefined
    if (sensorMetadata) {
        return sensorMetadata;
    }
    else {
        console.log(`[index.js validate] could not validate ${JSON.stringify(observation)}`);
        return null;
    }
}