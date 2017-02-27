var Pusher = require('pusher-client');

var pusher = new Pusher('c6851f0950381b69a136', { 
    authEndpoint: 'https://8k1tgwbine.execute-api.us-east-1.amazonaws.com/test/pusher/auth' 
});

var channel = pusher.subscribe('private-all');

channel.bind('data', function(e) {
    console.log(e);
});

