const mongoose = require('mongoose');

module.exports = mongoose.model('schemaless', new mongoose.Schema({_id: String}, {strict: false}), 'stix');