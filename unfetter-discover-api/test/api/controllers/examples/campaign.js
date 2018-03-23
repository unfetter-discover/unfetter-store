var campaign = {
    endpoint: 'campaigns',
    type: 'campaign',
    attributes: {
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
        aliases: [
            'OLI'
        ],
        created_by_ref: 'identity--a932fcc6-e032-176c-126f-cb970a5a1ade',
        revoked: false,
        name: 'Operation Lorem Ipsum',
        description: 'Lorem Ipsum',
        objective: 'Lorem the ipsums',
        object_marking_refs: [
            'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            'marking-definition--d771aceb-3148-4315-b4b4-130b888533d0'
        ],
    }
};

campaign.attributes.x_extended_property_test = 'testvalue';
module.exports = campaign;
