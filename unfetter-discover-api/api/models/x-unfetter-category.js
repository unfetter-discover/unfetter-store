const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');
const xunfetterAssessObject = require('./x-unfetter-assessed-object').xunfetterAssessObject;

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
    assessed_objects: [xunfetterAssessObject]
};

const XUnfetterCategory = mongoose.model('XUnfetterCategory', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = XUnfetterCategory;
