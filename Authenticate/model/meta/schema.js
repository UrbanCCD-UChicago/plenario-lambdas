var Sequelize = require('sequelize');


function Column(name, type, pk=false) {
    return {
        field: name,
        primaryKey: pk,
        type: type
    };
}

module.exports = {
    STRING: (name, pk) => { return Column(name, Sequelize.STRING, pk); },
    JSONB: (name, pk) => { return Column(name, Sequelize.JSONB, pk); }
}