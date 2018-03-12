const mongoose = require('mongoose');

const notificationStoreSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        required: true
    },
    messageContent: {
        type: Object,
        require: true
    },
    read: {
        type: Boolean,
        default: false
    }
});

const notificationStoreModel = mongoose.model('notificationStore', notificationStoreSchema, 'notificationStore');
module.exports = notificationStoreModel;
