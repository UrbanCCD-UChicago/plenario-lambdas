var database = require('../database');
var STRING = require('./meta/schema').STRING;
var JSONB = require('./meta/schema').JSONB;


var Sensor = database.define('sensor__sensor_metadata', {
    name: STRING('name', pk=true),
    observed_properties: JSONB('observed_properties')
}, {
    timestamps: false
});


module.exports = Sensor;