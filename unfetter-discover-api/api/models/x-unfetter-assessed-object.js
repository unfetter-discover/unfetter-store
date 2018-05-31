const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

<<<<<<< HEAD
const scoreVals = ['L', 'M', 'S', 'N/A', 'N'];
=======
const scoreVals = ['S', 'M', 'L', 'N/A', 'N'];
>>>>>>> f20adeb... Rc 0.3.6 (#156)

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
<<<<<<< HEAD
                // enum: ['mitigate', 'indicate', 'respond'],
                enum: ['protect', 'detect', 'respond'],
                default: null,
=======
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
>>>>>>> f20adeb... Rc 0.3.6 (#156)
            },
            score: {
                type: String,
                enum: scoreVals,
                default: null
            }
        }
    ]
};

<<<<<<< HEAD
const xunfetterAssessObject = StixSchema;
const assessedObject = mongoose.model('XUnfetterAssessedObject', xunfetterAssessObject, 'stix');

module.exports = {
    assessedObject,
    xunfetterAssessObject,
};
=======
const assessedObject = mongoose.model('XUnfetterAssessedObject', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = assessedObject;
>>>>>>> f20adeb... Rc 0.3.6 (#156)
