const mongoose = require('mongoose');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    created_by_ref: {
        type: String,
        required: [true, 'created_by_ref is required']
    },
    name: {
        type: String,
        required: [true, 'name is required'],
        index: true
    },
    description: {
        type: String
    },
    action: String,
    type: {
        type: String,
        enum: ['course-of-action'],
        default: 'course-of-action'
    }
};

const CourseOfAction = mongoose.model('CourseOfAction', stixCommons.makeSchema(StixSchema), 'stix');

module.exports = CourseOfAction;
