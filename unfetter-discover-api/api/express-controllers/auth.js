const express = require('express');

const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const userModel = require('../models/user');
const configModel = require('../models/config');
const doauth = require('../helpers/auth_helpers');

const authSources = config.authServices || ['github'];
const apiRoot = process.env.API_ROOT || 'https://localhost/api';

const authServices = {};
authSources.forEach(source => {
    // I hate to do this here, but production builds have to know what packages are required in order to bundle them.
    // Serious [Node]JS fail.
    let service = null;
    switch (source) {
        case 'github':
            service = require('../helpers/github-auth.js');
            break;
        case 'gitlab':
            service = require('../helpers/gitlab-auth.js');
            break;
        default:
            break;
    }
    if (service) {
        authServices[source] = service;
        const strategy = service.build(config, process.env);
        passport.use(strategy);
    }
});

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

authSources.forEach(source => {
    const service = authServices[source];

    if (service) {
        router.get(`/login/${source}`, passport.authenticate(source, service.options));

        router.get(`/login/${source}/callback`,
            passport.authenticate(source, { failureRedirect: `/auth/login/${source}` }),
            (req, res) => doauth.handleLoginCallback(req.user, source, service, res)
        );
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

router.post('/profile/preferences/:id',
    passport.authenticate('jwt', { session: false }),
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
