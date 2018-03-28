const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    organizations: {
        type: [{
            _id: false,
            id: String,
            role: {
                type: String,
                default: 'STANDARD_USER'
            },
            approved: {
                type: Boolean,
                default: false
            },
            subscribed: {
                type: Boolean,
                default: true
            }
        }]
    },
    email: {
        type: String,
        unique: true
    },
    userName: {
        type: String,
        unique: true
    },
    registered: {
        type: Boolean,
        default: false
    },
    approved: {
        type: Boolean,
        default: false
    },
    locked: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: [
            'STANDARD_USER',
            'ORG_LEADER',
            'ADMIN'
        ],
        default: 'STANDARD_USER'
    },
    github: {
        userName: {
            type: String
        },
        id: {
            type: String,
            unique: true
        },
        avatar_url: {
            type: String
        }
    },
    identity: {
        created_by_ref: String,
        id: {
            type: String
        },
        name: {
            type: String
        },
        description: {
            type: String
        },
        identity_class: {
            type: String,
            enum: ['individual'],
            default: 'individual'
        },
        sectors: [String],
        contact_information: String,
        type: {
            type: String,
            enum: ['identity'],
            default: 'identity'
        },
        created: {
            type: Date,
            default: Date.now
        },
        modified: {
            type: Date,
            default: Date.now
        }
    },
    created: {
        type: Date,
        default: Date.now,
        required: [true, 'created is required']
    },
    registrationInformation: {
        applicationNote: {
            type: String
        },
        requestedOrganization: {
            type: String
        }
    }
});

UserSchema.index({ userName: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema, 'user');
// const User = module.exports;
