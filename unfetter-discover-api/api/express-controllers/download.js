const express = require('express');
const mongoose = require('mongoose');

const attachmentsModel = require('../models/attachments');
const stixModel = require('../models/schemaless');
const SecurityHelper = require('../helpers/security_helper');

const router = express.Router();

router.get('/file/:stixId/:fileId', (req, res) => {
    const { stixId, fileId } = req.params;
    const bucket = global.unfetter.gridFSBucket;
    if (!bucket || !stixId || !fileId) {
        return res.status(500).json({
            errors: [{
                status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
            }]
        });
    }

    stixModel.find(SecurityHelper.applySecurityFilter({ _id: stixId }, req.user), (stixErr, stixResult) => {
        if (stixErr || !stixResult || !stixResult.length) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }

        const stixResultObj = stixResult[0].toObject();
        const hasAttachment = stixResultObj.metaProperties &&
            stixResultObj.metaProperties.attachments &&
            stixResultObj.metaProperties.attachments.map(att => att._id).includes(fileId);
        if (!hasAttachment) {
            return res.status(404).json({
                errors: [{
                    status: 404, source: '', title: 'Error', code: '', detail: 'Request attachment not found on STIX object.'
                }]
            });
        }
        const idObj = new mongoose.mongo.ObjectID(fileId);
        attachmentsModel.findById(idObj, (fileErr, fileResult) => {
            if (fileErr || !fileResult) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred while.'
                    }]
                });
            }
            const fileObj = fileResult.toObject();
            const stream = bucket.openDownloadStream(idObj);

            res.setHeader('Content-disposition', `attachment; filename=${fileObj.filename}`);
            stream.on('error', err => {
                res.send(err);
            });

            stream.on('data', chunk => {
                res.write(chunk);
            });

            stream.on('close', () => {
                // On large files, there can be a lag effect on the chunks
                setTimeout(() => res.end(), 100);
            });
        });
    })
    .limit(1);
});

module.exports = router;
