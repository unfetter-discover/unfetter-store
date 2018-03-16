const fetch = require('node-fetch');

const CTF_PARSE_HOST = process.env.CTF_PARSE_HOST || 'http://localhost';
const CTF_PARSE_PORT = process.env.CTF_PARSE_PORT || 10010;
const CTF_PARSE_PATH = process.env.CTF_PARSE_PATH || '/translate/report/data';

const translateData = (req, res) => {
    const err = {
        error:
            {
                status: 500,
                source: '',
                title: 'Error',
                code: '',
                detail: 'An unknown error has occurred.'
            }
    };
    if (!req || !req.swagger || !req.swagger.params) {
        return res.status(500).json(err);
    }

    // grab the swagger defined data param
    const val = req.swagger.params.data.value;
    // unwrap the jsonapi data value
    const valueData = val.data || val;
    // repost to ctf endpoints
    const body = JSON.stringify(valueData);
    const headers = { 'content-type': 'application/json', accept: 'application/json' };
    const url = `${CTF_PARSE_HOST}:${CTF_PARSE_PORT}${CTF_PARSE_PATH}`;
    fetch(url, {
        headers,
        method: 'POST',
        body
    }).then((response) => {
        response.json().then((json) => {
            // console.log('response', json);
            // format back to jsonapi, with data wrapper
            res.json({ data: json });
        });
    }).catch((ex) => {
        err.error.detail = ex;
        return res.status(500).json(err);
    });
};

/**
 * @description sample generic formatted report
 */
const translateDataSample = (req, res) => {
    const json = {
        systemName: 'sample-report-system',
        payload: {
            id: '123',
            description: 'descrip',
            published: '2017-12-01',
            protection: {
                level: 'Medium'
            },
            report: {
                url: 'report.url',
                id: 'https://reports.org/report.id',
                description: 'report description'
            }
        }
    };
    // format back to jsonapi, with data wrapper
    res.json({ data: json });
};

module.exports = {
    translateData,
    translateDataSample
};
