var markingDefinition = {
    endpoint: 'marking-definitions',
    type: 'marking-definition',
    attributes: {
        created: '2017-01-20T00:00:00.000Z',
        definition_type: 'tlp',
        definition: {
            tlp: 'green'
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
        version: '2.0',
    }
};

markingDefinition.attributes.x_extended_property_test = 'testvalue';
module.exports = markingDefinition;
