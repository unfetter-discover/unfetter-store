const express = require('express');

const multerHelpers = require('../helpers/multer-helper');

const router = express.Router();

router.post('/files', multerHelpers.attachmentArray, (req, res) => {
    const { files } = req;
    const response = {
        data: files.map(file => ({
            type: 'attachment',
            id: file._id,
            attributes: file
        }))
    };
    res.status(201).json(response);
});

// TODO
// router.post('/file', multerHelpers.singleAttachment, (req, res) => {});

module.exports = router;
