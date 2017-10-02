const mongoose = require('mongoose');

module.exports = mongoose.model('Config', mongoose.Schema({ _id: String }, { strict: false }), 'config');