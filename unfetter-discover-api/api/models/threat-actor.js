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
    labels: [String],
    aliases: [String],
    roles: [{
        type: String
    }],
    goals: [String],
    sophisication: {
        type: String
    },
    resource_level: {
        type: String
    },
    primary_motivation: {
        type: String
    },
    secondary_motivations: [String],
    personal_motivation: [String],
    type: {
        type: String,
        enum: ['threat-actor'],
        default: 'threat-actor'
    },
};

const ThreatActor = mongoose.model('ThreatActor', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = ThreatActor;
