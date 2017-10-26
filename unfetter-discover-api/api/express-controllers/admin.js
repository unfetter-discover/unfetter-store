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

module.exports = router;
