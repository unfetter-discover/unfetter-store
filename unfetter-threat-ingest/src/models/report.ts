import * as mongoose from 'mongoose';
import { stixCommons } from './stix-commons';

const StixSchema = {
    type: {
        type: String,
        enum: ['report'],
        default: 'report'
    },
    id: String,
    name: {
        type: String,
        index: true,
        required: [true, 'name is required']
    },
    labels: [{
        type: String,
        required: [true, 'label(s) are required']
    }],
    published: {
        type: Date,
        default: Date.now(),
        required: [true, 'published is required']
    },
    object_refs: [{
        type: String,
        // required: [true, 'object_refs are required']
    }],
    description: String,
    created_by_ref: {
        type: String,
        // required: [true, 'created_by_ref is required']
    },
};

export const ReportModel = mongoose.model('Report', stixCommons.makeSchema(StixSchema), 'stix');
