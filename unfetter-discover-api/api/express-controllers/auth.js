const express = require('express');

const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const userModel = require('../models/user');
const configModel = require('../models/config');
const generateId = require('../helpers/stix').id;
const publish = require('../controllers/shared/publish');

const SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;
const apiRoot = process.env.API_ROOT || 'https://localhost/api';

const githubStrategy = new GithubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackURL
}, (accessToken, refreshToken, profile, cb) => cb(null, profile));

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

router.get('/github-login', passport.authenticate('github', {
    scope: ['user:email']
}));

router.get('/github-callback', passport.authenticate('github', {
    failureRedirect: '/auth/github-login'
}), (req, res) => {
    // hit unfetter api to update token
    const githubUser = req.user;
    if (!githubUser) {
        res.json({
            success: false,
            message: 'User object is empty'
        });
    } else {
        let registered;
        let user = {};

        userModel.find({
            'github.id': githubUser.id
        }, (err, result) => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });

                // Unknown user
            } else if (!result || result.length === 0) {
                // TODO create user
                registered = false;
                user.github = {};
                user.github.userName = githubUser.username;
                user.github.id = githubUser.id;
                if (githubUser._json.avatar_url) {
                    user.github.avatar_url = githubUser._json.avatar_url;
                }
                user.approved = false;

                const newDocument = new userModel(user);
                const error = newDocument.validateSync();
                if (error) {
                    console.log(error);
                    const errors = [];
                    error.errors.forEach(field => {
                        errors.push(field.message);
                    });
                    return res.status(400).json({
                        errors: [{
                            status: 400,
                            source: '',
                            title: 'Error',
                            code: '',
                            detail: errors
                        }]
                    });
                }
                userModel.create(newDocument, (createError, createResult) => {
                    if (createError) {
                        console.log(createError);
                        return res.status(500).json({
                            errors: [{
                                status: 500,
                                source: '',
                                title: 'Error',
                                code: '',
                                detail: 'An unknown error has occurred.'
                            }]
                        });
                    }
                    console.log(`First github login attempt by github id# ${githubUser.id}`);
                    const token = jwt.sign(createResult.toObject(), config.jwtSecret, {
                        expiresIn: global.unfetter.JWT_DURATION_SECONDS
                    });
                    res.header('Authorization', token);
                    res.redirect(`${config.unfetterUiCallbackURL}/${encodeURIComponent(token)}/${registered}/github`);
                });


                // Known user
            } else {
                user = result[0].toObject();
                registered = user.registered;

        router.get(`/${source}-callback`,
            passport.authenticate(source, { failureRedirect: `/auth/${source}-login` }),
                (req, res) => doauth.handleLoginCallback(req.user, source, service, res)
        );
    }
});

router.get('/user-from-token', (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: ''
            }]
        });
    }

    let tokenHash;
    if (token.match(/^Bearer /) !== null) {
        tokenHash = token.split('Bearer ')[1].trim();
    } else {
        tokenHash = token;
    }

    jwt.verify(tokenHash, config.jwtSecret, (err, decoded) => {
        if (err) {
            console.log(`Error in /auth/user-from-token:\n${JSON.stringify(err, null, 2)}`);
            return res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'An unknown error has occurred.'
                }]
            });
        }
        const id = decoded._id;
        if (!id) {
            return res.status(400).json({
                errors: [{
                    status: 400,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'Malformed token'
                }]
            });
        }
        userModel.findById(id, (error, result) => {
            if (error || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });
            }
            return res.json({
                data: {
                    attributes: result.toObject()
                }
            });
        });
    });
});

router.post('/finalize-registration', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const user = req.body.data.attributes;
    if (user) {
        userModel.findById(user._id, (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });
            }
            user.registered = true;
            user.identity.id = generateId('identity');

            if (!user.organizations) {
                user.organizations = [];
            }

            // Unfetter open
            user.organizations.push({
                id: 'identity--e240b257-5c42-402e-a0e8-7b81ecc1c09a',
                approved: true,
                role: 'STANDARD_USER'
            });

            const newDocument = new userModel(user);
            const error = newDocument.validateSync();
            if (error) {
                console.log(error);
                const errors = [];
                error.errors.forEach(field => {
                    errors.push(field.message);
                });
                return res.status(400).json({
                    errors: [{
                        status: 400,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: errors
                    }]
                });
            }
            userModel.findByIdAndUpdate(user._id, newDocument, (errInner, resultInner) => {
                if (errInner || !resultInner) {
                    return res.status(500).json({
                        errors: [{
                            status: 500,
                            source: '',
                            title: 'Error',
                            code: '',
                            detail: 'An unknown error has occurred.'
                        }]
                    });
                }
                if (SEND_EMAIL_ALERTS) {
                    const emailData = {
                        template: 'USER_REGISTERED',
                        subject: `${user.firstName} ${user.lastName} registered to unfetter`,
                        body: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email
                        }
                    };
                    publish.notifyAdmin('NOTIFICATION', `${user.userName} Registered`, `${user.userName} registered to Unfetter and is pending approval by an admin.`, '/admin/approve-users', emailData);
                } else {
                    publish.notifyAdmin('NOTIFICATION', `${user.userName} Registered`, `${user.userName} registered to Unfetter and is pending approval by an admin.`, '/admin/approve-users');
                }
                return res.json({
                    data: {
                        attributes: newDocument.toObject()
                    }
                });
            });
        });
    } else {
        return res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Malformed request'
            }]
        });
    }
);

