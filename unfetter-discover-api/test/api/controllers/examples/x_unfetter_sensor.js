const sensor = {
    endpoint: 'x-unfetter-sensors',
    type: 'x-unfetter-sensor',
    attributes: {
        version: '1.0',
        type: 'x-unfetter-sensor',
        created_by_ref: 'identity--f431f809-377b-45e0-aa1c-6a4751cae5ff',
        revoked: false,
        name: 'Lorem Ipsum',
        description: 'Lorem Ipsum',
        aliases: ['lorem'],
        kill_chain_phases: [{
            kill_chain_name: 'lockheed-martin-cyber-kill-chain',
            phase_name: 'command-and-control'
        }],
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

sensor.attributes.x_extended_property_test = 'testvalue';
module.exports = sensor;
