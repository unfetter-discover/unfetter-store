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
//     aliases: [String],
//     first_seen: {
//         type: Date,
//         default: Date.now
//     },
//     last_seen: {
//         type: Date,
//         default: Date.now
//     },
//     goals: [String],
//     resource_level: {
//         type: String,
//         enum: stixCommons['resource_level']     
//     },
//     primary_motivation: {
//         type: String,
//         enum: stixCommons['motivations']
//     },
//     secondary_motivations: [{
//         type: String,
//         enum: stixCommons['motivations']
//     }]
// });

// const IntrusionSet = mongoose.model('IntrusionSet', BaseSchema, 'IntrusionSet')
//     .discriminator('intrusion-set', StixSchema);

const StixSchema = {
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
        default: Date.now
    },
    last_seen: {
        type: Date,
        default: Date.now
    },
    goals: [String],
    resource_level: {
        type: String
    },
    primary_motivation: {
        type: String
    },
    secondary_motivations: [String],
    type: {
        type: String,
        enum: ['intrusion-set']
    }
};

const IntrusionSet = mongoose.model('IntrusionSet', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = IntrusionSet;
