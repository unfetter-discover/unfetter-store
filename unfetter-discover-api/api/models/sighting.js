const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

// const StixSchema = new mongoose.Schema({
//     _id: String,
//     first_seen: {
//         type: Date,
//         default: Date.now()
//     }, 
//     last_seen: {
//         type: Date,
//         default: Date.now()
//     },
//     count: Number,
//     sighting_of_ref: {
//         type: String,
//         required: [true, 'sighting_of_ref is required']
//     },
//     observed_data_refs: [String]
// });

// const Sighting = mongoose.model('Sighting', BaseSchema, 'Sighting')
//     .discriminator('sighting', StixSchema);

const StixSchema = {
    id: String,
    first_seen: {
        type: Date,
        default: Date.now
    },
    last_seen: {
        type: Date,
        default: Date.now
    },
    count: Number,
    sighting_of_ref: {
        type: String,
        required: [true, 'sighting_of_ref is required']
    },
    observed_data_refs: [String],
    type: {
        type: String,
        enum: ['sighting'],
        default: 'sighting'
    },
    summary: {
        type: Boolean,
    },
};

const Sighting = mongoose.model('Sighting', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = Sighting;
