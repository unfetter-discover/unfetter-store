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
//     labels: [{
//         type: String,
//         required: [true, 'labels are required'],
//         enum: [
//             "activist",
//             "competitor",
//             "crime-syndicate",
//             "criminal",
//             "hacker",
//             "insider-accidental",
//             "insider-disgruntled",
//             "nation-state",
//             "sensationalist",
//             "spy",
//             "terrorist"
//         ]
//     }],
//     aliases: [String],
//     roles: [{
//         type: String,
//         enum: [
//             "agent",
//             "director",
//             "independent",
//             "sponsor",
//             "infrastructure-operator",
//             "infrastructure-architect",
//             "malware-author"
//         ]
//     }],
//     goals: [String],
//     sophisication: {
//         type: String,
//         enum: [
//             "none",
//             "minimal",
//             "intermediate",
//             "advanced",
//             "strategic",
//             "expert",
//             "innovator"
//         ]
//     },
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
//     }],
//     personal_motivation: [{
//         type: String,
//         enum: stixCommons['motivations']
//     }],
// });

// const ThreatActor = mongoose.model('ThreatActor', BaseSchema, 'ThreatActor')
//     .discriminator('threat-actor', StixSchema);

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
