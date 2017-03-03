var Pusher = require('pusher');


// https://pusher.com/docs/server_api_guide/interact_rest_api
var pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET
});


/**
 * Extract the base64 data encoded in the kinesis record to an object. 
 * @return {Object}
 */
function decode(record) {
    var data = new Buffer(record.kinesis.data, 'base64').toString();
    console.log('decode.data: ' + data);
    try {
        return JSON.parse(data);
    } catch (SyntaxError) {
        return {};
    }
}


/**
 * Iterate through incoming records and publish to the appropriate channels.
 */
function publish(records, channels) {
    records.forEach((record) => {
        Object.keys(channels).forEach((channel) => {
            var message = JSON.stringify(record);
            if (channel === 'private-all')
                pusher.trigger('private-all', 'data', { message: message });
            if ('private-' + record.node === channel) 
                pusher.trigger(channel, 'data', { message: message });
        });
    });
}


/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context) {
    var records = event.Records.map(decode);
    pusher.get({path: '/channels'}, (error, request, response) => {
        var result = JSON.parse(response.body);
        var channels = result.channels;
        publish(records, channels);
    });
}


exports.handler = handler;
