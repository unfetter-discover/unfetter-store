const mongoose = require('mongoose');

const webSchema = new mongoose.Schema({ }, { strict: false });

webSchema.index({ eventType: 1 });

module.exports = mongoose.model('webAnalytics', webSchema, 'webAnalytics');
