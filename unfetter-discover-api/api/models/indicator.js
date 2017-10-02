const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    labels: [String],
    name: {
        type: String
    },
    description: {
        type: String
    },
    pattern: String,
    valid_from: {
        type: Date,
        default: Date.now
    },
    valid_until: {
        type: Date,
        default: Date.now
    },
    kill_chain_phases: [stixCommons['kill_chain_phases']],
    type: {
        type: String,
        enum: ['indicator'],
        default: 'indicator'
    }
};

const Indicator = mongoose.model('Indicator', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = Indicator;
