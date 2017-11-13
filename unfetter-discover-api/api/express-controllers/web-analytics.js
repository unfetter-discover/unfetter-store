const express = require('express');
const router = express.Router();

const model = require('../models/web-analytics');

router.get('/visit', (req, res) => {

    const userId = req.user._id;

    if (userId) {

        const obj = {
            eventType: 'visit',
            eventData: {
                userId,
                date: new Date()
            }
        };
        const newDocument = new model(obj);

        const error = newDocument.validateSync();
        if (error) {
            return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: '' }] });
        } else {
            model.create(newDocument, (err, result) => {
                if (err) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                } else {
                    res.json({ data: { success: true, message: 'visit successfully recorded' } });
                }
            });
        }

    } else {        
        return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
    }    
});

module.exports = router;
