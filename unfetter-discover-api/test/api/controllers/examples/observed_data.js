var observedData = {
    endpoint: 'observed-data',
    type: 'observed-data',
    attributes: {
        version: '2.0',
        objects: {
            0: {
                type: 'file',
                hashes: {
                    MD5: '1717b7fff97d37a1e1a0029d83492de1',
                    'SHA-1': 'c79a326f8411e9488bdc3779753e1e3489aaedea'
                },
                name: 'resume.pdf',
                size: 83968
            }
        },
        external_references: [{
            source_name: 'capec',
            description: 'phishing',
            url: 'https://capec.mitre.org/data/definitions/98.html',
            external_id: 'CAPEC-98'
        }],
        granular_markings: [{
            marking_ref: 'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            selectors: [
                'labels.[1]'
            ]
        }],
        labels: [
            'lorem'
        ],
        object_marking_refs: [
            'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            'marking-definition--d771aceb-3148-4315-b4b4-130b888533d0'
        ],
        created_by_ref: 'identity--f431f809-377b-45e0-aa1c-6a4751cae5ff',
        revoked: false,
        number_observed: 0,
    }
};

observedData.attributes.x_extended_property_test = 'testvalue';
module.exports = observedData;
