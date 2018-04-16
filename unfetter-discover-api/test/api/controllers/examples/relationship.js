var relationship = {
    endpoint: 'relationships',
    type: 'relationship',
    attributes: {
        created_by_ref: 'identity--f431f809-377b-45e0-aa1c-6a4751cae5ff',
        created: '2016-04-06T20:06:37.000Z',
        modified: '2016-04-06T20:06:37.000Z',
        source_ref: 'indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
        target_ref: 'malware--31b940d4-6f7f-459a-80ea-9c1f17b5891b',
        relationship_type: 'indicates',
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
    }
};

relationship.attributes.x_extended_property_test = 'testvalue';
module.exports = relationship;
