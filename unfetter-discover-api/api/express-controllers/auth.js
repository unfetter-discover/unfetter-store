const vm = require('vm');
const fs = require('fs');
const express = require('express');

const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const passportConfig = require('../config/passport-config');
const userModel = require('../models/user');
const configModel = require('../models/config');
const doauth = require('../helpers/auth_helpers');
const userHelpers = require('../helpers/user');

const apiRoot = config.apiRoot;

const authSources = config.authServices || ['github'];
const path = `${__dirname}/../helpers`;
const authServices = {};
authSources.forEach(source => {
    if (fs.existsSync(`${path}/${source}-auth.js`)) {
        const helper = fs.readFileSync(`${path}/${source}-auth.js`);
        const service = vm.runInNewContext(helper, { require });
        if (service) {
            const strategy = service.build(config, process.env);
            if (strategy) {
                authServices[source] = service;
                passport.use(strategy);
            }
        }
    }
});
console.log('passport strategies loaded: ', Object.keys(authServices));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

router.use(require('express-session')({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true
}));

router.use(passport.initialize());
router.use(passport.session());

Object.keys(authServices).forEach(source => {
    const service = authServices[source];
    if (service !== null) {
        if (service.redirects !== true) {
            router.get(`/${source}-login`, passport.authenticate(source, service.options()));
            router.get(`/${source}-callback`,
                passport.authenticate(source, { failureRedirect: `/auth/${source}-login` }),
                (req, res) => doauth.handleLoginCallback(req.user, source, service, res));
        } else {
            router.get(`/${source}-login`, passport.authenticate(source, service.options()),
                (req, res) => doauth.handleLoginCallback(req.user, source, service, res));
        }
    }
});

router.get('/user-from-token',
    (req, res) => {
        const token = req.headers.authorization;
        if (!token) {
            return doauth.setErrorResponse(res, 400, '');
        }

        let tokenHash;
        if (token.match(/^Bearer /) !== null) {
            tokenHash = token.split('Bearer ')[1].trim();
        } else {
            tokenHash = token;
        }

        jwt.verify(tokenHash, config.jwtSecret,
            (err, decoded) => {
                if (err) {
                    console.log(`Error in /auth/user-from-token:\n${JSON.stringify(err, null, 2)}`);
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                const id = decoded._id;
                if (!id) {
                    return doauth.setErrorResponse(res, 400, 'Malformed token');
                }
                userModel.findById(id,
                    (error, result) => {
                        if (error || !result) {
                            return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                        }
                        return res.json({ data: { attributes: result.toObject() } });
                    }
                );
            }
        );
    }
);

router.post('/finalize-registration',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const user = req.body.data.attributes;
        if (user) {
            userModel.findById(user._id, () => doauth.storeRegistration(user, res));
        } else {
            return doauth.setErrorResponse(res, 400, 'Malformed request');
        }
    }
);

router.get('/profile/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => passportConfig.jwtStandard(req, res, next),
    (req, res) => {
        const userId = req.params.id;
        userModel.findById(userId,
            (error, result) => {
                if (error || !result) {
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                return res.json({ data: { attributes: result.toObject() } });
            }
        );
    }
);

/**
 * Returns only the basic information about users, as this is not an admin route
 */
router.get('/get-user-list',
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => passportConfig.jwtStandard(req, res, next),
    (req, res) => {
        userModel.find({ approved: true, locked: false },
            (error, results) => {
                if (error || !results) {
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                const data = results
                    .map(result => result.toObject())
                    .map(user => ({
                        _id: user._id,
                        attributes: {
                            _id: user._id,
                            userName: user.userName,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            avatar_url: userHelpers.getAvatarUrl(user),
                            organizationIds: user.organizations
                                && user.organizations.filter(org => org.approved).map(org => org.id)
                        }
                    }));
                return res.json({ data });
            }
        );
    }
);

router.post('/profile/preferences/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => passportConfig.jwtStandard(req, res, next),
    (req, res) => {
        const userId = req.params.id.trim();
        const requestingUser = req.user._id.toString().trim();
        if (userId !== requestingUser) {
            return doauth.setErrorResponse(res, 500, 'Current users credentials must match the requesting user id');
        }

        const preferences = req.body.data.preferences || {};
        userModel.findByIdAndUpdate(userId, { preferences: { ...preferences } },
            (err, result) => {
                if (err || !result) {
                    return doauth.setErrorResponse(res, 500, err);
                }
                const user = result.toObject();
                return res.json({ data: { attributes: user, } });
            }
        );
    }
);

router.get('/refreshtoken',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const token = req.headers.authorization;
        if (!token) {
            return doauth.setErrorResponse(res, 400, '');
        }

        let tokenHash;
        if (token.match(/^Bearer /) !== null) {
            tokenHash = token.split('Bearer ')[1].trim();
        } else {
            tokenHash = token;
        }

        jwt.verify(tokenHash, config.jwtSecret,
            (err, decoded) => {
                if (err) {
                    console.log(`Error in /auth/user-from-token:\n${JSON.stringify(err, null, 2)}`);
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                userModel.findById(decoded._id,
                    (error, user) => {
                        if (error || !user) {
                            return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                        }
                        const userObject = user.toObject();
                        const newToken = jwt.sign(userObject, config.jwtSecret, {
                            expiresIn: global.unfetter.JWT_DURATION_SECONDS
                        });
                        res.json({ data: { attributes: { token: `Bearer ${newToken}` } } });
                    }
                );
            }
        );
    }
);

router.get('/public-config',
    (req, res) => {
        configModel.find({ configGroups: 'public' },
            (err, results) => {
                if (err || !results) {
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                const requestedUrl = apiRoot + req.originalUrl;
                const convertedResults = results
                    .map(result => result.toObject())
                    .map(result => {
                        const retVal = {};
                        retVal.links = {};
                        retVal.links.self = `${requestedUrl}/${result._id}`;
                        retVal.attributes = result;
                        retVal.attributes.id = result._id;
                        return retVal;
                    });
                return res.status(200).json({
                    links: {
                        self: requestedUrl
                    },
                    data: convertedResults
                });
            }
        );
    }
);

router.get('/username-available/:userName',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const userName = req.params.userName;
        if (!userName || userName === '') {
            return doauth.setErrorResponse(res, 400, 'Unable to process userName');
        }
        userModel.count({ userName },
            (err, count) => {
                if (err) {
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                return res.json({ data: { attributes: { available: (count === 0) } } });
            }
        );
    }
);

router.get('/email-available/:email',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const email = req.params.email;
        if (!email || (email === '')) {
            return doauth.setErrorResponse(res, 400, 'Unable to process email');
        }
        userModel.count({ email },
            (err, count) => {
                if (err) {
                    return doauth.setErrorResponse(res, 500, 'An unknown error has occurred.');
                }
                return res.json({ data: { attributes: { available: (count === 0) } } });
            }
        );
    }
);

module.exports = router;
