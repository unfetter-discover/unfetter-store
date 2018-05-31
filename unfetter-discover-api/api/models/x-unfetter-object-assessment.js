const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
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
<<<<<<< HEAD
=======
    is_baseline: {
        type: Boolean,
        required: [true, 'is_baseline is required']
    },
    set_ref: [String],
>>>>>>> f20adeb... Rc 0.3.6 (#156)
    assessed_objects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'XUnfetterAssessedObject' }]
};

const objectAssessment = mongoose.model('XUnfetterObjectAssessment', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = objectAssessment;
