const express = require('express');
const router = express.Router();

const userModel = require('../models/user');

// TODO add admin middleware
router.get('*', (req, res, next) => {
    console.log('in admin middleware');
    next();
});

router.get('/users-pending-approval', (req, res) => {
    userModel.find({ registered: true, approved: false, locked: false}, (err, result) => {
        if(err) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            const users = result.map(res => res.toObject());
            return res.json({ data: { attributes: users } });
        }
    });
});

router.post('/process-user-approval', (req, res) => {
    let requestData = req.body.data && req.body.data.attributes ? req.body.data.attributes : {};
    if (requestData._id === undefined || requestData.approved === undefined || requestData.locked === undefined) {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request' }] });
    } else {
        userModel.findById(requestData._id, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                const user = result.toObject();
                user.approved = requestData.approved;
                user.locked = requestData.locked;
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
                        if (errInner || !resultInner) {
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
    }
});

module.exports = router;
