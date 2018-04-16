const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
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
        type: Date
    },
    kill_chain_phases: {
        type: [stixCommons.kill_chain_phases],
        default: void 0
    },
    type: {
        type: String,
        enum: ['indicator'],
        default: 'indicator'
    }
};

const Indicator = mongoose.model('Indicator', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = Indicator;
