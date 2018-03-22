'use strict';

const ReportCtfIngestService = require('../../services/ingest/report-ctf-ingest.service');
const StixToJsonSchemaAdapter = require('../../adapters/stix-to-jsonschema.adapter');

const upload = (req, res) => {
    // console.log('req', req);
    // console.log('swagger', req.swagger);
    const body = req.swagger.params.data.value || '';
    const csv = body.data || '';
    // console.log(csv.split('\n')[0]);
    const ctfIngest = new ReportCtfIngestService.ReportCtfIngestService();
    return ctfIngest.csvToStix(csv)
        .then((stixies) => {
            console.log(`stixies ${stixies}`);
            const stixToJson = new StixToJsonSchemaAdapter.StixToJsonSchemaAdapter();
            const jsonArr = stixToJson.convertStixToJsonSchema(stixies);
            // console.log(jsonArr);
            res.status(200).json(jsonArr);
            res.end();
        })
        .catch((err) => {
            console.log('error', err);
            res.status(200).json([{ 'data': { 'error': err } }]);
            return res.end();
        });
}

module.exports = {
    upload
};