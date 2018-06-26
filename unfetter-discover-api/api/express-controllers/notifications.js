const express = require('express');

const router = express.Router();

const notificationStoreModel = require('../models/notification-store');

const NOTIFICATION_ACTIONS = {
    READ_NOTIFICATION: 'READ_NOTIFICATION',
    DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
    READ_ALL_NOTIFICATIONS: 'READ_ALL_NOTIFICATIONS',
    DELETE_ALL_NOTIFICATIONS: 'DELETE_ALL_NOTIFICATIONS'
};

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
            .map(result => result.toObject())
            .map(result => ({
                attributes: result
            }));
        return res.json({ data: formattedRes });
    });
});

router.get('/user-notifications/process/:action/:notificationId?', (req, res) => {
    const userId = req.user._id;
    const { action, notificationId } = req.params;

    if (
        (!action || !Object.keys(NOTIFICATION_ACTIONS).includes(action) || !userId) ||
        ((action === NOTIFICATION_ACTIONS.READ_NOTIFICATION || action === NOTIFICATION_ACTIONS.DELETE_NOTIFICATION) && !notificationId)
    ) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request'
            }]
        });
    }

    switch (action) {
    case NOTIFICATION_ACTIONS.READ_NOTIFICATION:
        console.log('Reading notification');
        notificationStoreModel.findByIdAndUpdate(notificationId, { $set: { read: true } }, (err, result) => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            console.log('Notification read');
            res.json({ data: { type: 'Success', message: `Marked ${notificationId} as read`, attributes: result } });
        });
        break;
    case NOTIFICATION_ACTIONS.DELETE_NOTIFICATION:
        console.log('Deleting notification');
        notificationStoreModel.findByIdAndRemove(notificationId, err => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            console.log('Notification deleted');
            res.json({ data: { type: 'Success', message: `Deleted ${notificationId}` } });
        });
        break;
    case NOTIFICATION_ACTIONS.READ_ALL_NOTIFICATIONS:
        console.log('Reading all notification');
        notificationStoreModel.update({ userId }, { $set: { read: true } }, { multi: true }, err => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            console.log('All notifications read');
            res.json({ data: { type: 'Success', message: 'Marked all notifications as read' } });
        });
        break;
    case NOTIFICATION_ACTIONS.DELETE_ALL_NOTIFICATIONS:
        console.log('Deleting all notification');
        notificationStoreModel.remove({ userId }, err => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            console.log('All notifications deleted');
            res.json({ data: { type: 'Success', message: 'Deleted all notifications' } });
        });
        break;
    default:
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'Malformed request'
            }]
        });
    }
});

module.exports = router;
