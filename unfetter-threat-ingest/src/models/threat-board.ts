import * as mongoose from 'mongoose';
import { stixCommons } from './stix-commons';

const StixSchema = {
    type: {
        type: String,
        enum: ['x-unfetter-threat-board'],
        default: 'x-unfetter-threat-board'
    },
    id: String,
    name: {
        type: String,
        index: true,
        required: [true, 'name is required']
    },
    description: String,
    created_by_ref: String,
    boundaries: {
        start_date: {
            type: Date,
            default: Date.now
        },
        end_date: {
            type: Date
        },
        intrusion_sets: {
            type: [String],
        },
        malware: {
            type: [String],
        },
        targets: {
            type: [String],
        }
    },
    reports: {
        type: [String],
    },
    articles: {
        type: Array,
    },
};

export const ThreatBoardModel = mongoose.model('XUnfetterThreatBoard', stixCommons.makeSchema(StixSchema), 'stix');
