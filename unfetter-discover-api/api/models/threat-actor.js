const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
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

const ThreatActor = mongoose.model('ThreatActor', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = ThreatActor;
