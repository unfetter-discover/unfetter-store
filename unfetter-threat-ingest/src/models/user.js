const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    preferences: {
        killchain: {
            type: String,
            default: 'mitre-attack'
        }
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
        sparse: true,
        unique: true
    },
    userName: {
        type: String,
        sparse: true,
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
        default: 'STANDARD_USER',
        index: true
    },
    auth: {
        service: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        avatar_url: {
            type: String,
            required: false,
            sparse: true
        },
        marking_refs: {
            type: [String]
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

module.exports = mongoose.model('User', UserSchema, 'user');
