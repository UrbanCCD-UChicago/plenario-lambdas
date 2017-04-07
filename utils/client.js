var Pusher = require('pusher-client');
var moment = require('moment');

var pusher = new Pusher('c6851f0950381b69a136', { 
    authEndpoint: 'https://gm76b1jzz1.execute-api.us-east-1.amazonaws.com/development' 
});

var channel = pusher.subscribe('private-array_of_things_chicago');

channel.bind('data', function(e) {
    var observation = JSON.parse(e.message);
    console.log(observation.datetime);
    console.log(moment().utc().format());
    console.log('\n');
});

