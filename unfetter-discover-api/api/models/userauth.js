const mongoose = require('mongoose');

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

const UserAuth = mongoose.model('UserAuth', UserAuthSchema, 'userId');

module.exports = UserAuth;
