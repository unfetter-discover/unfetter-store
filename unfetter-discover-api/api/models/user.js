const mongoose = require('mongoose');

// User Schema
const UserSchema = mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    organizations: {
        type: [String]
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