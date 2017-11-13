const express = require('express');
const router = express.Router();

const userModel = require('../models/user');
const webAnalyticsModel = require('../models/web-analytics');

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
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            console.log(result);
            return res.json({ data: result });
        }
    });
});

router.post('/process-organization-applicant/:userId', (req, res) => {

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

                    matchingOrg.role = organizations.role;

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
                        format: "%Y-%m-%d",
                        date: "$eventData.date"
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
                'visits': -1
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
                'lastVisit': -1
            }
        }
    ];

    webAnalyticsModel.aggregate(visitsAggregation, (err, results) => {
        if (err || !results) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            return res.json({ data: results});
        }
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
                        format: "%Y-%m-%d",
                        date: "$eventData.date"
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
        if (err || !results || !results.length) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            results = results.map((res) => {
                const retVal = res;
                retVal._id = new Date(res._id)
                return retVal;
            });
            const startDate = new Date(results[results.length - 1]._id);
            const endDate = new Date(results[0]._id);
            const zeroDates = [];
            for (let iDate = new Date(startDate); iDate < endDate; iDate.setDate(iDate.getDate() + 1)) {      
                let findDate = results.find((res) => res._id.toDateString() === iDate.toDateString());
                if (!findDate) {
                    zeroDates.push({
                        _id: new Date(iDate.getTime()),
                        users: 0,
                        appLoads: 0
                    });
                }
            }
            const formatedRes = results
                .concat(zeroDates)
                .sort((a, b) => b._id - a._id)
                .slice(0, numDays)
                .sort((a, b) => a._id - b._id);

            return res.json({ data: formatedRes });
        }
    });

});

module.exports = router;
