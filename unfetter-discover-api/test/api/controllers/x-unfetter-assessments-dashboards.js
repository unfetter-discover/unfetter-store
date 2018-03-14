process.env.RUN_MODE = 'TEST';

const should = require('should');
const request = require('supertest');
const server = require('../../../app');
const mongoinit = require('../../../api/server/mongoinit')();

const controllers = [{
    endpoint: 'x-unfetter-assessments',
    type: 'x-unfetter-assessment',
    attributes: {
        "id": "x-unfetter-assessment--120d3765-75bd-4db5-987b-3ec5afc8f9fc",
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
                        "selected_value": {
                            "risk": 0.25,
                            "name": "0.25 test"
                        },
                        "options": [
                            {
                                "risk": 1.0,
                                "name": "1 test"
                            },
                            {
                                "risk": 0.75,
                                "name": "0.75 test"
                            },
                            {
                                "risk": 0.5,
                                "name": "0.50 test"
                            },
                            {
                                "risk": 0.25,
                                "name": "0.25 test"
                            },
                            {
                                "risk": 0.0,
                                "name": "0 test"
                            }
                        ],
                        "risk": 0.25,
                        "name": "0.5 test"
                    }
                ]
            },
            {
                "risk": 0.25,
                "stix": {
                    "id": "indicator--0fb3bf0b-f3a4-4c75-bc34-492a7433f33b",
                    "type": "indicator",
                    "description": "indicator description",
                    "name": "indicator name"
                },
                "questions": [
                    {
                        "selected_value": {
                            "risk": 0.25,
                            "name": "0.25 test"
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
                        "name": "0.5 test"
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
                        "selected_value": {
                            "risk": 0.25,
                            "name": "0.25 test"
                        },
                        "options": [
                            {
                                "risk": 1.0,
                                "name": "1 test"
                            },
                            {
                                "risk": 0.75,
                                "name": "0.75 test"
                            },
                            {
                                "risk": 0.5,
                                "name": "0.50 test"
                            },
                            {
                                "risk": 0.25,
                                "name": "0.25 test"
                            },
                            {
                                "risk": 0.0,
                                "name": "0 test"
                            }
                        ],
                        "risk": 0.25,
                        "name": "0.5 test"
                    }
                ]
            }
        ]
    }
}];

// TODO add linked indicactors, sensors, and coas to more accuretly test aggregations

describe('x-unfetter-assessments specific routes', () => {

    let controller = controllers[0];
    // Only ensure that the assessment for the following testsis created
    // The test for the shared rotues are done in the controllers test
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
                    should(typeof res.body.data).equal('object', `There should be exactly 1 ${controller.endpoint} returned.`);
                    done();
                });
        });
    });

    describe('GET /x-unfetter-assessments/{id}/assessed-objects', () => {
        it('Returns arrays of objects assessed.', (done) => {
            request(server)
                .get(`/${controller.endpoint}/${controller.testId}/assessed-objects/`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.equal(false, res.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    should.equal(res.body.data.length, 3, 'Wrong number of assessed objects were returned.  Expected 3, received '+res.body.data.length);
                    done();
            });
        });
    });

    describe('GET /x-unfetter-assessments/{id}/assessed-object-answer/{objectId}/{question}', () => {
        it('Returns the Answer of a particular question of an object.', (done) => {
        let objectId = "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4";
            
        request(server)
            .get(`/${controller.endpoint}/${controller.testId}/assessed-object-answer/${objectId}/0`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                should.not.exist(err);
                should.equal(false, res.error, 'Error found');
                should.exist(res.body.data, 'No "data" found');
                should.exist(res.body.data.risk, 'No "risk" found');
                should.exist(res.body.data.name, 'No "name" found');
                done();
            });
        });
    });

    describe('GET /x-unfetter-assessments/{id}/assessed-object-answer/{objectId}', () => {
        it('Returns the Risk of an object.', (done) => {
        let objectId = "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4";
            
        request(server)
            .get(`/${controller.endpoint}/${controller.testId}/assessed-object-risk/${objectId}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                should.not.exist(err);
                should.equal(false, res.error, 'Error found');
                should.exist(res.body.data, 'No "data" found');
                should.equal(res.body.data, 0.25, 'Risk should be 0.25 rather than '+res.body.data);
                done();
            });
        });
    });

    // update
    describe(`PATCH /x-unfetter-assessments/{id}/assessed-object-answer/{objectId}`, () => {
        let objectId = "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4";
        it(`should update a ${controller.endpoint}`, (done) => {
            request(server)
                .patch(`/${controller.endpoint}/${controller.testId}/assessed-object-answer/${objectId}`)
                .send({
                    data: {
                        attributes: {
                            answer: 1
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
    // Testing that the previous update worked
    describe('GET /x-unfetter-assessments/{id}/assessed-object-risk/{objectId}', () => {
        it('Returns the Risk of an object.', (done) => {
        let objectId = "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4";
        request(server)
            .get(`/${controller.endpoint}/${controller.testId}/assessed-object-risk/${objectId}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                should.not.exist(err);
                should.equal(false, res.error, 'Error found');
                should.exist(res.body.data, 'No "data" found');
                should.equal(res.body.data, 0.75, 'Risk should have been updated to 0.75 in the previous test rather than '+res.body.data);
                done();
            });
        });
    });

    // update
    describe(`PATCH /x-unfetter-assessments/{id}/assessed-object-answer/{objectId}/{question}`, () => {
        let objectId = "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4";
        let questionIndex = 0;
        it(`should update a ${controller.endpoint}`, (done) => {
            request(server)
                .patch(`/${controller.endpoint}/${controller.testId}/assessed-object-answer/${objectId}/${questionIndex}`)
                .send({
                    data: {
                        attributes: {
                            answer: 2
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

    describe('GET /x-unfetter-assessments/{id}/assessed-object-risk/{objectId}', () => {
        it('Returns the Risk of an object.', (done) => {
        let objectId = "indicator--020dae65-75bd-4db5-9e7b-3e45afc8f9f4";
        request(server)
            .get(`/${controller.endpoint}/${controller.testId}/assessed-object-risk/${objectId}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                should.not.exist(err);
                should.equal(false, res.error, 'Error found');
                should.exist(res.body.data, 'No "data" found');
                should.equal(res.body.data, .5, 'Risk should have been updated to .5 in the previous test '+res.body.data);
                done();
            });
        });
    });


    describe('GET /x-unfetter-assessments/{id}/risk', () => {
        it('Returns the risk for the entire assessment, and the risk per measurement.', (done) => {
            request(server)
                .get(`/${controller.endpoint}/${controller.testId}/risk`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.not.exist(res.body.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    done();
                });
        });
    });

    describe('GET /x-unfetter-assessments/{id}/risk-per-kill-chain', () => {
        it('Returns arrays of objects assessed.', (done) => {
            request(server)
                .get(`/${controller.endpoint}/${controller.testId}/risk-per-kill-chain`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.not.exist(res.body.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    done();
                });
        });
    });

    describe('GET /x-unfetter-assessments/{id}/summary-aggregations', () => {
        it('Returns attack pattern aggregations for the summary dashboard.', (done) => {
            request(server)
                .get(`/${controller.endpoint}/${controller.testId}/summary-aggregations`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.not.exist(res.body.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    done();
                });
        });
    });

    // Only ensure that the assessment for the following tests is deleted
    // The test for the shared rotues are done in the controllers test
    describe(`DELETE /x-unfetter-assessments/{id}`, () => {
        it(`should delete a x-unfetter-assessment`, (done) => {
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

});