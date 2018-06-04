// const mongoinit = require('../server/mongoinit.js')();
// const UserAuth = require('../models/userauth.js');
// const LocalStrategy = require('passport-local').Strategy;
// const scrypt = require('scrypt');
// const scryptParameters = scrypt.paramsSync(0.1, 1);
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

class MongoAuth extends AuthHelper {

    search(user) {
        return { 'mongo.id': user.id };
    }

}

(() => new MongoAuth())();
