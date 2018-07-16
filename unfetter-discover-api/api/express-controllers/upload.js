const express = require('express');
const stream = require('stream');

const multerHelpers = require('../helpers/multer-helper');

/**
 * @param  {Buffer} buffer
 * @param  {string} filename
 * @param  {string} contentType
 * @returns {Promise<{}>}
 * @description Abstraction of buffer creation and piping
 */
function uploadFile(buffer, filename, contentType) {
    return new Promise((resolve, reject) => {
        const bucket = global.unfetter.gridFSBucket;
        if (!bucket) {
            reject('global.unfetter.gridFSBucket does not exist');
            return;
        }

        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(
            bucket.openUploadStream(
                filename,
                {
                    contentType
                }
            )
        )
        .on('error', err => reject(err))
        .on('finish', fileData => resolve(fileData));
    });
}

const router = express.Router();

router.post('/files', multerHelpers.attachmentArray, (req, res) => {
    const promises = [];
    const { files } = req;
    files.forEach(file => {
        promises.push(uploadFile(file.buffer, file.originalname, file.mimetype));
    });
    if (promises.length) {
        Promise.all(promises)
            .then(fileData => res.status(201).json(
                    fileData.map(file => ({
                        type: 'attachment',
                        id: file._id,
                        attributes: file
                    }))
                )
            )
            .catch(err => {
                console.log(err);
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            });
    } else {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'no files attached'
            }]
        });
    }
});

// TODO
// router.post('/file', multerHelpers.singleAttachment, (req, res) => {});

module.exports = router;
