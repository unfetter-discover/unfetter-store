const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

// const StixSchema = new mongoose.Schema({ 
//     _id: String,
//     course_of_action_id: String,
//     group_coa_id: String,
//     risk: Number,
//     measurements: Array
// });

// const ControlAssessment = mongoose.model('XUnfetterControllAssessment', BaseSchema, 'XUnfetterControllAssessment')
//     .discriminator('x-unfetter-control-assessment', StixSchema);

const StixSchema = {
    id: String,
    course_of_action_id: String,
    group_coa_id: String,
    risk: Number,
    measurements: Array,
    type: {
        type: String,
        enum: ['x-unfetter-control-assessment'],
        default: 'x-unfetter-control-assessment'
    },
};

const ControlAssessment = mongoose.model('XUnfetterControllAssessment', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = ControlAssessment;
