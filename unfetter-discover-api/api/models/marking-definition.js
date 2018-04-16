const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    definition_type: {
        type: String,
        required: [true, 'definition_type is required']
    },
    definition: {
        type: Object,
        required: [true, 'definition is required']
    },
    type: {
        type: String,
        enum: ['marking-definition'],
        default: 'marking-definition'
    }
};

const MarkingDefinition = mongoose.model('MarkingDefinition', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = MarkingDefinition;
