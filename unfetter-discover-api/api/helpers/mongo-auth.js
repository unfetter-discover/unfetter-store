const mongoinit = require('../server/mongoinit.js')();
const LocalStrategy = require('passport-local').Strategy;
const scrypt = require("scrypt");
const scryptParameters = scrypt.paramsSync(0.1, 1);

module.exports = {

    build: function(config, env) {
        console.log('building mongo strategy using', config, 'and', env);
        const mongoStrategy = new LocalStrategy(function(username, password, callback) {
            console.log('trying to authenticate', username, password);
            UserAuth.findOne({userName: username}, function (err, user) {
                if (err) {
                    console.log('mongo error', err);
                    return callback(err);
                }
                if (!user) {
                    console.log('no such user');
                    return callback(null, false, { message: 'Invalid username.' });
                }
                if (!scrypt.verifyHashSync(user.hash, password)) {
                    console.log('password hash failed', user.hash);
                    return callback(null, false, { message: 'Incorrect password.' });
                }
                return callback(null, user);
            });
        });
        return mongoStrategy;
    },

};
