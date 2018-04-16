var report = {
    endpoint: 'reports',
    type: 'report',
    attributes: {
        created_by_ref: 'identity--a463ffb3-1bd9-4d94-b02d-74e4f1658283',
        created: '2015-12-21T19:59:11.000Z',
        modified: '2016-05-21T19:59:11.000Z',
        published: '2016-05-21T19:59:11Z',
        name: 'The Black Vine Cyberespionage Group',
        description: 'A simple report with an indicator and campaign',
        labels: ['campaign'],
        object_refs: [
            'indicator--26ffb872-1dd9-446e-b6f5-d58527e5b5d2',
            'campaign--83422c77-904c-4dc1-aff5-5c38f3a2c55c',
            'relationship--f82356ae-fe6c-437c-9c24-6b64314ae68a'
        ],
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
        object_marking_refs: [
            'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            'marking-definition--d771aceb-3148-4315-b4b4-130b888533d0'
        ],
    }
};

report.attributes.x_extended_property_test = 'testvalue';
module.exports = report;
