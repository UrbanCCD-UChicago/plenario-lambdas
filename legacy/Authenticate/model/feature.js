var database = require('../database');
var STRING = require('./meta/schema').STRING;


var Feature = database.define('sensor__feature_metadata', {
    name: STRING('name', pk=true),
}, {
    timestamps: false
});


module.exports = Feature;