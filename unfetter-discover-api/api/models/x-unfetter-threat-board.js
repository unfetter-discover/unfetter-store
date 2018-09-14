const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    articles: {
        type: Array,
        default: void 0
    },
    boundaries: {
        end_date: {
            type: Date
        },
        intrusion_sets: {
            type: [String],
            default: void 0
        },
        malware: {
            type: [String],
            default: void 0
        },
        start_date: {
            type: Date,
            default: Date.now
        },
        targets: {
            type: [String],
            default: void 0
        }
    },
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    description: String,
    id: String,
    name: {
        type: String,
        required: [true, 'name is required'],
        index: true
    },
    reports: {
        type: [String],
        default: void 0
    },
    type: {
        type: String,
        enum: ['x-unfetter-threat-board'],
        default: 'x-unfetter-threat-board'
    }
};

const stixModel = mongoose.model('XUnfetterThreatBoard', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = stixModel;
