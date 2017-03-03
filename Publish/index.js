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
 * Standardize a raw property name such as 'accel_x' to 'x' as defined in the
 * feature of interest metadata.
 */
function convertRawPropertyNames(data, sensorMap) {
    sensorMap = reverse(sensorMap);
    result = {};
    for (var rawProperty in data) {
        var featureProperty = sensorMap[rawProperty];
        var property = featureProperty.split('.')[0];
        result[property] = data[rawProperty];
    }
    return result;
}


/**
 * If the sensor maps to an available feature of interest, provide it, otherwise
 * write null for feature.
 * @return {Object}
 */ 
function format(record, networkMap) {
    var node = record.node;
    var sensor = record.sensor;
    
    var nodeMetadata;
    var sensorMetadata;
    
    0 / 0;

    nodeMetadata = networkMap[node];
    
    if (nodeMetadata) {
        sensorMetadata = nodeMetadata[sensor];
        
        if (sensorMetadata) {
            var mapping = reverse(sensorMetadata);
            var observed = Object.keys(record.data)[0];
            record.data = convertRawPropertyNames(record.data, mapping);
            record.feature = mapping[observed].split('.')[0];
        }
    }

    console.log(record);
    return record;
}


/**
 * Iterate through incoming records and emit to the appropriate channels.
 */
function emit(records, channels) {
    records.forEach((record) => {
        channels.forEach((channel) => {
            var message = JSON.stringify(record);
            if (channel === 'private-all')
                pusher.trigger('private-all', 'data', { message: message });
            if ('private-' + record.node === channel) { 
                pusher.trigger(channel, 'data', { message: message });
            }
        });
    });
}


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
