// const fs = request('fs');

const fetch = require('node-fetch');

const CTF_PARSE_HOST = process.env.CTF_PARSE_HOST || 'https://localhost';
const CTF_PARSE_PORT = process.env.CTF_PARSE_PORT || 443;
const CTF_PARSE_PATH = process.env.CTF_PARSE_PATH || '/api/ctf/parser/upload';

const upload = (req, res) => {

    const err = { 
            error:
                { 
                    status: 500, source: '', title: 'Error', 
                    code: '', detail: 'An unknown error has occurred.' 
                }
        };
    if (!req || !req.swagger || !req.swagger.params) {
        return res.status(500).json(err);
    }

    // console.log(`upload req`, req.swagger.params);
    // console.log(req.swagger.params.upfile.value);
    const fName = req.swagger.params.upfile.value.originalname;
    console.log(fName);
    const contents = req.swagger.params.upfile.value.buffer.toString('utf8');
    console.log(`csv.length=${contents.length}`);

    // const timestamp = new Date().getMilliseconds();
    // const tmpFileName = `${fName}-${timestamp}`;
    // fs.writeFileSync(tmpFileName, contents);

    const body = { data: JSON.stringify(contents) };
    const headers = { 'content-type': 'application/json' };
    const url = `${CTF_PARSE_HOST}:${CTF_PARSE_PORT}${CTF_PARSE_PATH}`;
    // console.log(url);
    fetch(url, {
        headers,
        method: 'POST',
        body
    }).then((jsonSchema) => {
        // console.log(jsonSchema);
        res.json(jsonSchema);
    }).catch((ex) => {
        err.error.detail = ex;
        return res.status(500).json(err);
    })

    // res.json({ count: -1 });

};

module.exports = {
    upload
};