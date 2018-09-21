import * as mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({

    // Who are you?
    userName: {
        type: String,
        sparse: true,
        unique: true
    },
    firstName: String,
    lastName: String,
    email: {
        type: String,
        sparse: true,
        unique: true
    },

    // How did we authenticate you?
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
        marking_refs: [String]
    },

    // Who do you work for?
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

    // What is your Unfetter role?
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

    // Your STIX Identity object
    identity: {
        type: {
            type: String,
            enum: ['identity'],
            default: 'identity'
        },
        id: String,
        name: String,
        description: String,
        identity_class: {
            type: String,
            enum: ['individual'],
            default: 'individual'
        },
        sectors: [String],
        contact_information: String,
        created_by_ref: String,
        created: {
            type: Date,
            default: Date.now
        },
        modified: {
            type: Date,
            default: Date.now
        }
    },

    // Your sign-up life story
    registrationInformation: {
        applicationNote: String,
        requestedOrganization: String
    },

    // How you want Unfetter to behave
    preferences: {
        killchain: {
            type: String,
            default: 'mitre-attack'
        }
    },

    // Account status
    created: {
        type: Date,
        default: Date.now,
        required: [true, 'created is required']
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

});

export const UserModel = mongoose.model('User', UserSchema, 'user');
