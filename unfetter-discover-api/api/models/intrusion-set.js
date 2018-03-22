const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: {
        type: String
    },
    aliases: [String],
    first_seen: {
        type: Date,
        default: Date.now
    },
    last_seen: {
        type: Date,
        default: Date.now
    },
    goals: [String],
    resource_level: {
        type: String
    },
    primary_motivation: {
        type: String
    },
    secondary_motivations: [String],
    type: {
        type: String,
        enum: ['intrusion-set']
    }
};

const IntrusionSet = mongoose.model('IntrusionSet', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = IntrusionSet;
