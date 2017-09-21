const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const ExtendedSchema = {
    id: String,
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

const Campaign = mongoose.model('Campaign', stixCommons['makeSchema'](ExtendedSchema), 'stix');

module.exports = Campaign;