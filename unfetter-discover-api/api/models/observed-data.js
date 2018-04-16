const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    first_observed: {
        type: Date,
        default: Date.now,
        required: [true, 'first_observed is required']
    },
    last_observed: {
        type: Date,
        default: Date.now,
        required: [true, 'last_observed is required']
    },
    number_observed: {
        type: Number,
        required: [true, 'number_observed is required']
    },
    objects: {
        type: Object,
        required: [true, 'objects are required']
    },
    type: {
        type: String,
        enum: ['observed-data'],
        default: 'observed-data'
    }
};

const ObservedData = mongoose.model('ObservedData', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = ObservedData;
