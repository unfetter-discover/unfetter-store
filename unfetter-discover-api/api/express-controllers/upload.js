const express = require('express');

const multerHelpers = require('../helpers/multer-helper');
const config = require('../config/config');

const router = express.Router();

router.post('/files', (req, res, next) => {
    if (config.blockAttachments) {
        next();
        return;
    }
    multerHelpers.attachmentArray(req, res, err => {
        if (err) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An error occured while attempting to upload the files'
                }]
            });
        }
        const { files } = req;
        const response = {
            data: files.map(file => ({
                type: 'attachment',
                id: file._id,
                attributes: file
            }))
        };
        return res.status(201).json(response);
    });
});

// TODO
// router.post('/file', multerHelpers.singleAttachment, (req, res) => {});

module.exports = router;
