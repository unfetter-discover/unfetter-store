const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    assessment_objects: [{
        _id: false,
        risk: Number,
        stix: {
            id: String,
            description: String,
            type: {
                type: String
            },
            name: String,
        },
        questions: [{
            _id: false,
            selected_value: {
                risk: Number,
                name: String
            },
            options: [{
                _id: false,
                risk: Number,
                name: String
            }],
            risk: Number,
            name: String
        }]
    }],
    description: String,
    target_ref: String,
    type: {
        type: String,
        enum: ['x-unfetter-assessment'],
        default: 'x-unfetter-assessment',
    },
};

const XUnfetterAssessment = mongoose.model('XUnfetterAssessment', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = XUnfetterAssessment;
