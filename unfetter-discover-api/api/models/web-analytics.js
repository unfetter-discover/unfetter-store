const mongoose = require('mongoose');

module.exports = mongoose.model('webAnalytics', new mongoose.Schema({}, { strict: false }), 'webAnalytics');