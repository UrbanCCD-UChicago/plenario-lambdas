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
function parseQueryStringToObject(query) {
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
function convertChannelNameToObject(channel) {
    channel = channel.split(';');

    // Remove private- from the beginning of the network name.
    var network = channel[0].split('-');
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


function values(object) {
    var objects = [];
    for (var key of Object.keys(object)) {
        objects.push(object[key]);
    }
    return objects;
}


/**
 * Check the filter parameters provided for a user's specified channel name.
 */
function validateChannel(channel, tree) {

    // > channel
    // { 
    //     network: 'array_of_things_chicago',
    //     node: '0000001e0610ba72',
    //     sensor: 'tmp421',
    //     feature: undefined 
    // }

    var network = channel.network;  // 'array_of_things_chicago'
    var node = channel.node;        // '0000001e0610ba72'
    var sensor = channel.sensor;    // 'tmp421'
    var feature = channel.features; // undefined

    if (!network || !(network in tree)) return false;

    tree = tree[network];

    if (node) {
        if (!(node in tree)) return false;
        else tree = tree[node];
    } else {
        tree = Object.assign(...values(tree));
    }

    if (sensor) {
        if (!(sensor in tree)) return false;
        else {
            tree = tree[sensor];
            tree = new Set(values(tree).map( str => str.split('.')[0] ));
        }
    }  else {
        tree = Object.assign(...values(tree));
        tree = new Set(values(tree).map( str => str.split('.')[0] ));
    }

    if (feature && !(tree.has(feature))) return false;

    return true;
}


/**
 * Implementation of an API Gateway method for authenticating pusher clients.
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html
 * https://pusher.com/docs/authenticating_users#implementing_endpoints
 */ 
exports.handler = (event, context, callback) => {
    var body = parseQueryStringToObject(event.body);
	var socketId = body.socket_id;
  	var channel = body.channel_name;
  	var channelObj = convertChannelNameToObject(body.channel_name);
    
    var promise = getSensorNetworkTree().then( tree => {

        var valid = validateChannel(channelObj, tree);

        if (valid) {
            var auth = pusher.authenticate(socketId, channel);
            var authResponse = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(auth)
            };
        }
        
        else {
            var authResponse = {
                statusCode: 403,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: ''
            };
        }

        callback(null, authResponse);
        return authResponse.statusCode;
    });

    return promise;
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



function getSensorNetworkTree() {
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
