const userModel = require('../models/user');
const generateId = require('../helpers/stix').id;
const publish = require('../controllers/shared/publish');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const markingDefinitions = require('../models/marking-definition');

const SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;

const setEmptyResponse = res => res.json({
    success: false,
    message: 'User object is empty'
});

const setErrorResponse = (res, status, detail) => res.status(500).json({
    errors: [{
        status,
        source: '',
        title: 'Error',
        code: '',
        detail
    }]
});

const handleLoginCallback = (authUser, source, service, response) => {
    console.log(`(${new Date().toISOString()}) Received ${source} user:\n${JSON.stringify(authUser, null, 2)}`);
    if (!authUser) {
        return setEmptyResponse(response);
    }
    userModel.find(service.search(authUser), (err, result) => {
        handleUserSearch(authUser, source, service, response, err, result);
    });
};

const handleUserSearch = (authUser, source, service, response, err, result) => {
    let user = {};
    const uiCallbackURL = config.unfetterUiCallbackURL;
    if (err) {
        return setErrorResponse(response, 500, 'An unknown error has occurred.');
    } else if (!result || (result.length === 0)) {
        // Unknown user
        console.log(`(${new Date().toISOString()}) First login attempt by ${source} id# ${authUser.id}`);
        service.sync(user, authUser, false);
        startRegistration(user, response, token => {
            response.redirect(`${uiCallbackURL}/${encodeURIComponent(token)}/false/${source}`);
        });
    } else {
        // Known user
        user = result[0].toObject();
        service.sync(user, authUser, user.approved);
        const token = jwt.sign(user, config.jwtSecret, {
            expiresIn: global.unfetter.JWT_DURATION_SECONDS
        });
        markingDefinitions.find({ 'stix.definition_type': ['tlp', 'statement'] }, (mderr, results) => {
            user.auth.marking_refs = results.map(ref => ref.stix.id);
            const json = JSON.stringify(user, null, 2);
            console.log(`(${new Date().toISOString()}) ${token}`);
            console.log(`(${new Date().toISOString()}) Returning ${source} user:\n${json}`);
            userModel.findByIdAndUpdate(user._id, user,
                (updateErr, updateResult) => {
                    if (updateErr || !updateResult) {
                        console.log('We could not update the user document', updateErr);
                        return setErrorResponse(response, 500, 'An unknown error has occurred.');
                    }
                    response.redirect(`${uiCallbackURL}/${encodeURIComponent(token)}/${user.registered}/${source}`);
                }
            );
        });
    }
};

const startRegistration = (user, res, cb) => {
    const newDocument = new userModel(user);
    const error = newDocument.validateSync();
    if (error) {
        console.log('User registration document invalid', newDocument, error);
        const errors = error.errors.map(field => field.message);
        return setErrorResponse(res, 400, errors);
    }
    userModel.create(newDocument, (err, result) => {
        if (err) {
            console.log('We could not create the new user document', err);
            return setErrorResponse(res, 500, 'An unknown error has occurred.');
        }
        const token = jwt.sign(result.toObject(), config.jwtSecret, {
            expiresIn: global.unfetter.JWT_DURATION_SECONDS
        });
        res.header('Authorization', token);
        cb(token);
    });
};

const storeRegistration = (registration, res) => {
    const user = registration;
    user.registered = true;
    user.identity.id = generateId('identity');
    if (!user.organizations) {
        user.organizations = [];
    }

    // Unfetter open
    user.organizations.push({
        id: global.unfetter.openIdentity._id,
        approved: true,
        role: 'STANDARD_USER'
    });

    const newDocument = new userModel(user);

    const error = newDocument.validateSync();
    if (error) {
        console.log(error);
        const errors = error.errors.map(field => field.message);
        return setErrorResponse(res, 400, errors);
    }

    userModel.findByIdAndUpdate(user._id, newDocument,
        (err, result) => {
            if (err || !result) {
                console.log('We got an error storing the user document', err);
                return setErrorResponse(res, 500, 'An unknown error has occurred.');
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
                publish.notifyAdmin('NOTIFICATION', `${user.userName} Registered`,
                        `${user.userName} registered to Unfetter and is pending approval by an admin.`,
                        '/admin/approve-users', emailData);
            } else {
                publish.notifyAdmin('NOTIFICATION', `${user.userName} Registered`,
                        `${user.userName} registered to Unfetter and is pending approval by an admin.`,
                        '/admin/approve-users');
            }
            return res.json({ data: { attributes: newDocument.toObject() } });
        }
    );
};

const AuthHelper = class {

    constructor(name) {
        this.name = name;
    }

    build(cfg, env) {
        console.error(`
            Cannot generate authentication helper for ${this.name} without builder code.
            Override build method on this helper, and redeploy.
            Configuration: ${JSON.stringify(cfg)}
            Environment: ${JSON.stringify(env)}
        `);
        return null;
    }

    /**
     * Strategy-based configuration options.
     */
    options() {
        return null;
    }

    /**
     * What to pass to the Mongo find() query specification to search for a known Unfetter user.
     */
    search(user) {
        return user || null;
    }

    /**
     * When receiving a response from the authentication strategy, how do we convert the response to an Unfetter user object.
     */
    sync(data, loginInfo, approved) {
        const user = data;
        user.approved = approved;
        if (!user.auth) {
            user.auth = {
                id: loginInfo.id,
                userName: null,
                avatar_url: null,
            };
        }
        user.auth.marking_refs = [];
    }

};

module.exports = {
    setEmptyResponse,
    setErrorResponse,
    handleLoginCallback,
    startRegistration,
    storeRegistration,
    AuthHelper,
};
