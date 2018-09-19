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
    description: {
        type: String
    },
    labels: [{
        type: String,
        required: [true, 'label(s) are required']
    }],
    published: {
        type: Date,
        default: Date.now(),
        required: [true, 'published is required']
    },
    object_refs: [{
        type: String,
        required: [true, 'object_refs are required']
    }],
    type: {
        type: String,
        enum: ['report'],
        default: 'report'
    },
};

const report = mongoose.model('Report', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = report;
