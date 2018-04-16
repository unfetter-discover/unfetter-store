const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const scoreVals = ['S', 'M', 'L', 'N/A', 'N'];

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
};

const assessedObject = mongoose.model('XUnfetterAssessedObject', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = assessedObject;
