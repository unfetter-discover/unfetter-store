const mongoose = require('mongoose');
const StixSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

// const AttackPatternSchema = new mongoose.Schema({
//   _id: String,
//   name: {
//     type: String,
//     required: [true, 'name is required']
//   },
//   description: {
//     type: String
//   },
//   kill_chain_phases: [stixCommons['kill_chain_phases']],
//   x_unfetter_sophistication_level: {
//     type: Number
//   }
// });

// const AttackPattern = mongoose.model('AttackPattern', StixSchema, 'AttackPattern').discriminator('attack-pattern',
//   AttackPatternSchema
// );

const AttackPatternSchema = {
  id: String,
  name: {
    type: String,
    required: [true, 'name is required']
  },
  description: {
    type: String
  },
  kill_chain_phases: [stixCommons['kill_chain_phases']],
  x_unfetter_sophistication_level: {
    type: Number
  },
  type: {
    type: String,
    enum: ['attack-pattern'],
    default: 'attack-pattern'
  }
};

const AttackPattern = mongoose.model('AttackPattern', stixCommons['makeSchema'](AttackPatternSchema), 'stix');

module.exports = AttackPattern;



    // Example validation
    // validate: {
    //   validator: (v) => {
    //     const pattern = /\d{3}-\d{3}-\d{4}/;
    //     return pattern.test(v);
    //   },
    //   message: '{VALUE} is not a valid phone number.'
    // },
