const userModel = require('../models/user');
const generateId = require('../helpers/stix').id;
const publish = require('../controllers/shared/publish');
const SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;

const setEmptyResponse = (res) => res.json({
    success: false,
    message: 'User object is empty'
});

const setErrorResponse = (res, status, detail) => res.status(500).json({
    errors: [{
        status: status,
        source: '',
        title: 'Error',
        code: '',
        detail: detail
    }]
});

const startRegistration = (user, res, cb) => {
    const newDocument = new userModel(user);
    const error = newDocument.validateSync();
    if (error) {
        console.log(error);
        const errors = error.errors.map(field => field.message);
        return setErrorResponse(res, 400, errors);
    }
    userModel.create(newDocument, (err, result) => {
        if (err) {
            return setErrorResponse(res, 500, 'An unknown error has occurred.');
        }
        const token = jwt.sign(result.toObject(), config.jwtSecret, {
            expiresIn: global.unfetter.JWT_DURATION_SECONDS
        });
        res.header('Authorization', token);
        cb(token);
    });
}

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
}

module.exports = {
    setEmptyResponse,
    setErrorResponse,
    startRegistration,
    storeRegistration,
};