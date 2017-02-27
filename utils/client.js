var Pusher = require('pusher-client');
var pusher = new Pusher('app-key', { authEndpoint: 'auth-endpoint' });
var channel = pusher.subscribe('private-all');

channel.bind('data', function(e) {
    console.log(e);
});

