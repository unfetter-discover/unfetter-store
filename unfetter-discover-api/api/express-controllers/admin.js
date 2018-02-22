process.env.PATTERN_HANDLER_DOMAIN = process.env.PATTERN_HANDLER_DOMAIN || 'unfetter-pattern-handler';
process.env.PATTERN_HANDLER_PORT = process.env.PATTERN_HANDLER_PORT || 5000;
process.env.SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'socketserver';
process.env.SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT || 3333;
const CTF_PARSE_HOST = process.env.CTF_PARSE_HOST || 'http://localhost';
const CTF_PARSE_PORT = process.env.CTF_PARSE_PORT || 10010;
const SEND_EMAIL_ALERTS = process.env.SEND_EMAIL_ALERTS || false;

const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

const emailAlert = require('../controllers/shared/email-alert');
const userModel = require('../models/user');
const webAnalyticsModel = require('../models/web-analytics');

router.get('/users-pending-approval', (req, res) => {
    userModel.find({ registered: true, approved: false, locked: false}, (err, result) => {
        if(err) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            const users = result
                .map(res => res.toObject())
                .map(user => {
                    return {
                        id: user._id,
                        attributes: user
                    };
                });
            return res.json({ data: users });
        }
        const users = result
            .map(response => response.toObject())
            .map(user => ({
                id: user._id,
                attributes: user
            }));

        return res.json({ data: users });
    });
});

router.get('/current-users', (req, res) => {
    userModel.find({ approved: true }, (err, result) => {
        if (err || !result || !result.length) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        const users = result
            .map(response => response.toObject())
            .map(user => ({
                id: user._id,
                attributes: user
            }));

        return res.json({ data: users });
    });
});

router.get('/organization-leader-applicants', (req, res) => {
    const query = [
        {
            $unwind: '$organizations'
        },
        {
            $match: {
                'organizations.role': 'ORG_LEADER_APPLICANT'
            }
        }
    ];

    userModel.aggregate(query, (err, result) => {
        if (err) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        console.log(result);
        return res.json({ data: result });
    });
});

router.post('/process-organization-applicant/:userId', (req, res) => {
    const userId = req.params.userId;
    // Note, since organizations is unwinded, its an object, not an array of objects
    const organizations = req.body.data && req.body.data.organizations ? req.body.data.organizations : undefined;

    if (userId === undefined || organizations === undefined || organizations.approved === undefined || organizations.id === undefined) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request'
            }]
        });
    }
    userModel.findById(userId, (err, result) => {
        if (err || !result) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        const user = result.toObject();
        const matchingOrg = user.organizations.find(org => org.id === organizations.id);

        if (!matchingOrg) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }

        matchingOrg.role = organizations.role;

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
                    status: 400, source: '', title: 'Error', code: '', detail: errors
                }]
            });
        }
        userModel.findByIdAndUpdate(user._id, newDocument, (errInner, resultInner) => {
            if (errInner || !resultInner) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            return res.json({
                data: {
                    attributes: newDocument.toObject()
                }
            });
        });
    });
});

router.post('/change-user-status', (req, res) => {
    const requestData = req.body.data && req.body.data.attributes ? req.body.data.attributes : {};
    if (requestData._id === undefined || !(requestData.role !== undefined || (requestData.approved !== undefined && requestData.locked !== undefined))) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request'
            }]
        });
    }
    userModel.findById(requestData._id, (err, result) => {
        if (err || !result) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        const user = result.toObject();
        if (requestData.approved !== undefined) {
            user.approved = requestData.approved;
        }
        if (requestData.locked !== undefined) {
            user.locked = requestData.locked;
        }
        if (requestData.role !== undefined) {
            user.role = requestData.role;
        }
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
                    status: 400, source: '', title: 'Error', code: '', detail: errors
                }]
            });
        }
        userModel.findByIdAndUpdate(user._id, newDocument, (errInner, resultInner) => {
            if (errInner || !resultInner) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }

            // Alert user when approved
            if (SEND_EMAIL_ALERTS && user.approved) {
                emailAlert.emailUser(user._id, user.email, 'REGISTRATION_APPROVAL', 'You were approved to user Unfetter', {});
            }

            return res.json({
                data: {
                    attributes: newDocument.toObject()
                }
            });
        });
    });
});

