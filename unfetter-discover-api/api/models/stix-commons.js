const mongoose = require('mongoose');

const stixCommons = {};

stixCommons.kill_chain_phases = mongoose.Schema({
    kill_chain_name: {
        type: String,
        required: [true, 'kill_chain_name is required']
    },
    phase_name: {
        type: String,
        required: [true, 'phase_name is required']
    }
}, { _id: false });

stixCommons.granular_markings = mongoose.Schema({
    selectors: {
        type: [String],
        required: [true, 'selectors are required']
    },
    marking_ref: {
        type: String,
        required: [true, 'marking_ref is required']
    }
}, { _id: false });

stixCommons.external_references = mongoose.Schema({
    source_name: {
        type: String,
        required: [true, 'Source name is required']
    },
    description: String,
    url: String,
    hashes: Object,
    external_id: String
}, { _id: false });

stixCommons.metaProperties = mongoose.Schema({
    published: {
        type: Boolean,
        default: false
    }
}, { _id: false, strict: false });

stixCommons.motivations = [
    'accidental',
    'coercion',
    'dominance',
    'ideology',
    'notoriety',
    'organizational-gain',
    'personal-gain',
    'personal-satisfaction',
    'revenge',
    'unpredictable'
];

stixCommons.resource_level = [
    'individual',
    'club',
    'contest',
    'team',
    'organization',
    'government'
];

stixCommons.mongoRoot = {
    _id: String,
    organization: String,
    extendedProperties: Object,
    metaProperties: stixCommons.metaProperties,
    creator: String
};

// TODO delete if not used
stixCommons.discriminator = {
    discriminatorKey: 'type'
};

stixCommons.baseStix = {
    id: String,
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
    labels: { type: Array, default: void 0 },
    external_references: { type: [stixCommons.external_references], default: void 0 },
    object_marking_refs: { type: Array, default: void 0 },
    granular_markings: { type: [stixCommons.granular_markings], default: void 0 },
};

stixCommons.makeSchema = childSchema => {
    const schema = {
        ...stixCommons.mongoRoot,
        stix: {
            ...stixCommons.baseStix,
            ...childSchema
        }
    };
    const schemaObj = new mongoose.Schema(schema);
    schemaObj.index({ 'stix.name': 'text' });
    schemaObj.index({ 'stix.name': 1 });
    schemaObj.index({ 'stix.type': 1 });
    schemaObj.index({ 'stix.kill_chain_phases.phase_name': 1 });
    schemaObj.index({ 'stix.created_by_ref': 1 });
    schemaObj.index({ 'stix.target_ref': 1 });
    schemaObj.index({ 'stix.target_ref': 'text' });
    schemaObj.index({ 'stix.source_ref': 1 });
    schemaObj.index({ 'stix.source_ref': 'text' });
    return schemaObj;
};

module.exports = stixCommons;
