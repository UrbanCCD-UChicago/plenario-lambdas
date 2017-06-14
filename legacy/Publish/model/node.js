var database = require('../database');
var STRING = require('./meta/schema').STRING;


var Node = database.define('sensor__node_metadata', {
    name: STRING('id', pk=true),
}, {
    timestamps: false
});


module.exports = Node;