const express = require('express');
const fetch = require('node-fetch');
const getFileType = require('file-type');
const pdfParse = require('pdf-parse');

const multerHelpers = require('../helpers/multer-helper');
const config = require('../config/config');
const fetchHelpers = require('../helpers/fetch_helper');

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

// For text extraction only
const ALLOW_FILE_TYPES = [
    'pdf',
    'application/pdf'
];

router.post('/extract-text/:fileType', async (req, res) => {
    const { fileType } = req.params;
    const { url } = req.body.data.attributes;

    if (!fileType || !url) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'Filetype and URL is required'
            }]
        });
    }

    if (!ALLOW_FILE_TYPES.includes(fileType)) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'Filetype is not supported'
            }]
        });
    }

    try {
        const fetchResults = await fetch(url, fetchHelpers.instanceOptions);
        const buffer = await fetchHelpers.getResultBuffer(fetchResults);
        const bufferFileType = getFileType(buffer);
        if (bufferFileType.ext !== fileType && bufferFileType.mime !== fileType) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'The provided URL did not contain the correct file type.'
                }]
            });
        }
        let extractedText;

        switch (fileType) {
        case 'pdf':
        case 'application/pdf':
            const { text } = await pdfParse(buffer);
            extractedText = text;
            break;
        default:
            // This should never be reached
            throw new Error('Unreachable switch statement reached');
        }

        return res.json({
            data: {
                attributes: {
                    url,
                    ext: bufferFileType.ext,
                    contentType: bufferFileType.mime,
                    extractedText
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            errors: [{
                status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
            }]
        });
    }
});

// TODO
// router.post('/file', multerHelpers.singleAttachment, (req, res) => {});

module.exports = router;
