var attackPattern = {
    type: 'attack-pattern',
    endpoint: 'attack-patterns',
    attributes: {
        name: 'Spear Phishing',
        description: 'Lorem Ipsum',
        version: '2.0',
        labels: [
            'phishing'
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
        kill_chain_phases: [{
            kill_chain_name: 'mandiant-attack-lifecycle-model',
            phase_name: 'initial-compromise'
        }],
        created_by_ref: 'identity--a932fcc6-e032-176c-126f-cb970a5a1ade',
        x_unfetter_sophistication_level: 0,
        object_marking_refs: [
            'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            'marking-definition--d771aceb-3148-4315-b4b4-130b888533d0'
        ]
    }
};


attackPattern.attributes.x_extended_property_test = 'testvalue';
module.exports = attackPattern;
