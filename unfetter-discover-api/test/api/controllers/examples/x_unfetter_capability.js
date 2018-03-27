var capability = {
    endpoint: 'v3/x-unfetter-capabilities',
    type: 'x-unfetter-capability',
    attributes: {
        created_by_ref: 'string',
        name: 'kaspersky antivirus',
        description: 'Is an antivirus program developed by Kaspersky Lab.',
        version: 17.0,
        category: 'Antivirus',
        external_references: [],
        x_extended_property_test: 'testvalue'
    }
};

capability.attributes.x_extended_property_test = 'testvalue';
module.exports = capability;
