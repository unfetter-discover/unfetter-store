const model = require('../models/schemaless');
const SecurityHelper = require('../helpers/security_helper');

const downloadBundle = function downloadBundleFunc(req, res) {
    model
        .find({ stix: { $exists: 1 } })
        .exec((err, results) => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }

            let objects;
            if (req.swagger.params.extendedproperties !== undefined && req.swagger.params.extendedproperties.value !== undefined && req.swagger.params.extendedproperties.value === true) {
                objects = results
                    .map(response => response.toObject())
                    .map(response => {
                        if (response.extendedProperties !== undefined) {
                            return { ...response.stix, ...response.extendedProperties };
                        }
                        return response.stix;
                    });
            } else {
                objects = results
                    .map(response => response.toObject())
                    .map(response => response.stix);
            }

            return res.json({
                type: 'bundle', id: 'stix-archive-bundle', spec_version: '2.0', objects
            });
        });
};

module.exports = {
    downloadBundle
};