router.get('/site-visits', (req, res) => {
    const visitsAggregation = [
        {
            $match: {
                eventType: 'visit'
            }
        },
        {
            $project: {
                userId: '$eventData.userId',
                day: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$eventData.date'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$userId',
                visits: {
                    $addToSet: {
                        day: '$day'
                    }
                }
            }
        },
        {
            $unwind: '$visits'
        },
        {
            $sort: {
                visits: -1
            }
        },
        {
            $group: {
                _id: '$_id',
                visits: {
                    $push: {
                        day: '$visits.day'
                    }
                },
            },
        },
        {
            $lookup: {
                from: 'user',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $project: {
                daysVisited: {
                    $size: '$visits'
                },
                lastVisit: {
                    $arrayElemAt: ['$visits.day', 0]
                },
                userName: {
                    $arrayElemAt: ['$user.userName', 0]
                },
                registered: {
                    $arrayElemAt: ['$user.created', 0]
                }
            }
        },
        {
            $sort: {
                lastVisit: -1
            }
        }
    ];

    webAnalyticsModel.aggregate(visitsAggregation, (err, results) => {
        if (err || !results || !results.length) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        return res.json({ data: results });
    });
});

router.get('/site-visits-graph/:days', (req, res) => {
    const numDays = req.params.days;
    const query = [
        {
            $match: {
                eventType: 'visit'
            }
        },
        {
            $project: {
                userId: '$eventData.userId',
                day: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$eventData.date'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$day',
                users: {
                    $addToSet: {
                        userId: '$userId'
                    }
                },
                appLoads: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                users: { $size: '$users' },
                appLoads: '$appLoads'
            }
        },
        {
            $sort: {
                _id: -1
            }
        }
    ];

    webAnalyticsModel.aggregate(query, (err, results) => {
        let localResults = results;
        if (err || !localResults || !localResults.length) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        localResults = localResults.map(response => {
            const retVal = response;
            retVal._id = new Date(response._id);
            return retVal;
        });
        const startDate = new Date(localResults[localResults.length - 1]._id);
        const endDate = new Date(localResults[0]._id);
        const zeroDates = [];
        for (let iDate = new Date(startDate); iDate < endDate; iDate.setDate(iDate.getDate() + 1)) {
            const findDate = localResults.find(response => response._id.toDateString() === iDate.toDateString());
            if (!findDate) {
                zeroDates.push({
                    _id: new Date(iDate.getTime()),
                    users: 0,
                    appLoads: 0
                });
            }
        }
        const formatedRes = localResults
            .concat(zeroDates)
            .sort((a, b) => b._id - a._id)
            .slice(0, numDays)
            .sort((a, b) => a._id - b._id);

        return res.json({ data: formatedRes });
    });
});

router.get('/heartbeat', (req, res) => {
    const statuses = [
        {
            service: 'unfetter-discover-api',
            status: 'RUNNING'
        },
        {
            service: 'cti-stix-store-respository',
            status: global.unfetter.conn.readyState === 1 ? 'RUNNING' : 'DOWN'
        }
    ];

    const services = [
        {
            service: 'unfetter-pattern-handler',
            url: `http://${process.env.PATTERN_HANDLER_DOMAIN}:${process.env.PATTERN_HANDLER_PORT}/heartbeat`
        },
        {
            service: 'unfetter-socket-server',
            url: `https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/heartbeat`
        },
        {
            service: 'unfetter-ctf-ingest',
            url: `${CTF_PARSE_HOST}:${CTF_PARSE_PORT}/heartbeat`
        }
    ];

    const fetchArr = services.map(service => new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
        fetch(service.url)
            .then(response => response.json())
            .then(data => resolve({ service: service.service, status: data.status }))
            .catch(err => resolve({ service: service.service, status: 'DOWN' })); // eslint-disable-line no-unused-vars
    }));

    Promise.all(fetchArr)
        .then(results => {
            res.json({
                data: {
                    attributes: {
                        statuses: statuses.concat(results)
                    }
                }
            });
        })
        .catch(err => res.status(500).json({ // eslint-disable-line no-unused-vars
            errors: [{
                status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
            }]
        }));
});

module.exports = router;
