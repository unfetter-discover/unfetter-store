var XUnfetterAssessmentGroup = {
    endpoint: 'x-unfetter-assessment-groups',
    type: 'x-unfetter-assessment-group',
    attributes: {
        name: 'lorem',
        description: 'lorem ipsum',
        created_by_ref: 'identity--4ac44385-691d-411a-bda8-027c61d68e99',
        object_refs: [
            'x-unfetter-capability-1234',
            'x-unfetter-capability-3564'
        ],
        assessment_sets: [
            'x-unfetter-assessment-set--8ef94b52',
            'x-unfetter-assessment-set--2ef98ba1'
        ]
    }
};

XUnfetterAssessmentGroup.attributes.x_extended_property_test = 'testvalue';
module.exports = XUnfetterAssessmentGroup;
