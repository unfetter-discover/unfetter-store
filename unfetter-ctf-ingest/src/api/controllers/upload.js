'use strict';

const CtfIngestService = require('../../services/ingest/ctf-ingest.service');
const StixToJsonSchemaAdapter = require('../../adapters/stix-to-jsonschema.adapter');

const upload = (req, res) => {
    // console.log('req', req);
    // console.log('swagger', req.swagger);
    const body = req.swagger.params.data.value || '';
    const csv = body.data || '';
    // console.log(csv.split('\n')[0]);
    const ctfIngest = new CtfIngestService.CtfIngestService();
    ctfIngest.csvToStix(csv)
        .then((stixies) => {
            // console.log(`stixies ${stixies}`);
            const stixToJson = new StixToJsonSchemaAdapter.StixToJsonSchemaAdapter();
            const jsonArr = stixToJson.convertStixToJsonSchema(stixies);
            // console.log(jsonArr);
            res.json(jsonArr);
        })
        .catch((err) => { 
            console.log('error', err);
            res.json(err);
        });
}

module.exports = {
  upload
 };