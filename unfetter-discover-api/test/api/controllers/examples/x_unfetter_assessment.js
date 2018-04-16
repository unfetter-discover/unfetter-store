var XUnfetterAssessment = {
    endpoint: 'x-unfetter-assessments',
    type: 'x-unfetter-assessment',
    attributes: {
        _id: 'x-unfetter-assessment--220da765-75bd-4db5-9e7b-3ec5afc8f9fc',
        created_by_ref: 'identity--a932fcc6-e032-176c-126f-cb970a5a1ade',
        name: 'Assessment Testing',
        description: 'Tests an assessment.',
        version: '2.0',
        labels: [
            'lorem'
        ],
        external_references: [{
            source_name: 'capec',
            description: 'phishing',
            url: 'https://capec.mitre.org/data/definitions/98.html',
            external_id: 'CAPEC-98'
        }],
        x_extended_property_test: 'testvalue',
        granular_markings: [{
            marking_ref: 'marking-definition--f88d31f6-486f-44da-b317-01333bde0b82',
            selectors: [
                'labels.[1]'
            ]
        }],
        kill_chain_phases: [
            {
                kill_chain_name: 'lorem',
                phase_name: 'ipsum'
            }
        ],
        assessment_objects: [
            {
                risk: 0.25,
                stix: {
                    id: 'indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4',
                    type: 'indicator',
                    description: 'indicator description',
                    name: 'indicator name'
                },
                questions: [
                    {
                        selected_option: {
                            risk: 0.25,
                            title: '0.25 test'
                        },
                        options: [
                            {
                                risk: 1.0,
                                title: '1 test'
                            },
                            {
                                risk: 0.75,
                                title: '0.75 test'
                            },
                            {
                                risk: 0.5,
                                title: '0.50 test'
                            },
                            {
                                risk: 0.25,
                                title: '0.25 test'
                            },
                            {
                                risk: 0.0,
                                title: '0 test'
                            }
                        ],
                        risk: 0.25,
                        title: '0.5 test'
                    }
                ]
            },
            {
                risk: 0.5,
                stix: {
                    id: 'indicator--0fb3bf0b-f3a4-4c75-bc34-492a7433f33b',
                    type: 'indicator',
                    description: 'indicator description',
                    name: 'indicator name'
                },
                questions: [
                    {
                        selected_option: {
                            risk: 0.25,
                            title: '0.25 test'
                        },
                        options: [
                            {
                                risk: 1.0,
                                title: '1 test'
                            },
                            {
                                risk: 0.75,
                                title: '0.75 test'
                            },
                            {
                                risk: 0.5,
                                title: '0.50 test'
                            },
                            {
                                risk: 0.25,
                                title: '0.25 test'
                            },
                            {
                                risk: 0.0,
                                title: '0 test'
                            }
                        ],
                        risk: 0.25,
                        title: '0.5 test'
                    }
                ]
            },
            {
                risk: 0.25,
                stix: {
                    id: 'course-of-action--045c6f31-d329-40b0-b819-660d77b6cd58',
                    type: 'course-of-action',
                    description: 'course of action',
                    name: 'course of action name'
                },
                questions: [
                    {
                        selected_option: {
                            risk: 0.25,
                            title: '0.25 test'
                        },
                        options: [
                            {
                                risk: 1.0,
                                title: '1 test'
                            },
                            {
                                risk: 0.75,
                                title: '0.75 test'
                            },
                            {
                                risk: 0.5,
                                title: '0.50 test'
                            },
                            {
                                risk: 0.25,
                                title: '0.25 test'
                            },
                            {
                                risk: 0.0,
                                title: '0 test'
                            }
                        ],
                        risk: 0.25,
                        title: '0.5 test'
                    }
                ]
            }
        ]
    }
};

XUnfetterAssessment.attributes.x_extended_property_test = 'testvalue';
module.exports = XUnfetterAssessment;
