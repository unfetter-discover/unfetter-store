const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    type: {
        type: String,
        enum: ['x-unfetter-capability'],
        default: 'x-unfetter-capability'
    },
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
    description: String,
    version: Number,
    category: String
};

const XUnfetterCapability = mongoose.model('XUnfetterCapability', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = XUnfetterCapability;
