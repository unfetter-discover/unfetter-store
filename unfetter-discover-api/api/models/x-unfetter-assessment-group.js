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
        required: [true, 'name is required'],
        index: true
    },
    description: String,
    object_refs: [String],
    assessment_sets: [{
        type: String,
        index: 1
    }]
};

const assessmentGroup = mongoose.model('XUnfetterAssessmentGroup', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = assessmentGroup;
