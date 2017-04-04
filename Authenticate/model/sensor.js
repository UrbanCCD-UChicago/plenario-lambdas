var database = require('../database');
var STRING = require('./meta/schema').STRING;


var Sensor = database.define('sensor__sensor_metadata', {
    name: STRING('name', pk=true)
}, {
    timestamps: false
});


module.exports = Sensor;