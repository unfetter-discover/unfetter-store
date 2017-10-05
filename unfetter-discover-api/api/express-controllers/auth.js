const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const GithubStrategy = require('passport-github').Strategy;

const config = require('../config/passport-config');
const githubConfig = require('../config/github-config');
const User = require('../models/user');

// Github
passport.use(new GithubStrategy({
    clientID: githubConfig.clientID,
    clientSecret: githubConfig.clientSecret,
    callbackURL: githubConfig.callbackURL
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
    secret: 'keyboard cat', 
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
        const user = {};
        user.loginMethod = 'github';
        user.githubUsername = githubUser.username;  
        user.githubId = githubUser.id;
        const code = req.query.code;
        if(!code) {
            console.log('Code is empty');
        } else {
            user.githubCode = code;
        }
        const token = jwt.sign(user, config.secret, {
            expiresIn: 604800 // 1 week
        });
        // TODO redirect this to angular
        res.json({
            success: true,
            token: 'Bearer ' + token,
            user: user,
            githubRaw: githubUser
        });
    }
});

router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.send('in profile');
});

module.exports = router;