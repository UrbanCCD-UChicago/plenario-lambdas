var database = require('../database');
var Network = require('./network');
var Node = require('./node');
var Sensor = require('./sensor');
var Feature = require('./feature');


// Why does the foreignKey have to be the same for both sides of the
// relation? Not sure. But otherwise it generates an improper query.
// http://stackoverflow.com/questions/28056211
Network.hasMany(Node, {
    as: 'nodes',
    foreignKey: 'sensor_network'
});

Node.belongsTo(Network, {
    as: 'network',
    foreignKey: 'sensor_network',
    foreignKeyConstraint: true
});

Node.belongsToMany(Sensor, {
    foreignKey: 'node',
    through: 'sensor__sensor_to_node',
    timestamps: false
});

Sensor.belongsToMany(Node, {
    foreignKey: 'sensor',
    through: 'sensor__sensor_to_node'
});
