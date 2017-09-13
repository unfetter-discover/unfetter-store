const mongoose = require('mongoose');

const stixCommons = {};

stixCommons['kill_chain_phases'] = mongoose.Schema({
    kill_chain_name: {
        type: String,
        required: [true, 'kill_chain_name is required']
    },
    phase_name: {
        type: String,
        required: [true, 'phase_name is required']
    }
}, { _id: false });

stixCommons['granular_markings'] = mongoose.Schema({
    selectors: {
        type: [String],
        required: [true, 'selectors are required']
    },
    marking_ref: {
        type: String,
        required: [true, 'marking_ref is required']
    }
}, { _id: false });

stixCommons['motivations'] = [
    "accidental",
    "coercion",
    "dominance",
    "ideology",
    "notoriety",
    "organizational-gain",
    "personal-gain",
    "personal-satisfaction",
    "revenge",
    "unpredictable"
];

stixCommons['resource_level'] = [
    "individual",
    "club",
    "contest",
    "team",
    "organization",
    "government"
];

// Data model redesign

stixCommons['mongoRoot'] = {
    _id: String,
    organization: String
};

// TODO delete if not used
stixCommons['discriminator'] = {
    discriminatorKey: 'type'
};

stixCommons['baseStix'] = {
    id: String,
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
    labels: { type: Array, default: void 0 },
    external_references: { type: Array, default: void 0 },
    object_marking_refs: { type: Array, default: void 0 },
    granular_markings: { type: [stixCommons['granular_markings']], default: void 0},
};

stixCommons['makeSchema'] = childSchema => {
    // let schema = Object.assign({}, stixCommons['mongoRoot']); // Safe copy of mongoRoot object
    // schema.stix = Object.assign(stixCommons['baseStix'], childSchema);
    let schema = {}; 
    
    for (let prop of Object.keys(stixCommons['mongoRoot'])) {
        schema[prop] = stixCommons['mongoRoot'][prop];
    }

    schema.stix = {};
    for (let prop of Object.keys(stixCommons['baseStix'])) {
        schema.stix[prop] = stixCommons['baseStix'][prop];
    }
    for (let prop of Object.keys(childSchema)) {
        schema.stix[prop] = childSchema[prop];
    }
    return mongoose.Schema(schema);
};

module.exports = stixCommons;