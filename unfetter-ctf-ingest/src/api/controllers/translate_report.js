'use strict';

const SystemUrlAdapter = require('../../adapters/system-url.adapter');

const translate_report_data = (req, res) => {
    console.log(req.swagger);
    const body = req.swagger.params.data.value || '';
    const data = body.data || '';
    console.log(data);
    res.json(data);
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