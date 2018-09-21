const LocalStrategy = require('passport-local').Strategy;
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;
const userModel = require('../models/user');
const scrypt = require('scrypt');

const scryptParameters = scrypt.paramsSync(0.1);

class MongoAuth extends AuthHelper {

    constructor() {
        super('mongo');
        this.redirects = true;
    }

    build() {
        const _this = this;
        const localStrategy = new LocalStrategy(
            (username, password, callback) => {
                userModel.find(_this.search({ id: username }, (err, user) => {
                    console.log(`return from db for ${username} is ${user}, error? ${err}`);
                    if (err) {
                        return callback(err);
                    }
                    if (!user || !user.auth || (user.auth.service !== 'mongo') || !user.auth.key) {
                        console.log('no user or auth or auth key, or auth is not mongo');
                        return callback(null, false);
                    }
                    console.log(`key is ${user.auth.key.toString('hex')}, to compare against password`);
                    if (!scrypt.verifyKdfSync(user.auth.key.toString('hex'), password)) {
                        return callback(null, false);
                    }
                    return callback(null, user);
                }));
            }
        );
        return localStrategy;
    }

    search(user) {
        return { 'auth.service': 'mongo', 'auth.id': user.id };
    }

    sync(data, login, approved) {
        const user = data;
        super.sync(user, login, approved);
        user.auth.service = 'mongo';
        user.auth.userName = login.username;
        user.auth.key = scrypt.kdfSync(login.password, scryptParameters);
        user.auth.marking_refs = [];
    }

}

(() => new MongoAuth())();
