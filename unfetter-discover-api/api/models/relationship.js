const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

// const StixSchema = new mongoose.Schema({
//   _id: String,
//   relationship_type: {
//     type: String,
//     match: /^[a-z0-9\\-]+$/,
//     required: [true, 'relationship_type is required']
//   },
//   description: String,
//   source_ref: {
//     type: String,
//     required: [true, 'source_ref is required']
//   },
//   target_ref: {
//     type: String,
//     required: [true, 'target_ref is required']
//   },
// });
// const Relationship = mongoose.model('Relationship', BaseSchema, 'Relationship')
//   .discriminator('relationship', StixSchema);

const StixSchema = {
  id: String,
  relationship_type: {
    type: String,
    match: /^[a-z0-9\\-]+$/,
    required: [true, 'relationship_type is required']
  },
  description: String,
  source_ref: {
    type: String,
    required: [true, 'source_ref is required']
  },
  target_ref: {
    type: String,
    required: [true, 'target_ref is required']
  },
  type: {
    type: String,
    enum: ['relationship'],
    default: 'relationship'
  },
};

const Relationship = mongoose.model('Relationship', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = Relationship;
