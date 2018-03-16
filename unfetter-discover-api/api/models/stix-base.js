const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = new mongoose.Schema({
    _id: String,
    created_by_ref: String,
    created: {
        type: Date,
        default: Date.now,
        required: [true, 'created is required']
    },
    modified: {
        type: Date,
        default: Date.now,
        required: [true, 'modified is required']
    },
    revoked: Boolean,
    version: String,
    labels: Array,
    external_references: Array,
    object_marking_refs: Array,
    granular_markings: [stixCommons.granular_markings],
}, {
    discriminatorKey: 'type'
});

module.exports = StixSchema;
