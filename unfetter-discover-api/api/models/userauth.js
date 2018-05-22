const mongoose = require('mongoose');

const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const UserAuthSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userName: {
        type: String,
        required: true,
        index: true
    },
    hash: {
        type: String,
        required: true
    }
});

const UserAuth = module.exports = mongoose.model('UserAuth', UserAuthSchema, 'userId');
