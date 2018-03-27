var identities = {
    endpoint: 'identities',
    type: 'identity',
    attributes: {
        created: '2014-08-08T15:50:10.983Z',
        modified: '2014-08-08T15:50:10.983Z',
        name: 'ACME Widget, Inc.',
        identity_class: 'organization',
        version: '1.0',
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
        ]
    }
};

identities.attributes.x_extended_property_test = 'testvalue';
module.exports = identities;
