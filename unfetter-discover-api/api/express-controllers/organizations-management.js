const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();

const userModel = require('../models/user');
const stixSchemaless = require('../models/schemaless');

router.get('/pending-approval', (req, res) => {

    const user = req.user;

    if (!user || !user.organizations || !user.role || user.role === 'STANDARD_USER') {
        return res.status(401).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'Unauthorized' }] });
    }

    let query;
    if (user.role === 'ADMIN') {
        query = [
            {
                $unwind: '$organizations'
            },
            {
                $match: {
                    'organizations.approved': false
                }
            }
        ];
    } else {
        const orgsToQuery = user.organizations
            .filter((org) => org.role === 'ORG_LEADER')
            .map((org) => org.id);

        if (!orgsToQuery) {
            return res.status(401).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'Unauthorized' }] });
        } else {
            query = [
                {
                    $unwind: '$organizations'
                },
                {
                    $match: {
                        'organizations.approved': false,
                        'organizations.id': {
                            $in: orgsToQuery
                        }
                    }
                }
            ];
        }
    }

    userModel.aggregate(query, (err, result) => {
        if (err) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            return res.json({ data: { attributes: result } });
        }
    });
});

router.post('/process-approval/:userId', (req, res) => {

    const userId = req.params.userId;
    // Note, since organizations is unwinded, its an object, not an array of objects
    const organizations = req.body.data && req.body.data.organizations ? req.body.data.organizations : undefined;

    if (userId === undefined || organizations === undefined || organizations.approved === undefined || organizations.id === undefined) {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request' }] });
    } else {
        userModel.findById(userId, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else {
                const user = result.toObject();
                const matchingOrg = user.organizations.find((org) => org.id === organizations.id);

                if (!matchingOrg) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                } else {                    
                    
                    const approved = organizations.approved;

                    if (approved) {
                        matchingOrg.approved = true;
                    } else {
                        user.organizations = user.organizations.filter((org) => org.id !== organizations.id);
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

                                // Publish notification
                                if(approved) {
                                    stixSchemaless.findById(matchingOrg.id, (err, orgResult) => {
                                        if (err || !result) {
                                            console.log('Unable to find organizaiton for ', matchingOrg.id);
                                        } else {
                                            const orgObj = orgResult.toObject();
                                            const body = JSON.stringify({
                                                "data": {
                                                    "attributes": {
                                                        "userId": userId,
                                                        "notification": {
                                                            "type": "ORGANIZATION",
                                                            "heading": "Approved to Organization",
                                                            "body": `You were approved to join ${orgObj.stix.name}`
                                                        }
                                                    }
                                                }
                                            });
                                            fetch('https://socketserver:3333/publish/notification/user', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Accept': 'application/json'
                                                },
                                                body
                                            })
                                            .then((res) => {
                                                console.log('Publish API recieved notification for', userId);
                                            })
                                            .catch((err) => console.log('Error!', err));
                                        }
                                    });       
                                }
                                
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
