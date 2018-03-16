const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    labels: [String],
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: {
        type: String
    },
    kill_chain_phases: [stixCommons.kill_chain_phases],
    tool_version: String,
    type: {
        type: String,
        enum: ['tool'],
        default: 'tool'
    },
};

const Tool = mongoose.model('Tool', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = Tool;
