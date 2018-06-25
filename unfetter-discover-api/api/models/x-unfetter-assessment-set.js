const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    type: {
        type: String,
        enum: ['x-unfetter-assessment-set'],
        default: 'x-unfetter-assessment-set'
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
    assessment_group_ref: String,
    assessments: [{
        type: String,
        index: 1
    }]
};

const assessmentSet = mongoose.model('XUnfetterAssessmentSet', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = assessmentSet;
