const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: {
        type: String
    },
    labels: [{
        type: String,
        required: [true, 'label(s) are required'],
        enum: [
            "threat-report",
            "attack-pattern",
            "campaign",
            "identity",
            "indicator",
            "malware",
            "observed-data",
            "threat-actor",
            "tool",
            "vulnerability"
        ]
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

const report = mongoose.model('Report', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = report;
