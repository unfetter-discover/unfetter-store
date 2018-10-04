const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    content: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    id: String,
    name: {
        type: String,
        required: [true, 'name is required'],
        index: true
    },
    sources: {
        type: [String],
        default: void 0
    },
    type: {
        type: String,
        enum: ['x-unfetter-article'],
        default: 'x-unfetter-article'
    }
};

const stixModel = mongoose.model('XUnfetterArticle', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = stixModel;
