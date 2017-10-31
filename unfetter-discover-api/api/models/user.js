const mongoose = require('mongoose');

const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const UserSchema = mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    organizations: {
        type: [{
            _id: false,
            id: String,
            role: {
                type: String,
                default: 'STANDARD_USER'
            }
        }],
        default: [{
            // Unfetter Identity ID
            id: 'identity--4ac44385-691d-411a-bda8-027c61d68e99'
        }]
    },
    email: {
        type: String,
        unique: true
    },
    userName: {
        type: String,
        unique: true
    },
    registered: {
        type: Boolean,
        default: false
    },
    approved: {
        type: Boolean,
        default: false
    },
    locked: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: [
            'STANDARD_USER',
            'ORG_LEADER',
            'ADMIN'
        ],
        default: 'STANDARD_USER'
    },
    github: {
        userName: {
            type: String
        },
        id: {
            type: String,
            unique: true
        },
        avatar_url: {
            type: String
        }
    },
    identity: {
        id: {
            type: String
        },
        name: {
            type: String
        },
        description: {
            type: String
        },
        identity_class: {
            type: String
        },
        sectors: [String],
        contract_information: String,
        type: {
            type: String,
            enum: ['identity'],
            default: 'identity'
        }
    },
    created: {
        type: Date,
        default: Date.now,
        required: [true, 'created is required']
    }
});

const User = module.exports = mongoose.model('User', UserSchema, 'user');

// module.exports.getUserById = function (id, callback) {
//     User.findById(id, callback);
// }

// module.exports.getUserByUsername = function (username, callback) {
//     const query = { username: username }
//     User.findOne(query, callback);
// }

// module.exports.addUser = function (newUser, callback) {
//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(newUser.password, salt, (err, hash) => {
//             if (err) throw err;
//             newUser.password = hash;
//             newUser.save(callback);
//         });
//     });
// }

// module.exports.comparePassword = function (candidatePassword, hash, callback) {
//     bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
//         if (err) throw err;
//         callback(null, isMatch);
//     });
// }