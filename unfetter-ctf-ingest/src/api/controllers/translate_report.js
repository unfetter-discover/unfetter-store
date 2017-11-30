'use strict';

const SystemUrlAdapter = require('../../adapters/system-url.adapter');
const ExternalDataToStixAdapter = require('../../adapters/external-data-to-stix.adapter');

const translate_report_data = (req, res) => {
    const body = req.swagger.params.data.value || '';
    console.log(body);
    const adapter = new ExternalDataToStixAdapter.ExternalDataToStixAdapter();
    const translated = adapter.translateData(body);
    console.log(translated);
    res.json(translated);
}

const translate_report_url = (req, res) => {
    // console.log(req.swagger.params);
    const body = req.swagger.params.url.value || { };
    console.log(body);
    const adapter = new SystemUrlAdapter.SystemUrlAdapter();
    const translated = adapter.translateUrl(body);
    console.log(translated);    
    res.json(translated);
}

module.exports = {
    translate_report_data,
    translate_report_url
};