router.get('/profile/:id', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const userId = req.params.id;
    userModel.findById(userId, (err, result) => {
        if (err || !result) {
            return res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'An unknown error has occurred.'
                }]
            });
        }
        const user = result.toObject();
        res.json({
            data: {
                attributes: user
            }
        });
    });
});

router.post('/profile/preferences/:id', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const userId = req.params.id.trim();
    const requestingUser = req.user._id.toString().trim();
    if (userId !== requestingUser) {
        return res.status(500).json({
            errors: [{
                status: 500,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Current users credentials must match the requesting user id'
            }]
        });
    }

    const preferences = req.body.data.preferences || {};
    userModel.findByIdAndUpdate(userId, { preferences: { ...preferences } }, (err, result) => {
        if (err || !result) {
            return res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: err,
                }]
            });
        }

        const user = result.toObject();
        return res.json({
            data: {
                attributes: user,
            }
        });
    });
});

router.post('/finalize-registration', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const user = req.body.data.attributes;
    if (user) {
        userModel.findById(user._id, (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });
            }
            user.registered = true;
            user.identity.id = generateId('identity');

            if (!user.organizations) {
                user.organizations = [];
            }

            // Unfetter open
            user.organizations.push({
                id: 'identity--e240b257-5c42-402e-a0e8-7b81ecc1c09a',
                approved: true,
                role: 'STANDARD_USER'
            });

            const newDocument = new userModel(user);
            const error = newDocument.validateSync();
            if (error) {
                console.log(error);
                const errors = [];
                error.errors.forEach(field => {
                    errors.push(field.message);
                });
                return res.status(400).json({
                    errors: [{
                        status: 400,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: errors
                    }]
                });
            }
            userModel.findByIdAndUpdate(user._id, newDocument, (errInner, resultInner) => {
                if (errInner || !resultInner) {
                    return res.status(500).json({
                        errors: [{
                            status: 500,
                            source: '',
                            title: 'Error',
                            code: '',
                            detail: 'An unknown error has occurred.'
                        }]
                    });
                }
                if (SEND_EMAIL_ALERTS) {
                    const emailData = {
                        template: 'USER_REGISTERED',
                        subject: `${user.firstName} ${user.lastName} registered to unfetter`,
                        body: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email
                        }
                    };
                    publish.notifyAdmin('NOTIFICATION', `${user.userName} Registered`, `${user.userName} registered to Unfetter and is pending approval by an admin.`, '/admin/approve-users', emailData);
                } else {
                    publish.notifyAdmin('NOTIFICATION', `${user.userName} Registered`, `${user.userName} registered to Unfetter and is pending approval by an admin.`, '/admin/approve-users');
                }
                return res.json({
                    data: {
                        attributes: newDocument.toObject()
                    }
                });
            });
        });
    } else {
        return res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Malformed request'
            }]
        });
    }
);

router.get('/refreshtoken', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: ''
            }]
        });
    }

    let tokenHash;
    if (token.match(/^Bearer /) !== null) {
        tokenHash = token.split('Bearer ')[1].trim();
    } else {
        tokenHash = token;
    }

    jwt.verify(tokenHash, config.jwtSecret, (err, decoded) => {
        if (err) {
            console.log(`Error in /auth/user-from-token:\n${JSON.stringify(err, null, 2)}`);
            return res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'An unknown error has occurred.'
                }]
            });
        }
        userModel.findById(decoded._id, (error, user) => {
            if (error || !user) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const userObject = user.toObject();

            const newToken = jwt.sign(userObject, config.jwtSecret, {
                expiresIn: global.unfetter.JWT_DURATION_SECONDS
            });
            res.json({
                data: {
                    attributes: {
                        token: `Bearer ${newToken}`
                    }
                }
            });
        });
    });
});

router.get('/public-config', (req, res) => {
    configModel.find({
        configGroups: 'public'
    }, (err, results) => {
        if (err || !results) {
            return res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'An unknown error has occurred.'
                }]
            });
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
    });
});

router.get('/username-available/:userName', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const userName = req.params.userName;
    if (!userName || userName === '') {
        res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Unable to process userName'
            }]
        });
    } else {
        userModel.count({ userName }, (err, count) => {
            if (err) {
                res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                res.json({ data: { attributes: { available: (count === 0) } } });
            }
        });
    }
});

router.get('/email-available/:email', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    const email = req.params.email;
    if (!email || email === '') {
        res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Unable to process email'
            }]
        });
    } else {
        userModel.count({ email }, (err, count) => {
            if (err) {
                res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                res.json({ data: { attributes: { available: (count === 0) } } });
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
