var xUnfetterObjectAssessment = {
    endpoint: 'v3/x-unfetter-object-assessments',
    type: 'x-unfetter-object-assessment',
    attributes: {
        created_by_ref: 'identity--a932fcc6-e032-176c-126f-cb970a5a1ade',
        name: 'lorem',
        description: 'lorem ipsum',
        object_ref: 'x-unfetter-capability-45256397-a396-40cd-b91a-95f39f99c24a',
        is_baseline: true,
        set_ref: [
            'x-unfetter-assessment-set-5bc34f67-8595-4ea5-b21b-b8ad0855d5b9',
            'x-unfetter-assessment-set-3bc24f64-8595-1aa5-a68b-c8ad08557653'
        ]
    }
};

xUnfetterObjectAssessment.attributes.x_extended_property_test = 'testvalue';
module.exports = xUnfetterObjectAssessment;
