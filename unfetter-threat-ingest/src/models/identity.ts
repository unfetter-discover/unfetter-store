import * as mongoose from 'mongoose';
import { stixCommons } from './stix-commons';

const StixSchema = {
    type: {
        type: String,
        enum: ['identity'],
        default: 'identity'
    },
    id: String,
    name: {
        type: String,
        index: true,
        required: [true, 'name is required']
    },
    identity_class: {
        type: String,
        required: [true, 'identity class is required']
    },
    sectors: [String],
    contact_information: String,
    description: String,
    created_by_ref: String,
};

export const IdentityModel = mongoose.model('Identity', stixCommons.makeSchema(StixSchema), 'stix');
