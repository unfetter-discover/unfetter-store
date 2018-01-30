const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const userModel = require('../models/user');
const config = require('./config');

const passportConfig = {};

passportConfig.setStrategy = (passport) => {
    const opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = config.jwtSecret;
    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
        userModel.findById(jwt_payload._id, (err, user) => {
            if (err) {
                return done(err, false);
            }

            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        });
    }));
};

passportConfig.jwtStandard = (req, res, next) => {
    // Do nothing if they pass strategy
    next();
};

passportConfig.jwtAdmin = (req, res, next) => {
    const user = req.user;
    // Verify they have admin role
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ errors: [{ status: 403, source: '', title: 'Error', code: '', detail: 'Unauthorized.  Only admins may access the admin route' }] });
    } else {
        next();
    }
};

passportConfig.jwtOrganizations = (req, res, next) => {
    const user = req.user;
    // Verify they have admin or org leader role
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORG_LEADER')) {
        return res.status(403).json({ errors: [{ status: 403, source: '', title: 'Error', code: '', detail: 'Unauthorized.  Only admins and organization leaders may access the organizations route' }] });
    } else {
        next();
    }
};

module.exports = passportConfig;
