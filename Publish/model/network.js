var database = require('../database');
var STRING = require('./meta/schema').STRING;


var Network = database.define('sensor__network_metadata', {
    name: STRING('name', pk=true),
}, {
    timestamps: false
});


module.exports = Network;