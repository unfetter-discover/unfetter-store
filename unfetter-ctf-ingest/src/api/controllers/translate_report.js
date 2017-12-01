'use strict';

const SystemUrlAdapter = require('../../adapters/system-url.adapter');
const ExternalDataToStixAdapter = require('../../adapters/external-data-to-stix.adapter');

const translate_report_data = async (req, res) => {
    const body = req.swagger.params.data.value || '';
    const adapter = new ExternalDataToStixAdapter.ExternalDataToStixAdapter();
    const translated = await adapter.translateData(body);
    res.json(translated);
}

const translate_report_url = async (req, res) => {
    // console.log(req.swagger.params);
    const body = req.swagger.params.url.value || { };
    const adapter = new SystemUrlAdapter.SystemUrlAdapter();
    const translated = await adapter.translateUrl(body);
    res.json(translated);
}

module.exports = {
    translate_report_data,
    translate_report_url
};