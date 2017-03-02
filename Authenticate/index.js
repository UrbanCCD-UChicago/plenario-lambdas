var Pusher = require('pusher');


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
 * Implementation of an API Gateway method for authenticating pusher clients.
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html
 * https://pusher.com/docs/authenticating_users#implementing_endpoints
 */ 
exports.handler = (event, context, callback) => {
    var body = parse(event.body);
    
	var socketId = body.socket_id;
  	var channel = body.channel_name;
  	var auth = pusher.authenticate(socketId, channel);

    console.log(auth);
    var response = {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(auth)
    };
    
    callback(null, response);
};

