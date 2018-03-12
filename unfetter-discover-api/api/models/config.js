const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({ _id: String }, { strict: false });

configSchema.index({ configKey: 1 });

module.exports = mongoose.model('Config', configSchema, 'config');
