const express = require('express');

const router = express.Router();

const notificationStoreModel = require('../models/notification-store');

router.get('/user-notifications', (req, res) => {
    const userId = req.user._id;
    notificationStoreModel.find({ userId }, (err, results) => {
        if (err) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        } else if (!results || !results.length) {
            return res.json({ data: [] });
        }
        const formattedRes = results
            .map((result) => result.toObject())
            .map((result) => ({
                attributes: result
            }));
        return res.json({ data: formattedRes });
    });
});

module.exports = router;
