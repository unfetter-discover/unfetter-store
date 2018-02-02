const express = require('express');
const router = express.Router();

const userModel = require('../models/user');

router.get('/request-leadership/:userId/:orgId', (req, res) => {

    const userId = req.params.userId;
    const orgId = req.params.orgId;

    if (userId === undefined || orgId === undefined) {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request' }] });
    } else {
        userModel.findById(userId, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                const user = result.toObject();
                const matchingOrg = user.organizations.find((org) => org.id === orgId);

                if (!matchingOrg) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                } else if (matchingOrg.role !== 'STANDARD_USER') {
                    return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Only standard users may apply for leadership of an organization.' }] });
                } else {

                    // Allow admins to be immediantly promoted
                    if (user && user._id.toString() === userId && user.role === 'ADMIN') {
                        matchingOrg.role = 'ORG_LEADER';
                    } else {
                        matchingOrg.role = 'ORG_LEADER_APPLICANT';                
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
            }
        });
    }
});

router.get('/request-membership/:userId/:orgId', (req, res) => {

    const userId = req.params.userId;
    const orgId = req.params.orgId;

    if (userId === undefined || orgId === undefined) {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request' }] });
    } else {
        userModel.findById(userId, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                const user = result.toObject();
                const matchingOrg = user.organizations.find((org) => org.id === orgId);

                if (matchingOrg) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'User is already affiliated with this organization' }] });
                } else {

                    // Allow admins to be immediantly accepted
                    if (user && user._id.toString() === userId && user.role === 'ADMIN') {
                        user.organizations.push({id: orgId, approved: true});
                    } else {
                        user.organizations.push({ id: orgId });
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
            }
        });
    }
});

// TODO make subscriptions route

router.get('/subscription/:userId/:orgId/:subscribe', (req, res) => {

    const { userId, orgId, subscribe }= req.params;

    if (userId === undefined || orgId === undefined || subscribe === undefined) {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request' }] });
    } else {
        userModel.findById(userId, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                const user = result.toObject();
                const matchingOrg = user.organizations.find((org) => org.id === orgId);

                if (!matchingOrg) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                } else {
                    matchingOrg.subscribed = subscribe;

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
            }
        });
    }
});

module.exports = router;