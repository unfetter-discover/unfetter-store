process.env.PATTERN_HANDLER_DOMAIN = process.env.PATTERN_HANDLER_DOMAIN || 'unfetter-pattern-handler';
process.env.PATTERN_HANDLER_PORT = process.env.PATTERN_HANDLER_PORT || 5000;

const fetch = require('node-fetch');
const express = require('express');

const router = express.Router();

function postToPatternHandler(req, res, body, url, contentType = 'application/json') {
    fetch(`http://${process.env.PATTERN_HANDLER_DOMAIN}:${process.env.PATTERN_HANDLER_PORT}/${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': contentType
        },
        body
    })
        .then((rawHandlerResponse) => rawHandlerResponse.json())
        .then((handlerResponse) => res.json({ data: { attributes: handlerResponse } }))
        .catch((err) => res.status(500).json({
            errors: [{
                status: 500, source: '', title: 'Error', code: '', detail: err
            }]
        }));
}

router.post('/translate-all', (req, res) => {
    const pattern = req.body && req.body.data && req.body.data.pattern ? JSON.stringify(req.body.data) : null;

    if (pattern) {
        postToPatternHandler(req, res, pattern, 'translate-all');
    } else {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
            }]
        });
    }
});

router.post('/get-objects', (req, res) => {
    const pattern = req.body && req.body.data && req.body.data.pattern ? JSON.stringify(req.body.data) : null;

    if (pattern) {
        postToPatternHandler(req, res, pattern, 'get-objects');
    } else {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
            }]
        });
    }
});

module.exports = router;
