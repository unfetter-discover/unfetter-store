const should = require('should');
const request = require('supertest');
const server = require('../../../app');
const mongoinit = require('../../../api/server/mongoinit')();

const controllers = [
    {
        type: 'attack-pattern',
        endpoint: 'attack-patterns',
        attributes: {
            "name": "Spear Phishing",
            "description": "Lorem Ipsum",
            "version": "2.0",
            "labels": [
                "phishing"
            ],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "kill_chain_phases": [{
                "kill_chain_name": "mandiant-attack-lifecycle-model",
                "phase_name": "initial-compromise"
            }],
            "created_by_ref": "identity--a932fcc6-e032-176c-126f-cb970a5a1ade",
            "x_unfetter_sophistication_level": 0,
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'campaigns',
        type: 'campaign',
        attributes: {
            "version": "1.0",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "aliases": [
                "OLI"
            ],
            "created_by_ref": "identity--a932fcc6-e032-176c-126f-cb970a5a1ade",
            "revoked": false,
            "name": "Operation Lorem Ipsum",
            "description": "Lorem Ipsum",
            "aliases": [
                "lorem"
            ],
            "objective": "Lorem the ipsums",
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'course-of-actions',
        type: "course-of-action",
        
        attributes: {
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "created": "2016-04-06T20:03:48.000Z",
            "modified": "2016-04-06T20:03:48.000Z",
            "name": "Add TCP port 80 Filter Rule to the existing Block UDP 1434 Filter",
            "description": "This is how to add a filter rule to block inbound access to TCP port 80 to the existing UDP 1434 filter",
            "version": "1.0",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }

    },
    {
        endpoint: 'identities',
        type: "identity",
        attributes: {
            "created": "2014-08-08T15:50:10.983Z",
            "modified": "2014-08-08T15:50:10.983Z",
            "name": "ACME Widget, Inc.",
            "identity_class": "organization",
            "version": "1.0",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'indicators',
        type: "indicator",
        attributes: {
            "created_by_ref": "source--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "created": "2016-04-06T20:03:48.000Z",
            "modified": "2016-04-06T20:03:48.000Z",
            "labels": ["malicious-activity"],
            "name": "Poison Ivy Malware",
            "description": "This file is part of Poison Ivy",
            "pattern": "[file:hashes.'SHA-256' = 'aec070645fe53ee3b3763059376134f058cc337247c978add178b6ccdfb0019f']",
            "valid_from": "2016-04-06T20:03:48Z",
            "version": "1.0",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'intrusion-sets',
        type: "intrusion-set",
        attributes: {
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "created": "2016-04-06T20:03:48.000Z",
            "modified": "2016-04-06T20:03:48.000Z",
            "name": "Bobcat Breakin",
            "description": "Incidents usually feature a shared TTP of a bobcat being released within the building containing network access, scaring users to leave their computers without locking them first. Still determining where the threat actors are getting the bobcats.",
            "aliases": ["Zookeeper"],
            "goals": ["acquisition-theft", "harassment", "damage"],
            "version": "1.0",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'malwares',
        type: "malware",
        attributes: {
            "created": "2016-05-12T08:17:27.000Z",
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "modified": "2016-05-12T08:17:27.000Z",
            "name": "Cryptolocker",
            "description": "Locks Files",
            "labels": ["ransomware"],
            "version": "1.0",
            "kill_chain_phases": [{
                "kill_chain_name": "mandiant-attack-lifecycle-model",
                "phase_name": "initial-compromise"
            }],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'marking-definitions',
        type: "marking-definition",
        
        attributes: {
            "created": "2017-01-20T00:00:00.000Z",
            "definition_type": "tlp",
            "definition": {
                "tlp": "green"
            },
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "version": "2.0",
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'observed-data',
        type: "observed-data",
        
        attributes: {
            "version": "2.0",
            "objects": {
                "0": {
                    "type": "file",
                    "hashes": {
                        "MD5": "1717b7fff97d37a1e1a0029d83492de1",
                        "SHA-1": "c79a326f8411e9488bdc3779753e1e3489aaedea"
                    },
                    "name": "resume.pdf",
                    "size": 83968
                }
            },
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "revoked": false,
            "number_observed": 0,
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'relationships',
        type: "relationship",
        
        attributes: {
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "created": "2016-04-06T20:06:37.000Z",
            "modified": "2016-04-06T20:06:37.000Z",
            "source_ref": "indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",
            "target_ref": "malware--31b940d4-6f7f-459a-80ea-9c1f17b5891b",
            "relationship_type": "indicates",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'reports',
        type: "report",
        
        attributes: {
            "created_by_ref": "identity--a463ffb3-1bd9-4d94-b02d-74e4f1658283",
            "created": "2015-12-21T19:59:11.000Z",
            "modified": "2016-05-21T19:59:11.000Z",
            "published": "2016-05-21T19:59:11Z",
            "name": "The Black Vine Cyberespionage Group",
            "description": "A simple report with an indicator and campaign",
            "labels": ["campaign"],
            "object_refs": [
                "indicator--26ffb872-1dd9-446e-b6f5-d58527e5b5d2",
                "campaign--83422c77-904c-4dc1-aff5-5c38f3a2c55c",
                "relationship--f82356ae-fe6c-437c-9c24-6b64314ae68a"
            ],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'sightings',
        type: "sighting",
        
        attributes: {
            "id": "sighting--6b0e3956-95f3-4c04-a882-116832996da0",
            "created": "2016-08-22T14:09:00.123Z",
            "modified": "2016-08-22T14:09:00.123Z",
            "first_seen": "2016-08-22T14:09:00.123456Z",
            "sighting_of_ref": "malware--36ffb872-1dd9-446e-b6f5-d58527e5b5d2",
            "where_sighted_refs": ["identity--f431f809-377b-45e0-aa1c-6a4751cae5ff"],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'threat-actors',
        type: "threat-actor",
        
        attributes: {
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "created": "2016-04-06T20:03:48.000Z",
            "modified": "2016-04-06T20:03:48.000Z",
            "labels": ["hacker"],
            "name": "Evil Org",
            "description": "The Evil Org threat actor group",
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    {
        endpoint: 'tools',
        type: "tool",

        attributes: {
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "created": "2016-04-06T20:03:48.000Z",
            "modified": "2016-04-06T20:03:48.000Z",
            "name": "VNC",
            "labels": ["remote-access"],
            "kill_chain_phases": [{
                "kill_chain_name": "lockheed-martin-cyber-kill-chain",
                "phase_name": "command-and-control"
            }],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
    
    {
        endpoint: 'x-unfetter-assessments',
        type: 'x-unfetter-assessment',
        attributes: {
            "_id": "x-unfetter-assessment--220da765-75bd-4db5-9e7b-3ec5afc8f9fc",
            "name": "Assessment Testing",
            "description": "Tests an assessment.",
            "version": "2.0",
            "labels": [
                "lorem"
            ],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "x_extended_property_test": "testvalue",
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "kill_chain_phases": [
                {
                    "kill_chain_name": "lorem",
                    "phase_name": "ipsum"
                }
            ],
            "assessment_objects": [
                {
                    "risk": 0.25,
                    "stix": {
                        "id": "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4",
                        "type": "indicator",
                        "description": "indicator description",
                        "name": "indicator name"
                    },
                    "questions": [
                        {
                            "selected_option": {
                                "risk": 0.25,
                                "title": "0.25 test"
                            },
                            "options": [
                                {
                                    "risk": 1.0,
                                    "title": "1 test"
                                },
                                {
                                    "risk": 0.75,
                                    "title": "0.75 test"
                                },
                                {
                                    "risk": 0.5,
                                    "title": "0.50 test"
                                },
                                {
                                    "risk": 0.25,
                                    "title": "0.25 test"
                                },
                                {
                                    "risk": 0.0,
                                    "title": "0 test"
                                }
                            ],
                            "risk": 0.25,
                            "title": "0.5 test"
                        }
                    ]
                },
                {
                    "risk": 0.5,
                    "stix": {
                        "id": "indicator--0fb3bf0b-f3a4-4c75-bc34-492a7433f33b",
                        "type": "indicator",
                        "description": "indicator description",
                        "name": "indicator name"
                    },
                    "questions": [
                        {
                            "selected_option": {
                                "risk": 0.25,
                                "title": "0.25 test"
                            },
                            "options": [
                                {
                                    "risk": 1.0,
                                    "title": "1 test"
                                },
                                {
                                    "risk": 0.75,
                                    "title": "0.75 test"
                                },
                                {
                                    "risk": 0.5,
                                    "title": "0.50 test"
                                },
                                {
                                    "risk": 0.25,
                                    "title": "0.25 test"
                                },
                                {
                                    "risk": 0.0,
                                    "title": "0 test"
                                }
                            ],
                            "risk": 0.25,
                            "title": "0.5 test"
                        }
                    ]
                },
                {
                    "risk": 0.25,
                    "stix": {
                        "id": "course-of-action--045c6f31-d329-40b0-b819-660d77b6cd58",
                        "type": "course-of-action",
                        "description": "course of action",
                        "name": "course of action name"
                    },
                    "questions": [
                        {
                            "selected_option": {
                                "risk": 0.25,
                                "title": "0.25 test"
                            },
                            "options": [
                                {
                                    "risk": 1.0,
                                    "title": "1 test"
                                },
                                {
                                    "risk": 0.75,
                                    "title": "0.75 test"
                                },
                                {
                                    "risk": 0.5,
                                    "title": "0.50 test"
                                },
                                {
                                    "risk": 0.25,
                                    "title": "0.25 test"
                                },
                                {
                                    "risk": 0.0,
                                    "title": "0 test"
                                }
                            ],
                            "risk": 0.25,
                            "title": "0.5 test"
                        }
                    ]
                }
            ]
        }
    },

    {
        endpoint: 'x-unfetter-sensors',
        type: 'x-unfetter-sensor',
        attributes: {
            "version": "1.0",
            "type": "x-unfetter-sensor",
            "created_by_ref": "identity--f431f809-377b-45e0-aa1c-6a4751cae5ff",
            "revoked": false,
            "name": "Lorem Ipsum",
            "description": "Lorem Ipsum",
            "aliases": ["lorem"],
            "kill_chain_phases": [{
                "kill_chain_name": "lockheed-martin-cyber-kill-chain",
                "phase_name": "command-and-control"
            }],
            "external_references": [{
                "source_name": "capec",
                "description": "phishing",
                "url": "https://capec.mitre.org/data/definitions/98.html",
                "external_id": "CAPEC-98"
            }],
            "granular_markings": [{
                "marking_ref": "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "selectors": [
                    "labels.[1]"
                ]
            }],
            "labels": [
                "lorem"
            ],
            "object_marking_refs": [
                "marking-definition--f88d31f6-486f-44da-b317-01333bde0b82",
                "marking-definition--d771aceb-3148-4315-b4b4-130b888533d0"
            ],
            "x_extended_property_test": "testvalue"
        }
    },
];

describe('stix controllers', () => {
    for (let controller of controllers) {

        describe(controller.type, () => {

            // Create
            describe(`POST /${controller.type}`, () => {
                it(`should create an ${controller.type}`, (done) => {
                    
                    let stixObj = {};
                    stixObj.type = controller.type;
                    stixObj.attributes = controller.attributes;
                    if (controller.id) {
                        stixObj.id = controller.id;
                    }
                    request(server)
                        .post(`/${controller.endpoint}`)
                        .send({data:stixObj})
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        // TODO determine appropiate status code(s) to check for
                        // .expect(201)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.exist(res.body.data, `No ${controller.endpoint} created`);
                            controller.testId = res.body.data[0].id;
                            done();
                        });
                });
            });

            // update
            describe(`PATCH /${controller.endpoint}/{id}`, () => {
                it(`should update a ${controller.endpoint}`, (done) => {
                    request(server)
                        .patch(`/${controller.endpoint}/${controller.testId}`)
                        .send({
                            data: {
                                attributes: {
                                    revoked: true
                                }
                            }
                        })
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.exist(res.body.data, `No ${controller.endpoint} updated`);
                            done();
                        });
                });
            });

            // get all
            describe(`GET /${controller.endpoint}`, () => {
                it(`should return all ${controller.endpoint}`, (done) => {
                    request(server)
                        .get(`/${controller.endpoint}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should(res.body.data.length).be.above(0, `No '${controller.endpoint}' found`);
                            done();
                        });
                });
            });

            // get by id
            describe(`GET /${controller.endpoint}/{id}`, () => {
                it(`should return the ${controller.endpoint} matching the id in the path`, (done) => {
                    request(server)
                        .get(`/${controller.endpoint}/${controller.testId}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.exist(res.body.data.attributes.x_extended_property_test);
                            should(typeof res.body.data).equal('object', `There should be exactly 1 ${controller.endpoint} returned.`);
                            done();
                        });
                });
            });

            // get by id without extended properties
            describe(`GET /${controller.endpoint}/{id}?extendedproperties=false`, () => {
                it(`should return the ${controller.endpoint} matching the id in the path without extended properties`, (done) => {
                    request(server)
                        .get(`/${controller.endpoint}/${controller.testId}?extendedproperties=false`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.not.exist(res.body.data.attributes.x_extended_property_test);
                            should(typeof res.body.data).equal('object', `There should be exactly 1 ${controller.endpoint} returned.`);
                            done();
                        });
                });
            });

            // get with filter
            describe(`GET /${controller.endpoint}?filter=filterstring`, () => {
                it(`should filter ${controller.endpoint} created > 1980`, (done) => {
                    const filter = encodeURIComponent(JSON.stringify({
                        "stix.created": {
                            "$gte": "1980-01-01T00:00:00.000Z"
                        }
                    }));
                    request(server)
                        .get(`/${controller.endpoint}?filter=${filter}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should(res.body.data.length).be.above(0, `No '${controller.endpoint}' found`);
                            // should.equal(res.body.data.length, 2, 'There should be exactly 2 attack patterns returned.');
                            done();
                        });
                });
            });

            // get with sort
            describe(`GET /${controller.endpoint}?sort=sortstring`, () => {
                it(`should sort all ${controller.endpoint} in descending order by created date`, (done) => {
                    const sort = encodeURIComponent(JSON.stringify({
                        created: -1
                    }));
                    request(server)
                        .get(`/${controller.endpoint}?sort=${sort}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should(res.body.data.length).be.above(0, `No '${controller.endpoint}' found`);
                            done();
                        });
                });
            });

            // get with sort and limit
            describe(`GET /${controller.endpoint}?sort=sortstring&limit=limitvalue`, () => {
                it(`should get the oldest ${controller.endpoint}, using created sort and limit 1`, (done) => {
                    const sort = encodeURIComponent(JSON.stringify({
                        created: -1
                    }));
                    const limit = encodeURIComponent(1);
                    request(server)
                        .get(`/${controller.endpoint}?sort=${sort}&limit=${limit}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.equal(res.body.data.length, 1, `There should be exactly 1 ${controller.endpoint} returned.`);
                            done();
                        });
                });
            });

            // get with sort, limit, and skip
            describe(`GET /${controller.endpoint}?sort=sortstring&limit=limitvalue&skip=skipvalue`, () => {
                it(`should get ${controller.endpoint} using sort, limit, and skip`, (done) => {
                    const sort = encodeURIComponent(JSON.stringify({
                        created: -1
                    }));
                    const limit = encodeURIComponent(1);
                    const skip = encodeURIComponent(0);
                    request(server)
                        .get(`/${controller.endpoint}?sort=${sort}&limit=${limit}&skip=${skip}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.equal(res.body.data.length, 1, `There should be exactly 1 ${controller.endpoint} returned.`);
                            done();
                        });
                });
            });

            // get by id that doesn't exist
            describe(`GET /${controller.endpoint}/{id} - id does not exist`, () => {
                it('should return a 404 since the id doesn\'t exist', (done) => {
                    const id = 'noidtomatch';
                    request(server)
                        .get(`/${controller.endpoint}/${id}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(404)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.exist(res.body.message, 'There is no error message.');
                            done();
                        });
                });
            });

            // delete
            describe(`DELETE /${controller.endpoint}/{id}`, () => {
                it(`should delete a ${controller.endpoint}`, (done) => {
                    request(server)
                        .delete(`/${controller.endpoint}/${controller.testId}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((errDelete, resDelete) => {
                            should.not.exist(errDelete);
                            should.equal(false, resDelete.error, 'Error found');
                            should.exist(resDelete.body.data, `No '${controller.endpoint}' deleted`);
                            done();
                        });
                });
            });
 
        }); // End controller test 
    } // End controllers for loop
}); // End stix controllers test