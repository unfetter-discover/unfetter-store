const mongoose = require('mongoose');

const utilitySchema = new mongoose.Schema({ _id: String }, { strict: false });

utilitySchema.index({ utilityKey: 1 });

module.exports = mongoose.model('utility', utilitySchema, 'utility');
