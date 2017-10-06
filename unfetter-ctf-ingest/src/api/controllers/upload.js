'use strict';

const CtfIngest = require('../../ctf-ingest');
const StixToJsonSchemaAdapter = require('../../stix-to-jsonschema-adapter');

const upload = (req, res) => {
    // console.log(req.swagger.params);
    const body = req.swagger.params.data.value || '';
    const csv = body.data || '';
    // console.log(csv.split('\n')[0]);
    const ctfIngest = new CtfIngest.CtfIngest();
    ctfIngest.csvToStix(csv).then((stixies) => {
        // console.log(`stixies ${stixies}`);
        const stixToJson = new StixToJsonSchemaAdapter.StixToJsonSchemaAdapter();
        const jsonArr = stixToJson.convertStixToJsonSchema(stixies);
        // console.log(jsonArr);
        res.json(jsonArr);
    });
}

module.exports = {
  upload
 };