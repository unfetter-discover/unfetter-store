const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const ExtendedSchema = {
    id: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        index: true
    },
    description: {
        type: String
    },
    aliases: [String],
    first_seen: {
        type: Date,
        default: Date.now()
    },
    last_seen: {
        type: Date,
        default: Date.now()
    },
    objective: String,
    type: {
        type: String,
        enum: ['campaign'],
        default: 'campaign'
    }
};

const Campaign = mongoose.model('Campaign', stixCommons.makeSchema(ExtendedSchema), 'stix');

module.exports = Campaign;
