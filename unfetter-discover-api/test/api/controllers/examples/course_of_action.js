var courseOfAction = {
    endpoint: 'course-of-actions',
    type: 'course-of-action',
    attributes: {
        created_by_ref: 'identity--f431f809-377b-45e0-aa1c-6a4751cae5ff',
        created: '2016-04-06T20:03:48.000Z',
        modified: '2016-04-06T20:03:48.000Z',
        name: 'Add TCP port 80 Filter Rule to the existing Block UDP 1434 Filter',
        description: 'This is how to add a filter rule to block inbound access to TCP port 80 to the existing UDP 1434 filter',
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


courseOfAction.attributes.x_extended_property_test = 'testvalue';
module.exports = courseOfAction;
