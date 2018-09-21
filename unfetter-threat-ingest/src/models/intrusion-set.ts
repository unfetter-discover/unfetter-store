import * as mongoose from 'mongoose';
import { stixCommons } from './stix-commons';

const StixSchema = {
    type: {
        type: String,
        enum: ['intrusion-set'],
        default: 'intrusion-set'
    },
    id: String,
    name: {
        type: String,
        index: true,
        required: [true, 'name is required']
    },
    description: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    aliases: [String],
    first_seen: {
        type: Date,
        default: Date.now
    },
    last_seen: {
        type: Date,
        default: Date.now
    },
    goals: [String],
    resource_level: String,
    primary_motivation: String,
    secondary_motivations: [String],
};

export const IntrusionSetModel = mongoose.model('IntrusionSet', stixCommons.makeSchema(StixSchema), 'stix');
