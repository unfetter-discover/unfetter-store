const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');
<<<<<<< HEAD
const xunfetterAssessObject = require('./x-unfetter-assessed-object').xunfetterAssessObject;
=======
>>>>>>> f20adeb... Rc 0.3.6 (#156)

const StixSchema = {
    type: {
        type: String,
        enum: ['x-unfetter-category'],
        default: 'x-unfetter-category'
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
    version: Number,
<<<<<<< HEAD
    assessed_objects: [xunfetterAssessObject]
=======
    assessed_objects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'XUnfetterAssessedObject' }]
>>>>>>> f20adeb... Rc 0.3.6 (#156)
};

const XUnfetterCategory = mongoose.model('XUnfetterCategory', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = XUnfetterCategory;
