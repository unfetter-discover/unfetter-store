const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    name: {
        type: String,
        required: [true, 'name is required']
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

const CourseOfAction = mongoose.model('CourseOfAction', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = CourseOfAction;
