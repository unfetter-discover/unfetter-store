const mongoose = require('mongoose');

module.exports = mongoose.model('schemaless', mongoose.Schema({_id: String}, {strict: false}), 'stix');