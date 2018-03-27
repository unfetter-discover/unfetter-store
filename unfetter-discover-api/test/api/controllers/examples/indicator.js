var indicator = {
    endpoint: 'indicators',
    type: 'indicator',
    attributes: {
        created_by_ref: 'source--f431f809-377b-45e0-aa1c-6a4751cae5ff',
        created: '2016-04-06T20:03:48.000Z',
        modified: '2016-04-06T20:03:48.000Z',
        labels: ['malicious-activity'],
        name: 'Poison Ivy Malware',
        description: 'This file is part of Poison Ivy',
        pattern: '[file:hashes.\'SHA-256\' = \'aec070645fe53ee3b3763059376134f058cc337247c978add178b6ccdfb0019f\']',
        valid_from: '2016-04-06T20:03:48Z',
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
        object_marking_refs: [
            'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            'marking-definition--d771aceb-3148-4315-b4b4-130b888533d0'
        ]
    }
};

indicator.attributes.x_extended_property_test = 'testvalue';
module.exports = indicator;
