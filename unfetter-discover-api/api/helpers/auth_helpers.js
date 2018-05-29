const userModel = require('../models/user');
const generateId = require('../helpers/stix').id;
const publish = require('../controllers/shared/publish');
const config = require('../config/config');
const jwt = require('jsonwebtoken');

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

const handleLoginCallback = (authUser, source, service, res) => {
    console.log(`Received ${source} user:\n${JSON.stringify(authUser, null, 2)}`);
    if (!authUser) {
        return setEmptyResponse(res);
    }
    let user = {};
    const uiCallbackURL = config.unfetterUiCallbackURL;
    userModel.find(service.search(authUser),
        (err, result) => {
            if (err) {
                return setErrorResponse(res, 500, 'An unknown error has occurred.');
            } else if (!result || (result.length === 0)) {
                // Unknown user
                service.sync(user, authUser, false);
                console.log(`First login attempt by ${source} id# ${authUser.id}`);
                startRegistration(user, res, token => {
                    res.redirect(`${uiCallbackURL}/${encodeURIComponent(token)}/false/${source}`);
                });
            } else {
                // Known user
                user = result[0].toObject();
                service.sync(user, authUser, user.approved);
                const token = jwt.sign(user, config.jwtSecret, {
                    expiresIn: global.unfetter.JWT_DURATION_SECONDS
                });
                console.log(token);
                console.log(`Returning ${source} user:\n${JSON.stringify(user, null, 2)}`);
                userModel.findByIdAndUpdate(user._id, user,
                    (updateErr, updateResult) => {
                        if (updateErr || !updateResult) {
                            console.log('We could not update the user document', updateErr);
                            return setErrorResponse(res, 500, 'An unknown error has occurred.');
                        }
                        res.redirect(`${uiCallbackURL}/${encodeURIComponent(token)}/${user.registered}/${source}`);
                    }
                );
            }
        }
    );
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

const storeRegistration = (user, res) => {
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

module.exports = {
    setEmptyResponse,
    setErrorResponse,
    handleLoginCallback,
    startRegistration,
    storeRegistration,
};
