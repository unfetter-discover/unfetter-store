const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const scoreVals = ['S', 'M', 'L', 'N/A', 'N'];

const StixSchema = {
    type: {
        type: String,
        enum: ['x-unfetter-object-assessment'],
        default: 'x-unfetter-object-assessment'
    },
    id: String,
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: String,
    object_ref: {
        type: String,
        required: [true, 'object_ref is required']
    },
    is_baseline: {
        type: Boolean,
        required: [true, 'is_baseline is required']
    },
    set_ref: [String],
    assessment_objects: [{
        assessed_object_ref: String,
        questions: [
            {
                name: {
                    type: String,
                    enum: ['protect'],
                    default: 'protect',
                },
                score: {
                    type: String,
                    enum: scoreVals,
                    default: null
                }
            },
            {
                name: {
                    type: String,
                    enum: ['detect'],
                    default: 'detect',
                },
                score: {
                    type: String,
                    enum: scoreVals,
                    default: null
                }
            },
            {
                name: {
                    type: String,
                    enum: ['respond'],
                    default: 'respond',
                },
                score: {
                    type: String,
                    enum: scoreVals,
                    default: null
                }
            }
        ]
    }]
};

const objectAssessment = mongoose.model('XUnfetterObjectAssessment', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = objectAssessment;
