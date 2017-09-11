const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

// const StixSchema = new mongoose.Schema({
//     _id: String,
//     name: {
//         type: String,
//         required: [true, 'name is required']
//     },
//     description: {
//         type: String
//     },
//     identity_class: {
//         type: String,
//         required: [true, 'identity class is required'],
//         enum: [
//             "individual",
//             "group",
//             "organization",
//             "class",
//             "unknown"
//         ]
//     },
//     sectors: [{
//         type: String,
//         enum: [
//             "agriculture",
//             "aerospace",
//             "automotive",
//             "communications",
//             "construction",
//             "defence",
//             "education",
//             "energy",
//             "engineering",
//             "entertainment",
//             "financial-services",
//             "government-national",
//             "government-regional",
//             "government-local",
//             "government-public-services",
//             "healthcare",
//             "hospitality-leisure",
//             "infrastructure",
//             "insurance",
//             "manufacturing",
//             "mining",
//             "non-profit",
//             "pharmaceuticals",
//             "retail",
//             "technology",
//             "telecommunications",
//             "transportation",
//             "utilities"
//         ]
//     }],
//     contract_information: String
// });

// const Identity = mongoose.model('Identity', BaseSchema, 'Identity')
//     .discriminator('identity', StixSchema);

const StixSchema = {
    id: String,
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: {
        type: String
    },
    identity_class: {
        type: String,
        required: [true, 'identity class is required']
    },
    sectors: [String],
    contract_information: String,
    type: {
        type: String,
        enum: ['identity'],
        default: 'identity'
    }
};

const Identity = mongoose.model('Identity', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = Identity;
