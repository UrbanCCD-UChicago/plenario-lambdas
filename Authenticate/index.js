'use strict';

var Network = require('./model/network');
var Sensor = require('./model/sensor');
var Pusher = require('pusher');
var database = require('./database');
require('./model/relations');


var pusher = new Pusher({
	appId: process.env.PUSHER_ID, 
	key: process.env.PUSHER_KEY, 
	secret: process.env.PUSHER_SECRET
});


/**
 * Parse and decode query-string like arguments into an object.
 * @return {Object}
 */
function parse(query) {
    var result = {};
    var args = query.split('&');
    for (var i = 0; i < args.length; i++) {
        var pair = args[i].split('=');
        result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return result;
}


/**
 * Convert a channel name of the form <network>;<node>;<sensor>;<feature> to an
 * object.
 */
function convert(channel) {
    channel = channel.split(';');
    
    // Remove private- from the beginning of the network name.
    network = channel[0].split('-');
    network.shift();
    // Rejoin the network field in case the network name had '-'s in it.
    network = network.join('-');
    
    return {
        network: network,
        node: channel[1],
        sensor: channel[2],
        feature: channel[3]
    };
}


/**
 * Check the filter parameters provided for a user's specified channel name.
 */
function validate(channel, tree) {
    var network = channel.network;
    var node = channel.node;
    var sensor = channel.sensor;
    var feature = channel.features;

    if (!(network in tree)) return false;
    if (!(node in tree[network])) return false;
    if (!(sensor in tree[network][node])) return false;
    if (!(feature in tree[network][node][feature])) return false;
}


/**
 * Implementation of an API Gateway method for authenticating pusher clients.
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html
 * https://pusher.com/docs/authenticating_users#implementing_endpoints
 */ 
exports.handler = (event, context, callback) => {
    // var body = parse(event.body);
	// var socketId = body.socket_id;
  	// var channel = body.channel_name;
  	// var channelObj = convert(body.channel_name);
    
    tree().then( tree => {

        var valid = validate(channelObj, tree);

        var auth = pusher.authenticate(socketId, channel);
        var authResponse = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(auth)
        };

        callback(null, authResponse);
    });
};


function extractFeatures(sensors) {
    var result = {};
    for (var sensor of sensors) {
        result[sensor.name] = sensor.observed_properties;
    }
    return result;
}


function extractSensors(nodes) {
    var result = {};
    for (var node of nodes) {
        result[node.name] = extractFeatures(node.sensor__sensor_metadata);
    }
    return result;
}



function tree() {
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

        return tree;
    });
}


exports.handler();