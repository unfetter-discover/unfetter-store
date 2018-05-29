// const mongoinit = require('../server/mongoinit.js')();
// const UserAuth = require('../models/userauth.js');
// const LocalStrategy = require('passport-local').Strategy;
// const scrypt = require('scrypt');
// const scryptParameters = scrypt.paramsSync(0.1, 1);

/**
 * @todo This strategy is not fully implemented.
 */
module.exports = {

    // build: (config, env) => {
    //     const mongoStrategy = new LocalStrategy((username, password, callback) => {
    //         UserAuth.findOne({ userName: username }, (err, user) => {
    //             if (err) {
    //                 console.log('mongo error', err);
    //                 return callback(err);
    //             }
    //             if (!user) {
    //                 console.log('no such user');
    //                 return callback(null, false, { message: 'Invalid username.' });
    //             }
    //             if (!scrypt.verifyHashSync(user.hash, password)) {
    //                 console.log('password hash failed', user.hash);
    //                 return callback(null, false, { message: 'Incorrect password.' });
    //             }
    //             return callback(null, user);
    //         });
    //     });
    //     return mongoStrategy;
    // },

    // options: { scope: ['user:email'] },

    // search: user => ({ 'mongo.id': user.id }),

    // sync: (storedUser, userinfo, approved) => {
    //     storedUser.oauth = 'mongo';
    //     if (!storedUser.github) {
    //         storedUser.github = {
    //             id: userinfo.id,
    //             userName: null,
    //             avatar: null,
    //         };
    //     }
    //     storedUser.approved = approved;
    //     storedUser.github.userName = userinfo.username;
    //     if (userinfo._json.avatar_url) {
    //         storedUser.github.avatar_url = userinfo._json.avatar_url;
    //     }
    // },

};
