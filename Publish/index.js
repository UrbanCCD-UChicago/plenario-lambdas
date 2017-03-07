var http = require('http');
var Pusher = require('pusher');


// https://pusher.com/docs/server_api_guide/interact_rest_api
var pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET
});


/** 
 * Reverse object keys and values.
 */
function reverse(o) {
  var result = {};
  for(var key in o) {
    result[o[key]] = key;
  }
  return result;
}


/**
 * Extract the base64 data encoded in the kinesis record to an object. 
 * @return {Object}
 */
function decode(record) {
    var data = new Buffer(record.kinesis.data, 'base64').toString();
    try {
        return JSON.parse(data);
    } catch (SyntaxError) {
        return {};
    }
}


/**
 * If the sensor maps to an available feature of interest, provide it, otherwise 
 * reject it as null.
 * @return {Object}
 */ 
function format(record, networkMap) {
    var node = record.node;
    var sensor = record.sensor;
    
    var nodeMetadata;
    var sensorMetadata;
    
    nodeMetadata = networkMap[node];
    
    if (!nodeMetadata) return null;
    
    sensorMetadata = nodeMetadata[sensor];

    if (!sensorMetadata) return null;

    var mapping = reverse(sensorMetadata);
    var feature = '';
    
    for (var property in record.data) {
        if (!(property in mapping)) return null;

        feature = mapping[property].split('.')[0];
        var formalName = mapping[property].split('.')[1];
        record.data[formalName] = record.data[property];
        if (formalName != property) {
            delete record.data[property];
        }
    }
    
    record.feature = feature;
    record.results = record.data;
    delete record.data;
    return record;
}


/**
 * Determine if a record can be published to a channel.
 * @return {Boolean}
 */
function match(record, channel) {
    var prefix = channel.split('-')[0];
    channel = channel.split('-')[1];

    if (prefix != 'private') return false;
    
    var channelParts = channel.split(';');
    var network = channelParts[0];
    var node = channelParts[1];
    var sensor = channelParts[2];
    var feature = channelParts[3];
    
    if (network != record.network) return false;
    if (node && record.node != node) return false;
    if (sensor && record.sensor != sensor) return false;
    if (feature && record.feature != feature) return false;
    
    return true;
}


/**
 * Iterate through incoming records and emit to the appropriate channels.
 */
function emit(records, channels) {
    records.forEach((record) => {
        if (!record) return;
        
        channels.forEach((channel) => {
            var message = { message: JSON.stringify(record) };
            
            if (match(record, channel)) {
                pusher.trigger(channel, 'data', message);
            }
        });
    });
}


/**
 * Get sensor network metadata from plenario.
 */
function getNetworkMap() {
    return new Promise((resolve, reject) => {
        http.get(process.env.PLENARIO_MAP_URI, (response) => {
            var chunks = '';
            response.on('data', (chunk) => chunks += chunk);
            response.on('end', () => resolve(JSON.parse(chunks)));
        });
    });
}


/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context) {
    var records = event.Records.map(decode);

    getNetworkMap().then((networkMap) => {
        records = records.map((record) => format(record, networkMap));
        
        pusher.get({path: '/channels'}, (error, request, response) => {
            var result = JSON.parse(response.body);
            var channels = Object.keys(result.channels);
            emit(records, channels);
        });
    });
}


exports.handler = handler;
