var XUnfetterAssessmentSet = {
    endpoint: 'x-unfetter-assessment-sets',
    type: 'x-unfetter-assessment-set',
    attributes: {
        name: 'lorem',
        description: 'lorem ipsum',
        created_by_ref: 'identity--4ac44385-691d-411a-bda8-027c61d68e99',
        assessment_group_ref: 'x-unfetter-assessment-group–ac16beef-878a-42ea-8f7a-3f689b4bdbbc',
        assessments: [
            'x-unfetter-object-assessment-62308af9-f402-4036-80db-633203d22b1a',
            'x-unfetter-object-assessment-bb69b995-c65c-4739-b90d-1599c45510b6',
            'x-unfetter-object-assessment-5929bba7-2dc7-4482-a938-3dba4110fd85'
        ]
    }
};

XUnfetterAssessmentSet.attributes.x_extended_property_test = 'testvalue';
module.exports = XUnfetterAssessmentSet;
