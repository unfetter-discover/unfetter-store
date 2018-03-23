var sighting = {
    endpoint: 'sightings',
    type: 'sighting',
    attributes: {
        id: 'sighting--6b0e3956-95f3-4c04-a882-116832996da0',
        created_by_ref: 'identity--a463ffb3-1bd9-4d94-b02d-74e4f1658283',
        created: '2016-08-22T14:09:00.123Z',
        modified: '2016-08-22T14:09:00.123Z',
        first_seen: '2016-08-22T14:09:00.123456Z',
        sighting_of_ref: 'malware--36ffb872-1dd9-446e-b6f5-d58527e5b5d2',
        where_sighted_refs: ['identity--f431f809-377b-45e0-aa1c-6a4751cae5ff'],
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

sighting.attributes.x_extended_property_test = 'testvalue';
module.exports = sighting;
