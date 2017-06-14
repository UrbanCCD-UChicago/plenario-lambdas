'use strict';

var http = require('http');
var Pusher = require('pusher');

var Network = require('./model/network');
var Node = require('./model/node');
var Sensor = require('./model/sensor');
var Feature = require('./model/feature');
require('./model/relations');


// https://pusher.com/docs/server_api_guide/interact_rest_api
var pusher = new Pusher({
    appId: process.env.PUSHER_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET
});


/** 
 * Reverse object keys and values.
 */
function reverse(o) {
  console.log('[index.js] reverse');
  console.time('[index.js] reverse');
  var result = {};
  for(var key in o) {
    result[o[key]] = key;
  }
  console.timeEnd('[index.js] reverse');
  return result;
}


/**
 * Extract the base64 data encoded in the kinesis record to an object. 
 * @return {Object}
 */
function decode(record) {
    console.log('[index.js] decode');
    console.time('[index.js] decode');
    var data = new Buffer(record.kinesis.data, 'base64').toString();
    try {
        return JSON.parse(data);
    } catch (SyntaxError) {
        return {};
    }
    console.timeEnd('[index.js] decode');
}


/**
 * If the sensor maps to an available feature of interest, provide it, otherwise 
 * reject it as null.
 * @return {Object}
 */ 
function format(record, networkMap) {
    var network = record.network;
    var node = record.node;
    var sensor = record.sensor;

    var networkMetadata = networkMap[network];

    if (!networkMetadata) {
        return null;
    }
    
    var nodeMetadata = networkMetadata[node];
    
    if (!nodeMetadata) {
        return null;
    }
    
    var sensorMetadata = nodeMetadata[sensor];

    if (!sensorMetadata) {
        return null;
    }

    var mapping = sensorMetadata;
    var feature = '';
    
    for (var property in record.data) {
        if (!(property in mapping)) {
            return null;
        }

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
    console.log('[index.js] emit');
    console.time('[index.js] emit');
    records.forEach((record) => {
        if (!record) return;
        
        channels.forEach((channel) => {
            var message = { message: JSON.stringify(record) };
            
            if (match(record, channel)) {
                pusher.trigger(channel, 'data', message);
            }
        });
    });
    console.timeEnd('[index.js] emit');
}


/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context) {
    console.log('[index.js] handler');
    console.time('[index.js] handler');
    var records = event.Records.map(decode);

    var promise = getSensorNetworkTree().then((networkMap) => {
        records = records.map((record) => format(record, networkMap));
        var valids = records.filter(r => r);
        
        pusher.get({path: '/channels'}, (error, request, response) => {
            console.log(response.body);
            var result = JSON.parse(response.body);
            var channels = Object.keys(result.channels);
            emit(records, channels);
        });

        console.timeEnd('[index.js] handler');
        return [records.length, valids.length];
    });

    return promise;
}


exports.handler = handler;


function extractFeatures(sensors) {
    console.log('[index.js] extractFeatures');
    console.time('[index.js] extractFeatures');
    var result = {};
    for (var sensor of sensors) {
        result[sensor.name] = sensor.observed_properties;
    }
    console.timeEnd('[index.js] extractFeatures');
    return result;
}


function extractSensors(nodes) {
    console.log('[index.js] extractSensors');
    console.time('[index.js] extractSensors');
    var result = {};
    for (var node of nodes) {
        result[node.name] = extractFeatures(node.sensor__sensor_metadata);
    }
    console.timeEnd('[index.js] extractSensors');
    return result;
}


function getSensorNetworkTree() {
    console.log('[index.js] getSensorNetworkTree');
    console.time('[index.js] getSensorNetworkTree');

    var networkNames = [];
    var promises = [];

    return Network.findAll().then( networks => {
        for (var network of networks) {
            networkNames.push(network.name);
            promises.push(network.getNodes({ include: [{ model: Sensor }]}));
        }

        return Promise.all(promises);
    }).then( results => {
        var tree = {};
        for (var i = 0; i < results.length; i++) {
            tree[networkNames[i]] = extractSensors(results[i]);
        }

        console.timeEnd('[index.js] getSensorNetworkTree');
        return tree;
    });
}

