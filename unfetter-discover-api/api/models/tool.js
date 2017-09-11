const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

// const StixSchema = new mongoose.Schema({
//     _id: String,
//     labels: [{
//         type: String,
//         required: [true, 'labels are required'],
//         enum: [
//             "denial-of-service",
//             "exploitation",
//             "information-gathering",
//             "network-capture",
//             "credential-exploitation",
//             "remote-access",
//             "vulnerability-scanning"
//         ]
//     }],
//     name: {
//         type: String,
//         required: [true, 'name is required']
//     },
//     description: {
//         type: String
//     },
//     kill_chain_phases: [stixCommons['kill_chain_phases']],
//     tool_version: String
// });

// const Tool = mongoose.model('Tool', BaseSchema, 'Tool')
//     .discriminator('tool', StixSchema);

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
    kill_chain_phases: [stixCommons['kill_chain_phases']],
    tool_version: String,
    type: {
        type: String,
        enum: ['tool'],
        default: 'tool'
    },
};

const Tool = mongoose.model('Tool', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = Tool;