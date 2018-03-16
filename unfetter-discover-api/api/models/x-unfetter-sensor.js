const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    name: {
        type: String,
        required: [true, 'name is required']
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
