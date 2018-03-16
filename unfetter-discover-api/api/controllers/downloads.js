const model = require('../models/schemaless');

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
                    .map((res) => res.toObject())
                    .map((res) => {
                        if (res.extendedProperties !== undefined) {
                            return { ...res.stix, ...res.extendedProperties };
                        }
                        return res.stix;
                    });
            } else {
                objects = results
                    .map((res) => res.toObject())
                    .map((res) => res.stix);
            }

            return res.json({
                type: 'bundle', id: 'stix-archive-bundle', spec_version: '2.0', objects
            });
        });
};

module.exports = {
    downloadBundle
};
