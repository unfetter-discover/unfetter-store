const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const GithubStrategy = require('passport-github').Strategy;

const config = require('../config/config');
const userModel = require('../models/user');

// Github
passport.use(new GithubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackURL
},
function (accessToken, refreshToken, profile, cb) {
    // TODO process token here
    console.log(accessToken);
    return cb(null, profile);
}));

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
});

router.use(require('express-session')({ 
    secret: config.sessionSecret, 
    resave: true, 
    saveUninitialized: true 
}));
router.use(passport.initialize());
router.use(passport.session());

router.get('/github-login', passport.authenticate('github', { scope: ['user:email']}));

router.get('/github-callback', passport.authenticate('github', { failureRedirect:'/auth/github-login' }), (req, res) => {
    // hit unfetter api to update token
    const githubUser = req.user;
    if (!githubUser) {
        res.json({success: false, message: 'User object is empty'});
    } else {
        let registered;
        let user = {};       

        userModel.find({ 'github.id': githubUser.id}, (err, result) => {
            if(err) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });

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

                const newDocument = new userModel(user);
                const error = newDocument.validateSync();
                if (error) {
                    console.log(error);
                    const errors = [];
                    error.errors.forEach((field) => {
                        errors.push(field.message);
                    });
                    return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: errors }] });
                } else {
                    userModel.create(newDocument, (err, result) => {
                        if(err) {
                            console.log(err);
                            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                        } else {
                            console.log(`First github login attempt by github id# ${githubUser.id}`);
                            const token = jwt.sign(result.toObject(), config.jwtSecret, {
                                expiresIn: 604800 // 1 week
                            });
                            res.header('Authorization', token);
                            res.redirect(`${config.unfetterUiCallbackURL}/${encodeURIComponent(token)}/${registered}/github`);
                        }
                    });
                }
                
            // Known user
            } else {
                user = result[0].toObject();
                registered = user.registered;

                const token = jwt.sign(user, config.jwtSecret, {
                    expiresIn: 604800 // 1 week
                });
                console.log(token);
                console.log(`Returning github user:\n${JSON.stringify(user, null, 2)}`);
                res.redirect(`${config.unfetterUiCallbackURL}/${encodeURIComponent(token)}/${registered}/github`);
            }
        });
    }
});

router.get('/user-from-token', (req, res) => {
    let token = req.headers.authorization;
    if(!token) {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: '' }] });
    } else {

        let tokenHash;
        if(token.match(/^Bearer\ /) !== null) {
            tokenHash = token.split('Bearer ')[1].trim()
        } else {
            tokenHash = token;
        }

        jwt.verify(tokenHash, config.jwtSecret, (err, decoded) => {
            if(err) {
                console.log(`Error in /auth/user-from-token:\n${JSON.stringify(err, null, 2)}`);
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                const id = decoded._id;
                if(!id) {
                    return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed token' }] });
                } else {
                    userModel.findById(id, (err, result) => {
                        if (err || !result) {
                            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                        } else {
                            return res.json({
                                "data": {
                                    "attributes": result.toObject()
                                }
                            });
                        }
                    });
                }
            }
        });
    }
});

router.post('/finalize-registration', (req, res) => {
    let user = req.body.data.attributes;
    if(user) {
        userModel.findById(user._id, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                user.registered = true;
                const newDocument = new userModel(user);
                const error = newDocument.validateSync();
                if (error) {
                    console.log(error);
                    const errors = [];
                    error.errors.forEach((field) => {
                        errors.push(field.message);
                    });
                    return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: errors }] });
                } else {                  
                    userModel.findByIdAndUpdate(user._id, newDocument, (errInner, resultInner) => {
                        if(errInner || !resultInner) {
                            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                        } else {
                            return res.json({
                                "data": {
                                    "attributes": newDocument.toObject()
                                }
                            });
                        }
                    });
                }                
            }
        });
    } else {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request' }] });
    }
});

router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res, next) => {    
    res.send('in profile');
});

module.exports = router;
