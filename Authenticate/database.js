var Sequelize = require('sequelize');
var Settings = require('./settings');


var sequelize = new Sequelize(Settings.POSTGRES_URI);


module.exports = sequelize;