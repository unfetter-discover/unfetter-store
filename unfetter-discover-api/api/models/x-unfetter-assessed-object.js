const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const scoreVals = ['L', 'M', 'S', 'N/A', 'N'];

const StixSchema = {
    id: String,
    type: {
        type: String,
        enum: ['x-unfetter-assessed-object'],
        default: 'x-unfetter-assessed-object'
    },
    assessed_object_ref: String,
    questions: [
        {
            name: {
                type: String,
                // enum: ['mitigate', 'indicate', 'respond'],
                enum: ['protect', 'detect', 'respond'],
                default: null,
            },
            score: {
                type: String,
                enum: scoreVals,
                default: null
            }
        }
    ]
};

const xunfetterAssessObject = StixSchema;
const assessedObject = mongoose.model('XUnfetterAssessedObject', xunfetterAssessObject, 'stix');

module.exports = {
    assessedObject,
    xunfetterAssessObject,
};
