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
        required: [true, 'name is required'],
        index: true
    },
    kill_chain_phases: [stixCommons.kill_chain_phases],
    aliases: [String],
    description: String,
    type: {
        type: String,
        enum: ['x-unfetter-sensor'],
        default: 'x-unfetter-sensor'
    },
};

const sensor = mongoose.model('XUnfetterSensor', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = sensor;
