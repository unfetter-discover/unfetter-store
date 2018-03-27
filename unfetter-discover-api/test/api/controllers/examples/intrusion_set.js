var intrustionSet = {
    endpoint: 'intrusion-sets',
    type: 'intrusion-set',
    attributes: {
        created_by_ref: 'identity--f431f809-377b-45e0-aa1c-6a4751cae5ff',
        created: '2016-04-06T20:03:48.000Z',
        modified: '2016-04-06T20:03:48.000Z',
        name: 'Bobcat Breakin',
        description: 'Incidents usually feature a shared TTP of a bobcat being released within the building containing network access, scaring users to leave their computers without locking them first. Still determining where the threat actors are getting the bobcats.',
        aliases: ['Zookeeper'],
        goals: ['acquisition-theft", "harassment", "damage'],
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
        ],
    }
};

intrustionSet.attributes.x_extended_property_test = 'testvalue';
module.exports = intrustionSet;
