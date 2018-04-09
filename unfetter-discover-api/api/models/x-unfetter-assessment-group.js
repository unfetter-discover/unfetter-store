const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    type: {
        type: String,
        enum: ['x-unfetter-assessment-group'],
        default: 'x-unfetter-assessment-group'
    },
    id: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: String,
    published: {
        type: Boolean,
        default: false
    },
    object_refs: [String],
    assessment_sets: [String]
};

const assessmentGroup = mongoose.model('XUnfetterAssessmentGroup', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = assessmentGroup;
